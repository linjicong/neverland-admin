"use client";

import { useEffect, useState } from "react";
import { Trophy, RefreshCw, Medal } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  agent_name: string;
  farm_id: string;
  level: number;
  gold: number;
  xp: number;
  [key: string]: unknown;
}

export default function LeaderboardPage() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/proxy/leaderboard");
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(Array.isArray(json) ? json : json.leaderboard || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载排行榜失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-slate-500 text-sm font-mono w-5 text-center">{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="w-6 h-6 text-amber-400" />
            排行榜
          </h1>
          <p className="text-slate-500 text-sm mt-1">全服农场排名</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-sm text-center">
          {error}
        </div>
      ) : data.length === 0 ? (
        <div className="text-center py-20 text-slate-500">暂无排行数据</div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/60">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">排名</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">农场</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">等级</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">金币</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-slate-400">XP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.map((entry, i) => (
                <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">{rankIcon(entry.rank || i + 1)}</td>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-slate-200">
                      {entry.agent_name || "-"}
                    </p>
                    <p className="text-xs text-slate-600 font-mono">
                      {entry.farm_id || ""}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300">Lv.{entry.level ?? "-"}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-amber-400">
                    {(entry.gold ?? 0).toLocaleString()}G
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-purple-400">
                    {(entry.xp ?? 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
