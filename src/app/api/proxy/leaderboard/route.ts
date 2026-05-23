import { NextResponse } from "next/server";
import { gameApi } from "@/lib/game-api";

export async function GET() {
  try {
    const data = await gameApi.getLeaderboard();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
