"use client";

import { Sprout } from "lucide-react";
import type { FarmStatus } from "@/lib/game-api";

export function FarmOverview({ status }: { status: FarmStatus }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 space-y-4">
      <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <Sprout className="w-4 h-4 text-emerald-400" />
        农场概况
      </h3>

      {status.land_status && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-xl bg-slate-800/50">
            <p className="text-xl font-bold text-emerald-400">{status.land_status.tilled}</p>
            <p className="text-xs text-slate-500">已开垦</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-800/50">
            <p className="text-xl font-bold text-green-400">{status.land_status.planted}</p>
            <p className="text-xs text-slate-500">已种植</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-800/50">
            <p className="text-xl font-bold text-blue-400">{status.land_status.watered}</p>
            <p className="text-xs text-slate-500">已浇水</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-slate-800/50">
            <p className="text-xl font-bold text-slate-400">{status.land_status.empty}</p>
            <p className="text-xs text-slate-500">空地</p>
          </div>
        </div>
      )}

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
                  <span className="text-slate-400">{crop.days_to_harvest}天后收获</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
