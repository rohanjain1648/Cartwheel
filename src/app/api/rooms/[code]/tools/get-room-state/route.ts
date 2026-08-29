import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";
import type { RoomStateSnapshot } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room } = auth;
  const supabase = getServerClient();

  const [{ data: participants }, { data: cartItemsRaw }, { data: catalogItems }, { data: proposals }] =
    await Promise.all([
      supabase.from("participants").select("*").eq("room_id", room.id),
      supabase
        .from("cart_items")
        .select("*, catalogItem:catalog_items(*)")
        .eq("room_id", room.id)
        .eq("status", "active"),
      supabase.from("catalog_items").select("*"),
      supabase
        .from("proposals")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const state: RoomStateSnapshot = {
    room,
    participants: participants ?? [],
    cartItems: (cartItemsRaw ?? []) as RoomStateSnapshot["cartItems"],
    catalogItems: catalogItems ?? [],
    proposals: proposals ?? [],
  };

  return NextResponse.json({ ok: true, state });
}
