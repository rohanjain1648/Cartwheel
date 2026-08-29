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
