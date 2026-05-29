"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCard, ProgressBar, SectionCard } from "@/components/ui";
import type { FarmStatus, CropDetail, BuildingInfo, AnimalInfo, InventoryItem } from "@/lib/game-api";
import {
  Coins,
  Zap,
  Star,
  Calendar,
  Cloud,
  Sprout,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
  Grid3x3,
  Droplets,
  Building2,
  PawPrint,
  Package,
} from "lucide-react";

const seasonMap: Record<string, { name: string; emoji: string }> = {
  spring: { name: "春天", emoji: " " },
  summer: { name: "夏天", emoji: "☀️" },
  autumn: { name: "秋天", emoji: " " },
  fall: { name: "秋天", emoji: " " },
  winter: { name: "冬天", emoji: "❄️" },
};

const weatherMap: Record<string, { name: string; emoji: string }> = {
  sunny: { name: "晴天", emoji: "☀️" },
  cloudy: { name: "多云", emoji: "☁️" },
  rainy: { name: "雨天", emoji: " " },
  stormy: { name: "暴风雨", emoji: "⛈️" },
  snowy: { name: "雪天", emoji: " " },
};

function CropDetailSection({ status }: { status: FarmStatus }) {
  const size = status.farm_layout?.size ?? 12;
  const cropsDetail = status.crops_detail ?? [];

  const cropMap = new Map<string, CropDetail>();
  cropsDetail.forEach((crop) => {
    cropMap.set(`${crop.position_x},${crop.position_y}`, crop);
  });

  return (
    <SectionCard
      title="作物详情"
      icon={<Grid3x3 className="w-4 h-4 text-emerald-400" />}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="shrink-0">
          <p className="text-xs text-slate-500 mb-2">农场布局 ({size}x{size})</p>
          <div
            className="grid gap-0.5"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: size }, (_, y) =>
              Array.from({ length: size }, (_, x) => {
                const crop = cropMap.get(`${x},${y}`);
                let cellClass = "bg-slate-800/50";
                if (crop) {
                  if (crop.growth_stage >= crop.max_growth_stage) {
                    cellClass = "bg-emerald-500/60";
                  } else if (crop.watered_today) {
                    cellClass = "bg-blue-500/40";
                  } else {
                    cellClass = "bg-amber-500/40";
                  }
                }
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`w-4 h-4 rounded-sm ${cellClass}`}
                    title={crop ? `${crop.name} (${crop.growth_stage}/${crop.max_growth_stage})` : "空地"}
                  />
                );
              })
            )}
          </div>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-emerald-500/60" />成熟</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-blue-500/40" />生长中</span>
            <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm bg-slate-800/50" />空地</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 mb-2">
            作物明细 ({cropsDetail.length} 块)
          </p>
          <div className="max-h-64 overflow-auto rounded-lg border border-slate-800">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/50 sticky top-0">
                <tr className="text-xs text-slate-400">
                  <th className="px-3 py-2 text-left">位置</th>
                  <th className="px-3 py-2 text-left">名称</th>
                  <th className="px-3 py-2 text-center">生长阶段</th>
                  <th className="px-3 py-2 text-center">浇水</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {cropsDetail.map((crop) => (
                  <tr key={crop.crop_id} className="text-slate-300 hover:bg-slate-800/30">
                    <td className="px-3 py-1.5 text-xs font-mono text-slate-500">
                      ({crop.position_x}, {crop.position_y})
                    </td>
                    <td className="px-3 py-1.5">{crop.name}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`text-xs ${crop.growth_stage >= crop.max_growth_stage ? "text-emerald-400" : "text-slate-400"}`}>
                        {crop.growth_stage} / {crop.max_growth_stage}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      {crop.watered_today ? (
                        <Droplets className="w-3.5 h-3.5 text-blue-400 inline" />
                      ) : (
                        <span className="text-xs text-amber-400">未浇</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function BuildingsSection({ buildings }: { buildings: BuildingInfo[] }) {
  function formatBonus(bonus: Record<string, unknown> | null): string {
    if (!bonus) return "无加成";
    const parts: string[] = [];
    if (bonus.type && typeof bonus.type === "string") {
      const typeNames: Record<string, string> = {
        crop_protection: "作物保护",
        fertilizer_production: "肥料生产",
        water_energy_save: "省水节能",
        tool_durability: "工具耐久",
        indoor_planting: "室内种植",
        egg_speed: "产蛋加速",
        product_yield: "产物增产",
        growth_speed: "生长加速",
        crop_price: "作物价格",
        fruit_price: "水果价格",
        feed_cost: "饲料成本",
        move_speed: "移动加速",
        auto_water: "自动浇水",
        fishing: "钓鱼加成",
        slime: "史莱姆",
        quality_bonus: "品质加成",
        animal_output: "动物产出",
        meteor_shower: "流星雨",
        gold_bonus: "金币加成",
        auto_farm: "自动农场",
      };
      parts.push(typeNames[bonus.type] || bonus.type);
    }
    if (bonus.value !== undefined) {
      const val = bonus.value;
      if (typeof val === "number" && val > 0 && val < 10) {
        parts.push(`+${Math.round(val * 100)}%`);
      } else if (typeof val === "boolean" && val) {
        parts.push("已激活");
      }
    }
    if (bonus.auto_feed === true) parts.push("自动喂食");
    if (bonus.auto_collect === true) parts.push("自动收集");
    if (bonus.auto_water === true) parts.push("自动浇水");
    if (bonus.auto_fish === true) parts.push("自动钓鱼");
    if (bonus.free_feed === true) parts.push("免费饲料");
    if (bonus.daily_income !== undefined) parts.push(`日入${bonus.daily_income}金币`);
    return parts.join(" · ") || "特殊加成";
  }

  return (
    <SectionCard
      title="建筑列表"
      icon={<Building2 className="w-4 h-4 text-blue-400" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {buildings.map((b) => (
          <div
            key={b.type}
            className="rounded-xl border border-slate-800 bg-slate-800/30 p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">{b.name}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                Lv.{b.level}
              </span>
            </div>
            {b.capacity > 0 && (
              <div className="text-xs text-slate-500">
                容量: <span className="text-slate-300">{b.capacity}</span>
              </div>
            )}
            <div className="text-xs text-slate-400 leading-relaxed">
              {formatBonus(b.bonus)}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function AnimalsSection({ animals }: { animals: AnimalInfo[] }) {
  return (
    <SectionCard
      title="动物列表"
      icon={<PawPrint className="w-4 h-4 text-orange-400" />}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {animals.map((animal) => {
          const dailyIncome =
            animal.product_price && animal.product_cycle
              ? Math.round((animal.product_price / animal.product_cycle) * animal.count)
              : 0;

          return (
            <div
              key={animal.type}
              className="rounded-xl border border-slate-800 bg-slate-800/30 p-3 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-200">{animal.name}</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">
                  x{animal.count}
                </span>
              </div>

              {animal.product ? (
                <div className="space-y-1">
                  <div className="text-xs text-slate-400">
                    产出: <span className="text-slate-300">{animal.product_name}</span>
                  </div>
                  <div className="text-xs text-slate-400">
                    周期: <span className="text-slate-300">{animal.product_cycle}天</span>
                    {animal.product_price && (
                      <span className="ml-2 text-slate-500">单价: {animal.product_price}金币</span>
                    )}
                  </div>
                  {dailyIncome > 0 && (
                    <div className="text-xs text-emerald-400">
                      预估日收益: {dailyIncome.toLocaleString()} 金币
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500">无产出</div>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function InventorySection({ items }: { items: InventoryItem[] }) {
  const categories: { key: string; label: string; filter: (item: InventoryItem) => boolean }[] = [
    {
      key: "seeds",
      label: "种子",
      filter: (item) => item.key.endsWith("_seeds") || item.key === "rare_seed" || item.key === "coffee_bean",
    },
    {
      key: "animals",
      label: "动物",
      filter: (item) =>
        ["chicken", "cow", "sheep", "pig", "duck", "rabbit", "horse", "dog"].includes(item.key),
    },
    {
      key: "buildings",
      label: "建筑",
      filter: (item) =>
        ["barn", "coop", "mill", "pond", "silo", "stable", "winery", "scarecrow",
         "tool_shed", "flower_pot", "greenhouse", "compost_bin", "observatory",
         "slime_hutch", "water_tower", "magic_spring", "ancient_ruins",
         "golden_statue", "watering_trough", "perpetual_engine"].includes(item.key),
    },
    {
      key: "fish",
      label: "鱼类",
      filter: (item) =>
        ["bass", "carp", "pike", "perch", "salmon", "catfish", "sturgeon",
         "snail", "crayfish", "blobfish", "golden_carp", "mermaid_fish", "legendary_carp"].includes(item.key),
    },
    {
      key: "products",
      label: "产品",
      filter: (item) =>
        ["egg", "milk", "wool", "duck_egg", "truffle", "rabbit_foot", "tomato",
         "wheat", "parsnip", "ancient_fruit", "blueberry"].includes(item.key),
    },
    {
      key: "other",
      label: "其他",
      filter: () => true,
    },
  ];

  const assigned = new Set<string>();
  const categorized: Record<string, InventoryItem[]> = {};

  categories.forEach((cat) => {
    if (cat.key === "other") return;
    categorized[cat.key] = items.filter((item) => {
      if (assigned.has(item.key)) return false;
      if (cat.filter(item)) {
        assigned.add(item.key);
        return true;
      }
      return false;
    });
  });

  categorized["other"] = items.filter((item) => !assigned.has(item.key));

  const categoryColors: Record<string, string> = {
    seeds: "text-green-400 bg-green-500/10",
    animals: "text-orange-400 bg-orange-500/10",
    buildings: "text-blue-400 bg-blue-500/10",
    fish: "text-cyan-400 bg-cyan-500/10",
    products: "text-amber-400 bg-amber-500/10",
    other: "text-slate-400 bg-slate-500/10",
  };

  return (
    <SectionCard
      title="背包"
      icon={<Package className="w-4 h-4 text-purple-400" />}
    >
      <div className="space-y-4">
        {categories.map((cat) => {
          const catItems = categorized[cat.key] ?? [];
          if (catItems.length === 0) return null;
          return (
            <div key={cat.key}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[cat.key]}`}>
                  {cat.label}
                </span>
                <span className="text-xs text-slate-500">{catItems.length} 种</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {catItems.map((item) => (
                  <span
                    key={item.key}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 border border-slate-700/50"
                  >
                    {item.name}
                    <span className="ml-1 text-slate-500">x{item.count}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

export default function DashboardPage() {
  const [status, setStatus] = useState<FarmStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/status");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStatus(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取状态失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading && !status) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-slate-400 text-sm">加载农场状态...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-slate-500 text-sm max-w-md">
            请检查 .env.local 中的 GAME_API_URL 和 FARM_ID 是否正确配置
          </p>
          <button
            onClick={fetchStatus}
            className="mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!status) return null;

  const season = seasonMap[status.season?.toLowerCase()] || { name: status.season, emoji: " " };
  const weather = weatherMap[status.weather?.toLowerCase()] || { name: status.weather, emoji: " " };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {status.agent_info?.agent_name || "我的农场"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {status.farm_description}
          </p>
        </div>
        <button
          onClick={fetchStatus}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="金币"
          value={status.gold?.toLocaleString() ?? 0}
          icon={<Coins className="w-6 h-6" />}
          color="amber"
        />
        <StatCard
          title="等级"
          value={`Lv.${status.farm_level ?? 1}`}
          icon={<Star className="w-6 h-6" />}
          subtitle={`${(status.xp ?? 0).toLocaleString()} / ${(status.xp_to_next ?? 0).toLocaleString()} XP`}
          color="purple"
          progress={{ current: status.xp ?? 0, max: status.xp_to_next ?? 1 }}
        />
        <StatCard
          title="季节 / 天数"
          value={`${season.emoji} ${season.name}`}
          icon={<Calendar className="w-6 h-6" />}
          subtitle={`第 ${status.day ?? 1} 天 · 第 ${status.year ?? 1} 年`}
          color="blue"
        />
        <StatCard
          title="天气"
          value={`${weather.emoji} ${weather.name}`}
          icon={<Cloud className="w-6 h-6" />}
          subtitle={
            status.weather_forecast
              ? `明天: ${status.weather_forecast.tomorrow} (${Math.round(status.weather_forecast.confidence * 100)}%)`
              : undefined
          }
          color="cyan"
        />
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            资源状态
          </h3>
          <ProgressBar
            label="体力"
            current={status.energy?.current ?? 0}
            max={status.energy?.max ?? 100}
            color="bg-gradient-to-r from-amber-500 to-yellow-400"
          />
          <ProgressBar
            label="每日配额"
            current={status.daily_quota?.used ?? 0}
            max={status.daily_quota?.limit ?? 20}
            color="bg-gradient-to-r from-blue-500 to-cyan-400"
          />
          <ProgressBar
            label="经验值"
            current={status.xp ?? 0}
            max={status.xp_to_next ?? 1}
            color="bg-gradient-to-r from-purple-500 to-violet-400"
          />
          <ProgressBar
            label="声望"
            current={status.achievements?.reputation ?? status.reputation_score ?? 50}
            max={100}
            color="bg-gradient-to-r from-rose-500 to-pink-400"
          />
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            农场概况
          </h3>

          {/* Land Status */}
          {status.land_status && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <p className="text-xl font-bold text-emerald-400">
                  {status.land_status.tilled}
                </p>
                <p className="text-xs text-slate-500">已开垦</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <p className="text-xl font-bold text-green-400">
                  {status.land_status.planted}
                </p>
                <p className="text-xs text-slate-500">已种植</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <p className="text-xl font-bold text-blue-400">
                  {status.land_status.watered}
                </p>
                <p className="text-xs text-slate-500">已浇水</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-slate-800/50">
                <p className="text-xl font-bold text-slate-400">
                  {status.land_status.empty}
                </p>
                <p className="text-xs text-slate-500">空地</p>
              </div>
            </div>
          )}

          {/* Crops Summary */}
          {status.crops && status.crops.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">作物状态</p>
              <div className="space-y-2">
                {status.crops.map((crop, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-slate-200">{crop.name}</span>
                      <span className="text-slate-500">x{crop.count}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">
                        阶段 {crop.growth_stage}/{crop.status === "已成熟" ? "已成熟" : "生长中"}
                      </span>
                      {crop.watered_today ? (
                        <span className="text-blue-400">已浇水</span>
                      ) : (
                        <span className="text-amber-400">未浇水</span>
                      )}
                      <span className="text-slate-400">
                        {crop.days_to_harvest}天后收获
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Crop Detail */}
      {status.crops_detail && status.crops_detail.length > 0 && (
        <CropDetailSection status={status} />
      )}

      {/* Buildings */}
      {status.buildings && status.buildings.length > 0 && (
        <BuildingsSection buildings={status.buildings} />
      )}

      {/* Animals */}
      {status.animals && status.animals.length > 0 && (
        <AnimalsSection animals={status.animals} />
      )}

      {/* Full Inventory */}
      {status.inventory_items && status.inventory_items.length > 0 && (
        <InventorySection items={status.inventory_items} />
      )}

      {/* Suggestions */}
      {status.suggestions && status.suggestions.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-4">
            <Sprout className="w-4 h-4 text-emerald-400" />
            建议操作
          </h3>
          <div className="space-y-2">
            {status.suggestions.map((suggestion, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-800/40 text-sm text-slate-300"
              >
                <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Bonus */}
      {status.daily_bonus?.available && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            每日奖励可用
          </h3>
          <p className="text-sm text-slate-300">
            {status.daily_bonus.type}: {status.daily_bonus.description}
          </p>
        </div>
      )}
    </div>
  );
}
