export type ActionType =
  | "add_item"
  | "remove_item"
  | "claim_item"
  | "set_budget"
  | "set_preferences"
  | "mark_paid"
  | "swap_item";

export type ProposalStatus = "auto_approved" | "pending" | "approved" | "rejected";
export type CartItemStatus = "active" | "removed";
export type Category = "grocery" | "gift" | "furniture";

export interface Room {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  display_name: string;
  dietary_tags: string[];
  style_tags: string[];
  budget_cap_cents: number | null;
  session_token: string;
  created_at: string;
}

export interface CatalogItem {
  id: string;
  category: Category;
  name: string;
  price_cents: number;
  image_url: string | null;
  tags: string[];
}

export interface CartItem {
  id: string;
  room_id: string;
  catalog_item_id: string;
  claimed_by: string | null;
  qty: number;
  paid_by: string[];
  status: CartItemStatus;
  created_at: string;
}

export interface Proposal {
  id: string;
  room_id: string;
  proposer_id: string;
  action_type: ActionType;
  payload: Record<string, unknown>;
  affected_participant_id: string | null;
  status: ProposalStatus;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ProposalPayload =
  | { catalog_item_id: string; qty?: number; claim?: boolean } // add_item
  | { cart_item_id: string } // remove_item | claim_item
  | { budget_cap_cents: number } // set_budget
  | { dietary_tags?: string[]; style_tags?: string[] } // set_preferences
  | { cart_item_id: string; new_catalog_item_id: string }; // swap_item
// mark_paid reuses the remove_item/claim_item shape: { cart_item_id: string }

export interface RoomStateSnapshot {
  room: Room;
  participants: Participant[];
  cartItems: (CartItem & { catalogItem: CatalogItem })[];
  catalogItems: CatalogItem[];
  proposals: Proposal[];
}
