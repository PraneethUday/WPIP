import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";

function getToken(req: NextRequest): string | null {
  const h = req.headers.get("authorization") || "";
  return h.toLowerCase().startsWith("bearer ") ? h.slice(7).trim() : null;
}

function normalizeTicketType(value: unknown): "support" | "claim_escalation" {
  return String(value ?? "").toLowerCase() === "claim_escalation"
    ? "claim_escalation"
    : "support";
}

function normalizeText(value: unknown, maxLength: number): string {
  return String(value ?? "")
    .trim()
    .slice(0, maxLength);
}

export async function POST(req: NextRequest) {
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workerId = await verifyToken(token);
  if (!workerId) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const ticketType = normalizeTicketType(body.ticket_type);
    const subject = normalizeText(body.subject, 120);
    const message = normalizeText(body.message, 1000);

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required." },
        { status: 400 },
      );
    }

    const supabase = createServerClient();

    const { data: profile } = await supabase
      .from("registered_workers")
      .select("name, email, delivery_id")
      .eq("id", workerId)
      .maybeSingle();

    const now = new Date().toISOString();
    const ticket = {
      worker_id: workerId,
      worker_name: profile?.name ?? null,
      worker_email: profile?.email ?? null,
      delivery_id:
        normalizeText(body.delivery_id, 80) || profile?.delivery_id || null,
      ticket_type: ticketType,
      subject,
      message,
      claim_id: normalizeText(body.claim_id, 80) || null,
      claim_number: normalizeText(body.claim_number, 80) || null,
      claim_trigger_type: normalizeText(body.claim_trigger_type, 80) || null,
      source_tab: normalizeText(body.source_tab, 40) || null,
      status: "open",
      owner_notes: null,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("support_tickets")
      .insert(ticket)
      .select("id, ticket_type, status, created_at")
      .single();

    if (error) {
      console.error("[support/tickets] insert error:", error.message);
      return NextResponse.json(
        { error: "Failed to submit support ticket." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "Ticket submitted successfully.",
      ticket: data,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit support ticket." },
      { status: 500 },
    );
  }
}
