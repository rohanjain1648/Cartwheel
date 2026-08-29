"use client";

import type { Proposal } from "@/lib/types";
import { ProposalCard } from "./ProposalCard";
import { loadSession } from "@/lib/session";

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

  if (pending.length === 0) {
    return <p className="text-sm text-slate-400">Nothing waiting on your approval.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {pending.map((p) => (
        <ProposalCard key={p.id} proposal={p} onRespond={(decision, note) => respond(p.id, decision, note)} />
      ))}
    </div>
  );
}
