"use client";

import { useState } from "react";
import type { RoomStateSnapshot } from "@/lib/types";
import { CartItemCard } from "./CartItemCard";
import { BudgetBar } from "./BudgetBar";
import { ShoppingBag, Gift, Armchair, Layers, Plus } from "lucide-react";

const CATEGORY_META = {
  grocery: { label: "Household Groceries", icon: ShoppingBag, desc: "Pantry items, shared perishables & staples" },
  gift: { label: "Pooled Group Gifts", icon: Gift, desc: "Crowdfunded items with individual payment tracking" },
  furniture: { label: "Shared Furniture", icon: Armchair, desc: "Big-ticket items with budget constraints" },
};

export function CartBoard({ state }: { state: RoomStateSnapshot }) {
  const [activeTab, setActiveTab] = useState<"all" | "grocery" | "gift" | "furniture">("all");
  const categories = ["grocery", "gift", "furniture"] as const;

  // Calculate stats
  const totalSpendCents = state.cartItems.reduce(
    (sum, item) => sum + (item.catalogItem.price_cents * item.qty),
    0
  );
  const totalItemCount = state.cartItems.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Participant Budget Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {state.participants.map((p) => (
          <BudgetBar
            key={p.id}
            label={p.display_name}
            capCents={p.budget_cap_cents}
            dietaryTags={p.dietary_tags}
            styleTags={p.style_tags}
          />
        ))}
      </div>

      {/* Cart Navigation Bar & Category Filter Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl glass-panel p-2.5 border border-line">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setActiveTab("all")}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-semibold transition-all ${
              activeTab === "all"
                ? "bg-ink text-white shadow-sm"
                : "text-ink-secondary hover:bg-canvas-muted hover:text-ink"
            }`}
          >
            <Layers className="size-3.5" />
            <span>All Items</span>
            <span className="ml-1 rounded-full bg-surface/20 px-1.5 py-0.2 font-mono text-[10px]">
              {totalItemCount}
            </span>
          </button>

          {categories.map((cat) => {
            const count = state.cartItems.filter((i) => i.catalogItem.category === cat).length;
            const Icon = CATEGORY_META[cat].icon;
            const isActive = activeTab === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveTab(cat)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-display text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-ink text-white shadow-sm"
                    : "text-ink-secondary hover:bg-canvas-muted hover:text-ink"
                }`}
              >
                <Icon className="size-3.5" />
                <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                {count > 0 && (
                  <span className="ml-1 rounded-full bg-brand-lime px-1.5 py-0.2 font-mono text-[10px] text-ink font-bold">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Total Cart Value Metric */}
        <div className="flex items-center gap-2 self-end sm:self-center px-3 py-1 bg-brand-lime-soft/90 rounded-xl border border-line-subtle font-mono text-xs text-ink font-bold">
          <span className="text-ink-muted text-[10px] uppercase font-normal">Cart Total:</span>
          <span>${(totalSpendCents / 100).toFixed(2)}</span>
        </div>
      </div>

      {/* Categories Sections */}
      {categories.map((category) => {
        if (activeTab !== "all" && activeTab !== category) return null;
        const items = state.cartItems.filter((c) => c.catalogItem.category === category);
        const meta = CATEGORY_META[category];
        const Icon = meta.icon;

        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded-md bg-canvas-muted text-ink border border-line-subtle">
                  <Icon className="size-3.5" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">
                    {meta.label}
                  </h3>
                  <p className="text-[11px] text-ink-muted">{meta.desc}</p>
                </div>
              </div>
              <span className="font-mono text-xs text-ink-muted">
                {items.length} item{items.length === 1 ? "" : "s"}
              </span>
            </div>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas-muted/40 py-8 px-4 text-center">
                <Icon className="size-8 text-ink-faint/60 mb-2" />
                <p className="font-display text-xs font-semibold text-ink-secondary">
                  No {category} items in cart yet.
                </p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Ask your AI agent to call <code>propose_change</code> or add from the catalog.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {items.map((item) => (
                  <CartItemCard
                    key={item.id}
                    cartItem={item}
                    participants={state.participants}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
