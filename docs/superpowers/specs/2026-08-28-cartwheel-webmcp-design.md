# Cartwheel — WebMCP Challenge Design

**Date:** 2026-08-28
**Status:** Approved for implementation planning
**Event:** WebMCP Challenge (Devpost) — top 10 submissions receive prizes

## 1. Problem & pitch

The WebMCP Challenge asks for an app that becomes *meaningfully better* when
people and their agents use it together — not a chatbot bolted onto a normal
UI, but a page that exposes structured tools an agent can call directly
instead of scraping the DOM.

Plain "agentic shopping" (search → cart → checkout) is the obvious entry
every team will submit. **Cartwheel** differentiates by making the
*multiplayer* case the point: a household/group shares one cart across
groceries, a pooled gift, and shared furniture, each person driving their own
side from their own agent, in real time, with a genuine human-in-the-loop
approval checkpoint whenever one person's action touches another person's
stake. That's the thing that's "difficult or impossible" without WebMCP: an
agent can't safely act in a shared, contested space without a structured way
to (a) see the current shared state, (b) know when an action needs someone
else's sign-off, and (c) get a clear yes/no back — not by scraping a live DOM
that's changing under it from another tab.

## 2. Scenario & scope

One unified app, not three separate demos. A "room" (household/group) shares
one cart spanning three catalog categories that map to the three requested
scenarios:

- **Grocery** — roommates running a household, dietary tags, duplicate-buy
  detection.
- **Gift** — pooled contribution toward one item, "mark my share paid"
  tracking.
- **Furniture** — shared big-ticket items, budget-cap conflicts, style tags.

Non-goals (explicitly out of scope for the hackathon window): real
payments/checkout, real authentication (room-code + display-name only),
production-grade security hardening beyond the server-side tool boundary,
mobile-native apps, more than ~3 simultaneous participants per room, catalog
beyond a curated ~60-item seed set.

## 3. Core mechanic: propose → auto-resolve or approve

Every mutation — add item, claim item, remove item, set budget, set
preference tags, mark paid, swap item — goes through a **proposal**, never a
direct write.

- If a proposal only touches the proposer's own stake (their own claim,
  their own budget, their own paid-status), it **auto-resolves instantly**
  but is still recorded as a proposal, so the activity log is a complete,
  honest audit trail of "what happened and why," not just of the contested
  cases.
- If a proposal touches someone else's claim, budget cap, or payment status,
  it **blocks** as `pending` until that `affected_participant`'s agent (or
  the person themselves, directly in the UI) approves or rejects it.

This is the feature the whole app is built to demonstrate: two agents,
working for two different humans, coordinating through tool calls with a
real approval checkpoint at the trust boundary between people — not
decorative, not simulated; rejecting a proposal must visibly change what the
rejected agent does next.

## 4. Data model (Supabase / Postgres)

```
rooms
  id, code (short human-friendly join code), name, created_at

participants
  id, room_id, display_name, dietary_tags[], style_tags[],
  budget_cap (nullable personal spending ceiling), session_token

catalog_items            -- seeded once, read-only in the demo
  id, category ('grocery' | 'gift' | 'furniture'), name, price_cents,
  image_url, tags[]

cart_items
  id, room_id, catalog_item_id, claimed_by (participant id, nullable),
  qty, paid_by[] (participant ids), status ('active' | 'removed')

proposals
  id, room_id, proposer_id,
  action_type ('add_item' | 'remove_item' | 'claim_item' | 'set_budget' |
               'set_preferences' | 'mark_paid' | 'swap_item'),
  payload (jsonb), affected_participant_id (nullable — null = self-scoped),
  status ('auto_approved' | 'pending' | 'approved' | 'rejected'),
  resolution_note, created_at, resolved_at
```

A single Postgres function, `apply_proposal(proposal_id)`, is the **only**
code path that mutates `cart_items` / `participants`. It runs automatically
on insert when a proposal is self-scoped, and is invoked by
`respond_to_proposal` when a human/agent approves one. This keeps "what
actually happened" consistent regardless of whether the triggering call came
from the UI or an agent tool call, and it's what Supabase Realtime broadcasts
off of.

## 5. WebMCP tool surface

Registered via `document.modelContext.registerTool`. Every tool's `execute()`
calls a Supabase Edge Function (server-side) rather than touching tables
directly from the browser, so approval logic can't be bypassed by a crafted
client-side call. The current participant is resolved server-side from their
session — never taken as a trusted tool input.

1. **`search_catalog`** — `{ query?, category? }` → matching items
   (id/name/price/tags). Read-only.
2. **`get_room_state`** — `{ }` → full snapshot: cart items (claimant + paid
   status), participants (budgets/tags), pending proposals, recent activity.
   The tool an agent calls first to see the shared world.
