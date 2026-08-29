import type { CartItem, CatalogItem, Participant } from "@/lib/types";

export function CartItemCard({
  cartItem,
  participants,
}: {
  cartItem: CartItem & { catalogItem: CatalogItem };
  participants: Participant[];
}) {
  const claimant = participants.find((p) => p.id === cartItem.claimed_by);
  return (
    <div className="rounded border border-slate-200 bg-white p-3 flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="font-medium">{cartItem.catalogItem.name}</span>
        <span className="text-slate-600">${(cartItem.catalogItem.price_cents / 100).toFixed(2)}</span>
      </div>
      <div className="text-xs text-slate-500">
        {claimant ? `claimed by ${claimant.display_name}` : "unclaimed (pooled)"}
        {cartItem.paid_by.length > 0 && ` · paid by ${cartItem.paid_by.length}`}
      </div>
    </div>
  );
}
