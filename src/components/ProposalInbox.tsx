"use client";

import type { Proposal } from "@/lib/types";
import { ProposalCard } from "./ProposalCard";
import { loadSession } from "@/lib/session";
import { Inbox, CheckCircle2 } from "lucide-react";

export function ProposalInbox({
  roomCode,
  myParticipantId,
  proposals,
  onResolved,
}: {
  roomCode: string;
  myParticipantId: string;
  proposals: Proposal[];
  onResolved: () => void;
}) {
  const pending = proposals.filter(
    (p) => p.status === "pending" && p.affected_participant_id === myParticipantId
  );

  async function respond(proposalId: string, decision: "approve" | "reject", note: string) {
    const session = loadSession(roomCode);
    if (!session) return;
    await fetch(`/api/rooms/${roomCode}/tools/respond-to-proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-token": session.sessionToken },
      body: JSON.stringify({ proposal_id: proposalId, decision, note: note || undefined }),
    });
    onResolved();
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl glass-panel p-6 border border-line text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 mb-2">
            <CheckCircle2 className="size-5" />
          </div>
          <p className="font-display text-xs font-bold text-ink">
            Inbox is Clear
          </p>
          <p className="text-[11px] text-ink-muted mt-0.5">
            No cross-participant proposals waiting on your approval.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {pending.map((p) => (
            <ProposalCard
              key={p.id}
              proposal={p}
              onRespond={(decision, note) => respond(p.id, decision, note)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
