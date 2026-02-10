import { create } from "zustand";
import { getSessionSnapshot } from "@/lib/api/sessions";
import { ApiError } from "@/lib/api/http";
import type { SessionSnapshot } from "@/lib/api/schemas";

interface SessionStoreState {
  sessionId: string | null;
  snapshot: SessionSnapshot | null;
  loading: boolean;
  error: string | null;
  errorStatus: number | null;
  lastLoadedAt: number | null;
  setSessionId: (sessionId: string | null) => void;
  hydrate: (sessionId: string, snapshot: SessionSnapshot) => void;
  loadSession: (sessionId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clear: () => void;
}

const INITIAL_STATE = {
  sessionId: null,
  snapshot: null,
  loading: false,
  error: null,
  errorStatus: null,
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
  hydrate: (sessionId, snapshot) => {
    set({
      sessionId,
      snapshot,
      loading: false,
      error: null,
      errorStatus: null,
      lastLoadedAt: Date.now()
    });
  },
  loadSession: async (sessionId) => {
    if (activeRequestController) {
      activeRequestController.abort();
    }

    const controller = new AbortController();
    activeRequestController = controller;
    const state = get();
    const existingSnapshot = state.sessionId === sessionId ? state.snapshot : null;
    const existingLastLoadedAt = state.sessionId === sessionId ? state.lastLoadedAt : null;

    set({
      sessionId,
      snapshot: existingSnapshot,
      loading: true,
      error: null,
      errorStatus: null
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
        errorStatus: null,
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
        snapshot: existingSnapshot,
        loading: false,
        error: getErrorMessage(error),
        errorStatus: error instanceof ApiError ? error.status : null,
        lastLoadedAt: existingLastLoadedAt
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
