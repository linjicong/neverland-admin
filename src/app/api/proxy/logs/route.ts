import { NextResponse } from "next/server";
import { query, initDatabase } from "@/lib/tidb";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const actionType = searchParams.get("action_type");
    const offset = (page - 1) * limit;

    await initDatabase();

    let where = "";
    const params: (string | number | boolean | null)[] = [];
    if (actionType) {
      where = "WHERE action_type = ?";
      params.push(actionType);
    }

    const rows = await query<Record<string, unknown>>(
      `SELECT * FROM operation_logs ${where} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const countResult = await query<{ total: number }>(
      `SELECT COUNT(*) as total FROM operation_logs ${where}`,
      params
    );

    return NextResponse.json({
      logs: rows,
      total: countResult[0]?.total || 0,
      page,
      limit,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
