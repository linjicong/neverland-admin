import { NextResponse } from "next/server";
import { gameApi } from "@/lib/game-api";
import { gameConfig } from "@/lib/config";

export async function GET() {
  try {
    const farmId = gameConfig.farmId;
    if (!farmId) {
      return NextResponse.json({ error: "FARM_ID not configured" }, { status: 400 });
    }
    const status = await gameApi.getFarmStatus(farmId);
    return NextResponse.json(status);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
