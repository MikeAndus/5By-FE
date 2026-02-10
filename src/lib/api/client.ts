import { z } from "zod";
import { ApiClientError, parseApiErrorResponse } from "@/lib/api/errors";

interface ApiRequestOptions extends Omit<RequestInit, "method" | "body"> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
}

const getBaseUrl = (): string => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  if (!baseUrl) {
    throw new ApiClientError(
      0,
      "missing_api_base_url",
      "Missing VITE_API_BASE_URL environment variable.",
    );
  }

  return baseUrl.replace(/\/+$/, "");
};

const normalizePath = (path: string): string => {
  if (path.startsWith("/")) {
    return path;
  }

  return `/${path}`;
};

const parseJson = async (response: Response): Promise<unknown> => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiClientError(
      response.status,
      "invalid_json",
      "Received invalid JSON from the server.",
    );
  }
};

const buildHeaders = (hasBody: boolean, headers?: HeadersInit): Headers => {
  const requestHeaders = new Headers(headers);

  requestHeaders.set("Accept", "application/json");

  if (hasBody) {
    requestHeaders.set("Content-Type", "application/json; charset=utf-8");
  }

  return requestHeaders;
};

export const apiRequest = async <T>(
  path: string,
  schema: z.ZodSchema<T>,
  options: ApiRequestOptions = {},
): Promise<T> => {
  const hasBody = options.body !== undefined;
  const response = await fetch(`${getBaseUrl()}${normalizePath(path)}`, {
    ...options,
    method: options.method ?? "GET",
    body: hasBody ? JSON.stringify(options.body) : undefined,
    headers: buildHeaders(hasBody, options.headers),
  });

  if (response.ok) {
    const payload = await parseJson(response);
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      throw new ApiClientError(
        response.status,
        "invalid_response_shape",
        "Response payload does not match the expected schema.",
        parsed.error.flatten(),
      );
    }

    return parsed.data;
  }

  const payload = await parseJson(response);
  const parsedError = parseApiErrorResponse(payload);

  if (!parsedError) {
    throw new ApiClientError(
      response.status,
      "invalid_error_shape",
      "Error payload does not match the expected schema.",
      payload,
    );
  }

  throw new ApiClientError(
    response.status,
    parsedError.error.code,
    parsedError.error.message,
    parsedError.error.details,
  );
};

export const apiGet = async <T>(
  path: string,
  schema: z.ZodSchema<T>,
): Promise<T> => {
  return apiRequest(path, schema, { method: "GET" });
};
