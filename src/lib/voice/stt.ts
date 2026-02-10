const DEFAULT_LANG = "en-US";

const STT_ERROR_CODES = {
  aborted: "aborted",
  audio_capture: "audio_capture",
  network: "network",
  no_speech: "no_speech",
  not_allowed: "not_allowed",
  service_not_allowed: "service_not_allowed",
  stt_error: "stt_error",
  unsupported: "unsupported",
} as const;

type SttErrorCode = (typeof STT_ERROR_CODES)[keyof typeof STT_ERROR_CODES];

export type SttStatus = "listening" | "stopped";

export interface SttError {
  code: SttErrorCode;
  message: string;
}

export interface StartListeningOptions {
  lang?: string;
  interimResults?: boolean;
  onStatus: (status: SttStatus) => void;
  onInterimTranscript: (text: string) => void;
  onFinalTranscript: (text: string) => void;
  onError: (error: SttError) => void;
}

export interface SttListeningHandle {
  stop: () => void;
}

let activeStop: (() => void) | null = null;

const getRecognitionConstructor = (): SpeechRecognitionConstructor | null => {
  if (typeof window === "undefined") {
    return null;
  }

  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
};

const getSttErrorCode = (error: string): SttErrorCode => {
  if (error === "aborted") {
    return STT_ERROR_CODES.aborted;
  }

  if (error === "audio-capture") {
    return STT_ERROR_CODES.audio_capture;
  }

  if (error === "network") {
    return STT_ERROR_CODES.network;
  }

  if (error === "no-speech") {
    return STT_ERROR_CODES.no_speech;
  }

  if (error === "not-allowed") {
    return STT_ERROR_CODES.not_allowed;
  }

  if (error === "service-not-allowed") {
    return STT_ERROR_CODES.service_not_allowed;
  }

  return STT_ERROR_CODES.stt_error;
};

const getSttErrorMessage = (code: SttErrorCode): string => {
  if (code === "not_allowed" || code === "service_not_allowed") {
    return "Microphone permission denied.";
  }

  if (code === "network") {
    return "Speech recognition network error.";
  }

  if (code === "no_speech") {
    return "No speech detected. Try again.";
  }

  if (code === "audio_capture") {
    return "No microphone available for speech recognition.";
  }

  if (code === "aborted") {
    return "Speech recognition stopped.";
  }

  if (code === "unsupported") {
    return "Speech-to-text is unavailable in this browser.";
  }

  return "Speech recognition failed.";
};

export const isSttSupported = (): boolean => {
  return getRecognitionConstructor() !== null;
};

export const startListening = (
  options: StartListeningOptions,
): SttListeningHandle => {
  const Recognition = getRecognitionConstructor();

  if (!Recognition) {
    options.onStatus("stopped");
    options.onError({
      code: STT_ERROR_CODES.unsupported,
      message: getSttErrorMessage(STT_ERROR_CODES.unsupported),
    });
    return {
      stop: () => {
        // no-op when STT is unavailable
      },
    };
  }

  stopListening();

  let recognition: SpeechRecognition;

  try {
    recognition = new Recognition();
  } catch {
    options.onStatus("stopped");
    options.onError({
      code: STT_ERROR_CODES.stt_error,
      message: "Could not initialize speech recognition.",
    });
    return {
      stop: () => {
        // no-op when initialization fails
      },
    };
  }

  recognition.continuous = false;
  recognition.interimResults = options.interimResults ?? true;
  recognition.maxAlternatives = 1;
  recognition.lang = options.lang ?? DEFAULT_LANG;

  let isStopping = false;

  const stop = (): void => {
    if (isStopping) {
      return;
    }

    isStopping = true;

    try {
      recognition.stop();
    } catch {
      // ignored: browser may throw when already stopped
    }
  };

  activeStop = stop;

  recognition.onstart = () => {
    options.onStatus("listening");
  };

  recognition.onresult = (event) => {
    const finalParts: string[] = [];
    const interimParts: string[] = [];

    for (let index = 0; index < event.results.length; index += 1) {
      const result = event.results.item(index);
      const alternative = result.item(0);

      if (!alternative || !alternative.transcript) {
        continue;
      }

      const transcript = alternative.transcript.trim();
      if (!transcript) {
        continue;
      }

      if (result.isFinal) {
        finalParts.push(transcript);
      } else {
        interimParts.push(transcript);
      }
    }

    options.onInterimTranscript(interimParts.join(" ").trim());

    const finalTranscript = finalParts.join(" ").trim();
    if (finalTranscript) {
      options.onFinalTranscript(finalTranscript);
    }
  };

  recognition.onerror = (event) => {
    const code = getSttErrorCode(event.error);

    if (isStopping && code === STT_ERROR_CODES.aborted) {
      return;
    }

    options.onError({
      code,
      message: getSttErrorMessage(code),
    });
  };

  recognition.onend = () => {
    if (activeStop === stop) {
      activeStop = null;
    }

    options.onStatus("stopped");
  };

  try {
    recognition.start();
  } catch {
    if (activeStop === stop) {
      activeStop = null;
    }

    options.onStatus("stopped");
    options.onError({
      code: STT_ERROR_CODES.stt_error,
      message: "Could not start speech recognition.",
    });
  }

  return { stop };
};

export const stopListening = (): void => {
  if (!activeStop) {
    return;
  }

  activeStop();
};
