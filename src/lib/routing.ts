export const sessionRoute = (sessionId: string): string => {
  return `/s/${sessionId}`;
};

export const sessionOverRoute = (sessionId: string): string => {
  return `/s/${sessionId}/over`;
};
