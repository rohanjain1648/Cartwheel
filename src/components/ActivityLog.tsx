import type { Participant, Proposal } from "@/lib/types";

export function ActivityLog({
  proposals,
  participants,
}: {
  proposals: Proposal[];
  participants: Participant[];
}) {
  function nameOf(id: string): string {
    return participants.find((p) => p.id === id)?.display_name ?? "someone";
  }

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {proposals.map((p) => (
        <li key={p.id} className="text-slate-600">
          <span className="font-medium">{nameOf(p.proposer_id)}</span> {p.action_type} —{" "}
          <span
            className={
              p.status === "rejected"
                ? "text-red-600"
                : p.status === "pending"
                  ? "text-amber-600"
                  : "text-emerald-600"
            }
          >
            {p.status}
          </span>
          {p.resolution_note && <span className="text-slate-400"> ({p.resolution_note})</span>}
        </li>
      ))}
    </ul>
  );
}
