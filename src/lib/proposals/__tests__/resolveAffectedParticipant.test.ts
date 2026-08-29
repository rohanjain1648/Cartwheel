import { describe, expect, it } from "vitest";
import { resolveAffectedParticipant } from "../resolveAffectedParticipant";

const alex = "11111111-1111-1111-1111-111111111111";
const sam = "22222222-2222-2222-2222-222222222222";
const milkCatalogId = "33333333-3333-3333-3333-333333333333";
const vaseCatalogId = "44444444-4444-4444-4444-444444444444";
const milkCartItemId = "55555555-5555-5555-5555-555555555555";

describe("resolveAffectedParticipant", () => {
  it("returns null for a self-scoped add_item (unclaimed, pooled)", () => {
    const result = resolveAffectedParticipant({
      actionType: "add_item",
      payload: { catalog_item_id: milkCatalogId, claim: false },
      proposerId: sam,
      participants: [{ id: alex, budget_cap_cents: null }, { id: sam, budget_cap_cents: null }],
      cartItems: [],
      catalogItems: [{ id: milkCatalogId, price_cents: 450 }],
    });
    expect(result).toBeNull();
  });

  it("returns the existing claimant when add_item with claim:true conflicts with their existing claim", () => {
    const result = resolveAffectedParticipant({
      actionType: "add_item",
      payload: { catalog_item_id: milkCatalogId, claim: true },
      proposerId: sam,
      participants: [{ id: alex, budget_cap_cents: null }, { id: sam, budget_cap_cents: null }],
      cartItems: [
        {
          id: milkCartItemId,
          catalog_item_id: milkCatalogId,
          claimed_by: alex,
          paid_by: [],
          status: "active",
        },
      ],
      catalogItems: [{ id: milkCatalogId, price_cents: 450 }],
    });
    expect(result).toBe(alex);
  });

  it("returns null for add_item with claim:true when nobody else has claimed it", () => {
    const result = resolveAffectedParticipant({
      actionType: "add_item",
      payload: { catalog_item_id: milkCatalogId, claim: true },
      proposerId: sam,
      participants: [{ id: alex, budget_cap_cents: null }, { id: sam, budget_cap_cents: null }],
      cartItems: [],
      catalogItems: [{ id: milkCatalogId, price_cents: 450 }],
    });
    expect(result).toBeNull();
  });

  it("returns the budget owner when a pooled add_item exceeds their cap", () => {
    const result = resolveAffectedParticipant({
      actionType: "add_item",
      payload: { catalog_item_id: vaseCatalogId, claim: false },
      proposerId: sam,
      participants: [{ id: alex, budget_cap_cents: 5000 }, { id: sam, budget_cap_cents: null }],
      cartItems: [],
      catalogItems: [{ id: vaseCatalogId, price_cents: 6000 }],
    });
    expect(result).toBe(alex);
  });

  it("returns the claimant when remove_item targets someone else's claim", () => {
    const result = resolveAffectedParticipant({
      actionType: "remove_item",
      payload: { cart_item_id: milkCartItemId },
      proposerId: sam,
      participants: [{ id: alex, budget_cap_cents: null }, { id: sam, budget_cap_cents: null }],
      cartItems: [
        {
          id: milkCartItemId,
          catalog_item_id: milkCatalogId,
          claimed_by: alex,
          paid_by: [],
          status: "active",
        },
      ],
      catalogItems: [{ id: milkCatalogId, price_cents: 450 }],
    });
    expect(result).toBe(alex);
  });

  it("returns null when remove_item targets your own claim", () => {
    const result = resolveAffectedParticipant({
      actionType: "remove_item",
      payload: { cart_item_id: milkCartItemId },
      proposerId: alex,
      participants: [{ id: alex, budget_cap_cents: null }, { id: sam, budget_cap_cents: null }],
      cartItems: [
        {
          id: milkCartItemId,
          catalog_item_id: milkCatalogId,
          claimed_by: alex,
          paid_by: [],
          status: "active",
        },
      ],
      catalogItems: [{ id: milkCatalogId, price_cents: 450 }],
    });
    expect(result).toBeNull();
  });

  it("returns null for set_budget, set_preferences, and mark_paid (always self-scoped)", () => {
    const base = {
      proposerId: alex,
      participants: [{ id: alex, budget_cap_cents: null }],
      cartItems: [],
      catalogItems: [],
    };
    expect(
      resolveAffectedParticipant({ actionType: "set_budget", payload: { budget_cap_cents: 5000 }, ...base })
    ).toBeNull();
    expect(
      resolveAffectedParticipant({ actionType: "set_preferences", payload: { dietary_tags: ["vegan"] }, ...base })
    ).toBeNull();
    expect(
      resolveAffectedParticipant({ actionType: "mark_paid", payload: { cart_item_id: milkCartItemId }, ...base })
    ).toBeNull();
  });
});
