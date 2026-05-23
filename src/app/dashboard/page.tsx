"use client";

import { useEffect, useState, useCallback } from "react";
import { StatCard, ProgressBar } from "@/components/ui";
import type { FarmStatus } from "@/lib/game-api";
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
            <div className="grid grid-cols-4 gap-3">
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

          {/* Inventory Preview */}
          {status.inventory_items && status.inventory_items.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">背包 (前10)</p>
              <div className="flex flex-wrap gap-2">
                {status.inventory_items.slice(0, 10).map((item) => (
                  <span
                    key={item.key}
                    className="px-2 py-1 text-xs rounded-lg bg-slate-800 text-slate-300"
                  >
                    {item.name}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

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
