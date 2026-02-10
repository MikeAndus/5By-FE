import { create } from "zustand";
import { getSessionSnapshot } from "@/lib/api/sessions";
import type { SessionSnapshot } from "@/lib/api/schemas";

interface SessionStoreState {
  sessionId: string | null;
  snapshot: SessionSnapshot | null;
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
  setSessionId: (sessionId: string | null) => void;
  loadSession: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

const INITIAL_STATE = {
  sessionId: null,
  snapshot: null,
  loading: false,
  error: null,
  lastLoadedAt: null
} as const;

let activeRequestController: AbortController | null = null;

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load session right now.";
};

export const useSessionStore = create<SessionStoreState>((set, get) => ({
  ...INITIAL_STATE,
  setSessionId: (sessionId) => {
    set({ sessionId });
  },
  loadSession: async (sessionId) => {
    if (activeRequestController) {
      activeRequestController.abort();
    }

    const controller = new AbortController();
    activeRequestController = controller;

    set({
      sessionId,
      snapshot: null,
      loading: true,
      error: null
    });

    try {
      const snapshot = await getSessionSnapshot(sessionId, controller.signal);

      if (activeRequestController !== controller) {
        return;
      }

      set({
        sessionId,
        snapshot,
        loading: false,
        error: null,
        lastLoadedAt: Date.now()
      });
    } catch (error) {
      if (activeRequestController !== controller) {
        return;
      }

      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      set({
        snapshot: null,
        loading: false,
        error: getErrorMessage(error),
        lastLoadedAt: null
      });
    } finally {
      if (activeRequestController === controller) {
        activeRequestController = null;
      }
    }
  },
  refresh: async () => {
    const currentSessionId = get().sessionId;
    if (!currentSessionId) {
      return;
    }

    await get().loadSession(currentSessionId);
  },
  clear: () => {
    if (activeRequestController) {
      activeRequestController.abort();
      activeRequestController = null;
    }

    set({ ...INITIAL_STATE });
  }
}));
