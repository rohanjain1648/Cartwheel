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
