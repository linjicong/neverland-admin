"use client";

import { Package } from "lucide-react";
import { SectionCard } from "@/components/ui";
import type { InventoryItem } from "@/lib/game-api";

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

const categoryColors: Record<string, string> = {
  seeds: "text-green-400 bg-green-500/10",
  animals: "text-orange-400 bg-orange-500/10",
  buildings: "text-blue-400 bg-blue-500/10",
  fish: "text-cyan-400 bg-cyan-500/10",
  products: "text-amber-400 bg-amber-500/10",
  other: "text-slate-400 bg-slate-500/10",
};

function categorizeItems(items: InventoryItem[]): Record<string, InventoryItem[]> {
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
  return categorized;
}

export function InventorySection({ items }: { items: InventoryItem[] }) {
  const categorized = categorizeItems(items);

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
