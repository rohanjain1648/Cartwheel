import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";
import { proposeChange } from "@/lib/proposals/proposeChange";
import type { ActionType } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room, participant } = auth;

  const { action_type, payload } = (await req.json()) as {
    action_type?: ActionType;
    payload?: Record<string, unknown>;
  };
  if (!action_type || !payload) {
    return NextResponse.json({ ok: false, reason: "action_type_and_payload_required" }, { status: 400 });
  }

  const result = await proposeChange({
    supabase: getServerClient(),
    roomId: room.id,
    proposerId: participant.id,
    actionType: action_type,
    payload,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
