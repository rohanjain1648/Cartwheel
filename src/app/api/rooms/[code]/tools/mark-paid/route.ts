import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";
import { proposeChange } from "@/lib/proposals/proposeChange";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room, participant } = auth;

  const { cart_item_id } = (await req.json()) as { cart_item_id?: string };
  if (!cart_item_id) {
    return NextResponse.json({ ok: false, reason: "cart_item_id_required" }, { status: 400 });
  }

  const result = await proposeChange({
    supabase: getServerClient(),
    roomId: room.id,
    proposerId: participant.id,
    actionType: "mark_paid",
    payload: { cart_item_id },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
