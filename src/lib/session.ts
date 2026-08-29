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
