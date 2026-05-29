"use client";

import { StatCard } from "@/components/ui";
import type { FarmStatus } from "@/lib/game-api";
import { Coins, Star, Calendar, Cloud, Trophy, Leaf, Award } from "lucide-react";

const seasonMap: Record<string, { name: string; emoji: string }> = {
  spring: { name: "春天", emoji: "🌱" },
  summer: { name: "夏天", emoji: "☀️" },
  autumn: { name: "秋天", emoji: "🍂" },
  fall: { name: "秋天", emoji: "🍂" },
  winter: { name: "冬天", emoji: "❄️" },
};

const weatherMap: Record<string, { name: string; emoji: string }> = {
  sunny: { name: "晴天", emoji: "☀️" },
  cloudy: { name: "多云", emoji: "☁️" },
  rainy: { name: "雨天", emoji: "🌧️" },
  stormy: { name: "暴风雨", emoji: "⛈️" },
  snowy: { name: "雪天", emoji: "🌨️" },
};

export function StatCards({ status }: { status: FarmStatus }) {
  const season = seasonMap[status.season?.toLowerCase()] || { name: status.season, emoji: "🌱" };
  const weather = weatherMap[status.weather?.toLowerCase()] || { name: status.weather, emoji: "🌡️" };

  return (
    <div className="space-y-4">
      {/* Primary stats */}
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
              ? `明天: ${weatherMap[status.weather_forecast.tomorrow]?.name ?? status.weather_forecast.tomorrow}`
              : undefined
          }
          color="cyan"
        />
      </div>

      {/* Weather forecast confidence */}
      {status.weather_forecast && (
        <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">明日天气预报</span>
            <span className="text-xs text-cyan-400">
              {weatherMap[status.weather_forecast.tomorrow]?.emoji ?? "🌡️"}{" "}
              {weatherMap[status.weather_forecast.tomorrow]?.name ?? status.weather_forecast.tomorrow}
            </span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-500"
              style={{ width: `${Math.round(status.weather_forecast.confidence * 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            预报置信度: <span className="text-cyan-400 font-mono">{Math.round(status.weather_forecast.confidence * 100)}%</span>
          </p>
        </div>
      )}

      {/* Achievement stats */}
      {status.achievements && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">连续登录</p>
              <p className="text-xl font-bold text-amber-400">{status.achievements.daily_streak} 天</p>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/5 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-500/20">
              <Leaf className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">总收获次数</p>
              <p className="text-xl font-bold text-emerald-400">{status.achievements.total_harvest.toLocaleString()}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-500/10 to-pink-500/5 p-4 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-rose-500/20">
              <Award className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">声望</p>
              <p className="text-xl font-bold text-rose-400">{status.achievements.reputation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
