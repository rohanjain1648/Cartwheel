import { Wallet, ShieldCheck, Tag } from "lucide-react";

export function BudgetBar({
  label,
  capCents,
  dietaryTags = [],
  styleTags = [],
}: {
  label: string;
  capCents: number | null;
  dietaryTags?: string[];
  styleTags?: string[];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl glass-panel p-4 border border-line shadow-sm hover:border-line-strong transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-brand-lime text-ink font-bold text-xs">
            {label.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-display text-xs font-bold text-ink leading-none">
              {label}
            </h4>
            <span className="text-[10px] font-mono text-ink-muted">Participant</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-md bg-canvas-muted px-2 py-0.5 font-mono text-[11px] font-semibold text-ink border border-line-subtle">
          <Wallet className="size-3 text-ink-muted" />
          {capCents === null ? (
            <span className="text-ink-muted font-normal">No cap set</span>
          ) : (
            <span>Cap: ${(capCents / 100).toFixed(2)}</span>
          )}
        </div>
      </div>

      {/* Tags if present */}
      {(dietaryTags.length > 0 || styleTags.length > 0) && (
        <div className="flex flex-wrap items-center gap-1 pt-1">
          {dietaryTags.map((tag) => (
            <span
              key={tag}
              className="rounded px-1.5 py-0.5 text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200"
            >
              🥗 {tag}
            </span>
          ))}
          {styleTags.map((tag) => (
            <span
              key={tag}
              className="rounded px-1.5 py-0.5 text-[9px] font-mono bg-blue-50 text-blue-700 border border-blue-200"
            >
              ✨ {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
