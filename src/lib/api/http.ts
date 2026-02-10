import { API_BASE_URL } from "@/lib/env";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const resolvePath = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
};

const resolveErrorMessage = (response: Response): string => {
  if (response.status === 404) {
    return "Session not found or expired.";
  }

  if (response.status === 422) {
    return "Request validation failed.";
  }

  if (response.status >= 500) {
    return "Server error. Please try again.";
  }

  return `Request failed (${response.status}).`;
};

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${resolvePath(path)}`, {
      ...init,
      headers
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new Error("Network request failed. Please check your connection and try again.");
  }

  if (!response.ok) {
    throw new ApiError(response.status, resolveErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("Received a non-JSON response from the server.");
  }
};
