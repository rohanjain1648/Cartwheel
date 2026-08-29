import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { displayName } = (await req.json()) as { displayName?: string };
  if (!displayName || !displayName.trim()) {
    return NextResponse.json({ ok: false, reason: "display_name_required" }, { status: 400 });
  }

  const supabase = getServerClient();
  const code = params.code.trim().toUpperCase();

  let { data: room } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();

  if (!room) {
    const { data: createdRoom, error: createRoomError } = await supabase
      .from("rooms")
      .insert({ code, name: `${displayName}'s room` })
      .select("*")
      .single();
    if (createRoomError) {
      return NextResponse.json({ ok: false, reason: "room_create_failed" }, { status: 500 });
    }
    room = createdRoom;
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({ room_id: room.id, display_name: displayName.trim() })
    .select("*")
    .single();

  if (participantError) {
    return NextResponse.json({ ok: false, reason: "participant_create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, room, participant });
}
