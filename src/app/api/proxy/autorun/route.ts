import { NextResponse } from "next/server";
import { gameApi } from "@/lib/game-api";
import type { CropDetail } from "@/lib/game-api";
import { gameConfig } from "@/lib/config";
import { execute, initDatabase } from "@/lib/tidb";

// Abort controllers keyed by farm_id
const abortMap = new Map<string, boolean>();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function sseEvent(data: object) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

async function doActionWithLog(
  farmId: string,
  body: Record<string, unknown>
): Promise<{ success: boolean; result: Record<string, unknown>; error?: string }> {
  let result: Record<string, unknown>;
  let success = true;
  let errorMsg: string | undefined;

  try {
    result = await gameApi.doAction(farmId, body);
  } catch (e) {
    success = false;
    errorMsg = e instanceof Error ? e.message : "Unknown error";
    result = { error: errorMsg };
  }

  // Log to TiDB (best-effort)
  try {
    await initDatabase();
    await execute(
      `INSERT INTO operation_logs (farm_id, action_type, request_body, response_body, success, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
      [farmId, body.action_type as string, JSON.stringify(body), JSON.stringify(result), success, errorMsg || null]
    );
  } catch { /* ignore */ }

  return { success, result, error: errorMsg };
}

// Parse cooldown wait time from error message
// e.g. "请等待 6 分钟后再试" -> 360 (seconds)
// e.g. "请等待 30 秒后再试" -> 30
function parseCooldownSeconds(msg: string): number {
  const minMatch = msg.match(/(\d+)\s*分钟/);
  if (minMatch) return parseInt(minMatch[1]) * 60;
  const secMatch = msg.match(/(\d+)\s*秒/);
  if (secMatch) return parseInt(secMatch[1]);
  return 0;
}

async function doActionWithRetry(
  farmId: string,
  body: Record<string, unknown>,
  cooldown: number,
  encoder: TextEncoder,
  controller: ReadableStreamDefaultController<Uint8Array>,
  onWaiting?: (waitSec: number) => void
): Promise<{ success: boolean; result: Record<string, unknown>; error?: string }> {
  let res = await doActionWithLog(farmId, body);
  if (res.success) return res;

  const errMsg = (res.result?.error || res.result?.message || "") as string;
  const waitSec = parseCooldownSeconds(errMsg);

  if (waitSec > 0) {
    onWaiting?.(waitSec);
    await sleep(waitSec * 1000);
    res = await doActionWithLog(farmId, body);
  }

  return { ...res, error: res.error };
}

// Best seasonal crops for auto-planting
const seasonalCrops: Record<string, string> = {
  spring: "parsnip",
  summer: "blueberry",
  autumn: "cranberry",
  fall: "cranberry",
  winter: "winter_seeds",
};

export async function POST(req: Request) {
  const farmId = gameConfig.farmId;
  if (!farmId) {
    return NextResponse.json({ error: "FARM_ID not configured" }, { status: 400 });
  }

  let body: { cooldown?: number } = {};
  try {
    body = await req.json();
  } catch { /* use defaults */ }
  const cooldown = Math.max(800, body.cooldown || 1500);

  // Mark as running
  abortMap.set(farmId, false);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const push = (data: object) => {
        try {
          controller.enqueue(encoder.encode(sseEvent(data)));
        } catch { /* stream closed */ }
      };

      const isAborted = () => abortMap.get(farmId) === true;

      let actionsCount = 0;
      let errorsCount = 0;
      let initialGold = 0;

      try {
        // Step 0: Fetch status
        push({ step: "init", action: "status", status: "running", message: "正在获取农场状态..." });

        let status;
        try {
          status = await gameApi.getFarmStatus(farmId);
        } catch (e) {
          push({
            step: "init",
            action: "status",
            status: "error",
            message: `获取状态失败: ${e instanceof Error ? e.message : "Unknown"}`,
          });
          controller.close();
          return;
        }

        initialGold = status.gold || 0;
        const season = (status.season || "spring").toLowerCase();
        const cropType = seasonalCrops[season] || "parsnip";
        const weather = (status.weather || "").toLowerCase();
        const isRainy = weather === "rainy" || weather === "stormy";
        const energy = status.energy?.current ?? 0;
        const maxEnergy = status.energy?.max ?? 100;
        const quota = status.daily_quota;

        push({
          step: "init",
          action: "status",
          status: "success",
          message: `第 ${status.day} 天 | ${season} | ${weather} | 金币: ${initialGold} | 体力: ${energy}/${maxEnergy} | 配额: ${quota?.used}/${quota?.limit}`,
          detail: {
            day: status.day,
            season,
            weather,
            gold: initialGold,
            energy: `${energy}/${maxEnergy}`,
            quota: `${quota?.used ?? 0}/${quota?.limit ?? 0}`,
            landStatus: status.land_status,
          },
        });

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Check quota — used means REMAINING quota
        if (quota && quota.used <= 0) {
          push({ step: "info", action: "quota", status: "running", message: `配额已用尽 (${quota.used}/${quota.limit})，操作可能被拒绝，继续尝试...` });
        }

        // Step 1: Collect products
        push({ step: 1, action: "collect_products", status: "running", message: "收集动物产品..." });
        {
          const res = await doActionWithRetry(farmId, { action_type: "collect_products" }, cooldown, encoder, controller);
          if (res.success) actionsCount++; else errorsCount++;
          push({
            step: 1, action: "collect_products",
            status: res.success ? "success" : "error",
            message: res.success ? "动物产品已收集" : `收集失败: ${res.error || "未知错误"}`,
          });
        }
        await sleep(cooldown);

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Step 2: Till empty land — find empty positions from farm_layout.grid
        const grid = status.farm_layout?.grid;
        const emptyCount = status.land_status?.empty ?? 0;

        if (emptyCount > 0 && grid) {
          // Find positions where grid[row][col] === 0 (empty)
          const emptyPositions: [number, number][] = [];
          for (let y = 0; y < grid.length; y++) {
            for (let x = 0; x < (grid[y]?.length || 0); x++) {
              if (grid[y][x] === 0) {
                emptyPositions.push([x, y]);
              }
            }

          }

          if (emptyPositions.length > 0) {
            push({ step: 2, action: "till", status: "running", message: `发现 ${emptyCount} 块空地，开垦 ${emptyPositions.length} 块...` });
            const res = await doActionWithRetry(farmId, { action_type: "till", positions: emptyPositions }, cooldown, encoder, controller);
            if (res.success) actionsCount++; else errorsCount++;
            push({
              step: 2, action: "till",
              status: res.success ? "success" : "error",
              message: res.success ? `已开垦 ${emptyPositions.length} 块土地` : `开垦失败: ${res.error || "未知错误"}`,
            });
            await sleep(cooldown);
          } else {
            push({ step: 2, action: "till", status: "skip", message: "没有空地需要开垦" });
          }
        } else {
          push({ step: 2, action: "till", status: "skip", message: "没有空地需要开垦" });
        }

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Step 3: Plant on tilled tiles
        try {
          const freshStatus = await gameApi.getFarmStatus(farmId);
          const freshGrid = freshStatus.farm_layout?.grid;
          const freshCrops = freshStatus.crops_detail || [];

          // Build set of planted positions
          const plantedPositions = new Set(
            freshCrops.map((c) => `${c.position_x},${c.position_y}`)
          );

          // Find tilled-but-empty positions (grid=1, not in plantedPositions)
          const plantablePositions: [number, number][] = [];
          if (freshGrid) {
            for (let y = 0; y < freshGrid.length; y++) {
              for (let x = 0; x < (freshGrid[y]?.length || 0); x++) {
                if (freshGrid[y][x] === 1 && !plantedPositions.has(`${x},${y}`)) {
                  plantablePositions.push([x, y]);
                }
              }
            }
          }

          if (plantablePositions.length > 0) {
            // Limit to 20 positions per request (API may have limits)
            const positions = plantablePositions.slice(0, 20);
            push({
              step: 3, action: "plant", status: "running",
              message: `发现 ${plantablePositions.length} 块可种植土地，种植 ${cropType} (首批 ${positions.length} 块)...`,
            });
            const res = await doActionWithRetry(
              farmId,
              { action_type: "plant", crop_type: cropType, positions },
              cooldown, encoder, controller
            );
            if (res.success) actionsCount++; else errorsCount++;
            push({
              step: 3, action: "plant",
              status: res.success ? "success" : "error",
              message: res.success ? `已种植 ${positions.length} 株 ${cropType}` : `种植失败: ${res.error || "未知错误"}`,
            });
            await sleep(cooldown);
          } else {
            push({ step: 3, action: "plant", status: "skip", message: "没有空地需要种植" });
          }
        } catch (e) {
          push({ step: 3, action: "plant", status: "error", message: `检查种植失败: ${e instanceof Error ? e.message : "未知"}` });
        }

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Step 4: Water all
        if (!isRainy) {
          push({ step: 4, action: "water", status: "running", message: "浇水全部作物..." });
          const res = await doActionWithRetry(farmId, { action_type: "water", mode: "all" }, cooldown, encoder, controller);
          if (res.success) actionsCount++; else errorsCount++;
          push({
            step: 4, action: "water",
            status: res.success ? "success" : "error",
            message: res.success ? "浇水完成" : `浇水失败: ${res.error || "未知错误"}`,
          });
          await sleep(cooldown);
        } else {
          push({ step: 4, action: "water", status: "skip", message: `${weather}天气，自动跳过浇水` });
        }

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Step 5: Harvest mature crops
        const cropsDetail: CropDetail[] = status.crops_detail || [];
        const matureCrops = cropsDetail.filter(
          (c) => c.growth_stage >= c.max_growth_stage
        );

        if (matureCrops.length > 0) {
          push({ step: 5, action: "harvest", status: "running", message: `发现 ${matureCrops.length} 株成熟作物，收获中...` });
          const res = await doActionWithRetry(farmId, { action_type: "harvest" }, cooldown, encoder, controller);
          if (res.success) actionsCount++; else errorsCount++;
          push({
            step: 5, action: "harvest",
            status: res.success ? "success" : "error",
            message: res.success ? "收获完成（已存入背包）" : `收获失败: ${res.error || "未知错误"}`,
          });
          await sleep(cooldown);
        } else {
          const growing = cropsDetail.filter((c) => c.growth_stage < c.max_growth_stage);
          push({
            step: 5, action: "harvest", status: "skip",
            message: `没有成熟作物可收获 (${growing.length} 株生长中)`,
          });
        }

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Step 6: Sell the highest-value item from inventory (once)
        try {
          const [sellStatus, marketPrices] = await Promise.all([
            gameApi.getFarmStatus(farmId),
            gameApi.getMarketPrices().catch(() => null),
          ]);
          const invItems = sellStatus.inventory_items || [];

          // Build price lookup from market data
          const priceMap = new Map<string, number>();
          if (marketPrices) {
            // crop sell prices
            if (marketPrices.crops) {
              for (const [k, v] of Object.entries(marketPrices.crops)) {
                priceMap.set(k, v.sell ?? v.base_sell ?? 0);
              }
            }
            // animal product sell prices
            if (marketPrices.animal_products) {
              for (const [k, v] of Object.entries(marketPrices.animal_products)) {
                priceMap.set(k, v.sell ?? 0);
              }
            }
            // fish sell prices
            if (marketPrices.fish) {
              for (const [k, v] of Object.entries(marketPrices.fish)) {
                priceMap.set(k, v.sell ?? 0);
              }
            }
          }

          // Sellable items: skip buildings, tools, seeds, animals, special items
          const skipPrefixes = ["_seeds", "_seed"];
          const skipKeys = new Set([
            "energy_potion", "fertilizer", "sprinkler", "mystery_box",
            "hoe", "watering_can", "scythe", "axe", "pickaxe",
            "coop", "barn", "mill", "pond", "silo", "stable", "winery",
            "greenhouse", "scarecrow", "tool_shed", "flower_pot",
            "compost_bin", "watering_trough", "water_tower",
            "slime_hutch", "ancient_ruins", "magic_spring",
            "observatory", "golden_statue", "perpetual_engine",
            "star_temple", "wizard_tower", "sky_garden", "dragon_lair",
            "time_altar", "divine_sanctuary", "void_portal",
            "world_tree", "cosmos_observatory", "supreme_throne",
            "chicken", "cow", "sheep", "dog", "duck", "rabbit",
            "goat", "pig", "horse", "cat", "owl",
            "land_expansions", "purchased_lands", "total_grid_increase",
          ]);

          const sellableItems = invItems.filter((item) => {
            if (skipKeys.has(item.key)) return false;
            if (skipPrefixes.some((p) => item.key.endsWith(p))) return false;
            return item.count > 0;
          });

          if (sellableItems.length > 0) {
            // Find item with highest total value (count * unit_price)
            let bestItem = sellableItems[0];
            let bestValue = 0;
            for (const item of sellableItems) {
              const unitPrice = priceMap.get(item.key) ?? 0;
              const totalValue = item.count * unitPrice;
              if (totalValue > bestValue) {
                bestValue = totalValue;
                bestItem = item;
              }
            }

            const unitPrice = priceMap.get(bestItem.key) ?? 0;
            const sellQty = Math.min(bestItem.count, 1000);
            push({
              step: 6, action: "sell", status: "running",
              message: `出售价值最高的物品: ${bestItem.name} x${sellQty} (约 ${(sellQty * unitPrice).toLocaleString()}G)`,
            });

            const res = await doActionWithRetry(
              farmId,
              { action_type: "sell", item_type: bestItem.key, quantity: sellQty },
              cooldown, encoder, controller,
              (waitSec) => push({ step: 6, action: "sell", status: "running", message: `频率限制，等待 ${waitSec} 秒后重试...` })
            );
            if (res.success) actionsCount++; else errorsCount++;
            push({
              step: 6, action: "sell",
              status: res.success ? "success" : "error",
              message: res.success
                ? `出售 ${bestItem.name} x${sellQty} (单价 ${unitPrice}G)`
                : `出售 ${bestItem.name} 失败: ${res.error || "未知"}`,
            });
            await sleep(cooldown);
          } else {
            push({ step: 6, action: "sell", status: "skip", message: "背包中没有可出售的物品" });
          }
        } catch (e) {
          push({ step: 6, action: "sell", status: "error", message: `出售失败: ${e instanceof Error ? e.message : "未知"}` });
        }

        if (isAborted()) { push({ step: "done", status: "skip", message: "已中止" }); controller.close(); return; }

        // Step 7: Next day
        push({ step: 7, action: "next-day", status: "running", message: "进入下一天..." });
        {
          let success = true;
          let errorMsg: string | undefined;
          let result: Record<string, unknown>;
          try {
            result = await gameApi.nextDay(farmId);
          } catch (e) {
            success = false;
            errorMsg = e instanceof Error ? e.message : "Unknown error";
            result = { error: errorMsg };
          }

          // Log to TiDB
          try {
            await initDatabase();
            await execute(
              `INSERT INTO operation_logs (farm_id, action_type, request_body, response_body, success, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
              [farmId, "next-day", "{}", JSON.stringify(result), success, errorMsg || null]
            );
          } catch { /* ignore */ }

          if (success) actionsCount++; else errorsCount++;
          push({
            step: 7, action: "next-day",
            status: success ? "success" : "error",
            message: success ? "已进入下一天" : `进入下一天失败: ${errorMsg || "未知"}`,
          });
        }

        // Final summary
        let finalGold = initialGold;
        let finalStatus;
        try {
          finalStatus = await gameApi.getFarmStatus(farmId);
          finalGold = finalStatus.gold || initialGold;
        } catch { /* use initial */ }

        // Save farm snapshot (best-effort)
        if (finalStatus) {
          try {
            await initDatabase();
            await execute(
              `INSERT INTO farm_snapshots (farm_id, gold, farm_level, xp, xp_to_next, energy, max_energy, total_crops, total_animals, total_buildings, reputation, land_tilled, land_planted, season, day, year, gold_change) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                farmId,
                finalStatus.gold || 0,
                finalStatus.farm_level || 0,
                finalStatus.xp || 0,
                finalStatus.xp_to_next || 0,
                finalStatus.energy?.current || 0,
                finalStatus.energy?.max || 0,
                (finalStatus.crops_detail || []).length,
                (finalStatus.animals || []).length,
                (finalStatus.buildings || []).length,
                finalStatus.reputation_score || 0,
                finalStatus.land_status?.tilled || 0,
                finalStatus.land_status?.planted || 0,
                finalStatus.season || "",
                finalStatus.day || 0,
                finalStatus.year || 0,
                finalGold - initialGold,
              ]
            );
          } catch { /* ignore */ }
        }

        push({
          step: "done",
          action: "summary",
          status: "success",
          message: `完成！共执行 ${actionsCount} 个操作，${errorsCount} 个错误。金币变化: ${initialGold} → ${finalGold} (${finalGold - initialGold >= 0 ? "+" : ""}${finalGold - initialGold})`,
          detail: {
            initialGold,
            finalGold,
            goldChange: finalGold - initialGold,
            actionsCount,
            errorsCount,
          },
        });
      } catch (e) {
        push({
          step: "error",
          action: "fatal",
          status: "error",
          message: `致命错误: ${e instanceof Error ? e.message : "Unknown"}`,
        });
      } finally {
        abortMap.delete(farmId);
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export async function DELETE() {
  const farmId = gameConfig.farmId;
  if (farmId) {
    abortMap.set(farmId, true);
  }
  return NextResponse.json({ message: "中止信号已发送" });
}
