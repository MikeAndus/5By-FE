export const isTtsSupported = (): boolean => {
  return false;
};

export const speak = async (_text: string): Promise<void> => {
  throw new Error("TTS integration not implemented yet.");
};
