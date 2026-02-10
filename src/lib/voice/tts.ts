const START_TIMEOUT_MS = 1500;

const getSpeechSynthesis = (): SpeechSynthesis | null => {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return null;
  }

  return window.speechSynthesis;
};

export const isTtsSupported = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    typeof window.SpeechSynthesisUtterance !== "undefined" &&
    getSpeechSynthesis() !== null
  );
};

export const stop = (): void => {
  const synth = getSpeechSynthesis();

  if (!synth) {
    return;
  }

  synth.cancel();
};

export const speak = async (text: string): Promise<void> => {
  const synth = getSpeechSynthesis();

  if (!isTtsSupported() || !synth) {
    throw new Error("Text-to-speech is unavailable in this browser.");
  }

  if (!text.trim()) {
    throw new Error("Question text is empty.");
  }

  stop();

  // Prime lazily loaded voices on Safari/iOS without blocking synthesis start.
  void synth.getVoices();

  const utterance = new window.SpeechSynthesisUtterance(text);

  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const settle = (callback: () => void): void => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      callback();
    };

    const timeoutId = window.setTimeout(() => {
      settle(() => {
        synth.cancel();
        reject(
          new Error(
            "Speech synthesis did not start. Try again from a button tap.",
          ),
        );
      });
    }, START_TIMEOUT_MS);

    utterance.onstart = () => {
      settle(() => {
        resolve();
      });
    };

    utterance.onerror = () => {
      settle(() => {
        reject(new Error("Speech synthesis failed to start."));
      });
    };

    try {
      synth.speak(utterance);
    } catch {
      settle(() => {
        reject(new Error("Speech synthesis could not be started."));
      });
    }
  });
};