3. **`propose_change`** — `{ action_type, payload }` → creates a proposal;
   server computes `affected_participant_id` (e.g. removing someone else's
   claimed item → that claimant; an add that would push spend over another
   participant's budget cap → that participant) and runs `apply_proposal`
   immediately if self-scoped. Returns the resulting proposal, including its
   `status`, so the calling agent knows immediately whether it went through
   or is now waiting on someone.
4. **`list_pending_proposals`** — `{ scope: "needs_my_approval" | "mine" |
   "all" }` → what's blocking on this participant.
5. **`respond_to_proposal`** — `{ proposal_id, decision, note? }` — callable
   only by (or on behalf of) `affected_participant_id`; runs
   `apply_proposal` on approve. The tool's description explicitly instructs
   agents to confirm with their human before calling this with
   `decision: "approve"` on anything nontrivial.
6. **`mark_paid`** — thin wrapper over `propose_change` for "I paid my
   share" (always self-scoped/auto-approved); kept separate so agents don't
   need to construct a generic payload for the single most common action in
   the gift-pooling flow.

## 6. Real-time sync

Each browser subscribes to a Supabase Realtime channel scoped to `room_id`
(`postgres_changes` on `cart_items`, `proposals`, `participants`). Every
mutation, whether from the UI or a tool call, goes through the same Edge
Function → `apply_proposal` path, so the UI and any connected agent are
always looking at the same source of truth, converging within Supabase
Realtime's normal sub-second latency. On a realtime disconnect, the client
falls back to polling `get_room_state` every 5s so neither the UI nor an
agent goes silently stale mid-demo.

## 7. UI (Next.js, client components)

- **Join screen** — room code + display name → issues a `session_token`
  stored client-side (localStorage/cookie). No password auth.
- **Cart board** — grouped by category, claim/paid badges, each
  participant's budget bar.
- **Proposal inbox** — proposals `needs_my_approval` with inline
  Approve/Reject buttons, so a human can resolve exactly what
  `respond_to_proposal` would do from an agent. This is the piece of UI the
  demo leans on hardest.
- **Activity log** — full proposal history including auto-approved ones, so
  "everything is a proposal" is visible, not just asserted.

## 8. Error handling

Tool calls return structured results, never opaque throws — e.g.
`propose_change` on an unknown `catalog_item_id` returns
`{ ok: false, reason: "item_not_found" }`; `respond_to_proposal` called by
someone who isn't `affected_participant_id` returns
`{ ok: false, reason: "not_authorized" }`.

## 9. Testing

Pragmatic given the hackathon window: unit tests on `apply_proposal`'s
branching logic (self-scoped vs. affected-participant resolution,
budget-overrun detection, duplicate-claim detection), plus a documented
manual two-tab test script in the README that walks the exact demo scenario
— the real validation bar is "works live in ChatGPT's in-app browser and in
Chrome with the WebMCP flag enabled."

## 10. Demo script (<3 min video, two browser windows: Alex, Sam)

1. Both join room `PANTRY42` via the room-code screen. (~15s)
2. Alex's agent: "add milk and eggs, I'll pay" → `search_catalog` →
   `propose_change(add_item)` ×2, both self-scoped, instantly visible live in
   Sam's window too. (~30s)
3. Sam's agent: "add milk" → already claimed by Alex → `propose_change`
   returns `status: pending`, `affected_participant_id: Alex`. Alex's inbox
   lights up live; Alex approves ("split it"). (~40s)
4. Sam's agent: "housewarming gift, budget capped at $50, add the $60 vase"
   → exceeds Alex's shared budget cap → blocks; Alex rejects with a note
   ("too much, find something under $50") → Sam's agent sees the reason and
   searches again. (~40s)
5. Pan to the activity log showing the full audit trail — what auto-resolved
   vs. what needed a human. (~15s)

## 11. Success criteria

1. Every action in the demo script above happens via WebMCP tool calls only
   — zero manual clicking — verifiably in ChatGPT's in-app browser and in
   Chrome with `chrome://flags/#enable-webmcp-testing`.
2. A second real browser tab shows every change propagate live, no refresh.
3. The rejection path visibly changes agent behavior — proves the
   human-in-the-loop checkpoint isn't decorative.
4. Public repo has an OSS license visible in GitHub's About section, a
   README covering setup + architecture, and a live Vercel URL.

## 12. Stack

- **Frontend:** Next.js (client components for WebMCP tool registration),
  deployed to Vercel.
- **Backend:** Supabase — Postgres tables above, Realtime subscriptions,
  Edge Functions as the tool-call entry point, `apply_proposal` Postgres
  function as the single mutation path.
- **WebMCP:** `document.modelContext.registerTool` per the WebMCP spec,
  polyfilled/tested via Chrome's `chrome://flags/#enable-webmcp-testing` and
  ChatGPT's in-app browser.
