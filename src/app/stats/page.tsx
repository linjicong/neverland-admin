"use client";

import { useEffect, useState, useCallback } from "react";
import {
  BarChart3, RefreshCw, Coins, TrendingUp, Sprout, PawPrint, Building2,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";

interface FarmSnapshot {
  id: number;
  farm_id: string;
  gold: number;
  farm_level: number;
  xp: number;
  xp_to_next: number;
  energy: number;
  max_energy: number;
  total_crops: number;
  total_animals: number;
  total_buildings: number;
  reputation: number;
  land_tilled: number;
  land_planted: number;
  season: string;
  day: number;
  year: number;
  gold_change: number;
  created_at: string;
}

interface SnapshotsResponse {
  snapshots: FarmSnapshot[];
}

const timeRanges = [
  { label: "7天", value: 7 },
  { label: "14天", value: 14 },
  { label: "30天", value: 30 },
  { label: "全部", value: 365 },
];

function formatGold(n: number | string): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
    fontSize: "12px",
  },
};

export default function StatsPage() {
  const [snapshots, setSnapshots] = useState<FarmSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const fetchSnapshots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/snapshots?days=${days}`);
      const data: SnapshotsResponse = await res.json();
      if ((data as unknown as { error: string }).error) {
        throw new Error((data as unknown as { error: string }).error);
      }
      setSnapshots(data.snapshots || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取数据失败");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const latest = snapshots[snapshots.length - 1];

  const chartData = snapshots.map((s) => ({
    label: formatDate(s.created_at),
    gold: s.gold,
    gold_change: s.gold_change,
    farm_level: s.farm_level,
    xp: s.xp,
    total_crops: s.total_crops,
    total_animals: s.total_animals,
    total_buildings: s.total_buildings,
    energy: s.energy,
    reputation: s.reputation,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">数据统计</h1>
            <p className="text-sm text-slate-500">农场核心指标趋势分析</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {timeRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === r.value
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={fetchSnapshots}
            className="ml-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin" />
          <span className="ml-2 text-slate-400">加载中...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && snapshots.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500">
          <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg">暂无数据</p>
          <p className="text-sm mt-1">运行"一键操作"后将自动记录快照数据</p>
        </div>
      )}

      {!loading && !error && snapshots.length > 0 && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <OverviewCard
              icon={<Coins className="w-5 h-5 text-yellow-400" />}
              label="当前金币"
              value={formatGold(latest?.gold ?? 0)}
              sub={`等级 ${latest?.farm_level ?? 0}`}
              bgClass="from-yellow-500/10 to-amber-500/5"
            />
            <OverviewCard
              icon={<Sprout className="w-5 h-5 text-green-400" />}
              label="作物数量"
              value={String(latest?.total_crops ?? 0)}
              sub={`${latest?.land_tilled ?? 0} 块已开垦`}
              bgClass="from-green-500/10 to-emerald-500/5"
            />
            <OverviewCard
              icon={<PawPrint className="w-5 h-5 text-orange-400" />}
              label="动物数量"
              value={String(latest?.total_animals ?? 0)}
              sub={`声望 ${latest?.reputation ?? 0}`}
              bgClass="from-orange-500/10 to-red-500/5"
            />
            <OverviewCard
              icon={<Building2 className="w-5 h-5 text-blue-400" />}
              label="建筑数量"
              value={String(latest?.total_buildings ?? 0)}
              sub={`第 ${latest?.day ?? 0} 天 / ${latest?.season ?? ""}`}
              bgClass="from-blue-500/10 to-cyan-500/5"
            />
          </div>

          {/* Gold Trend */}
          <ChartCard title="金币趋势" subtitle="随时间变化的金币数量">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={formatGold} />
                <Tooltip {...tooltipStyle} formatter={(v) => [formatGold(Number(v)), "金币"]} />
                <Area type="monotone" dataKey="gold" stroke="#eab308" fill="url(#goldGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Gold Change Bar */}
          <ChartCard title="每日金币变化" subtitle="每次一键操作后的金币增减">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip {...tooltipStyle} formatter={(v) => [`${Number(v) >= 0 ? "+" : ""}${v}`, "变化"]} />
                <Bar
                  dataKey="gold_change"
                  radius={[4, 4, 0, 0]}
                  fill="#10b981"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Level & XP Trend */}
          <ChartCard title="等级与经验" subtitle="等级和经验值变化趋势">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="level" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="xp" orientation="right" stroke="#64748b" fontSize={11} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line yAxisId="level" type="monotone" dataKey="farm_level" name="等级" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line yAxisId="xp" type="monotone" dataKey="xp" name="经验" stroke="#06b6d4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Resources Trend */}
          <ChartCard title="资源趋势" subtitle="作物、动物、建筑数量变化">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip {...tooltipStyle} />
                <Legend />
                <Line type="monotone" dataKey="total_crops" name="作物" stroke="#22c55e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total_animals" name="动物" stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="total_buildings" name="建筑" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </>
      )}
    </div>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  sub,
  bgClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  bgClass: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${bgClass} rounded-xl border border-slate-800/50 p-4`}>
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-100">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
