import { gameConfig } from "./config";

const BASE = gameConfig.baseUrl;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || `HTTP ${res.status}`);
  }
  return data as T;
}

// === Status API types ===

export interface CropDetail {
  crop_id: string;
  crop_type: string;
  name: string;
  position_x: number;
  position_y: number;
  growth_stage: number;
  max_growth_stage: number;
  watered_today: boolean;
}

export interface CropSummary {
  type: string;
  name: string;
  count: number;
  growth_stage: number;
  days_to_harvest: number;
  watered_today: boolean;
  status: string;
}

export interface AnimalInfo {
  type: string;
  name: string;
  count: number;
  product: string | null;
  product_name?: string;
  product_price?: number;
  product_cycle?: number;
}

export interface BuildingInfo {
  type: string;
  name: string;
  level: number;
  capacity: number;
  bonus: Record<string, unknown> | null;
}

export interface InventoryItem {
  key: string;
  name: string;
  count: number;
}

export interface FarmStatus {
  timestamp: string;
  season: string;
  day: number;
  year: number;
  weather: string;
  weather_forecast: { tomorrow: string; confidence: number };
  energy: { current: number; max: number; status: string };
  gold: number;
  xp: number;
  xp_to_next: number;
  farm_level: number;
  farm_description: string;
  crops: CropSummary[];
  crops_detail: CropDetail[];
  farm_layout: { grid: number[][]; size: number };
  land_status: { tilled: number; planted: number; watered: number; empty: number };
  achievements: { daily_streak: number; total_harvest: number; reputation: number };
  daily_bonus: { available: boolean; type: string; description: string };
  suggestions: string[];
  daily_quota: { used: number; limit: number; resets_at: string };
  daily_quests: unknown[];
  inventory: Record<string, number>;
  inventory_items: InventoryItem[];
  animals: AnimalInfo[];
  buildings: BuildingInfo[];
  agent_info: { agent_id: string; agent_name: string; bio: string };
  map_size: number;
  total_xp: number;
  reputation_score: number;
  land_expansions: number;
  npcs: unknown[];
}

// === Config API types ===

export interface CropConfig {
  crop_type: string;
  name: string;
  buy_price: number;
  sell_price: number;
  growth_days: number;
  seasons: string;
  sell_price_variety: number;
  max_growth_stage: number;
  description: string;
  min_level?: number;
  mythic?: boolean;
  supreme?: boolean;
}

export interface AnimalConfig {
  animal_type: string;
  name: string;
  buy_price: number;
  sell_price: number;
  product: string | null;
  product_name?: string;
  product_price?: number;
  product_cycle?: number;
  feed_cost: number;
  description: string;
  requires_coop?: boolean;
  requires_barn?: boolean;
  legendary?: boolean;
  bonus?: Record<string, unknown>;
  min_level?: number;
}

export interface BuildingLevelConfig {
  level: number;
  buy_price: number;
  sell_price: number;
  capacity: number;
  size_multiplier: number;
  description: string;
  bonus: Record<string, unknown> | null;
  landmark?: boolean;
}

export interface BuildingConfig {
  building_type: string;
  name: string;
  levels: BuildingLevelConfig[];
  unlock_level: number;
}

export interface FishConfig {
  fish_type: string;
  name: string;
  base_price: number;
  rarity: string;
  seasons: string;
  weather: string;
  description: string;
}

export interface ToolConfig {
  name: string;
  buy: number;
  description: string;
  energy_cost: number;
  level: number;
  unlock_requirement?: Record<string, unknown> | null;
  starter?: boolean;
  legendary?: boolean;
  bonus?: Record<string, unknown>;
}

export interface FarmLevelConfig {
  level: number;
  name: string;
  required_xp: number;
  benefits: string[];
}

export interface GameConfig {
  crops: CropConfig[];
  tools: Record<string, ToolConfig>;
  farm_levels: FarmLevelConfig[];
  daily_login_rewards: Record<string, unknown>;
  buildings: BuildingConfig[];
  fish: FishConfig[];
  animals: AnimalConfig[];
}

// === Market Prices types ===

export interface CropPrice {
  buy: number;
  sell: number;
  base_buy: number;
  base_sell: number;
  trend: string;
  trend_percent: number;
  trend_description: string;
  name: string;
}

export interface AnimalPrice {
  buy: number;
  sell: number;
  name: string;
  product: string | null;
  product_name?: string;
  product_price?: number;
  description: string;
  legendary?: boolean;
}

export interface BuildingPrice {
  name: string;
  unlock_level: number;
  levels: { level: number; buy: number; sell: number }[];
}

export interface MarketPrices {
  date: string;
  season: string;
  day?: number;
  crops: Record<string, CropPrice>;
  animals: Record<string, AnimalPrice>;
  buildings: Record<string, BuildingPrice>;
  animal_products: Record<string, { sell: number; base_sell: number; name: string }>;
  fish: Record<string, { name: string; sell: number; rarity: string }>;
  special_items: Record<string, { name: string; buy: number; description: string }>;
  tools: Record<string, ToolConfig>;
  items: Record<string, unknown>;
  special_offers: unknown[];
  market_leaders: { gainers: unknown[]; losers: unknown[] };
  land_expansions: unknown[];
  npcs: unknown[];
}

// === Shared types ===

export interface ActionLog {
  id: number;
  farm_id: string;
  action_type: string;
  request_body: string;
  response_body: string;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export const gameApi = {
  getFarmStatus: (farmId: string) =>
    request<FarmStatus>(`/api/farm/${farmId}/status`),

  getGameConfig: () => request<GameConfig>("/api/game/config"),

  getMarketPrices: () => request<MarketPrices>("/api/market/prices"),

  getLeaderboard: () => request<Record<string, unknown>[]>("/api/leaderboard"),

  getHistory: (farmId: string) =>
    request<Record<string, unknown>[]>(`/api/farm/${farmId}/history`),

  doAction: (farmId: string, body: Record<string, unknown>) =>
    request<Record<string, unknown>>(`/api/farm/${farmId}/action`, {
      method: "POST",
      body: JSON.stringify({ agent_id: gameConfig.agentId, ...body }),
    }),

  nextDay: (farmId: string) =>
    request<Record<string, unknown>>(`/api/farm/${farmId}/next-day`, {
      method: "POST",
      body: JSON.stringify({ agent_id: gameConfig.agentId }),
    }),

  register: (agentId: string, agentName: string, bio?: string) =>
    request<{ farm_id: string }>("/api/farm/register", {
      method: "POST",
      body: JSON.stringify({ agent_id: agentId, agent_name: agentName, bio }),
    }),
};
