import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const ALLOWED_STATUSES = ["open", "in_progress", "resolved"] as const;
type TicketStatus = (typeof ALLOWED_STATUSES)[number];

function normalizeText(value: unknown, maxLength: number): string | null {
  const text = String(value ?? "")
    .trim()
    .slice(0, maxLength);
  return text || null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params;
    if (!ticketId) {
      return NextResponse.json(
        { error: "ticketId is required." },
        { status: 400 },
      );
    }

    const body = await req.json();
    const status = String(body.status ?? "").toLowerCase() as TicketStatus;

    if (!ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Use open, in_progress, or resolved." },
        { status: 400 },
      );
    }

    const updates = {
      status,
      owner_notes: normalizeText(body.owner_notes, 500),
      updated_at: new Date().toISOString(),
    };

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .select("*")
      .single();

    if (error) {
      console.error("[admin/support/tickets] update error:", error.message);
      return NextResponse.json(
        { error: "Failed to update support ticket." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ticket: data });
  } catch {
    return NextResponse.json(
      { error: "Failed to update support ticket." },
      { status: 500 },
    );
  }
}
