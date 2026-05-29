"use client";

import { RefreshCw } from "lucide-react";
import type { FarmStatus } from "@/lib/game-api";

const seasonMap: Record<string, { name: string; emoji: string }> = {
  spring: { name: "春天", emoji: "🌱" },
  summer: { name: "夏天", emoji: "☀️" },
  autumn: { name: "秋天", emoji: "🍂" },
  fall: { name: "秋天", emoji: "🍂" },
  winter: { name: "冬天", emoji: "❄️" },
};

export function DashboardHeader({
  status,
  onRefresh,
  loading,
}: {
  status: FarmStatus;
  onRefresh: () => void;
  loading: boolean;
}) {
  const season = seasonMap[status.season?.toLowerCase()] || { name: status.season, emoji: "🌱" };

  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">
            {status.agent_info?.agent_name || "我的农场"}
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
            {season.emoji} {season.name} 第 {status.day} 天 · 第 {status.year} 年
          </span>
        </div>
        {status.agent_info?.bio && (
          <p className="text-slate-600 text-xs mt-0.5 italic">{status.agent_info.bio}</p>
        )}
        <p className="text-slate-500 text-sm mt-1">{status.farm_description}</p>
      </div>
      <button
        onClick={onRefresh}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        刷新
      </button>
    </div>
  );
}
