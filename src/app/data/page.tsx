"use client";

import { useEffect, useState } from "react";
import type { GameConfig, MarketPrices } from "@/lib/game-api";
import {
  Sprout,
  PawPrint,
  Home,
  Package,
  Fish,
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Wrench,
  Star,
} from "lucide-react";

type Tab = "crops" | "animals" | "buildings" | "fish" | "tools" | "prices";

export default function DataPage() {
  const [tab, setTab] = useState<Tab>("crops");
  const [config, setConfig] = useState<GameConfig | null>(null);
  const [prices, setPrices] = useState<MarketPrices | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [cfgRes, priceRes] = await Promise.all([
          fetch("/api/proxy/config"),
          fetch("/api/proxy/prices"),
        ]);
        const cfgData = await cfgRes.json();
        const priceData = await priceRes.json();
        if (cfgData.error) throw new Error(cfgData.error);
        if (priceData.error) throw new Error(priceData.error);
        setConfig(cfgData);
        setPrices(priceData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载数据失败");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "crops", label: "作物", icon: <Sprout className="w-4 h-4" /> },
    { id: "animals", label: "动物", icon: <PawPrint className="w-4 h-4" /> },
    { id: "buildings", label: "建筑", icon: <Home className="w-4 h-4" /> },
    { id: "fish", label: "鱼类", icon: <Fish className="w-4 h-4" /> },
    { id: "tools", label: "工具", icon: <Wrench className="w-4 h-4" /> },
    { id: "prices", label: "市场价格", icon: <DollarSign className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-400 font-medium">{error}</p>
          <p className="text-slate-500 text-sm mt-2">请确保游戏 API 服务正在运行</p>
        </div>
      </div>
    );
  }

  const filterItems = <T extends object>(items: T[]): T[] => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) =>
      Object.values(item as Record<string, unknown>).some((v) => String(v).toLowerCase().includes(q))
    );
  };

  const renderCropsTable = () => {
    const data = filterItems(config?.crops || []);
    if (data.length === 0) return <p className="text-slate-500 text-center py-10">暂无数据</p>;

    return (
      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">名称</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">ID</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">买入价</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">卖出价</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">生长天数</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">季节</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">描述</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((c) => (
              <tr key={c.crop_type} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-200">
                  {c.name}
                  {c.mythic && <span className="ml-1 text-xs text-amber-400">★</span>}
                  {c.supreme && <span className="ml-1 text-xs text-red-400">★★</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.crop_type}</td>
                <td className="px-4 py-3 text-right text-amber-400 font-mono">{c.buy_price}G</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono">{c.sell_price}G</td>
                <td className="px-4 py-3 text-center text-slate-300">{c.growth_days}天</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{c.seasons}</td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{c.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAnimalsTable = () => {
    const data = filterItems(config?.animals || []);
    if (data.length === 0) return <p className="text-slate-500 text-center py-10">暂无数据</p>;

    return (
      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">名称</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">买入价</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">产品</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">产品价格</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400">周期</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">前置</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">描述</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((a) => (
              <tr key={a.animal_type} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-200">
                  {a.name}
                  {a.legendary && <span className="ml-1 text-xs text-amber-400">★</span>}
                </td>
                <td className="px-4 py-3 text-right text-amber-400 font-mono">{a.buy_price}G</td>
                <td className="px-4 py-3 text-slate-300">{a.product_name || "-"}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono">
                  {a.product_price ? `${a.product_price}G` : "-"}
                </td>
                <td className="px-4 py-3 text-center text-slate-300">
                  {a.product_cycle ? `${a.product_cycle}天` : "-"}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {a.requires_coop ? "鸡舍" : a.requires_barn ? "谷仓" : "无"}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs max-w-xs truncate">{a.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBuildingsTable = () => {
    const data = filterItems(config?.buildings || []);
    if (data.length === 0) return <p className="text-slate-500 text-center py-10">暂无数据</p>;

    return (
      <div className="space-y-4">
        {data.map((b) => (
          <div key={b.building_type} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-medium text-slate-200">{b.name}</span>
                <span className="ml-2 text-xs text-slate-500 font-mono">{b.building_type}</span>
              </div>
              <span className="text-xs text-slate-400">解锁等级: {b.unlock_level}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {b.levels.map((lv) => (
                <div key={lv.level} className="px-3 py-2 rounded-lg bg-slate-800/40 text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-400">Lv.{lv.level}</span>
                    <span className="text-amber-400 font-mono">{lv.buy_price}G</span>
                  </div>
                  <p className="text-slate-500 truncate">{lv.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFishTable = () => {
    const data = filterItems(config?.fish || []);
    if (data.length === 0) return <p className="text-slate-500 text-center py-10">暂无数据</p>;

    const rarityColor: Record<string, string> = {
      common: "text-slate-400",
      uncommon: "text-green-400",
      rare: "text-blue-400",
      legendary: "text-amber-400",
    };

    return (
      <div className="overflow-auto rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-800/60">
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">名称</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400">价格</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">稀有度</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">季节</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">天气</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">描述</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((f) => (
              <tr key={f.fish_type} className="hover:bg-slate-800/30">
                <td className="px-4 py-3 font-medium text-slate-200">{f.name}</td>
                <td className="px-4 py-3 text-right text-emerald-400 font-mono">{f.base_price}G</td>
                <td className={`px-4 py-3 text-xs font-medium ${rarityColor[f.rarity] || ""}`}>
                  {f.rarity}
                </td>
                <td className="px-4 py-3 text-slate-400 text-xs">{f.seasons}</td>
                <td className="px-4 py-3 text-slate-400 text-xs">{f.weather}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{f.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderToolsTable = () => {
    const tools = config?.tools;
    if (!tools) return <p className="text-slate-500 text-center py-10">暂无数据</p>;

    const entries = Object.entries(tools).filter(([key]) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return key.toLowerCase().includes(q) || tools[key].name.toLowerCase().includes(q);
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {entries.map(([key, tool]) => (
          <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-slate-200">
                {tool.name}
                {tool.legendary && <span className="ml-1 text-xs text-amber-400">★</span>}
                {tool.starter && <span className="ml-1 text-xs text-emerald-400">初始</span>}
              </span>
              <span className="text-amber-400 font-mono text-sm">
                {tool.buy > 0 ? `${tool.buy}G` : "免费"}
              </span>
            </div>
            <p className="text-xs text-slate-500">{tool.description}</p>
            {tool.energy_cost > 0 && (
              <p className="text-xs text-slate-600 mt-1">体力消耗: {tool.energy_cost}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPrices = () => {
    if (!prices) return null;

    return (
      <div className="space-y-6">
        {/* Crops prices */}
        {prices.crops && Object.keys(prices.crops).length > 0 && (
          <PriceSection title="作物价格" icon={<Sprout className="w-4 h-4 text-emerald-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(prices.crops).map(([key, info]) => (
                <PriceCard
                  key={key}
                  name={info.name}
                  buyPrice={info.buy}
                  sellPrice={info.sell}
                  trend={info.trend}
                  trendPercent={info.trend_percent}
                />
              ))}
            </div>
          </PriceSection>
        )}

        {/* Animals prices */}
        {prices.animals && Object.keys(prices.animals).length > 0 && (
          <PriceSection title="动物价格" icon={<PawPrint className="w-4 h-4 text-blue-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(prices.animals).map(([key, info]) => (
                <div key={key} className="px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">
                      {info.name}
                      {info.legendary && <span className="ml-1 text-amber-400">★</span>}
                    </span>
                    <span className="text-sm font-mono text-amber-400">{info.buy}G</span>
                  </div>
                  {info.product_name && (
                    <p className="text-xs text-slate-500">
                      产品: {info.product_name} ({info.product_price}G)
                    </p>
                  )}
                </div>
              ))}
            </div>
          </PriceSection>
        )}

        {/* Special items prices */}
        {prices.special_items && Object.keys(prices.special_items).length > 0 && (
          <PriceSection title="特殊物品" icon={<Package className="w-4 h-4 text-purple-400" />}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(prices.special_items).map(([key, info]) => (
                <div key={key} className="px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-200">{info.name}</span>
                    <span className="text-sm font-mono text-amber-400">{info.buy}G</span>
                  </div>
                  <p className="text-xs text-slate-500">{info.description}</p>
                </div>
              ))}
            </div>
          </PriceSection>
        )}

        {/* Market Leaders */}
        {prices.market_leaders && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prices.market_leaders.gainers?.length > 0 && (
              <PriceSection title="涨幅榜" icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}>
                {(prices.market_leaders.gainers as Record<string, unknown>[]).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 text-sm">
                    <span className="text-slate-200">{item.name as string}</span>
                    <span className="text-emerald-400 text-xs font-mono">+{item.trendPercent as number}%</span>
                  </div>
                ))}
              </PriceSection>
            )}
            {prices.market_leaders.losers?.length > 0 && (
              <PriceSection title="跌幅榜" icon={<TrendingDown className="w-4 h-4 text-red-400" />}>
                {(prices.market_leaders.losers as Record<string, unknown>[]).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/40 text-sm">
                    <span className="text-slate-200">{item.name as string}</span>
                    <span className="text-red-400 text-xs font-mono">{item.trendPercent as number}%</span>
                  </div>
                ))}
              </PriceSection>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">数据中心</h1>
          <p className="text-slate-500 text-sm mt-1">
            游戏配置和市场价格
            {prices?.date && ` · ${prices.date} · ${prices.season}`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSearch(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              tab === t.id
                ? "bg-emerald-500/15 text-emerald-400 shadow-sm"
                : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "crops" && renderCropsTable()}
      {tab === "animals" && renderAnimalsTable()}
      {tab === "buildings" && renderBuildingsTable()}
      {tab === "fish" && renderFishTable()}
      {tab === "tools" && renderToolsTable()}
      {tab === "prices" && renderPrices()}
    </div>
  );
}

function PriceSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function PriceCard({ name, buyPrice, sellPrice, trend, trendPercent }: {
  name: string;
  buyPrice: number;
  sellPrice: number;
  trend: string;
  trendPercent: number;
}) {
  return (
    <div className="px-4 py-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-slate-200">{name}</span>
        <TrendBadge trend={trend} percent={trendPercent} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-slate-500">
          买入 <span className="text-amber-400 font-mono">{buyPrice}G</span>
        </span>
        <span className="text-slate-500">
          卖出 <span className="text-emerald-400 font-mono">{sellPrice}G</span>
        </span>
      </div>
    </div>
  );
}

function TrendBadge({ trend, percent }: { trend: string; percent: number }) {
  if (trend === "stable") {
    return (
      <span className="flex items-center gap-1 text-xs text-slate-400">
        <Minus className="w-3 h-3" /> 稳定
      </span>
    );
  }
  if (trend === "rising") {
    return (
      <span className="flex items-center gap-1 text-xs text-emerald-400">
        <TrendingUp className="w-3 h-3" /> +{percent}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs text-red-400">
      <TrendingDown className="w-3 h-3" /> {percent}%
    </span>
  );
}
