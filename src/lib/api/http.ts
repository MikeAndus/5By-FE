import { API_BASE_URL } from "@/lib/env";

const resolvePath = (path: string): string => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return path.startsWith("/") ? path : `/${path}`;
};

const resolveErrorMessage = (response: Response): string => {
  if (response.status === 404) {
    return "Session not found or has expired.";
  }

  if (response.status === 422) {
    return "Session link is invalid.";
  }

  if (response.status >= 500) {
    return "Server error while loading session. Please try again.";
  }

  return `Request failed (${response.status}).`;
};

export const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${resolvePath(path)}`, {
    ...init,
    headers
  });

  if (!response.ok) {
    throw new Error(resolveErrorMessage(response));
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
