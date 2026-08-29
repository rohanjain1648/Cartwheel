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
