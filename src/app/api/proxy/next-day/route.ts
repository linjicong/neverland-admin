import { NextResponse } from "next/server";
import { gameApi } from "@/lib/game-api";
import { gameConfig } from "@/lib/config";
import { execute, initDatabase } from "@/lib/tidb";

export async function POST() {
  try {
    const farmId = gameConfig.farmId;
    if (!farmId) {
      return NextResponse.json({ error: "FARM_ID not configured" }, { status: 400 });
    }

    let result;
    let success = true;
    let errorMsg: string | null = null;

    try {
      result = await gameApi.nextDay(farmId);
    } catch (e) {
      success = false;
      errorMsg = e instanceof Error ? e.message : "Unknown error";
      result = { error: errorMsg };
    }

    // Log to TiDB
    try {
      await initDatabase();
      await execute(
        `INSERT INTO operation_logs (farm_id, action_type, request_body, response_body, success, error_message) VALUES (?, ?, ?, ?, ?, ?)`,
        [farmId, "next-day", "{}", JSON.stringify(result), success, errorMsg]
      );
    } catch {
      // TiDB logging is best-effort
    }

    if (!success) {
      return NextResponse.json(result, { status: 500 });
    }
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
