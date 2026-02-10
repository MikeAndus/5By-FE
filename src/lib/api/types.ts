import { z } from "zod";

export type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  error: ApiError;
};

export type HealthResponse = {
  status: "ok" | string;
  service: "five-by-backend" | string;
  db: {
    status: "ok" | string;
  };
};

export const ApiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.unknown().optional(),
});

export const ApiErrorResponseSchema = z.object({
  error: ApiErrorSchema,
});

export const HealthResponseSchema = z.object({
  status: z.string(),
  service: z.string(),
  db: z.object({
    status: z.string(),
  }),
});
