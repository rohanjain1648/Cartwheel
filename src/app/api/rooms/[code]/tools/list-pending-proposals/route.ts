import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room, participant } = auth;

  const { scope } = (await req.json()) as { scope?: "needs_my_approval" | "mine" | "all" };
  const supabase = getServerClient();
  let builder = supabase.from("proposals").select("*").eq("room_id", room.id);

  if (scope === "needs_my_approval") {
    builder = builder.eq("affected_participant_id", participant.id).eq("status", "pending");
  } else if (scope === "mine") {
    builder = builder.eq("proposer_id", participant.id);
  }

  const { data: proposals, error } = await builder.order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, reason: "list_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, proposals });
}
