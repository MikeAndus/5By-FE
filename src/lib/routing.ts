const UUID_PATTERN_TEXT = "[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";
const UUID_PATTERN = new RegExp(`^${UUID_PATTERN_TEXT}$`, "i");
const SESSION_URL_PATTERN = new RegExp(`/s/(${UUID_PATTERN_TEXT})(?:/|$|\\?|#)`, "i");

export const sessionRoute = (sessionId: string): string => {
  return `/s/${sessionId}`;
};

export const sessionOverRoute = (sessionId: string): string => {
  return `/s/${sessionId}/over`;
};

export const isUuidLike = (value: string): boolean => {
  return UUID_PATTERN.test(value.trim());
};

export const parseSessionIdInput = (value: string): string | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (isUuidLike(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(SESSION_URL_PATTERN);
  if (!match?.[1]) {
    return null;
  }

  return isUuidLike(match[1]) ? match[1] : null;
};
