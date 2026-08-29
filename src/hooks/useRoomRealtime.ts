"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browserClient";
import { loadSession } from "@/lib/session";
import type { RoomStateSnapshot } from "@/lib/types";

export function useRoomRealtime(roomCode: string) {
  const [state, setState] = useState<RoomStateSnapshot | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    const session = loadSession(roomCode);
    if (!session) return;
    const res = await fetch(`/api/rooms/${roomCode}/tools/get-room-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-token": session.sessionToken },
      body: "{}",
    });
    const json = await res.json();
    if (json.ok) setState(json.state);
  }, [roomCode]);

  useEffect(() => {
    refetch();

    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, refetch)
      .subscribe();

    // Fallback poll in case the realtime channel drops, per spec §6.
    pollRef.current = setInterval(refetch, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomCode, refetch]);

  return { state, refetch };
}
