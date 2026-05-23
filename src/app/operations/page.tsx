"use client";

import { useState, useCallback } from "react";
import {
  Sprout,
  Droplets,
  Scissors,
  ShoppingCart,
  DollarSign,
  Fish,
  Sun,
  Send,
  ChevronRight,
  Zap,
  Package,
  Home,
  PawPrint,
  Gift,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface ActionResult {
  message?: string;
  error?: string;
  [key: string]: unknown;
}

const actionGroups = [
  {
    title: "农事操作",
    color: "emerald",
    actions: [
      { type: "till", label: "开垦土地", icon: Sprout, desc: "消耗 15 体力/格" },
      { type: "plant", label: "种植作物", icon: Sprout, desc: "消耗 12 体力/格", needsCrop: true, needsPositions: true },
      { type: "water", label: "浇水", icon: Droplets, desc: "消耗 6 体力/格", hasMode: true },
      { type: "harvest", label: "收获作物", icon: Scissors, desc: "消耗 6 体力/次，存入背包" },
    ],
  },
  {
    title: "交易",
    color: "amber",
    actions: [
      { type: "buy", label: "购买物品", icon: ShoppingCart, desc: "购买种子/物品", needsItem: true, needsQty: true },
      { type: "sell", label: "出售物品", icon: DollarSign, desc: "出售背包中物品获得金币", needsItem: true, needsQty: true },
    ],
  },
  {
    title: "畜牧 & 建筑",
    color: "blue",
    actions: [
      { type: "collect_products", label: "收集动物产品", icon: Package, desc: "收集所有动物产出" },
      { type: "buy_animal", label: "购买动物", icon: PawPrint, desc: "", needsItem: true, needsQty: true, itemLabel: "动物类型" },
      { type: "buy_building", label: "购买建筑", icon: Home, desc: "", needsItem: true, itemLabel: "建筑类型" },
    ],
  },
  {
    title: "特殊操作",
    color: "purple",
    actions: [
      { type: "fish", label: "钓鱼", icon: Fish, desc: "消耗 15 体力" },
      { type: "claim_daily_bonus", label: "领取每日奖励", icon: Gift, desc: "" },
      { type: "buy", label: "购买体力药水", icon: Zap, desc: "500G 恢复 50 体力", potionShortcut: true },
    ],
  },
];

export default function OperationsPage() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastAction, setLastAction] = useState("");

  const doAction = useCallback(async (body: Record<string, unknown>) => {
    setLoading(true);
    setResult(null);
    setLastAction(body.action_type as string);
    try {
      const res = await fetch("/api/proxy/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "操作失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  const nextDay = useCallback(async () => {
    setLoading(true);
    setResult(null);
    setLastAction("next-day");
    try {
      const res = await fetch("/api/proxy/next-day", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      setResult({ error: e instanceof Error ? e.message : "进入下一天失败" });
    } finally {
      setLoading(false);
    }
  }, []);

  const [cropType, setCropType] = useState("");
  const [itemType, setItemType] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [waterMode, setWaterMode] = useState("all");

  const handleAction = (type: string, opts: Record<string, unknown> = {}) => {
    if (type === "next-day") {
      nextDay();
      return;
    }

    const body: Record<string, unknown> = { action_type: type };

    if (opts.potionShortcut) {
      body.item_type = "energy_potion";
      body.quantity = 1;
    } else if (type === "plant") {
      if (!cropType) { setResult({ error: "请输入作物类型" }); return; }
      body.crop_type = cropType;
    } else if (type === "water" && opts.hasMode) {
      body.mode = waterMode;
    } else if (opts.needsItem) {
      if (!itemType) { setResult({ error: "请输入物品类型" }); return; }
      body.item_type = itemType;
      if (opts.needsQty) body.quantity = Number(quantity) || 1;
    }

    doAction(body);
  };

  const colorClasses: Record<string, { border: string; bg: string; hover: string; text: string }> = {
    emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", hover: "hover:bg-emerald-500/10", text: "text-emerald-400" },
    amber: { border: "border-amber-500/20", bg: "bg-amber-500/5", hover: "hover:bg-amber-500/10", text: "text-amber-400" },
    blue: { border: "border-blue-500/20", bg: "bg-blue-500/5", hover: "hover:bg-blue-500/10", text: "text-blue-400" },
    purple: { border: "border-purple-500/20", bg: "bg-purple-500/5", hover: "hover:bg-purple-500/10", text: "text-purple-400" },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">游戏操作</h1>
          <p className="text-slate-500 text-sm mt-1">执行各种农场操作</p>
        </div>
        <button
          onClick={nextDay}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 disabled:opacity-50 rounded-xl text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
        >
          {loading && lastAction === "next-day" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sun className="w-4 h-4" />
          )}
          进入下一天
        </button>
      </div>

      {/* Quick Input Fields */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">操作参数</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">作物类型 (种植用)</label>
            <input
              type="text"
              value={cropType}
              onChange={(e) => setCropType(e.target.value)}
              placeholder="如 parsnip, potato"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">物品类型 (买卖用)</label>
            <input
              type="text"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
              placeholder="如 parsnip, chicken"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">数量</label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">浇水模式</label>
            <select
              value={waterMode}
              onChange={(e) => setWaterMode(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
            >
              <option value="all">全部浇水</option>
              <option value="positions">指定位置</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Groups */}
      {actionGroups.map((group) => {
        const colors = colorClasses[group.color] || colorClasses.emerald;
        return (
          <div
            key={group.title}
            className={`rounded-2xl border ${colors.border} ${colors.bg} p-5`}
          >
            <h3 className={`text-sm font-semibold ${colors.text} mb-4`}>
              {group.title}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.actions.map((action) => {
                const Icon = action.icon;
                const isLoading = loading && lastAction === action.type;
                return (
                  <button
                    key={`${action.type}-${action.label}`}
                    onClick={() => handleAction(action.type, action)}
                    disabled={loading}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 ${colors.hover} border border-slate-700/50 text-left transition-all disabled:opacity-50 group`}
                  >
                    <Icon className={`w-5 h-5 ${colors.text} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">
                        {action.label}
                      </p>
                      {action.desc && (
                        <p className="text-xs text-slate-500 truncate">{action.desc}</p>
                      )}
                    </div>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Result */}
      {result && (
        <div className={`rounded-2xl border p-5 ${
          result.error
            ? "border-red-500/30 bg-red-500/5"
            : "border-emerald-500/30 bg-emerald-500/5"
        }`}>
          <div className="flex items-center gap-2 mb-3">
            {result.error ? (
              <XCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            )}
            <h3 className={`text-sm font-semibold ${
              result.error ? "text-red-400" : "text-emerald-400"
            }`}>
              {result.error ? "操作失败" : "操作成功"} - {lastAction}
            </h3>
          </div>
          <pre className="text-xs text-slate-300 bg-slate-900/60 rounded-xl p-4 overflow-auto max-h-64 font-mono">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
