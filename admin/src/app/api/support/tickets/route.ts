import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("[admin/support/tickets] list error:", error.message);
      return NextResponse.json(
        { error: "Failed to fetch support tickets." },
        { status: 500 },
      );
    }

    return NextResponse.json({ tickets: data ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch support tickets." },
      { status: 500 },
    );
  }
}
