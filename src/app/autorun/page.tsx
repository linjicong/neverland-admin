"use client";

import { useState, useRef, useCallback } from "react";
import {
  Zap,
  Play,
  Square,
  CheckCircle,
  XCircle,
  SkipForward,
  Loader2,
  Clock,
  Coins,
  AlertTriangle,
  Settings,
  Sprout,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LogEntry {
  step: string | number;
  action: string;
  status: "running" | "success" | "error" | "skip";
  message: string;
  detail?: Record<string, unknown>;
  timestamp: number;
}

const stepIcons: Record<string, React.ReactNode> = {
  init: <Clock className="w-4 h-4" />,
  collect_products: <Zap className="w-4 h-4" />,
  till: <Sprout className="w-4 h-4" />,
  plant: <Sprout className="w-4 h-4" />,
  water: <Zap className="w-4 h-4" />,
  harvest: <Sprout className="w-4 h-4" />,
  sell: <Coins className="w-4 h-4" />,
  "next-day": <Clock className="w-4 h-4" />,
  cooldown: <Loader2 className="w-4 h-4 animate-spin" />,
  summary: <Coins className="w-4 h-4" />,
};

const statusColors = {
  running: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  error: "text-red-400 bg-red-500/10 border-red-500/20",
  skip: "text-slate-400 bg-slate-500/10 border-slate-500/20",
};

const statusIcons = {
  running: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  success: <CheckCircle className="w-3.5 h-3.5" />,
  error: <XCircle className="w-3.5 h-3.5" />,
  skip: <SkipForward className="w-3.5 h-3.5" />,
};

export default function AutorunPage() {
  const [running, setRunning] = useState(false);
  const [cooldown, setCooldown] = useState("1500");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<{
    actionsCount: number;
    errorsCount: number;
    initialGold: number;
    finalGold: number;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const startAutorun = useCallback(async () => {
    setRunning(true);
    setLogs([]);
    setSummary(null);

    const controller = new AbortController();
    abortRef.current = controller;

    const addLog = (entry: Omit<LogEntry, "timestamp">) => {
      setLogs((prev) => [...prev, { ...entry, timestamp: Date.now() }]);
      scrollToBottom();
    };

    try {
      const res = await fetch("/api/proxy/autorun", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cooldown: Number(cooldown) || 1500 }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        addLog({
          step: "error",
          action: "start",
          status: "error",
          message: err.error || "启动失败",
        });
        setRunning(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        addLog({ step: "error", action: "start", status: "error", message: "无法读取响应流" });
        setRunning(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              addLog(data);

              if (data.step === "done") {
                if (data.detail) {
                  setSummary({
                    actionsCount: (data.detail.actionsCount as number) || 0,
                    errorsCount: (data.detail.errorsCount as number) || 0,
                    initialGold: (data.detail.initialGold as number) || 0,
                    finalGold: (data.detail.finalGold as number) || 0,
                  });
                }
                setRunning(false);
              }
            } catch { /* skip malformed JSON */ }
          }
        }
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError") {
        addLog({
          step: "error",
          action: "fatal",
          status: "error",
          message: `连接中断: ${e instanceof Error ? e.message : "未知错误"}`,
        });
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }, [cooldown, scrollToBottom]);

  const stopAutorun = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    try {
      await fetch("/api/proxy/autorun", { method: "DELETE" });
    } catch { /* ignore */ }
    setRunning(false);
  }, []);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const successCount = logs.filter((l) => l.status === "success" && l.step !== "done").length;
  const errorCount = logs.filter((l) => l.status === "error").length;
  const skipCount = logs.filter((l) => l.status === "skip").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <Zap className="w-6 h-6 text-amber-400" />
            一键操作
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            自动执行完整日常流程：开垦 → 种植 → 浇水 → 收获 → 出售 → 下一天
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Cooldown Config */}
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-500" />
            <label className="text-xs text-slate-500">操作间隔</label>
            <input
              type="number"
              value={cooldown}
              onChange={(e) => setCooldown(e.target.value)}
              disabled={running}
              min="800"
              max="10000"
              step="100"
              className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-center focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
            />
            <span className="text-xs text-slate-600">ms</span>
          </div>

          {/* Start/Stop Button */}
          {running ? (
            <button
              onClick={stopAutorun}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-red-500/20"
            >
              <Square className="w-4 h-4" />
              停止执行
            </button>
          ) : (
            <button
              onClick={startAutorun}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4" />
              开始一键操作
            </button>
          )}

          {/* Stats */}
          {logs.length > 0 && (
            <div className="flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-1.5 text-xs">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">{successCount}</span>
              </div>
              {errorCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-red-400 font-medium">{errorCount}</span>
                </div>
              )}
              {skipCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <SkipForward className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-400 font-medium">{skipCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Workflow Preview */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          {["collect_products", "till", "plant", "water", "harvest", "sell", "next-day"].map((step, i) => {
            const logEntry = logs.filter((l) => l.action === step && l.step !== "cooldown").pop();
            const st = logEntry?.status;
            return (
              <div key={step} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border whitespace-nowrap transition-all",
                    st === "success"
                      ? statusColors.success
                      : st === "error"
                      ? statusColors.error
                      : st === "skip"
                      ? statusColors.skip
                      : st === "running"
                      ? statusColors.running
                      : "text-slate-600 bg-slate-800/30 border-slate-700/30"
                  )}
                >
                  {st ? statusIcons[st] : stepIcons[step]}
                  {stepLabel(step)}
                </div>
                {i < 6 && (
                  <span className="text-slate-700 text-xs">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            执行完成
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className="text-xl font-bold text-emerald-400">{summary.actionsCount}</p>
              <p className="text-xs text-slate-500">成功操作</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className={`text-xl font-bold ${summary.errorsCount > 0 ? "text-red-400" : "text-slate-400"}`}>
                {summary.errorsCount}
              </p>
              <p className="text-xs text-slate-500">错误</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className="text-xl font-bold text-amber-400">{summary.initialGold.toLocaleString()}</p>
              <p className="text-xs text-slate-500">初始金币</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-slate-800/50">
              <p className={`text-xl font-bold ${summary.finalGold >= summary.initialGold ? "text-emerald-400" : "text-red-400"}`}>
                {summary.finalGold.toLocaleString()}
                <span className="text-sm ml-1">
                  ({summary.finalGold - summary.initialGold >= 0 ? "+" : ""}
                  {(summary.finalGold - summary.initialGold).toLocaleString()})
                </span>
              </p>
              <p className="text-xs text-slate-500">最终金币</p>
            </div>
          </div>
        </div>
      )}

      {/* Log Stream */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-300">执行日志</h3>
          <span className="text-xs text-slate-600">{logs.length} 条</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto p-4 space-y-2">
          {logs.length === 0 && !running && (
            <div className="text-center py-10 text-slate-600 text-sm">
              点击"开始一键操作"启动自动流程
            </div>
          )}

          {logs.map((log, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all",
                statusColors[log.status]
              )}
            >
              <div className="mt-0.5 shrink-0">
                {stepIcons[log.action] || statusIcons[log.status]}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{log.message}</span>
                </div>
                {log.detail && (
                  <pre className="mt-1 text-xs text-slate-500 font-mono overflow-x-auto">
                    {JSON.stringify(log.detail, null, 2)}
                  </pre>
                )}
              </div>

              <span className="text-xs text-slate-600 font-mono shrink-0">
                {formatTime(log.timestamp)}
              </span>
            </div>
          ))}

          {running && logs.length > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 text-sm text-blue-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              执行中...
            </div>
          )}

          <div ref={logEndRef} />
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-slate-300 space-y-1">
            <p className="font-medium text-amber-400">注意事项</p>
            <ul className="list-disc list-inside text-slate-400 space-y-0.5 text-xs">
              <li>操作间隔建议不低于 1500ms，过快可能触发频率限制</li>
              <li>遇到频率限制会自动等待 5 秒后重试，最多重试 3 次</li>
              <li>雨天/暴风雨天气会自动跳过浇水步骤</li>
              <li>所有操作均自动记录到 TiDB Cloud 日志</li>
              <li>可随时点击"停止执行"中止流程</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function stepLabel(step: string): string {
  const labels: Record<string, string> = {
    collect_products: "收集产品",
    till: "开垦",
    plant: "种植",
    water: "浇水",
    harvest: "收获",
    sell: "出售",
    "next-day": "下一天",
  };
  return labels[step] || step;
}
