const DEFAULT_API_BASE_URL = "http://localhost:8000";

const resolveApiBaseUrl = (): string => {
  const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredApiBaseUrl) {
    console.warn(
      "VITE_API_BASE_URL is not set. Falling back to http://localhost:8000 for local development."
    );
    return DEFAULT_API_BASE_URL;
  }

  return configuredApiBaseUrl;
};

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/+$/, "");
