# Cartwheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy Cartwheel — a real-time, multiplayer shared shopping cart (groceries/gift-pooling/furniture) whose entire mutation surface is exposed as WebMCP tools with a propose→auto-resolve-or-approve mechanic, for the WebMCP Challenge.

**Architecture:** Next.js 14 (App Router) deployed on Vercel serves both the UI and the tool-call server boundary as Route Handlers (`src/app/api/rooms/[code]/tools/*`) — this fills the role the spec calls "Supabase Edge Functions": a server-side-only endpoint holding the Supabase **service-role** key, so approval logic can never be bypassed by a crafted client call. Supabase holds Postgres tables plus three RPC functions (`create_proposal`, `apply_proposal`, `resolve_proposal`) that are the *only* code path allowed to mutate `cart_items`/`participants`. The browser client subscribes to Supabase Realtime for live sync and registers six `document.modelContext.registerTool()` tools whose `execute()` bodies call the Route Handlers using the same session as the human's own UI.

**Tech Stack:** Next.js 14 (App Router, TypeScript strict), Tailwind CSS, `@supabase/supabase-js` v2, Supabase Postgres + Realtime, Vitest, deployed to Vercel.

**Spec:** [docs/superpowers/specs/2026-08-28-cartwheel-webmcp-design.md](../specs/2026-08-28-cartwheel-webmcp-design.md)

## Global Constraints

