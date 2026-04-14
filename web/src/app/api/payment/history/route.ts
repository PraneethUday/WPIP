import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

function getToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : null;
}

export async function GET(req: NextRequest) {
  const token = getToken(req);
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workerId = await verifyToken(token);
  if (!workerId)
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("worker_payments")
    .select("transaction_id, amount, method, tier, status, created_at")
    .eq("worker_id", workerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[payment/history] Supabase error:", error.message);
    return NextResponse.json(
      { error: "Failed to fetch payment history." },
      { status: 500 }
    );
  }

  // Normalize field name so existing frontend code using `timestamp` still works
  const payments = (data ?? []).map((p) => ({
    ...p,
    timestamp: p.created_at,
  }));

  return NextResponse.json({ payments });
}
