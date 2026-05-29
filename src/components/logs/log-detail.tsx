"use client";

import { useState } from "react";
import {
  CheckCircle,
  Coins,
  Sparkles,
  Package,
  AlertTriangle,
  Zap,
  TrendingUp,
  Lock,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { type ActionResponse } from "@/lib/game-api";

const eventTypeColors: Record<string, string> = {
  disaster: "bg-red-500/15 text-red-400 border-red-500/20",
  reward: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  bonus: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  weather: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  default: "bg-slate-700/30 text-slate-300 border-slate-600/20",
};

interface LogDetailProps {
  parsed: ActionResponse;
  requestBody: string;
  responseBody: string;
}

export function LogDetail({ parsed, requestBody, responseBody }: LogDetailProps) {
  const [showRaw, setShowRaw] = useState(false);

  return (
    <div className="space-y-3">
      {/* Action Result */}
      {parsed.action_result && (
        <div className="flex items-start gap-3 rounded-xl bg-slate-800/40 p-3">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-slate-500 mb-0.5">操作结果</p>
            <p className="text-sm text-slate-200">{parsed.action_result}</p>
          </div>
        </div>
      )}

      {/* State Changes */}
      {parsed.state_changes && hasAnyStateChange(parsed.state_changes) && (
        <div className="rounded-xl bg-slate-800/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            <p className="text-xs text-slate-500">状态变化</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {parsed.state_changes.gold !== undefined && (
              <StateChangeTag
                icon={<Coins className="w-3 h-3" />}
                label="金币"
                value={parsed.state_changes.gold}
                positiveColor="text-emerald-400"
                negativeColor="text-red-400"
              />
            )}
            {parsed.state_changes.xp !== undefined && (
              <StateChangeTag
                icon={<Sparkles className="w-3 h-3" />}
                label="经验"
                value={parsed.state_changes.xp}
                positiveColor="text-blue-400"
                negativeColor="text-red-400"
              />
            )}
            {parsed.state_changes.energy !== undefined && (
              <StateChangeTag
                icon={<Zap className="w-3 h-3" />}
                label="体力"
                value={parsed.state_changes.energy}
                positiveColor="text-amber-400"
                negativeColor="text-red-400"
              />
            )}
            {parsed.state_changes.inventory &&
              Object.entries(parsed.state_changes.inventory).map(
                ([item, count]) => (
                  <StateChangeTag
                    key={item}
                    icon={<Package className="w-3 h-3" />}
                    label={item}
                    value={count}
                    positiveColor="text-emerald-400"
                    negativeColor="text-red-400"
                  />
                )
              )}
          </div>
        </div>
      )}

      {/* Random Event */}
      {parsed.random_event && (
        <div
          className={`rounded-xl border p-3 ${
            eventTypeColors[parsed.random_event.type] || eventTypeColors.default
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">
              随机事件 · {parsed.random_event.name}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20">
              {parsed.random_event.type}
            </span>
          </div>
          <p className="text-sm mb-2">{parsed.random_event.message}</p>
          {parsed.random_event.effects &&
            Object.keys(parsed.random_event.effects).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(parsed.random_event.effects).map(
                  ([key, val]) => (
                    <span
                      key={key}
                      className="text-[11px] px-2 py-0.5 rounded-md bg-black/20"
                    >
                      {key}: {val}
                    </span>
                  )
                )}
              </div>
            )}
        </div>
      )}

      {/* Quota Info */}
      {parsed.quota_used !== undefined &&
        parsed.quota_remaining !== undefined && (
          <div className="rounded-xl bg-slate-800/40 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs text-slate-500">操作配额</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${
                      (parsed.quota_used /
                        (parsed.quota_used + parsed.quota_remaining)) *
                      100
                    }%`,
                  }}
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0">
                {parsed.quota_used} /{" "}
                {parsed.quota_used + parsed.quota_remaining}
              </span>
            </div>
            {parsed.next_reset_at && (
              <p className="text-[11px] text-slate-500 mt-1.5">
                下次重置: {formatResetTime(parsed.next_reset_at)}
              </p>
            )}
          </div>
        )}

      {/* Level Up */}
      {parsed.level_up && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-amber-400">升级！</span>
          </div>
          <p className="text-sm text-slate-200">
            农场等级提升至 {parsed.level_up.new_level} 级
            {parsed.level_up.new_title && (
              <span className="text-amber-400">
                {" "}
                · {parsed.level_up.new_title}
              </span>
            )}
          </p>
        </div>
      )}

      {/* New Unlocks */}
      {parsed.new_unlocks && parsed.new_unlocks.length > 0 && (
        <div className="rounded-xl bg-slate-800/40 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <p className="text-xs text-slate-500">新解锁</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {parsed.new_unlocks.map((item) => (
              <span
                key={item}
                className="text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Toggle */}
      <div className="pt-1">
        <button
          onClick={() => setShowRaw(!showRaw)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
        >
          {showRaw ? (
            <>
              <ChevronUp className="w-3 h-3" /> 隐藏原始数据
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" /> 查看原始数据
            </>
          )}
        </button>
        {showRaw && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <p className="text-xs text-slate-500 mb-1">请求</p>
              <pre className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                {safeJson(requestBody)}
              </pre>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">响应</p>
              <pre className="text-xs text-slate-300 bg-slate-800/50 rounded-lg p-3 overflow-auto max-h-40 font-mono">
                {safeJson(responseBody)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StateChangeTag({
  icon,
  label,
  value,
  positiveColor,
  negativeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  positiveColor: string;
  negativeColor: string;
}) {
  const isPositive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-700/50 ${
        isPositive ? positiveColor : negativeColor
      }`}
    >
      {icon}
      <span className="text-slate-400">{label}</span>
      <span className="font-medium">
        {isPositive ? "+" : ""}
        {value}
      </span>
    </span>
  );
}

function hasAnyStateChange(
  state: NonNullable<ActionResponse["state_changes"]>
): boolean {
  return (
    state.gold !== undefined ||
    state.xp !== undefined ||
    state.energy !== undefined ||
    (state.inventory !== undefined &&
      Object.keys(state.inventory).length > 0)
  );
}

function formatResetTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function safeJson(str: string): string {
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str || "-";
  }
}
