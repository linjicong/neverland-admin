"use client";

import { PawPrint } from "lucide-react";
import { SectionCard } from "@/components/ui";
import type { AnimalInfo } from "@/lib/game-api";

export function AnimalsSection({ animals }: { animals: AnimalInfo[] }) {
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
