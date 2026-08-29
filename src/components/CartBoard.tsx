import type { RoomStateSnapshot } from "@/lib/types";
import { CartItemCard } from "./CartItemCard";
import { BudgetBar } from "./BudgetBar";

const CATEGORY_LABELS: Record<string, string> = {
  grocery: "Groceries",
  gift: "Gift",
  furniture: "Furniture",
};

export function CartBoard({ state }: { state: RoomStateSnapshot }) {
  const categories = ["grocery", "gift", "furniture"] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        {state.participants.map((p) => (
          <BudgetBar key={p.id} label={p.display_name} capCents={p.budget_cap_cents} />
        ))}
      </div>
      {categories.map((category) => {
        const items = state.cartItems.filter((c) => c.catalogItem.category === category);
        return (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-2">{CATEGORY_LABELS[category]}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing here yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <CartItemCard key={item.id} cartItem={item} participants={state.participants} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
