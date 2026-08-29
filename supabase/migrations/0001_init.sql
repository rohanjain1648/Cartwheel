create extension if not exists pgcrypto;

create table rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  display_name text not null,
  dietary_tags text[] not null default '{}',
  style_tags text[] not null default '{}',
  budget_cap_cents integer,
  session_token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now()
);

create table catalog_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('grocery', 'gift', 'furniture')),
  name text not null,
  price_cents integer not null,
  image_url text,
  tags text[] not null default '{}'
);

create table cart_items (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  catalog_item_id uuid not null references catalog_items(id),
  claimed_by uuid references participants(id),
  qty integer not null default 1,
  paid_by uuid[] not null default '{}',
  status text not null default 'active' check (status in ('active', 'removed')),
  created_at timestamptz not null default now()
);

create table proposals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  proposer_id uuid not null references participants(id),
  action_type text not null check (action_type in
    ('add_item', 'remove_item', 'claim_item', 'set_budget', 'set_preferences', 'mark_paid', 'swap_item')),
  payload jsonb not null,
  affected_participant_id uuid references participants(id),
  status text not null default 'pending' check (status in ('auto_approved', 'pending', 'approved', 'rejected')),
  resolution_note text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index cart_items_room_id_idx on cart_items (room_id);
create index proposals_room_id_idx on proposals (room_id);
create index proposals_affected_participant_idx on proposals (affected_participant_id, status);

alter table rooms enable row level security;
alter table participants enable row level security;
alter table catalog_items enable row level security;
alter table cart_items enable row level security;
alter table proposals enable row level security;

-- No client-side write policies are defined: the browser client only ever
-- reads (via realtime subscriptions and direct selects). All writes happen
-- exclusively through the service-role key inside Route Handlers (see the
-- plan's Global Constraints). Production-grade RLS hardening is a
-- documented non-goal for the hackathon window (spec §2).
create policy "anon can read rooms" on rooms for select using (true);
create policy "anon can read participants" on participants for select using (true);
create policy "anon can read catalog_items" on catalog_items for select using (true);
create policy "anon can read cart_items" on cart_items for select using (true);
create policy "anon can read proposals" on proposals for select using (true);
