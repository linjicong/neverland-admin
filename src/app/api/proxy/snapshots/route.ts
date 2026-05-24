import { NextResponse } from "next/server";
import { query, initDatabase } from "@/lib/tidb";

export interface FarmSnapshot {
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.max(1, Math.min(365, Number(searchParams.get("days")) || 30));

    await initDatabase();

    const rows = await query<FarmSnapshot>(
      `SELECT * FROM farm_snapshots WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) ORDER BY created_at ASC`,
      [days]
    );

    return NextResponse.json({ snapshots: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
