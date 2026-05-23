import { NextResponse } from "next/server";
import { gameApi } from "@/lib/game-api";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await gameApi.register(body.agent_id, body.agent_name, body.bio);
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
