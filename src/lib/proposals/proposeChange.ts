import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveAffectedParticipant } from "./resolveAffectedParticipant";
import type { ActionType, Proposal } from "@/lib/types";

export interface ProposeChangeInput {
  supabase: SupabaseClient;
  roomId: string;
  proposerId: string;
  actionType: ActionType;
  payload: Record<string, unknown>;
}

export type ProposeChangeResult = { ok: true; proposal: Proposal } | { ok: false; reason: string };

const VALID_ACTION_TYPES: ActionType[] = [
  "add_item",
  "remove_item",
  "claim_item",
  "set_budget",
  "set_preferences",
  "mark_paid",
  "swap_item",
];

export async function proposeChange(input: ProposeChangeInput): Promise<ProposeChangeResult> {
  const { supabase, roomId, proposerId, actionType, payload } = input;

  if (!VALID_ACTION_TYPES.includes(actionType)) {
    return { ok: false, reason: "invalid_action_type" };
  }

  const [{ data: participants }, { data: cartItems }, { data: catalogItems }] = await Promise.all([
    supabase.from("participants").select("id, budget_cap_cents").eq("room_id", roomId),
    supabase
      .from("cart_items")
      .select("id, catalog_item_id, claimed_by, paid_by, status")
      .eq("room_id", roomId)
      .eq("status", "active"),
    supabase.from("catalog_items").select("id, price_cents"),
  ]);

  const affectedParticipantId = resolveAffectedParticipant({
    actionType,
    payload,
    proposerId,
    participants: participants ?? [],
    cartItems: cartItems ?? [],
    catalogItems: catalogItems ?? [],
  });

  const { data: proposal, error } = await supabase
    .rpc("create_proposal", {
      p_room_id: roomId,
      p_proposer_id: proposerId,
      p_action_type: actionType,
      p_payload: payload,
      p_affected_participant_id: affectedParticipantId,
    })
    .single();

  if (error) {
    return { ok: false, reason: "propose_failed" };
  }

  return { ok: true, proposal: proposal as Proposal };
}
