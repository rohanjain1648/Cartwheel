"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

export function JoinForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = roomCode.trim().toUpperCase();
    if (!code || !displayName.trim()) {
      setError("Enter a room code and your name.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName.trim() }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      setError(json.reason ?? "join_failed");
      return;
    }
    saveSession(code, {
      sessionToken: json.participant.session_token,
      participantId: json.participant.id,
      displayName: json.participant.display_name,
    });
    router.push(`/room/${code}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="roomCode">
          Room code
        </label>
        <input
          id="roomCode"
          className="w-full rounded border border-slate-300 px-3 py-2 uppercase"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="PANTRY42"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="displayName">
          Your name
        </label>
        <input
          id="displayName"
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Alex"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "Joining…" : "Join room"}
      </button>
    </form>
  );
}
