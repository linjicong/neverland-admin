"use client";

import { Building2 } from "lucide-react";
import { SectionCard } from "@/components/ui";
import type { BuildingInfo } from "@/lib/game-api";

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

export function BuildingsSection({ buildings }: { buildings: BuildingInfo[] }) {
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
