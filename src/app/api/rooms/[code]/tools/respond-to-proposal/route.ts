import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { participant } = auth;

  const { proposal_id, decision, note } = (await req.json()) as {
    proposal_id?: string;
    decision?: "approve" | "reject";
    note?: string;
  };
  if (!proposal_id || !decision) {
    return NextResponse.json({ ok: false, reason: "proposal_id_and_decision_required" }, { status: 400 });
  }

  const supabase = getServerClient();
  const { data: proposal, error } = await supabase
    .rpc("resolve_proposal", {
      p_proposal_id: proposal_id,
      p_responder_id: participant.id,
      p_decision: decision,
      p_note: note ?? null,
    })
    .single();

  if (error) {
    const reason = error.message.includes("not_authorized")
      ? "not_authorized"
      : error.message.includes("already_resolved")
        ? "already_resolved"
        : "respond_failed";
    return NextResponse.json({ ok: false, reason }, { status: reason === "not_authorized" ? 403 : 400 });
  }

  return NextResponse.json({ ok: true, proposal });
}
