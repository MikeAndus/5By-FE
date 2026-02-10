import { ZodError } from "zod";
import { apiFetch } from "@/lib/api/http";
import {
  CreateSessionRequestSchema,
  SessionSnapshotSchema,
  type CreateSessionRequest,
  type SessionSnapshot
} from "@/lib/api/schemas";

const parseSessionSnapshot = (payload: unknown): SessionSnapshot => {
  try {
    return SessionSnapshotSchema.parse(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Unexpected server response.");
    }

    throw error;
  }
};

export const getSessionSnapshot = async (
  sessionId: string,
  signal?: AbortSignal
): Promise<SessionSnapshot> => {
  const requestInit: RequestInit = { method: "GET" };
  if (signal) {
    requestInit.signal = signal;
  }

  const payload = await apiFetch<unknown>(`/sessions/${encodeURIComponent(sessionId)}`, requestInit);

  return parseSessionSnapshot(payload);
};

export const createSession = async (
  payload: CreateSessionRequest,
  signal?: AbortSignal
): Promise<SessionSnapshot> => {
  const parsedPayload = CreateSessionRequestSchema.parse(payload);
  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(parsedPayload)
  };

  if (signal) {
    requestInit.signal = signal;
  }

  const responsePayload = await apiFetch<unknown>("/sessions", requestInit);
  return parseSessionSnapshot(responsePayload);
};
