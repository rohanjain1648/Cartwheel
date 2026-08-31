import type { Participant, Proposal } from "@/lib/types";
import { Check, Clock, X, Zap, ShieldAlert } from "lucide-react";

export function ActivityLog({
  proposals,
  participants,
}: {
  proposals: Proposal[];
  participants: Participant[];
}) {
  function nameOf(id: string): string {
    return participants.find((p) => p.id === id)?.display_name ?? "Someone";
  }

  const STATUS_BADGES = {
    auto_approved: {
      label: "auto-approved",
      className: "bg-brand-lime-soft text-emerald-800 border-emerald-300",
      icon: Zap,
    },
    approved: {
      label: "approved",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: Check,
    },
    pending: {
      label: "pending",
      className: "bg-amber-50 text-amber-800 border-amber-300",
      icon: Clock,
    },
    rejected: {
      label: "rejected",
      className: "bg-rose-50 text-rose-700 border-rose-200",
      icon: X,
    },
  };

  if (proposals.length === 0) {
    return (
      <div className="rounded-2xl glass-panel p-6 border border-line text-center">
        <p className="text-xs text-ink-muted">No activity recorded yet in this room.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl glass-panel p-4 border border-line shadow-card space-y-3">
      <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
        {proposals.map((p) => {
          const statusConfig = STATUS_BADGES[p.status] || STATUS_BADGES.pending;
          const Icon = statusConfig.icon;
          const proposerName = nameOf(p.proposer_id);
          const formattedAction = p.action_type.replace(/_/g, " ");

          return (
            <div
              key={p.id}
              className="flex flex-col gap-1 rounded-xl bg-canvas-muted/60 p-2.5 border border-line-subtle text-xs transition-colors hover:bg-canvas-muted"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-display font-bold text-ink truncate">
                    {proposerName}
                  </span>
                  <span className="font-mono text-[11px] text-ink-muted truncate">
                    {formattedAction}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold ${statusConfig.className}`}
                >
                  <Icon className="size-2.5" />
                  <span>{statusConfig.label}</span>
                </span>
              </div>

              {/* Resolution Note if any */}
              {p.resolution_note && (
                <div className="rounded-md bg-surface p-1.5 text-[11px] text-ink-secondary border border-line-subtle italic">
                  &ldquo;{p.resolution_note}&rdquo;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
