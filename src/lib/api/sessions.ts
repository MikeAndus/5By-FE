import { ZodError } from "zod";
import { apiFetch } from "@/lib/api/http";
import { SessionSnapshotSchema, type SessionSnapshot } from "@/lib/api/schemas";

export const getSessionSnapshot = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<SessionSnapshot> => {
  const requestInit: RequestInit = { method: "GET" };
  if (signal) {
    requestInit.signal = signal;
  }

  const payload = await apiFetch<unknown>(`/sessions/${encodeURIComponent(sessionId)}`, requestInit);

  try {
    return SessionSnapshotSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Received an invalid session snapshot from the server.");
    }

    throw error;
  }
};
