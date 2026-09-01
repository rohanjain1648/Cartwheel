"use client";

import { useEffect, useState } from "react";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useRegisterWebMCPTools } from "@/hooks/useRegisterWebMCPTools";
import { loadSession } from "@/lib/session";
import { CartBoard } from "@/components/CartBoard";
import { ProposalInbox } from "@/components/ProposalInbox";
import { ActivityLog } from "@/components/ActivityLog";
import { CatalogDrawer } from "@/components/CatalogDrawer";
import Link from "next/link";
import {
  ShoppingBag,
  Copy,
  Check,
  Bot,
  Plus,
  ArrowLeft,
  Users,
  Inbox,
  Clock,
  Sparkles,
} from "lucide-react";

export default function RoomPage({ params }: { params: { code: string } }) {
  const roomCode = params.code.toUpperCase();
  const { state, refetch } = useRoomRealtime(roomCode);
  useRegisterWebMCPTools(roomCode);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);

  useEffect(() => {
    const session = loadSession(roomCode);
    setParticipantId(session?.participantId ?? null);
  }, [roomCode]);

  function handleCopyRoomCode() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!state || !participantId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas bg-grid-hairline">
        <div className="flex flex-col items-center gap-3 rounded-2xl glass-panel p-8 shadow-card border border-line">
          <div className="size-8 rounded-full border-2 border-brand-lime border-t-ink animate-spin" />
          <p className="font-mono text-xs font-semibold text-ink">
            Connecting to room <span className="text-brand-lime bg-ink px-1.5 py-0.5 rounded">{roomCode}</span>…
          </p>
        </div>
      </div>
    );
  }

  const currentParticipant = state.participants.find((p) => p.id === participantId);
  const pendingCount = state.proposals.filter(
    (p) => p.status === "pending" && p.affected_participant_id === participantId
  ).length;

  return (
    <div className="relative min-h-screen bg-canvas bg-grid-hairline pb-16 selection:bg-brand-lime selection:text-ink">
      {/* Sticky Room Glass Navigation Bar */}
      <header className="sticky top-0 z-40 px-4 pt-3 sm:px-8 sm:pt-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl glass-panel px-4 py-2.5 shadow-sm border border-line">
          {/* Left Brand / Room Info */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex size-8 items-center justify-center rounded-xl bg-canvas-muted border border-line-subtle text-ink hover:bg-surface transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="size-4" />
            </Link>

            <div className="flex items-center gap-2">
              <span className="font-display text-sm font-bold text-ink">
                Room
              </span>
              <button
                onClick={handleCopyRoomCode}
                className="flex items-center gap-1.5 rounded-lg border border-line bg-canvas-muted px-2.5 py-1 font-mono text-xs font-bold text-ink hover:bg-brand-lime-soft transition-all"
                title="Click to copy code"
              >
                <span>{roomCode}</span>
                {copied ? (
                  <Check className="size-3 text-emerald-600" />
                ) : (
                  <Copy className="size-3 text-ink-muted" />
                )}
              </button>
            </div>
          </div>

          {/* Center WebMCP Status Pill */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-line bg-canvas-muted/80 px-3 py-1 text-xs font-mono text-ink-secondary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-lime opacity-75"></span>
              <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
            </span>
            <span>WebMCP Tools Active</span>
            <span className="text-ink-faint">|</span>
            <span className="text-ink-muted">{state.participants.length} connected</span>
          </div>

          {/* Right User Badge & Add Items Action */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsCatalogOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-ink px-3 py-1.5 font-display text-xs font-bold text-white shadow-sm hover:bg-neutral-800 active:scale-[0.98] transition-all"
            >
              <Plus className="size-3.5 text-brand-lime" />
              <span>Catalog</span>
            </button>

            {currentParticipant && (
              <div className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-2.5 py-1 text-xs font-medium text-ink shadow-xs">
                <div className="flex size-5 items-center justify-center rounded-full bg-brand-lime text-[10px] font-bold text-ink">
                  {currentParticipant.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[90px] truncate hidden sm:inline">
                  {currentParticipant.display_name}
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Left Column: Cart Board (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            <CartBoard
              state={state}
              roomCode={roomCode}
              myParticipantId={participantId}
              onChanged={refetch}
            />
          </div>

          {/* Right Column: Approval Inbox & Audit Feed (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Needs Your Approval Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Inbox className="size-4 text-ink" />
                  <h3 className="font-display text-sm font-bold text-ink">
                    Needs Your Approval
                  </h3>
                </div>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </div>

              <ProposalInbox
                roomCode={roomCode}
                myParticipantId={participantId}
                proposals={state.proposals}
                onResolved={refetch}
              />
            </div>

            {/* Activity Audit Log Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-ink" />
                <h3 className="font-display text-sm font-bold text-ink">
                  Audit Activity Trail
                </h3>
              </div>

              <ActivityLog
                proposals={state.proposals}
                participants={state.participants}
              />
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Catalog Drawer */}
      <CatalogDrawer
        roomCode={roomCode}
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onItemAdded={refetch}
      />
    </div>
  );
}
