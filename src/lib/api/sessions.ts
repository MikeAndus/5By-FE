import { apiGet, apiRequest } from "@/lib/api/client";
import {
  AskQuestionRequestSchema,
  type AskQuestionRequest,
} from "@/lib/api/ask";
import {
  AnswerQuestionRequestSchema,
  type AnswerQuestionRequest,
} from "@/lib/api/answer";
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

export const askQuestion = async (
  sessionId: string,
  payload: AskQuestionRequest,
): Promise<SessionSnapshot> => {
  const body = AskQuestionRequestSchema.parse(payload);

  return apiRequest(`/sessions/${sessionId}/ask`, SessionSnapshotSchema, {
    method: "POST",
    body,
  });
};

export const answerQuestion = async (
  sessionId: string,
  payload: AnswerQuestionRequest,
): Promise<SessionSnapshot> => {
  const body = AnswerQuestionRequestSchema.parse(payload);

  return apiRequest(`/sessions/${sessionId}/answer`, SessionSnapshotSchema, {
    method: "POST",
    body,
  });
};
