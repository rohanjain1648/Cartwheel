export function BudgetBar({
  label,
  capCents,
}: {
  label: string;
  capCents: number | null;
}) {
  return (
    <div className="text-sm text-slate-600">
      <span className="font-medium">{label}</span>{" "}
      {capCents === null ? (
        <span className="text-slate-400">no budget cap set</span>
      ) : (
        <span>cap ${(capCents / 100).toFixed(2)}</span>
      )}
    </div>
  );
}
