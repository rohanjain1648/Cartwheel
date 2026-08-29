"use client";

import { useEffect } from "react";
import { loadSession } from "@/lib/session";
import { registerCartwheelTools } from "@/lib/webmcp/registerCartwheelTools";

export function useRegisterWebMCPTools(roomCode: string) {
  useEffect(() => {
    const session = loadSession(roomCode);
    if (!session) return;

    let unregister: (() => void) | undefined;
    let cancelled = false;

    registerCartwheelTools(roomCode, session.sessionToken).then((fn) => {
      if (cancelled) fn();
      else unregister = fn;
    });

    return () => {
      cancelled = true;
      unregister?.();
    };
  }, [roomCode]);
}
