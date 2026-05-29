"use client";

import { useEffect, useState, useCallback } from "react";
import type { FarmStatus } from "@/lib/game-api";
import { RefreshCw, AlertTriangle, ChevronRight, Sprout } from "lucide-react";

import { DashboardHeader } from "@/components/dashboard/header";
import { StatCards } from "@/components/dashboard/stat-cards";
import { ResourceBars } from "@/components/dashboard/resource-bars";
import { FarmOverview } from "@/components/dashboard/farm-overview";
import { CropDetailSection } from "@/components/dashboard/crop-detail";
import { BuildingsSection } from "@/components/dashboard/buildings";
import { AnimalsSection } from "@/components/dashboard/animals";
import { InventorySection } from "@/components/dashboard/inventory";

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

  return (
    <div className="space-y-6">
      <DashboardHeader status={status} onRefresh={fetchStatus} loading={loading} />

      <StatCards status={status} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ResourceBars status={status} />
        <FarmOverview status={status} />
      </div>

      {status.crops_detail && status.crops_detail.length > 0 && (
        <CropDetailSection status={status} />
      )}

      {status.buildings && status.buildings.length > 0 && (
        <BuildingsSection buildings={status.buildings} />
      )}

      {status.animals && status.animals.length > 0 && (
        <AnimalsSection animals={status.animals} />
      )}

      {status.inventory_items && status.inventory_items.length > 0 && (
        <InventorySection items={status.inventory_items} />
      )}

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
