import { NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import type { Participant, Room } from "@/lib/types";

export interface AuthedContext {
  participant: Participant;
  room: Room;
}

/**
 * Resolves the calling participant from the `x-session-token` header,
 * scoped to the room in the URL. Never trusts a client-supplied
 * participant id — this is the server-side identity boundary described in
 * the plan's Global Constraints.
 */
export async function requireParticipant(
  req: NextRequest,
  roomCode: string
): Promise<AuthedContext | { ok: false; reason: string }> {
  const sessionToken = req.headers.get("x-session-token");
  if (!sessionToken) {
    return { ok: false, reason: "missing_session_token" };
  }

  const supabase = getServerClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode.toUpperCase())
    .maybeSingle();
  if (!room) {
    return { ok: false, reason: "room_not_found" };
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("session_token", sessionToken)
    .eq("room_id", room.id)
    .maybeSingle();
  if (!participant) {
    return { ok: false, reason: "not_authorized" };
  }

  return { participant, room };
}
