create or replace function apply_proposal(p_proposal_id uuid)
returns proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals;
begin
  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'proposal_not_found';
  end if;

  if v_proposal.action_type = 'add_item' then
    insert into cart_items (room_id, catalog_item_id, claimed_by, qty)
    values (
      v_proposal.room_id,
      (v_proposal.payload ->> 'catalog_item_id')::uuid,
      case when (v_proposal.payload ->> 'claim')::boolean is true then v_proposal.proposer_id else null end,
      coalesce((v_proposal.payload ->> 'qty')::integer, 1)
    );

  elsif v_proposal.action_type = 'remove_item' then
    update cart_items set status = 'removed'
    where id = (v_proposal.payload ->> 'cart_item_id')::uuid;

  elsif v_proposal.action_type = 'claim_item' then
    update cart_items set claimed_by = v_proposal.proposer_id
    where id = (v_proposal.payload ->> 'cart_item_id')::uuid;

  elsif v_proposal.action_type = 'set_budget' then
    update participants set budget_cap_cents = (v_proposal.payload ->> 'budget_cap_cents')::integer
    where id = v_proposal.proposer_id;

  elsif v_proposal.action_type = 'set_preferences' then
    update participants set
      dietary_tags = coalesce(
        (select array_agg(x) from jsonb_array_elements_text(v_proposal.payload -> 'dietary_tags') x),
        dietary_tags),
      style_tags = coalesce(
        (select array_agg(x) from jsonb_array_elements_text(v_proposal.payload -> 'style_tags') x),
        style_tags)
    where id = v_proposal.proposer_id;

  elsif v_proposal.action_type = 'mark_paid' then
    update cart_items
    set paid_by = array_append(paid_by, v_proposal.proposer_id)
    where id = (v_proposal.payload ->> 'cart_item_id')::uuid
      and not (v_proposal.proposer_id = any(paid_by));

  elsif v_proposal.action_type = 'swap_item' then
    update cart_items set catalog_item_id = (v_proposal.payload ->> 'new_catalog_item_id')::uuid
    where id = (v_proposal.payload ->> 'cart_item_id')::uuid;

  else
    raise exception 'unknown_action_type: %', v_proposal.action_type;
  end if;

  update proposals
  set resolved_at = coalesce(resolved_at, now())
  where id = p_proposal_id
  returning * into v_proposal;

  return v_proposal;
end;
$$;

create or replace function create_proposal(
  p_room_id uuid,
  p_proposer_id uuid,
  p_action_type text,
  p_payload jsonb,
  p_affected_participant_id uuid
)
returns proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals;
begin
  insert into proposals (room_id, proposer_id, action_type, payload, affected_participant_id, status)
  values (
    p_room_id,
    p_proposer_id,
    p_action_type,
    p_payload,
    p_affected_participant_id,
    case when p_affected_participant_id is null then 'auto_approved' else 'pending' end
  )
  returning * into v_proposal;

  if p_affected_participant_id is null then
    return apply_proposal(v_proposal.id);
  end if;

  return v_proposal;
end;
$$;

create or replace function resolve_proposal(
  p_proposal_id uuid,
  p_responder_id uuid,
  p_decision text,
  p_note text
)
returns proposals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_proposal proposals;
begin
  select * into v_proposal from proposals where id = p_proposal_id for update;
  if not found then
    raise exception 'proposal_not_found';
  end if;
  if v_proposal.affected_participant_id is distinct from p_responder_id then
    raise exception 'not_authorized';
  end if;
  if v_proposal.status <> 'pending' then
    raise exception 'already_resolved';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'invalid_decision';
  end if;

  update proposals
  set status = case when p_decision = 'approve' then 'approved' else 'rejected' end,
      resolution_note = p_note,
      resolved_at = now()
  where id = p_proposal_id
  returning * into v_proposal;

  if p_decision = 'approve' then
    return apply_proposal(p_proposal_id);
  end if;

  return v_proposal;
end;
$$;