- Node 18+, TypeScript strict mode, Next.js 14 App Router.
- All money amounts are integer cents (`price_cents`, `budget_cap_cents`) — never floats — everywhere: DB columns, TS types, API payloads.
- `action_type` is the closed enum from the spec: `add_item | remove_item | claim_item | set_budget | set_preferences | mark_paid | swap_item`. Never invent new values.
- Every mutation to `cart_items` or `participants` (other than participant creation at join time) goes through the `create_proposal` / `apply_proposal` / `resolve_proposal` Postgres RPCs — no direct table writes from Route Handlers.
- Every WebMCP tool's `execute()` returns a JSON-serializable `{ ok: boolean, ... }` shape and never throws — per spec §8, errors are structured (`{ ok: false, reason: "..." }`), not exceptions.
- WebMCP registration uses the confirmed spec API: `document.modelContext.registerTool(tool, options)`, `inputSchema` as plain JSON Schema, async `execute(inputObject, options)` returning a JSON-serializable value, `options.signal` (an `AbortController`'s signal) passed to `registerTool` for cleanup/unregistration on unmount.
- The current participant is always resolved server-side from an opaque `session_token` (header `x-session-token`) looked up in `participants` — never trusted from client-supplied `participantId` fields.

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`, `.eslintrc.json`
- Create: `.gitignore`, `.env.example`, `LICENSE`, `README.md`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Test: `src/lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: a running `npm run dev` Next.js app and a working `npm test` (Vitest) command — every later task depends on both existing.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "cartwheel",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "14.2.5",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "@supabase/supabase-js": "2.45.4"
  },
  "devDependencies": {
    "typescript": "5.5.4",
    "@types/node": "20.14.15",
    "@types/react": "18.3.3",
    "@types/react-dom": "18.3.0",
    "tailwindcss": "3.4.10",
    "postcss": "8.4.41",
    "autoprefixer": "10.4.20",
    "eslint": "8.57.0",
    "eslint-config-next": "14.2.5",
    "vitest": "2.0.5"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create `next.config.mjs`**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
```

- [ ] **Step 4: Create `tailwind.config.ts` and `postcss.config.mjs`**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

```javascript
// postcss.config.mjs
export default {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

- [ ] **Step 5: Create `src/app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 6: Create `src/app/layout.tsx`**

```tsx
import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Cartwheel",
  description: "A shared cart your agents can shop from — together.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder `src/app/page.tsx`** (replaced with the real join form in Task 4)

```tsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Cartwheel</h1>
    </main>
  );
}
```

- [ ] **Step 8: Create `.gitignore`**

```
node_modules/
.next/
.env
.env.local
.vercel/
.remember/
coverage/
```

- [ ] **Step 9: Create `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

- [ ] **Step 10: Create `LICENSE`** (MIT, required by the challenge to be visible in the repo's About section)

```
MIT License

Copyright (c) 2026 Cartwheel contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 11: Create `README.md` skeleton** (filled in fully in Task 13)

```markdown
# Cartwheel

A real-time, multiplayer shared shopping cart — groceries, a pooled gift, and
shared furniture, all in one cart — where every mutation is exposed to AI
agents as a WebMCP tool with a propose → auto-resolve-or-approve mechanic.

See [docs/superpowers/specs/2026-08-28-cartwheel-webmcp-design.md](docs/superpowers/specs/2026-08-28-cartwheel-webmcp-design.md)
for the full design.

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase project's
   URL, anon key, and service role key.
3. Apply the SQL in `supabase/migrations/` to your Supabase project (via the
   Supabase SQL editor, the Supabase CLI, or the Supabase MCP tool).
4. `npm run dev` and open `http://localhost:3000`.

## Testing

`npm test` runs the Vitest unit suite. See "Manual two-tab smoke test" below
for the end-to-end script used to validate the live demo path.
```

- [ ] **Step 12: Install dependencies**

Run: `npm install`
Expected: installs without error, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 13: Add a sanity Vitest test**

```typescript
// src/lib/__tests__/sanity.test.ts
import { describe, expect, it } from "vitest";

describe("test runner sanity", () => {
  it("adds numbers", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 14: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node" },
});
```

- [ ] **Step 15: Run the test suite**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 16: Run the dev server to confirm the scaffold boots**

Run: `npm run dev` (then stop it once the "Ready" log line appears — no need to leave it running)
Expected: Next.js prints a ready message with no compile errors.

---

## Task 2: Supabase schema, RPC functions, and seed data

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `supabase/migrations/0002_functions.sql`
- Create: `supabase/seed.sql`

**Interfaces:**
- Produces: tables `rooms`, `participants`, `catalog_items`, `cart_items`, `proposals` exactly as in spec §4; RPC functions `create_proposal(p_room_id uuid, p_proposer_id uuid, p_action_type text, p_payload jsonb, p_affected_participant_id uuid) returns proposals`, `apply_proposal(p_proposal_id uuid) returns proposals`, `resolve_proposal(p_proposal_id uuid, p_responder_id uuid, p_decision text, p_note text) returns proposals`. All later server-side tasks call these three RPCs by name and rely on this exact return shape (a full `proposals` row).

- [ ] **Step 1: Write `supabase/migrations/0001_init.sql`**

```sql
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

-- No client-side policies are defined: the browser client only ever reads
-- via realtime subscriptions filtered server-side is out of scope for the
-- hackathon window, so realtime + anon reads are allowed broadly, but all
-- writes happen exclusively through the service-role key inside Route
-- Handlers (see Global Constraints). This is a documented non-goal per
-- spec §2 ("production-grade security hardening").
create policy "anon can read rooms" on rooms for select using (true);
create policy "anon can read participants" on participants for select using (true);
create policy "anon can read catalog_items" on catalog_items for select using (true);
create policy "anon can read cart_items" on cart_items for select using (true);
create policy "anon can read proposals" on proposals for select using (true);
```

- [ ] **Step 2: Write `supabase/migrations/0002_functions.sql`**

```sql
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
```

- [ ] **Step 3: Write `supabase/seed.sql`** (curated catalog: ~20 grocery, ~20 gift, ~20 furniture items)

```sql
insert into catalog_items (category, name, price_cents, image_url, tags) values
  ('grocery', 'Whole Milk (1 gal)', 450, null, array['dairy']),
  ('grocery', 'Oat Milk (1/2 gal)', 550, null, array['dairy-free', 'nut-free']),
  ('grocery', 'Large Eggs (dozen)', 380, null, array['eggs']),
  ('grocery', 'Sourdough Bread', 600, null, array['bakery']),
  ('grocery', 'Peanut Butter (16oz)', 425, null, array['nuts']),
  ('grocery', 'Almond Butter (16oz)', 899, null, array['nuts']),
  ('grocery', 'Spaghetti (1lb)', 199, null, array['pasta']),
  ('grocery', 'Marinara Sauce (24oz)', 349, null, array['pasta']),
  ('grocery', 'Chicken Breast (2lb)', 999, null, array['meat']),
  ('grocery', 'Firm Tofu (14oz)', 299, null, array['vegan', 'dairy-free']),
  ('grocery', 'Baby Spinach (5oz)', 349, null, array['produce']),
  ('grocery', 'Bananas (bunch)', 199, null, array['produce']),
  ('grocery', 'Avocados (bag of 4)', 599, null, array['produce']),
  ('grocery', 'Greek Yogurt (32oz)', 549, null, array['dairy']),
  ('grocery', 'Coconut Yogurt (24oz)', 649, null, array['dairy-free']),
  ('grocery', 'Coffee Beans (12oz)', 1299, null, array['pantry']),
  ('grocery', 'Orange Juice (64oz)', 499, null, array['pantry']),
  ('grocery', 'Paper Towels (6-pack)', 899, null, array['household']),
  ('grocery', 'Dish Soap', 399, null, array['household']),
  ('grocery', 'Trash Bags (30ct)', 799, null, array['household']),
  ('gift', 'Ceramic Vase', 6000, null, array['mid-century', 'home']),
  ('gift', 'Espresso Machine', 24999, null, array['kitchen']),
  ('gift', 'Weighted Blanket', 8900, null, array['comfort']),
  ('gift', 'Cast Iron Skillet Set', 7500, null, array['kitchen']),
  ('gift', 'Indoor Herb Garden Kit', 4500, null, array['kitchen', 'plants']),
  ('gift', 'Bluetooth Speaker', 5900, null, array['electronics']),
  ('gift', 'Scented Candle Set', 3200, null, array['home']),
  ('gift', 'French Press', 2800, null, array['kitchen']),
  ('gift', 'Board Game Bundle', 4200, null, array['games']),
  ('gift', 'Cozy Throw Blanket', 3900, null, array['home']),
  ('gift', 'Wine Decanter Set', 5500, null, array['kitchen']),
  ('gift', 'Wireless Charging Pad', 2900, null, array['electronics']),
  ('gift', 'Succulent Trio', 2500, null, array['plants']),
  ('gift', 'Personalized Doormat', 3300, null, array['home']),
  ('gift', 'Charcuterie Board Set', 4700, null, array['kitchen']),
  ('gift', 'Bath Bomb Gift Set', 2200, null, array['comfort']),
  ('gift', 'Instant Camera', 6900, null, array['electronics']),
  ('gift', 'Leather Journal', 1800, null, array['stationery']),
  ('gift', 'Cocktail Kit', 4400, null, array['kitchen']),
  ('gift', 'Air Plant Terrarium', 3100, null, array['plants']),
  ('furniture', 'Mid-Century Sofa', 89900, null, array['mid-century', 'living-room']),
  ('furniture', 'Boucle Accent Chair', 32900, null, array['modern', 'living-room']),
  ('furniture', 'Oak Coffee Table', 24900, null, array['mid-century', 'living-room']),
  ('furniture', 'Rattan Bookshelf', 18900, null, array['boho', 'storage']),
  ('furniture', 'Platform Bed Frame (Queen)', 39900, null, array['modern', 'bedroom']),
  ('furniture', 'Linen Duvet Cover', 12900, null, array['bedroom']),
  ('furniture', 'Walnut Dining Table', 64900, null, array['mid-century', 'dining']),
  ('furniture', 'Set of 4 Dining Chairs', 45900, null, array['dining']),
  ('furniture', 'Jute Area Rug (8x10)', 27900, null, array['boho', 'living-room']),
  ('furniture', 'Floor Lamp', 9900, null, array['lighting']),
  ('furniture', 'Wall Mirror', 14900, null, array['decor']),
  ('furniture', 'TV Console', 29900, null, array['living-room', 'storage']),
  ('furniture', 'Bar Cart', 21900, null, array['boho', 'living-room']),
  ('furniture', 'Nightstand Pair', 19900, null, array['bedroom']),
  ('furniture', 'Desk Chair', 24900, null, array['office']),
  ('furniture', 'Standing Desk', 44900, null, array['office']),
  ('furniture', 'Storage Ottoman', 8900, null, array['living-room']),
  ('furniture', 'Outdoor Bistro Set', 34900, null, array['outdoor']),
  ('furniture', 'Woven Throw Pillows (set of 2)', 4900, null, array['decor']),
  ('furniture', 'Ceramic Table Lamp', 7900, null, array['lighting']);
```

- [ ] **Step 4: Apply the migrations and seed to a Supabase project**

If you have Supabase MCP tools available in this session, use them: create/select a project, then run each SQL file's contents via the migration-apply tool in order (`0001_init.sql`, `0002_functions.sql`, then `seed.sql`). Otherwise, apply the three files in that order via the Supabase Dashboard SQL editor for your project, or `supabase db push` with the Supabase CLI if the project is linked.
Expected: no SQL errors; `select count(*) from catalog_items;` returns 60.

- [ ] **Step 5: Record the project's URL and keys**

Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from the Supabase project's API settings.
Expected: `.env.local` exists with all three values non-empty (this file is gitignored, never committed).

---

## Task 3: Supabase clients and shared types

**Files:**
- Create: `src/lib/supabase/browserClient.ts`
- Create: `src/lib/supabase/serverClient.ts`
- Create: `src/lib/types.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` env vars from Task 2.
- Produces: `getBrowserClient(): SupabaseClient` (Task 4, 7, 11 use this for reads/realtime); `getServerClient(): SupabaseClient` (every Route Handler in Tasks 6, 7, 8, 9, 10 uses this — it is the only place the service-role key is read); the shared types `Room`, `Participant`, `CatalogItem`, `CartItem`, `Proposal`, `ActionType`, `ProposalPayload` used by every later task.

- [ ] **Step 1: Write `src/lib/types.ts`**

```typescript
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
```

- [ ] **Step 2: Write `src/lib/supabase/browserClient.ts`**

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return cached;
}
```

- [ ] **Step 3: Write `src/lib/supabase/serverClient.ts`**

```typescript
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// This client uses the service-role key and must only ever be imported
// from server-side code (Route Handlers). It is the single boundary through
// which cart_items/participants get mutated, per the plan's Global Constraints.
export function getServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
```

- [ ] **Step 4: Run the test suite to confirm nothing broke**

Run: `npm test`
Expected: 1 passed (still just the sanity test — these files aren't tested directly, they're consumed by later tasks).

---

## Task 4: Session/join flow

**Files:**
- Create: `src/app/api/rooms/[code]/join/route.ts`
- Create: `src/lib/session.ts`
- Modify: `src/app/page.tsx`
- Create: `src/app/room/[code]/page.tsx` (shell only — filled in by Task 12)
- Create: `src/components/JoinForm.tsx`

**Interfaces:**
- Consumes: `getServerClient` (Task 3).
- Produces: `POST /api/rooms/[code]/join` accepting `{ displayName: string }`, creating the room if it doesn't exist (first joiner names it) and always creating a fresh `participants` row, returning `{ ok: true, participant: Participant, room: Room }`; `saveSession(roomCode, sessionToken, participantId)` / `loadSession(roomCode)` in `src/lib/session.ts` (localStorage-backed), used by every later client-side task that needs to know "who am I".

- [ ] **Step 1: Write `src/lib/session.ts`**

```typescript
export interface StoredSession {
  sessionToken: string;
  participantId: string;
  displayName: string;
}

function storageKey(roomCode: string): string {
  return `cartwheel:session:${roomCode}`;
}

export function saveSession(roomCode: string, session: StoredSession): void {
  window.localStorage.setItem(storageKey(roomCode), JSON.stringify(session));
}

export function loadSession(roomCode: string): StoredSession | null {
  const raw = window.localStorage.getItem(storageKey(roomCode));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Write `src/app/api/rooms/[code]/join/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";

export async function POST(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const { displayName } = (await req.json()) as { displayName?: string };
  if (!displayName || !displayName.trim()) {
    return NextResponse.json({ ok: false, reason: "display_name_required" }, { status: 400 });
  }

  const supabase = getServerClient();
  const code = params.code.trim().toUpperCase();

  let { data: room } = await supabase.from("rooms").select("*").eq("code", code).maybeSingle();

  if (!room) {
    const { data: createdRoom, error: createRoomError } = await supabase
      .from("rooms")
      .insert({ code, name: `${displayName}'s room` })
      .select("*")
      .single();
    if (createRoomError) {
      return NextResponse.json({ ok: false, reason: "room_create_failed" }, { status: 500 });
    }
    room = createdRoom;
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({ room_id: room.id, display_name: displayName.trim() })
    .select("*")
    .single();

  if (participantError) {
    return NextResponse.json({ ok: false, reason: "participant_create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, room, participant });
}
```

- [ ] **Step 3: Write `src/components/JoinForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/lib/session";

export function JoinForm() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const code = roomCode.trim().toUpperCase();
    if (!code || !displayName.trim()) {
      setError("Enter a room code and your name.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/rooms/${code}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: displayName.trim() }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!json.ok) {
      setError(json.reason ?? "join_failed");
      return;
    }
    saveSession(code, {
      sessionToken: json.participant.session_token,
      participantId: json.participant.id,
      displayName: json.participant.display_name,
    });
    router.push(`/room/${code}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="roomCode">
          Room code
        </label>
        <input
          id="roomCode"
          className="w-full rounded border border-slate-300 px-3 py-2 uppercase"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          placeholder="PANTRY42"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="displayName">
          Your name
        </label>
        <input
          id="displayName"
          className="w-full rounded border border-slate-300 px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Alex"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
      >
        {submitting ? "Joining…" : "Join room"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Replace `src/app/page.tsx` with the real landing page**

```tsx
import { JoinForm } from "@/components/JoinForm";

export default function HomePage() {
  return (
    <main className="p-8 flex flex-col gap-6 items-start">
      <div>
        <h1 className="text-3xl font-semibold">Cartwheel</h1>
        <p className="text-slate-600 mt-1">
          One shared cart. Every action is a tool your agent can call.
        </p>
      </div>
      <JoinForm />
    </main>
  );
}
```

- [ ] **Step 5: Create the room page shell at `src/app/room/[code]/page.tsx`**

```tsx
export default function RoomPage({ params }: { params: { code: string } }) {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Room {params.code.toUpperCase()}</h1>
      <p className="text-slate-600">Cart board coming in Task 12.</p>
    </main>
  );
}
```

- [ ] **Step 6: Manual verification**

Run: `npm run dev`, open `http://localhost:3000`, submit the join form with a fresh room code and a name.
Expected: redirected to `/room/<CODE>` showing the placeholder heading; a new row exists in both `rooms` and `participants` in Supabase (check via the Supabase table editor or a `select` in the SQL editor).

---

## Task 5: `resolveAffectedParticipant` — the core conflict-resolution logic

**Files:**
- Create: `src/lib/proposals/resolveAffectedParticipant.ts`
- Test: `src/lib/proposals/__tests__/resolveAffectedParticipant.test.ts`

**Interfaces:**
- Consumes: `ActionType`, `ProposalPayload`, `CartItem`, `Participant`, `CatalogItem` types (Task 3).
- Produces: `resolveAffectedParticipant(input: ResolveInput): string | null`, where `ResolveInput = { actionType: ActionType; payload: Record<string, unknown>; proposerId: string; participants: Pick<Participant, "id" | "budget_cap_cents">[]; cartItems: Pick<CartItem, "id" | "catalog_item_id" | "claimed_by" | "paid_by" | "status">[]; catalogItems: Pick<CatalogItem, "id" | "price_cents">[] }`. This exact function name and signature is called directly by Task 8's `propose_change` Route Handler.

- [ ] **Step 1: Write the failing tests**

```typescript
// src/lib/proposals/__tests__/resolveAffectedParticipant.test.ts
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/lib/proposals/__tests__/resolveAffectedParticipant.test.ts`
Expected: FAIL — `Cannot find module '../resolveAffectedParticipant'`.

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/proposals/resolveAffectedParticipant.ts
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/lib/proposals/__tests__/resolveAffectedParticipant.test.ts`
Expected: 7 passed.

---

## Task 6: `search_catalog` tool — Route Handler and JSON Schema

**Files:**
- Create: `src/app/api/rooms/[code]/tools/search-catalog/route.ts`
- Create: `src/lib/webmcp/toolSchemas.ts`
- Create: `src/lib/session-server.ts`

**Interfaces:**
- Consumes: `getServerClient` (Task 3), `CatalogItem` type (Task 3).
- Produces: `POST /api/rooms/[code]/tools/search-catalog` accepting `{ query?: string; category?: Category }`, returning `{ ok: true, items: CatalogItem[] }`; `requireParticipant(req, roomCode)` in `src/lib/session-server.ts`, reused by every Route Handler in Tasks 7-10; `searchCatalogSchema` exported from `toolSchemas.ts`, consumed by Task 11's tool registration.

- [ ] **Step 1: Write `src/lib/session-server.ts`**

```typescript
import { NextRequest } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import type { Participant, Room } from "@/lib/types";

export interface AuthedContext {
  participant: Participant;
  room: Room;
}

/**
 * Resolves the calling participant from the `x-session-token` header,
 * scoped to the room in the URL. Never trusts a client-supplied
 * participant id — this is the server-side identity boundary described in
 * the plan's Global Constraints.
 */
export async function requireParticipant(
  req: NextRequest,
  roomCode: string
): Promise<AuthedContext | { ok: false; reason: string }> {
  const sessionToken = req.headers.get("x-session-token");
  if (!sessionToken) {
    return { ok: false, reason: "missing_session_token" };
  }

  const supabase = getServerClient();
  const { data: room } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", roomCode.toUpperCase())
    .maybeSingle();
  if (!room) {
    return { ok: false, reason: "room_not_found" };
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("*")
    .eq("session_token", sessionToken)
    .eq("room_id", room.id)
    .maybeSingle();
  if (!participant) {
    return { ok: false, reason: "not_authorized" };
  }

  return { participant, room };
}
```

- [ ] **Step 2: Write `src/lib/webmcp/toolSchemas.ts`** (schema for `search_catalog` only in this task — the other five are added in Tasks 7-10)

```typescript
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
```

- [ ] **Step 3: Write `src/app/api/rooms/[code]/tools/search-catalog/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }

  const { query, category } = (await req.json()) as { query?: string; category?: string };
  const supabase = getServerClient();
  let builder = supabase.from("catalog_items").select("*");
  if (category) builder = builder.eq("category", category);
  if (query && query.trim()) {
    builder = builder.or(`name.ilike.%${query.trim()}%,tags.cs.{${query.trim()}}`);
  }

  const { data: items, error } = await builder.limit(20);
  if (error) {
    return NextResponse.json({ ok: false, reason: "search_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, items });
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, then from a second terminal:
`curl -X POST http://localhost:3000/api/rooms/PANTRY42/tools/search-catalog -H "Content-Type: application/json" -H "x-session-token: <a real token from Task 4's manual test>" -d "{\"category\":\"grocery\"}"`
Expected: `{"ok":true,"items":[... 20 grocery items ...]}`.

---

## Task 7: `get_room_state` tool and live room state hook

**Files:**
- Create: `src/app/api/rooms/[code]/tools/get-room-state/route.ts`
- Modify: `src/lib/webmcp/toolSchemas.ts`
- Create: `src/hooks/useRoomRealtime.ts`

**Interfaces:**
- Consumes: `RoomStateSnapshot` type (Task 3), `requireParticipant` (Task 6).
- Produces: `POST /api/rooms/[code]/tools/get-room-state` returning `{ ok: true, state: RoomStateSnapshot }`; `getRoomStateSchema` (consumed by Task 11); `useRoomRealtime(roomCode: string): { state: RoomStateSnapshot | null; refetch: () => Promise<void> }` React hook, consumed by Task 12's room page.

- [ ] **Step 1: Add `getRoomStateSchema` to `src/lib/webmcp/toolSchemas.ts`**

```typescript
export const getRoomStateSchema = {
  type: "object",
  properties: {},
} as const;
```

- [ ] **Step 2: Write `src/app/api/rooms/[code]/tools/get-room-state/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";
import type { RoomStateSnapshot } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room } = auth;
  const supabase = getServerClient();

  const [{ data: participants }, { data: cartItemsRaw }, { data: catalogItems }, { data: proposals }] =
    await Promise.all([
      supabase.from("participants").select("*").eq("room_id", room.id),
      supabase
        .from("cart_items")
        .select("*, catalogItem:catalog_items(*)")
        .eq("room_id", room.id)
        .eq("status", "active"),
      supabase.from("catalog_items").select("*"),
      supabase
        .from("proposals")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const state: RoomStateSnapshot = {
    room,
    participants: participants ?? [],
    cartItems: (cartItemsRaw ?? []) as RoomStateSnapshot["cartItems"],
    catalogItems: catalogItems ?? [],
    proposals: proposals ?? [],
  };

  return NextResponse.json({ ok: true, state });
}
```

- [ ] **Step 3: Write `src/hooks/useRoomRealtime.ts`**

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/browserClient";
import { loadSession } from "@/lib/session";
import type { RoomStateSnapshot } from "@/lib/types";

export function useRoomRealtime(roomCode: string) {
  const [state, setState] = useState<RoomStateSnapshot | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    const session = loadSession(roomCode);
    if (!session) return;
    const res = await fetch(`/api/rooms/${roomCode}/tools/get-room-state`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-token": session.sessionToken },
      body: "{}",
    });
    const json = await res.json();
    if (json.ok) setState(json.state);
  }, [roomCode]);

  useEffect(() => {
    refetch();

    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`room:${roomCode}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, refetch)
      .on("postgres_changes", { event: "*", schema: "public", table: "participants" }, refetch)
      .subscribe();

    // Fallback poll in case the realtime channel drops, per spec §6.
    pollRef.current = setInterval(refetch, 5000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [roomCode, refetch]);

  return { state, refetch };
}
```

- [ ] **Step 4: Run the test suite to confirm no regressions**

Run: `npm test`
Expected: 8 passed (sanity + 7 resolver tests).

---

## Task 8: `propose_change` tool

**Files:**
- Create: `src/lib/proposals/proposeChange.ts`
- Create: `src/app/api/rooms/[code]/tools/propose-change/route.ts`
- Modify: `src/lib/webmcp/toolSchemas.ts`

**Interfaces:**
- Consumes: `requireParticipant` (Task 6), `resolveAffectedParticipant` (Task 5), `getServerClient` (Task 3).
- Produces: `proposeChange(input: { supabase: SupabaseClient; roomId: string; proposerId: string; actionType: ActionType; payload: Record<string, unknown> }): Promise<{ ok: true; proposal: Proposal } | { ok: false; reason: string }>` — consumed directly by Task 10's `mark_paid` route to avoid duplicating this logic; `POST /api/rooms/[code]/tools/propose-change` accepting `{ action_type: ActionType; payload: Record<string, unknown> }`; `proposeChangeSchema` (consumed by Task 11).

- [ ] **Step 1: Write `src/lib/proposals/proposeChange.ts`**

```typescript
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
```

- [ ] **Step 2: Add `proposeChangeSchema` to `src/lib/webmcp/toolSchemas.ts`**

```typescript
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
```

- [ ] **Step 3: Write `src/app/api/rooms/[code]/tools/propose-change/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";
import { proposeChange } from "@/lib/proposals/proposeChange";
import type { ActionType } from "@/lib/types";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room, participant } = auth;

  const { action_type, payload } = (await req.json()) as {
    action_type?: ActionType;
    payload?: Record<string, unknown>;
  };
  if (!action_type || !payload) {
    return NextResponse.json({ ok: false, reason: "action_type_and_payload_required" }, { status: 400 });
  }

  const result = await proposeChange({
    supabase: getServerClient(),
    roomId: room.id,
    proposerId: participant.id,
    actionType: action_type,
    payload,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, then `curl -X POST http://localhost:3000/api/rooms/PANTRY42/tools/propose-change -H "Content-Type: application/json" -H "x-session-token: <token>" -d "{\"action_type\":\"add_item\",\"payload\":{\"catalog_item_id\":\"<a real catalog_items.id>\",\"claim\":true}}"`
Expected: `{"ok":true,"proposal":{"status":"auto_approved", ...}}`, and a new row appears in `cart_items`.

---

## Task 9: `list_pending_proposals` and `respond_to_proposal` tools

**Files:**
- Create: `src/app/api/rooms/[code]/tools/list-pending-proposals/route.ts`
- Create: `src/app/api/rooms/[code]/tools/respond-to-proposal/route.ts`
- Modify: `src/lib/webmcp/toolSchemas.ts`

**Interfaces:**
- Consumes: `requireParticipant` (Task 6), `getServerClient` (Task 3).
- Produces: `POST /api/rooms/[code]/tools/list-pending-proposals` accepting `{ scope: "needs_my_approval" | "mine" | "all" }` → `{ ok: true, proposals: Proposal[] }`; `POST /api/rooms/[code]/tools/respond-to-proposal` accepting `{ proposal_id, decision, note? }` → `{ ok: true, proposal: Proposal } | { ok: false, reason }`; `listPendingProposalsSchema`, `respondToProposalSchema` (consumed by Task 11).

- [ ] **Step 1: Add both schemas to `src/lib/webmcp/toolSchemas.ts`**

```typescript
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
```

- [ ] **Step 2: Write `src/app/api/rooms/[code]/tools/list-pending-proposals/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room, participant } = auth;

  const { scope } = (await req.json()) as { scope?: "needs_my_approval" | "mine" | "all" };
  const supabase = getServerClient();
  let builder = supabase.from("proposals").select("*").eq("room_id", room.id);

  if (scope === "needs_my_approval") {
    builder = builder.eq("affected_participant_id", participant.id).eq("status", "pending");
  } else if (scope === "mine") {
    builder = builder.eq("proposer_id", participant.id);
  }

  const { data: proposals, error } = await builder.order("created_at", { ascending: false });
  if (error) {
    return NextResponse.json({ ok: false, reason: "list_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, proposals });
}
```

- [ ] **Step 3: Write `src/app/api/rooms/[code]/tools/respond-to-proposal/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { participant } = auth;

  const { proposal_id, decision, note } = (await req.json()) as {
    proposal_id?: string;
    decision?: "approve" | "reject";
    note?: string;
  };
  if (!proposal_id || !decision) {
    return NextResponse.json({ ok: false, reason: "proposal_id_and_decision_required" }, { status: 400 });
  }

  const supabase = getServerClient();
  const { data: proposal, error } = await supabase
    .rpc("resolve_proposal", {
      p_proposal_id: proposal_id,
      p_responder_id: participant.id,
      p_decision: decision,
      p_note: note ?? null,
    })
    .single();

  if (error) {
    const reason = error.message.includes("not_authorized")
      ? "not_authorized"
      : error.message.includes("already_resolved")
        ? "already_resolved"
        : "respond_failed";
    return NextResponse.json({ ok: false, reason }, { status: reason === "not_authorized" ? 403 : 400 });
  }

  return NextResponse.json({ ok: true, proposal });
}
```

- [ ] **Step 4: Manual verification**

Using the pending proposal created by having Sam try to `claim:true` an item Alex already claimed (Task 8's flow, run twice with two different participants): call `respond-to-proposal` as Alex with `{"proposal_id": "<id>", "decision": "approve"}`.
Expected: `{"ok":true,"proposal":{"status":"approved", "resolved_at": "..."}}`.

---

## Task 10: `mark_paid` tool

**Files:**
- Create: `src/app/api/rooms/[code]/tools/mark-paid/route.ts`
- Modify: `src/lib/webmcp/toolSchemas.ts`

**Interfaces:**
- Consumes: `proposeChange` (Task 8), `requireParticipant` (Task 6).
- Produces: `POST /api/rooms/[code]/tools/mark-paid` accepting `{ cart_item_id: string }`; `markPaidSchema` (consumed by Task 11).

- [ ] **Step 1: Add `markPaidSchema` to `src/lib/webmcp/toolSchemas.ts`**

```typescript
export const markPaidSchema = {
  type: "object",
  properties: {
    cart_item_id: { type: "string", description: "The cart item you're marking your share of as paid" },
  },
  required: ["cart_item_id"],
} as const;
```

- [ ] **Step 2: Write `src/app/api/rooms/[code]/tools/mark-paid/route.ts`**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/serverClient";
import { requireParticipant } from "@/lib/session-server";
import { proposeChange } from "@/lib/proposals/proposeChange";

export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  const auth = await requireParticipant(req, params.code);
  if ("reason" in auth) {
    return NextResponse.json({ ok: false, reason: auth.reason }, { status: 401 });
  }
  const { room, participant } = auth;

  const { cart_item_id } = (await req.json()) as { cart_item_id?: string };
  if (!cart_item_id) {
    return NextResponse.json({ ok: false, reason: "cart_item_id_required" }, { status: 400 });
  }

  const result = await proposeChange({
    supabase: getServerClient(),
    roomId: room.id,
    proposerId: participant.id,
    actionType: "mark_paid",
    payload: { cart_item_id },
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
```

- [ ] **Step 3: Manual verification**

`curl -X POST .../tools/mark-paid -H "x-session-token: <token>" -d "{\"cart_item_id\":\"<id>\"}"`
Expected: `{"ok":true,"proposal":{"status":"auto_approved",...}}` and that cart item's `paid_by` now includes the caller.

---

## Task 11: WebMCP tool registration

**Files:**
- Create: `src/lib/webmcp/registerCartwheelTools.ts`
- Create: `src/hooks/useRegisterWebMCPTools.ts`

**Interfaces:**
- Consumes: all six schemas from `src/lib/webmcp/toolSchemas.ts` (Tasks 6-10), `loadSession` (Task 4).
- Produces: `registerCartwheelTools(roomCode: string, sessionToken: string): Promise<() => void>` (returns an unregister function); `useRegisterWebMCPTools(roomCode: string)` React hook, consumed by Task 12's room page — this is the task that actually calls `document.modelContext.registerTool`.

- [ ] **Step 1: Write `src/lib/webmcp/registerCartwheelTools.ts`**

```typescript
import {
  getRoomStateSchema,
  listPendingProposalsSchema,
  markPaidSchema,
  proposeChangeSchema,
  respondToProposalSchema,
  searchCatalogSchema,
} from "./toolSchemas";

declare global {
  interface Document {
    modelContext?: {
      registerTool: (
        tool: {
          name: string;
          title?: string;
          description: string;
          inputSchema?: object;
          execute: (input: Record<string, unknown>, options?: { signal?: AbortSignal }) => Promise<unknown>;
          annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
        },
        options?: { exposedTo?: string[]; signal?: AbortSignal }
      ) => Promise<void>;
    };
  }
}

async function callTool(
  roomCode: string,
  sessionToken: string,
  toolPath: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const res = await fetch(`/api/rooms/${roomCode}/tools/${toolPath}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-session-token": sessionToken },
    body: JSON.stringify(body),
  });
  return res.json();
}

/**
 * Registers all six Cartwheel WebMCP tools on the current page, per the
 * confirmed spec API: document.modelContext.registerTool(tool, options).
 * Returns an unregister function (aborts the shared AbortController).
 */
export async function registerCartwheelTools(
  roomCode: string,
  sessionToken: string
): Promise<() => void> {
  const controller = new AbortController();

  if (!document.modelContext) {
    console.warn("document.modelContext is not available in this browser — WebMCP tools not registered.");
    return () => {};
  }

  const mc = document.modelContext;
  const signal = controller.signal;

  await mc.registerTool(
    {
      name: "search_catalog",
      description: "Search the shared cart's product catalog by free-text query and/or category.",
      inputSchema: searchCatalogSchema,
      annotations: { readOnlyHint: true },
      execute: (input) => callTool(roomCode, sessionToken, "search-catalog", input),
    },
    { signal }
  );

  await mc.registerTool(
    {
      name: "get_room_state",
      description:
        "Get the full current state of the shared cart room: items, who claimed/paid for what, " +
        "participants and their budgets, and pending proposals. Call this first to see what's going on.",
      inputSchema: getRoomStateSchema,
      annotations: { readOnlyHint: true },
      execute: () => callTool(roomCode, sessionToken, "get-room-state", {}),
    },
    { signal }
  );

  await mc.registerTool(
    {
      name: "propose_change",
      description:
        "Propose adding, removing, claiming, or swapping a cart item, or changing your own budget or " +
        "preferences. Actions that only affect you resolve instantly. Actions that touch another " +
        "participant's claim, budget, or payment become a pending proposal that participant must approve " +
        "— check the returned proposal's status field.",
      inputSchema: proposeChangeSchema,
      execute: (input) => callTool(roomCode, sessionToken, "propose-change", input),
    },
    { signal }
  );

  await mc.registerTool(
    {
      name: "list_pending_proposals",
      description: "List proposals in this room, optionally filtered to ones awaiting your approval.",
      inputSchema: listPendingProposalsSchema,
      annotations: { readOnlyHint: true },
      execute: (input) => callTool(roomCode, sessionToken, "list-pending-proposals", input),
    },
    { signal }
  );

  await mc.registerTool(
    {
      name: "respond_to_proposal",
      description:
        "Approve or reject a proposal that is awaiting your approval. Before calling this with " +
        "decision: 'approve' on anything nontrivial (money, someone else's claim), confirm with your human " +
        "first — this is the point where their decision actually matters.",
      inputSchema: respondToProposalSchema,
      execute: (input) => callTool(roomCode, sessionToken, "respond-to-proposal", input),
    },
    { signal }
  );

  await mc.registerTool(
    {
      name: "mark_paid",
      description: "Mark your own share of a cart item as paid. Always resolves instantly.",
      inputSchema: markPaidSchema,
      execute: (input) => callTool(roomCode, sessionToken, "mark-paid", input),
    },
    { signal }
  );

  return () => controller.abort();
}
```

- [ ] **Step 2: Write `src/hooks/useRegisterWebMCPTools.ts`**

```typescript
"use client";

import { useEffect } from "react";
import { loadSession } from "@/lib/session";
import { registerCartwheelTools } from "@/lib/webmcp/registerCartwheelTools";

export function useRegisterWebMCPTools(roomCode: string) {
  useEffect(() => {
    const session = loadSession(roomCode);
    if (!session) return;

    let unregister: (() => void) | undefined;
    let cancelled = false;

    registerCartwheelTools(roomCode, session.sessionToken).then((fn) => {
      if (cancelled) fn();
      else unregister = fn;
    });

    return () => {
      cancelled = true;
      unregister?.();
    };
  }, [roomCode]);
}
```

- [ ] **Step 3: Run the full test suite to confirm no regressions**

Run: `npm test`
Expected: 8 passed.

---

## Task 12: Cart UI — board, proposal inbox, activity log

**Files:**
- Create: `src/components/BudgetBar.tsx`
- Create: `src/components/CartItemCard.tsx`
- Create: `src/components/CartBoard.tsx`
- Create: `src/components/ProposalCard.tsx`
- Create: `src/components/ProposalInbox.tsx`
- Create: `src/components/ActivityLog.tsx`
- Modify: `src/app/room/[code]/page.tsx`

**Interfaces:**
- Consumes: `useRoomRealtime` (Task 7), `useRegisterWebMCPTools` (Task 11), `loadSession` (Task 4), `RoomStateSnapshot` type (Task 3).
- Produces: the complete room page — no later task consumes anything from this one.

- [ ] **Step 1: Write `src/components/BudgetBar.tsx`**

```tsx
export function BudgetBar({
  label,
  capCents,
}: {
  label: string;
  capCents: number | null;
}) {
  return (
    <div className="text-sm text-slate-600">
      <span className="font-medium">{label}</span>{" "}
      {capCents === null ? (
        <span className="text-slate-400">no budget cap set</span>
      ) : (
        <span>cap ${(capCents / 100).toFixed(2)}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/components/CartItemCard.tsx`**

```tsx
import type { CartItem, CatalogItem, Participant } from "@/lib/types";

export function CartItemCard({
  cartItem,
  participants,
}: {
  cartItem: CartItem & { catalogItem: CatalogItem };
  participants: Participant[];
}) {
  const claimant = participants.find((p) => p.id === cartItem.claimed_by);
  return (
    <div className="rounded border border-slate-200 bg-white p-3 flex flex-col gap-1">
      <div className="flex justify-between">
        <span className="font-medium">{cartItem.catalogItem.name}</span>
        <span className="text-slate-600">${(cartItem.catalogItem.price_cents / 100).toFixed(2)}</span>
      </div>
      <div className="text-xs text-slate-500">
        {claimant ? `claimed by ${claimant.display_name}` : "unclaimed (pooled)"}
        {cartItem.paid_by.length > 0 && ` · paid by ${cartItem.paid_by.length}`}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write `src/components/CartBoard.tsx`**

```tsx
import type { RoomStateSnapshot } from "@/lib/types";
import { CartItemCard } from "./CartItemCard";
import { BudgetBar } from "./BudgetBar";

const CATEGORY_LABELS: Record<string, string> = {
  grocery: "Groceries",
  gift: "Gift",
  furniture: "Furniture",
};

export function CartBoard({ state }: { state: RoomStateSnapshot }) {
  const categories = ["grocery", "gift", "furniture"] as const;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-6">
        {state.participants.map((p) => (
          <BudgetBar key={p.id} label={p.display_name} capCents={p.budget_cap_cents} />
        ))}
      </div>
      {categories.map((category) => {
        const items = state.cartItems.filter((c) => c.catalogItem.category === category);
        return (
          <div key={category}>
            <h2 className="text-lg font-semibold mb-2">{CATEGORY_LABELS[category]}</h2>
            {items.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing here yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item) => (
                  <CartItemCard key={item.id} cartItem={item} participants={state.participants} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Write `src/components/ProposalCard.tsx`**

```tsx
"use client";

import { useState } from "react";
import type { Proposal } from "@/lib/types";

export function ProposalCard({
  proposal,
  onRespond,
}: {
  proposal: Proposal;
  onRespond: (decision: "approve" | "reject", note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function respond(decision: "approve" | "reject") {
    setSubmitting(true);
    await onRespond(decision, note);
    setSubmitting(false);
  }

  return (
    <div className="rounded border border-amber-300 bg-amber-50 p-3 flex flex-col gap-2">
      <div className="text-sm">
        <span className="font-medium">{proposal.action_type}</span>{" "}
        <span className="text-slate-600">wants your approval</span>
      </div>
      <input
        className="rounded border border-slate-300 px-2 py-1 text-sm"
        placeholder="Optional note (e.g. why you're rejecting)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          disabled={submitting}
          onClick={() => respond("approve")}
          className="rounded bg-emerald-600 text-white px-3 py-1 text-sm disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={submitting}
          onClick={() => respond("reject")}
          className="rounded bg-red-600 text-white px-3 py-1 text-sm disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Write `src/components/ProposalInbox.tsx`**

```tsx
"use client";

import type { Proposal } from "@/lib/types";
import { ProposalCard } from "./ProposalCard";
import { loadSession } from "@/lib/session";

export function ProposalInbox({
  roomCode,
  myParticipantId,
  proposals,
  onResolved,
}: {
  roomCode: string;
  myParticipantId: string;
  proposals: Proposal[];
  onResolved: () => void;
}) {
  const pending = proposals.filter(
    (p) => p.status === "pending" && p.affected_participant_id === myParticipantId
  );

  async function respond(proposalId: string, decision: "approve" | "reject", note: string) {
    const session = loadSession(roomCode);
    if (!session) return;
    await fetch(`/api/rooms/${roomCode}/tools/respond-to-proposal`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-session-token": session.sessionToken },
      body: JSON.stringify({ proposal_id: proposalId, decision, note: note || undefined }),
    });
    onResolved();
  }

  if (pending.length === 0) {
    return <p className="text-sm text-slate-400">Nothing waiting on your approval.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {pending.map((p) => (
        <ProposalCard key={p.id} proposal={p} onRespond={(decision, note) => respond(p.id, decision, note)} />
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Write `src/components/ActivityLog.tsx`**

```tsx
import type { Participant, Proposal } from "@/lib/types";

export function ActivityLog({
  proposals,
  participants,
}: {
  proposals: Proposal[];
  participants: Participant[];
}) {
  function nameOf(id: string): string {
    return participants.find((p) => p.id === id)?.display_name ?? "someone";
  }

  return (
    <ul className="flex flex-col gap-1 text-sm">
      {proposals.map((p) => (
        <li key={p.id} className="text-slate-600">
          <span className="font-medium">{nameOf(p.proposer_id)}</span> {p.action_type} —{" "}
          <span
            className={
              p.status === "rejected"
                ? "text-red-600"
                : p.status === "pending"
                  ? "text-amber-600"
                  : "text-emerald-600"
            }
          >
            {p.status}
          </span>
          {p.resolution_note && <span className="text-slate-400"> ({p.resolution_note})</span>}
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 7: Replace `src/app/room/[code]/page.tsx` with the full room page**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useRegisterWebMCPTools } from "@/hooks/useRegisterWebMCPTools";
import { loadSession } from "@/lib/session";
import { CartBoard } from "@/components/CartBoard";
import { ProposalInbox } from "@/components/ProposalInbox";
import { ActivityLog } from "@/components/ActivityLog";

export default function RoomPage({ params }: { params: { code: string } }) {
  const roomCode = params.code.toUpperCase();
  const { state, refetch } = useRoomRealtime(roomCode);
  useRegisterWebMCPTools(roomCode);
  const [participantId, setParticipantId] = useState<string | null>(null);

  useEffect(() => {
    const session = loadSession(roomCode);
    setParticipantId(session?.participantId ?? null);
  }, [roomCode]);

  if (!state || !participantId) {
    return <main className="p-8">Loading room {roomCode}…</main>;
  }

  return (
    <main className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-semibold mb-4">Room {roomCode}</h1>
        <CartBoard state={state} />
      </div>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Needs your approval</h2>
          <ProposalInbox
            roomCode={roomCode}
            myParticipantId={participantId}
            proposals={state.proposals}
            onResolved={refetch}
          />
        </div>
        <div>
          <h2 className="text-lg font-semibold mb-2">Activity</h2>
          <ActivityLog proposals={state.proposals} participants={state.participants} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 8: Manual verification**

Open two browser windows (or a normal + incognito window), join the same room code as two different names, add an item as "claim" in window 1, then try to claim the same item as window 2.
Expected: window 1's proposal inbox shows a pending approval within ~5s (realtime or the polling fallback); approving it there removes it from the inbox and the activity log updates in both windows.

---

## Task 13: Deploy to Vercel and finish the README

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: everything from Tasks 1-12.
- Produces: a live public URL and a complete README for judges.

- [ ] **Step 1: Deploy the project to Vercel**

If Vercel MCP tools are available in this session, use them to create/link the project and deploy from this directory. Otherwise: `npx vercel` from the project root, following the prompts to link/create the project, then `npx vercel --prod` once ready.
Expected: a `https://<project>.vercel.app` URL is returned.

- [ ] **Step 2: Set the three Supabase env vars on the Vercel project**

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for the Production environment (via the Vercel dashboard, `npx vercel env add <NAME>`, or the Vercel MCP tools if available), then redeploy.
Expected: visiting the live URL and joining a room actually persists to the real Supabase project (verify via the Supabase table editor).

- [ ] **Step 3: Finish `README.md`** — append these sections to the skeleton from Task 1

```markdown
## Architecture

See [docs/superpowers/specs/2026-08-28-cartwheel-webmcp-design.md](docs/superpowers/specs/2026-08-28-cartwheel-webmcp-design.md)
for the full design. In short: Next.js Route Handlers under
`src/app/api/rooms/[code]/tools/*` are the server-side boundary holding the
Supabase service-role key; three Postgres RPC functions
(`create_proposal`, `apply_proposal`, `resolve_proposal`) are the only code
path that mutates cart state; Supabase Realtime plus a 5s polling fallback
keep every browser tab in sync; `src/lib/webmcp/registerCartwheelTools.ts`
registers six tools via `document.modelContext.registerTool`.

## WebMCP tools exposed

| Tool | Purpose |
| --- | --- |
| `search_catalog` | Search the product catalog |
| `get_room_state` | See the full shared cart, budgets, and pending approvals |
| `propose_change` | Add/remove/claim/swap an item, or change your own budget/preferences |
| `list_pending_proposals` | Check what's waiting on your approval |
| `respond_to_proposal` | Approve or reject a pending proposal |
| `mark_paid` | Mark your share of an item as paid |

## Manual two-tab smoke test

1. Open the live URL in two browser windows.
2. Join the same room code as two different names (e.g. Alex and Sam).
3. In Alex's agent (ChatGPT in-app browser, or Chrome with
   `chrome://flags/#enable-webmcp-testing`), ask it to add milk and eggs,
   claiming both. Confirm they appear in Sam's window within a few seconds.
4. In Sam's agent, ask it to add and claim milk too. Confirm Sam's agent
   reports the action is pending Alex's approval, and Alex's proposal inbox
   lights up live.
5. Approve it as Alex (via the UI or by asking Alex's agent to check
   `list_pending_proposals` and approve). Confirm it clears in both windows.
6. In Alex's agent, set a $50 budget cap. In Sam's agent, try to add the $60
   Ceramic Vase (unclaimed/pooled). Confirm it blocks pending Alex's
   approval, and that rejecting it (with a note) is visible to Sam's agent
   on its next `get_room_state` or `list_pending_proposals` call.

## License

MIT — see [LICENSE](LICENSE).
```

- [ ] **Step 4: Final full verification**

Run: `npm test` (all unit tests), then walk the manual two-tab smoke test above against the **live Vercel URL** (not localhost) using two real browser windows.
Expected: all unit tests pass; every step of the smoke test succeeds against the deployed app.
