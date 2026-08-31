import type { CartItem, CatalogItem, Participant } from "@/lib/types";
import { Check, User, Users, ShoppingBag, Gift, Armchair, Tag } from "lucide-react";

const CATEGORY_ICONS: Record<string, typeof ShoppingBag> = {
  grocery: ShoppingBag,
  gift: Gift,
  furniture: Armchair,
};

export function CartItemCard({
  cartItem,
  participants,
}: {
  cartItem: CartItem & { catalogItem: CatalogItem };
  participants: Participant[];
}) {
  const claimant = participants.find((p) => p.id === cartItem.claimed_by);
  const IconComponent = CATEGORY_ICONS[cartItem.catalogItem.category] || ShoppingBag;
  const isPaid = cartItem.paid_by.length > 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl glass-panel p-4 border border-line shadow-card transition-all duration-200 hover:border-line-strong hover:shadow-card-hover">
      {/* Top Header Row: Category Icon & Price */}
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-canvas-muted border border-line-subtle text-ink">
              <IconComponent className="size-3.5" />
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
              {cartItem.catalogItem.category}
            </span>
          </div>

          <span className="rounded-md bg-ink px-2 py-0.5 font-mono text-xs font-bold text-white shadow-sm">
            ${(cartItem.catalogItem.price_cents / 100).toFixed(2)}
          </span>
        </div>

        {/* Item Title */}
        <h4 className="font-display text-sm font-bold text-ink group-hover:text-neutral-900 transition-colors">
          {cartItem.catalogItem.name}
        </h4>

        {/* Tags if any */}
        {cartItem.catalogItem.tags && cartItem.catalogItem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {cartItem.catalogItem.tags.map((tag) => (
              <span
                key={tag}
                className="rounded px-1.5 py-0.5 text-[9px] font-mono bg-canvas-muted text-ink-secondary border border-line-subtle"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info: Claimant & Paid Status */}
      <div className="mt-4 pt-3 border-t border-line-subtle flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          {claimant ? (
            <div className="flex items-center gap-1.5 text-ink-secondary font-medium">
              <div className="flex size-4 items-center justify-center rounded-full bg-brand-lime text-ink text-[9px] font-bold">
                {claimant.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[11px] truncate max-w-[120px]">
                {claimant.display_name}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-amber-700 font-mono text-[11px]">
              <Users className="size-3" />
              <span>Pooled / Shared</span>
            </div>
          )}

          {cartItem.qty > 1 && (
            <span className="font-mono text-[10px] text-ink-muted bg-canvas-muted px-1.5 py-0.5 rounded border border-line-subtle">
              Qty: {cartItem.qty}
            </span>
          )}
        </div>

        {/* Paid By Status Chips */}
        {isPaid && (
          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded border border-emerald-200">
            <Check className="size-3 shrink-0" />
            <span>Paid by {cartItem.paid_by.length} participant{cartItem.paid_by.length > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </div>
  );
}
