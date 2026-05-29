"use client";

import { ProgressBar } from "@/components/ui";
import type { FarmStatus } from "@/lib/game-api";
import { Zap, Clock } from "lucide-react";

function formatResetTime(isoStr: string): string {
  try {
    const resetDate = new Date(isoStr);
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();
    if (diff <= 0) return "已重置";
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}小时${minutes}分钟后重置`;
    return `${minutes}分钟后重置`;
  } catch {
    return "";
  }
}

export function ResourceBars({ status }: { status: FarmStatus }) {
  const quotaUsed = status.daily_quota?.used ?? 0;
  const quotaLimit = status.daily_quota?.limit ?? 20;
  const quotaFull = quotaUsed >= quotaLimit;

  return (
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
      <div>
        <ProgressBar
          label="每日配额"
          current={quotaUsed}
          max={quotaLimit}
          color={quotaFull ? "bg-gradient-to-r from-red-500 to-rose-400" : "bg-gradient-to-r from-blue-500 to-cyan-400"}
        />
        {status.daily_quota?.resets_at && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Clock className="w-3 h-3 text-slate-600" />
            <span className={`text-xs ${quotaFull ? "text-amber-400" : "text-slate-600"}`}>
              {formatResetTime(status.daily_quota.resets_at)}
            </span>
          </div>
        )}
      </div>
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
  );
}
