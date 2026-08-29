export const searchCatalogSchema = {
  type: "object",
  properties: {
    query: { type: "string", description: "Free-text search over item name and tags" },
    category: {
      type: "string",
      enum: ["grocery", "gift", "furniture"],
      description: "Restrict results to one category",
    },
  },
} as const;

export const getRoomStateSchema = {
  type: "object",
  properties: {},
} as const;

export const proposeChangeSchema = {
  type: "object",
  properties: {
    action_type: {
      type: "string",
      enum: ["add_item", "remove_item", "claim_item", "set_budget", "set_preferences", "swap_item"],
      description:
        "What kind of change to make. Use mark_paid tool for paying your share instead of this.",
    },
    payload: {
      type: "object",
      description:
        "add_item: {catalog_item_id, qty?, claim?}. remove_item/claim_item: {cart_item_id}. " +
        "set_budget: {budget_cap_cents}. set_preferences: {dietary_tags?, style_tags?}. " +
        "swap_item: {cart_item_id, new_catalog_item_id}.",
    },
  },
  required: ["action_type", "payload"],
} as const;

export const listPendingProposalsSchema = {
  type: "object",
  properties: {
    scope: {
      type: "string",
      enum: ["needs_my_approval", "mine", "all"],
      description: "needs_my_approval: proposals blocked on you. mine: proposals you made. all: everything.",
    },
  },
  required: ["scope"],
} as const;

export const respondToProposalSchema = {
  type: "object",
  properties: {
    proposal_id: { type: "string", description: "The id of the pending proposal" },
    decision: { type: "string", enum: ["approve", "reject"] },
    note: { type: "string", description: "Optional reason, especially useful on reject" },
  },
  required: ["proposal_id", "decision"],
} as const;

export const markPaidSchema = {
  type: "object",
  properties: {
    cart_item_id: { type: "string", description: "The cart item you're marking your share of as paid" },
  },
  required: ["cart_item_id"],
} as const;
