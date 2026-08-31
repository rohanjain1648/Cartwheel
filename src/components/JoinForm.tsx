"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";
import { ArrowRight, Sparkles, User, Hash, AlertCircle, RefreshCw } from "lucide-react";

const SUGGESTED_CODES = ["PANTRY42", "ROOMIES99", "GIFTPOOL", "LIVINGROOM"];

export function JoinForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function generateRandomCode() {
    const prefixes = ["CART", "ROOM", "HOUSE", "FLAT", "GIFT"];
    const rand = Math.floor(10 + Math.random() * 90);
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    setRoomCode(`${prefix}${rand}`);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = roomCode.trim().toUpperCase();
    const name = displayName.trim();

    if (!code) {
      setError("Please enter or generate a room code.");
      return;
    }
    if (!name) {
      setError("Please enter your display name.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const json = await res.json();
      setSubmitting(false);

      if (!json.ok) {
        setError(json.reason ?? "Unable to join room. Please check the code.");
        return;
      }

      saveSession(code, {
        sessionToken: json.participant.session_token,
        participantId: json.participant.id,
        displayName: json.participant.display_name,
      });

      router.push(`/room/${code}`);
    } catch {
      setSubmitting(false);
      setError("Network connection error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full flex flex-col gap-4.5 text-left"
    >
      {/* Room Code Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="roomCode"
            className="text-xs font-semibold uppercase tracking-wider text-ink/70 font-mono"
          >
            Room Code
          </label>
          <button
            type="button"
            onClick={generateRandomCode}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted hover:text-ink transition-colors"
          >
            <RefreshCw className="size-3" />
            <span>Generate random</span>
          </button>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-faint">
            <Hash className="size-4" />
          </div>
          <input
            id="roomCode"
            type="text"
            className="w-full rounded-xl border border-line bg-surface/90 pl-10 pr-4 py-2.5 font-mono text-sm font-semibold tracking-wider text-ink placeholder:text-ink-faint/60 uppercase transition-all duration-200 focus:border-ink focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-lime/30"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            placeholder="e.g. PANTRY42"
            autoComplete="off"
            spellCheck="false"
          />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-ink-muted/80">Try:</span>
          {SUGGESTED_CODES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setRoomCode(code)}
              className="rounded-md border border-line-subtle bg-canvas-muted/80 px-2 py-0.5 font-mono text-[10px] font-medium text-ink-secondary hover:border-line hover:bg-brand-lime-soft hover:text-ink transition-all"
            >
              {code}
            </button>
          ))}
        </div>
      </div>

      {/* Your Name Input */}
      <div className="space-y-1.5">
        <label
          htmlFor="displayName"
          className="block text-xs font-semibold uppercase tracking-wider text-ink/70 font-mono"
        >
          Your Name / Agent Identity
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-ink-faint">
            <User className="size-4" />
          </div>
          <input
            id="displayName"
            type="text"
            className="w-full rounded-xl border border-line bg-surface/90 pl-10 pr-4 py-2.5 text-sm font-medium text-ink placeholder:text-ink-faint/60 transition-all duration-200 focus:border-ink focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand-lime/30"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Alex (or Alex's AI Agent)"
            autoComplete="name"
          />
        </div>
      </div>

      {/* Error Message Alert */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/80 p-3 text-xs text-red-700">
          <AlertCircle className="size-4 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Submit CTA */}
      <button
        type="submit"
        disabled={submitting}
        className="group relative mt-1 flex w-full items-center justify-center gap-2 rounded-xl border border-line-strong bg-ink px-5 py-3 font-display text-sm font-semibold text-white shadow-card transition-all duration-200 hover:bg-neutral-800 hover:shadow-card-hover active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <RefreshCw className="size-4 animate-spin text-brand-lime" />
            <span>Connecting to Room…</span>
          </>
        ) : (
          <>
            <span>Enter Shared Cartroom</span>
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 text-brand-lime" />
          </>
        )}
      </button>

      {/* WebMCP Indicator Pill */}
      <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono text-ink-muted">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-lime opacity-75"></span>
          <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
        </span>
        <span>WebMCP Standard Enabled · 6 Active Tools</span>
      </div>
    </form>
  );
}
