import { apiGet } from "@/lib/api/client";
import {
  SessionSnapshotSchema,
  type SessionSnapshot,
} from "@/lib/api/session-snapshot";

export const getSessionSnapshot = async (
  sessionId: string,
): Promise<SessionSnapshot> => {
  return apiGet(`/sessions/${sessionId}`, SessionSnapshotSchema);
};
