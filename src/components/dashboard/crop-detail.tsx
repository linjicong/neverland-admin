"use client";

import { Grid3x3, Droplets } from "lucide-react";
import { SectionCard } from "@/components/ui";
import type { FarmStatus, CropDetail } from "@/lib/game-api";

export function CropDetailSection({ status }: { status: FarmStatus }) {
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
