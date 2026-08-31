"use client";

import { useState } from "react";
import type { Proposal } from "@/lib/types";
import { AlertTriangle, Check, X, MessageSquare, RefreshCw, Sparkles } from "lucide-react";

export function ProposalCard({
  proposal,
  onRespond,
}: {
  proposal: Proposal;
  onRespond: (decision: "approve" | "reject", note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [activeDecision, setActiveDecision] = useState<"approve" | "reject" | null>(null);

  async function handleDecision(decision: "approve" | "reject") {
    setSubmitting(true);
    setActiveDecision(decision);
    try {
      await onRespond(decision, note);
    } finally {
      setSubmitting(false);
      setActiveDecision(null);
    }
  }

  // Format action label
  const formattedAction = proposal.action_type.replace(/_/g, " ");

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300 bg-amber-50/90 p-4 shadow-card transition-all duration-200 hover:shadow-card-hover">
      {/* Top Accent Stripe */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400"></div>

      {/* Header Info */}
      <div className="flex items-start justify-between gap-2 mb-2 pt-0.5">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="size-4 text-amber-600 shrink-0" />
          <span className="font-display text-xs font-bold uppercase tracking-wider text-amber-900 font-mono">
            {formattedAction}
          </span>
        </div>
        <span className="rounded-md bg-amber-200/80 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-900">
          Awaiting Decision
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-ink-secondary leading-relaxed mb-3">
        A peer participant&apos;s AI agent proposed a change that affects your items or budget cap.
      </p>

      {/* Optional Note / Feedback input */}
      <div className="space-y-1 mb-3">
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-ink-muted">
            <MessageSquare className="size-3.5" />
          </div>
          <input
            className="w-full rounded-xl border border-amber-200/80 bg-white/90 pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted/60 transition-all focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            placeholder="Add note (e.g. 'Too expensive, pick under $50')"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Decision Buttons */}
      <div className="flex items-center gap-2">
        <button
          disabled={submitting}
          onClick={() => handleDecision("approve")}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-600 px-3 py-2 font-display text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {submitting && activeDecision === "approve" ? (
            <RefreshCw className="size-3.5 animate-spin" />
          ) : (
            <Check className="size-3.5" />
          )}
          <span>Approve</span>
        </button>

        <button
          disabled={submitting}
          onClick={() => handleDecision("reject")}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-line bg-ink px-3 py-2 font-display text-xs font-bold text-white shadow-sm hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          {submitting && activeDecision === "reject" ? (
            <RefreshCw className="size-3.5 animate-spin text-brand-lime" />
          ) : (
            <X className="size-3.5 text-red-400" />
          )}
          <span>Reject</span>
        </button>
      </div>
    </div>
  );
}
