import type { ActionType, CartItem, CatalogItem, Participant } from "@/lib/types";

export interface ResolveInput {
  actionType: ActionType;
  payload: Record<string, unknown>;
  proposerId: string;
  participants: Pick<Participant, "id" | "budget_cap_cents">[];
  cartItems: Pick<CartItem, "id" | "catalog_item_id" | "claimed_by" | "paid_by" | "status">[];
  catalogItems: Pick<CatalogItem, "id" | "price_cents">[];
}

/**
 * Pure function: given the action a participant wants to take and a snapshot
 * of current room state, decide whose approval (if anyone's) is required.
 * Returns the affected participant's id, or null if the action is
 * self-scoped and should auto-resolve. See spec §3.
 */
export function resolveAffectedParticipant(input: ResolveInput): string | null {
  const { actionType, payload, proposerId, participants, cartItems, catalogItems } = input;

  function priceOf(catalogItemId: string): number | undefined {
    return catalogItems.find((c) => c.id === catalogItemId)?.price_cents;
  }

  function firstOverBudgetOwner(priceCents: number | undefined): string | null {
    if (priceCents === undefined) return null;
    const owner = participants.find(
      (p) => p.id !== proposerId && p.budget_cap_cents !== null && p.budget_cap_cents < priceCents
    );
    return owner ? owner.id : null;
  }

  switch (actionType) {
    case "add_item": {
      const catalogItemId = payload.catalog_item_id as string;
      const claim = payload.claim === true;

      if (claim) {
        const existingClaim = cartItems.find(
          (c) => c.catalog_item_id === catalogItemId && c.status === "active" && c.claimed_by !== null
        );
        if (existingClaim && existingClaim.claimed_by !== proposerId) {
          return existingClaim.claimed_by;
        }
        return null;
      }

      return firstOverBudgetOwner(priceOf(catalogItemId));
    }

    case "remove_item": {
      const cartItemId = payload.cart_item_id as string;
      const cartItem = cartItems.find((c) => c.id === cartItemId);
      if (!cartItem) return null;
      if (cartItem.claimed_by && cartItem.claimed_by !== proposerId) {
        return cartItem.claimed_by;
      }
      const otherPayer = cartItem.paid_by.find((id) => id !== proposerId);
      return otherPayer ?? null;
    }

    case "claim_item": {
      const cartItemId = payload.cart_item_id as string;
      const cartItem = cartItems.find((c) => c.id === cartItemId);
      if (!cartItem) return null;
      if (cartItem.claimed_by && cartItem.claimed_by !== proposerId) {
        return cartItem.claimed_by;
      }
      return null;
    }

    case "swap_item": {
      const cartItemId = payload.cart_item_id as string;
      const newCatalogItemId = payload.new_catalog_item_id as string;
      const cartItem = cartItems.find((c) => c.id === cartItemId);
      if (!cartItem) return null;
      if (cartItem.claimed_by && cartItem.claimed_by !== proposerId) {
        return cartItem.claimed_by;
      }
      const oldPrice = priceOf(cartItem.catalog_item_id) ?? 0;
      const newPrice = priceOf(newCatalogItemId) ?? 0;
      if (newPrice > oldPrice) {
        return firstOverBudgetOwner(newPrice);
      }
      return null;
    }

    case "set_budget":
    case "set_preferences":
    case "mark_paid":
      return null;

    default:
      return null;
  }
}
