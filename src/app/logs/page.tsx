"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ScrollText,
  RefreshCw,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface LogEntry {
  id: number;
  farm_id: string;
  action_type: string;
  request_body: string;
  response_body: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

interface LogsResponse {
  logs: LogEntry[];
  total: number;
  page: number;
  limit: number;
}

const actionTypeColors: Record<string, string> = {
  till: "bg-emerald-500/15 text-emerald-400",
  plant: "bg-green-500/15 text-green-400",
  water: "bg-blue-500/15 text-blue-400",
  harvest: "bg-amber-500/15 text-amber-400",
  sell: "bg-yellow-500/15 text-yellow-400",
  buy: "bg-purple-500/15 text-purple-400",
  "next-day": "bg-cyan-500/15 text-cyan-400",
  fish: "bg-teal-500/15 text-teal-400",
  collect_products: "bg-orange-500/15 text-orange-400",
  buy_building: "bg-indigo-500/15 text-indigo-400",
  buy_animal: "bg-pink-500/15 text-pink-400",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("");
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (filterType) params.set("action_type", filterType);

      const res = await fetch(`/api/proxy/logs?${params}`);
      const data: LogsResponse = await res.json();
      if ((data as unknown as { error: string }).error) {
        throw new Error((data as unknown as { error: string }).error);
      }
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "获取日志失败");
    } finally {
      setLoading(false);
    }
  }, [page, filterType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">操作日志</h1>
          <p className="text-slate-500 text-sm mt-1">
            共 {total} 条记录，存储于 TiDB Cloud
          </p>
        </div>
        <button
          onClick={fetchLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 rounded-xl text-sm transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          刷新
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-500" />
        <select
          value={filterType}
          onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        >
          <option value="">全部操作</option>
          <option value="till">开垦</option>
          <option value="plant">种植</option>
          <option value="water">浇水</option>
          <option value="harvest">收获</option>
          <option value="sell">出售</option>
          <option value="buy">购买</option>
          <option value="buy_animal">购买动物</option>
          <option value="buy_building">购买建筑</option>
          <option value="collect_products">收集产品</option>
          <option value="fish">钓鱼</option>
          <option value="next-day">进入下一天</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Log List */}
      {loading && logs.length === 0 ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <ScrollText className="w-12 h-12 text-slate-700 mb-4" />
          <p className="text-slate-500">暂无操作日志</p>
          <p className="text-slate-600 text-sm mt-1">
            执行游戏操作后日志将自动记录
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedLog(expandedLog === log.id ? null : log.id)
                }
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-800/30 transition-colors"
              >
                {log.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}

                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-medium shrink-0 ${
                    actionTypeColors[log.action_type] ||
                    "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {log.action_type}
                </span>

                {log.error_message && (
                  <span className="text-xs text-red-400 truncate flex-1">
                    {log.error_message}
                  </span>
                )}

                <span className="text-xs text-slate-500 font-mono shrink-0 ml-auto">
                  {formatTime(log.created_at)}
                </span>
              </button>

              {expandedLog === log.id && (
                <div className="px-5 pb-4 border-t border-slate-800/50 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">请求</p>
                      <pre className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                        {safeJson(log.request_body)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">响应</p>
                      <pre className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                        {safeJson(log.response_body)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-sm transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            上一页
          </button>
          <span className="text-sm text-slate-400">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-lg text-sm transition-colors"
          >
            下一页
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function safeJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str || "-";
  }
}
