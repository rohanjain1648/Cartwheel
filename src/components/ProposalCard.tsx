"use client";

import { useState } from "react";
import type { Proposal } from "@/lib/types";

export function ProposalCard({
  proposal,
  onRespond,
}: {
  proposal: Proposal;
  onRespond: (decision: "approve" | "reject", note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function respond(decision: "approve" | "reject") {
    setSubmitting(true);
    await onRespond(decision, note);
    setSubmitting(false);
  }

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3 flex flex-col gap-2">
      <div className="text-sm">
        <span className="font-medium">{proposal.action_type}</span>{" "}
        <span className="text-slate-600">wants your approval</span>
      </div>
      <input
        className="rounded border border-slate-300 px-2 py-1 text-sm"
        placeholder="Optional note (e.g. why you're rejecting)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          disabled={submitting}
          onClick={() => respond("approve")}
          className="rounded bg-emerald-600 text-white px-3 py-1 text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={submitting}
          onClick={() => respond("reject")}
          className="rounded bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
