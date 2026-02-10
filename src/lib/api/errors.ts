import { ApiErrorResponseSchema, type ApiErrorResponse } from "@/lib/api/types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const parseApiErrorResponse = (
  payload: unknown,
): ApiErrorResponse | null => {
  const parsed = ApiErrorResponseSchema.safeParse(payload);

  if (!parsed.success) {
    return null;
  }

  return parsed.data;
};
