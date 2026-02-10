import { apiGet, apiRequest } from "@/lib/api/client";
import {
  SessionSnapshotSchema,
  type SessionSnapshot,
} from "@/lib/api/session-snapshot";

export const createSession = async (): Promise<SessionSnapshot> => {
  return apiRequest("/sessions", SessionSnapshotSchema, { method: "POST" });
};

export const getSessionSnapshot = async (
  sessionId: string,
): Promise<SessionSnapshot> => {
  return apiGet(`/sessions/${sessionId}`, SessionSnapshotSchema);
};
