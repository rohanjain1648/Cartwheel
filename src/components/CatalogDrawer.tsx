"use client";

import { useState, useEffect } from "react";
import type { CatalogItem } from "@/lib/types";
import { loadSession } from "@/lib/session";
import { Search, ShoppingBag, Plus, Check, RefreshCw, X, Gift, Armchair } from "lucide-react";

export function CatalogDrawer({
  roomCode,
  isOpen,
  onClose,
  onItemAdded,
}: {
  roomCode: string;
  isOpen: boolean;
  onClose: () => void;
  onItemAdded: () => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetchCatalog();
  }, [isOpen, category]);

  async function fetchCatalog() {
    setLoading(true);
    const session = loadSession(roomCode);
    if (!session) return;
    try {
      const res = await fetch(`/api/rooms/${roomCode}/tools/search-catalog`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-token": session.sessionToken },
        body: JSON.stringify({
          query: query || undefined,
          category: category === "all" ? undefined : category,
        }),
      });
      const data = await res.json();
      if (data.items) {
        setItems(data.items);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }

  async function handleProposeAdd(catalogItemId: string) {
    const session = loadSession(roomCode);
    if (!session) return;
    setAddingId(catalogItemId);
    try {
      await fetch(`/api/rooms/${roomCode}/tools/propose-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-session-token": session.sessionToken },
        body: JSON.stringify({
          action_type: "add_item",
          payload: { catalog_item_id: catalogItemId, qty: 1 },
        }),
      });
      onItemAdded();
    } finally {
      setAddingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30 backdrop-blur-sm transition-all duration-300">
      <div className="relative w-full max-w-md bg-canvas h-full shadow-2xl flex flex-col border-l border-line">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-line bg-surface">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-brand-lime text-ink">
              <ShoppingBag className="size-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-bold text-ink">Product Catalog</h3>
              <p className="text-[10px] font-mono text-ink-muted">Propose items to shared room</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-muted hover:bg-canvas-muted hover:text-ink transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 space-y-3 border-b border-line bg-canvas-muted/50">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Search groceries, gifts, furniture…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchCatalog()}
              className="w-full rounded-xl border border-line bg-surface pl-8 pr-3 py-2 text-xs text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {["all", "grocery", "gift", "furniture"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-display font-medium capitalize transition-all ${
                  category === cat
                    ? "bg-ink text-white shadow-sm"
                    : "bg-surface text-ink-secondary border border-line-subtle hover:bg-canvas-muted"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-ink-muted">
              <RefreshCw className="size-6 animate-spin mb-2 text-brand-lime" />
              <span className="text-xs font-mono">Loading Catalog…</span>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-xs text-ink-muted">
              No products found matching your search.
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-xl glass-panel p-3 border border-line hover:border-line-strong transition-all"
              >
                <div className="min-w-0">
                  <h5 className="font-display text-xs font-bold text-ink truncate">
                    {item.name}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-xs font-bold text-ink">
                      ${(item.price_cents / 100).toFixed(2)}
                    </span>
                    <span className="font-mono text-[9px] uppercase px-1.5 py-0.2 rounded bg-canvas-muted text-ink-muted border border-line-subtle">
                      {item.category}
                    </span>
                  </div>
                </div>

                <button
                  disabled={addingId === item.id}
                  onClick={() => handleProposeAdd(item.id)}
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-ink text-white hover:bg-neutral-800 disabled:opacity-50 transition-all shadow-sm"
                  title="Propose Add"
                >
                  {addingId === item.id ? (
                    <RefreshCw className="size-3.5 animate-spin text-brand-lime" />
                  ) : (
                    <Plus className="size-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
