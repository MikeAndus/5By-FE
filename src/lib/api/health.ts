import {
  HealthResponseSchema,
  type HealthResponse,
} from "@/lib/api/types";
import { apiGet } from "@/lib/api/client";

export const getHealth = async (): Promise<HealthResponse> => {
  return apiGet("/health", HealthResponseSchema);
};
