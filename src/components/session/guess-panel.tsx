import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { GuessConfirmDialog } from "@/components/session/guess-confirm-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WordGuessedEventDataSchema, LetterGuessedEventDataSchema } from "@/lib/api/guess-events";
import {
  GuessDirectionSchema,
  type GuessDirection,
  type GuessLetterRequest,
  type GuessWordRequest,
} from "@/lib/api/guess-types";
import { ApiClientError } from "@/lib/api/errors";
import { guessLetter, guessWord } from "@/lib/api/sessions";
import type { PlayerSnapshot, SessionSnapshot } from "@/lib/api/session-snapshot";
import { toastApiError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import {
  isSttSupported,
  startListening,
  stopListening,
  type SttError,
  type SttListeningHandle,
} from "@/lib/voice/stt";

const LETTER_REGEX = /^[A-Za-z]$/;
const WORD_REGEX = /^[A-Za-z]{5}$/;
const TARGET_INDEX_OPTIONS = [0, 1, 2, 3, 4] as const;

type GuessType = "letter" | "word";

type WordIneligibleReason = "word_already_revealed" | "word_locked";

interface WordEligibility {
  eligible: boolean;
  reason: WordIneligibleReason | null;
}

interface GuessPanelProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  activePlayer: PlayerSnapshot;
  onSnapshotUpdate: (snapshot: SessionSnapshot) => void;
}

interface WordTargetOption {
  index: number;
  cellIndices: number[];
  eligibility: WordEligibility;
}

interface PendingLetterSubmission {
  kind: "letter";
  payload: GuessLetterRequest;
  summary: string;
}

interface PendingWordSubmission {
  kind: "word";
  payload: GuessWordRequest;
  summary: string;
}

type PendingSubmission = PendingLetterSubmission | PendingWordSubmission;

const LetterGuessFormSchema = z.object({
  cell_index: z.number().int().min(0).max(24),
  letter: z.string().regex(LETTER_REGEX),
});

type LetterGuessFormValues = z.infer<typeof LetterGuessFormSchema>;

const WordGuessFormSchema = z.object({
  direction: GuessDirectionSchema,
  index: z.number().int().min(0).max(4),
  word: z.string().regex(WORD_REGEX),
});

type WordGuessFormValues = z.infer<typeof WordGuessFormSchema>;

const cellIndexToRowCol = (cellIndex: number): { row: number; col: number } => {
  return {
    row: Math.floor(cellIndex / 5) + 1,
    col: (cellIndex % 5) + 1,
  };
};

const getWordCellIndices = (direction: GuessDirection, index: number): number[] => {
  if (direction === "across") {
    return [0, 1, 2, 3, 4].map((colOffset) => index * 5 + colOffset);
  }

  return [0, 1, 2, 3, 4].map((rowOffset) => rowOffset * 5 + index);
};

const getWordGuessEligibility = (
  cellsByIndex: Map<number, PlayerSnapshot["cells"][number]>,
  cellIndices: number[],
): WordEligibility => {
  const cells = cellIndices
    .map((cellIndex) => cellsByIndex.get(cellIndex))
    .filter((cell): cell is PlayerSnapshot["cells"][number] => cell !== undefined);

  const allRevealed = cells.length === 5 && cells.every((cell) => cell.revealed);
  if (allRevealed) {
    return {
      eligible: false,
      reason: "word_already_revealed",
    };
  }

  const hasLockedUnrevealed = cells.some((cell) => cell.locked && !cell.revealed);
  if (hasLockedUnrevealed) {
    return {
      eligible: false,
      reason: "word_locked",
    };
  }

  return {
    eligible: true,
    reason: null,
  };
};

const buildCellAriaLabel = (
  row: number,
  col: number,
  isLocked: boolean,
  isRevealed: boolean,
): string => {
  const parts = [`Cell row ${row + 1} col ${col + 1}`];

  if (isLocked) {
    parts.push("locked");
  }

  if (isRevealed) {
    parts.push("revealed");
  }

  return parts.join(", ");
};

const getWordTargetLabel = (direction: GuessDirection, index: number): string => {
  if (direction === "across") {
    return `Row ${index + 1}`;
  }

  return `Col ${index + 1}`;
};

const getWordTargetDescription = (reason: WordIneligibleReason | null): string | null => {
  if (reason === "word_already_revealed") {
    return "already revealed";
  }

  if (reason === "word_locked") {
    return "contains locked cells";
  }

  return null;
};

const formatLocks = (locks: number[]): string => {
  if (locks.length === 0) {
    return "None";
  }

  return locks
    .map((cellIndex) => {
      const { row, col } = cellIndexToRowCol(cellIndex);
      return `r${row}c${col}`;
    })
    .join(", ");
};

const mapGuessErrorCodeToMessage = (code: string): string | null => {
  if (code === "out_of_turn") {
    return "It's not your turn.";
  }

  if (code === "cell_locked") {
    return "That cell is locked.";
  }

  if (code === "cell_already_revealed") {
    return "That cell is already revealed.";
  }

  if (code === "word_locked") {
    return "That word contains locked cells.";
  }

  if (code === "word_already_revealed") {
    return "That word is already fully revealed.";
  }

  if (code === "session_not_in_progress") {
    return "Session is not in progress.";
  }

  if (code === "session_not_found") {
    return "Session not found.";
  }

  return null;
};

export const GuessPanel = ({
  sessionId,
  snapshot,
  activePlayer,
  onSnapshotUpdate,
}: GuessPanelProps): JSX.Element => {
  const [guessType, setGuessType] = useState<GuessType>("letter");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmittingGuess, setIsSubmittingGuess] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState<PendingSubmission | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [sttError, setSttError] = useState<SttError | null>(null);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [correctionValue, setCorrectionValue] = useState("");

  const sttSupported = useMemo(() => {
    return isSttSupported();
  }, []);

  const listeningHandleRef = useRef<SttListeningHandle | null>(null);

  const letterForm = useForm<LetterGuessFormValues>({
    resolver: zodResolver(LetterGuessFormSchema),
    mode: "onChange",
    defaultValues: {
      letter: "",
    },
  });

  const wordForm = useForm<WordGuessFormValues>({
    resolver: zodResolver(WordGuessFormSchema),
    mode: "onChange",
    defaultValues: {
      direction: "across",
      index: 0,
      word: "",
    },
  });

  const orderedCells = useMemo(() => {
    return activePlayer.cells.slice().sort((a, b) => a.index - b.index);
  }, [activePlayer.cells]);

  const cellsByIndex = useMemo(() => {
    return new Map(orderedCells.map((cell) => [cell.index, cell]));
  }, [orderedCells]);

  const selectedCellIndex = letterForm.watch("cell_index");
  const selectedCell =
    typeof selectedCellIndex === "number" ? cellsByIndex.get(selectedCellIndex) ?? null : null;

  const letterValue = letterForm.watch("letter") ?? "";

  const selectedDirection = wordForm.watch("direction") ?? "across";
  const selectedWordIndex = wordForm.watch("index") ?? 0;
  const wordValue = wordForm.watch("word") ?? "";

  const wordTargetOptions = useMemo<WordTargetOption[]>(() => {
    return TARGET_INDEX_OPTIONS.map((targetIndex) => {
      const cellIndices = getWordCellIndices(selectedDirection, targetIndex);

      return {
        index: targetIndex,
        cellIndices,
        eligibility: getWordGuessEligibility(cellsByIndex, cellIndices),
      };
    });
  }, [cellsByIndex, selectedDirection]);

  const selectedWordCellIndices = useMemo(() => {
    return getWordCellIndices(selectedDirection, selectedWordIndex);
  }, [selectedDirection, selectedWordIndex]);

  const selectedWordEligibility = useMemo(() => {
    return getWordGuessEligibility(cellsByIndex, selectedWordCellIndices);
  }, [cellsByIndex, selectedWordCellIndices]);

  const unavailableWordTargets = useMemo(() => {
    return wordTargetOptions.filter((targetOption) => !targetOption.eligibility.eligible);
  }, [wordTargetOptions]);

  const selectedWordCoordinates = useMemo(() => {
    return selectedWordCellIndices
      .map((cellIndex) => {
        const { row, col } = cellIndexToRowCol(cellIndex);
        return `r${row}c${col}`;
      })
      .join(", ");
  }, [selectedWordCellIndices]);

  const selectedWordPattern = useMemo(() => {
    return selectedWordCellIndices
      .map((cellIndex) => {
        const cell = cellsByIndex.get(cellIndex);

        if (cell?.revealed && cell.letter) {
          return cell.letter;
        }

        return "_";
      })
      .join(" ");
  }, [cellsByIndex, selectedWordCellIndices]);

  const isSelectedCellEligible = Boolean(
    selectedCell && !selectedCell.revealed && !selectedCell.locked,
  );

  const canReviewLetterGuess = isSelectedCellEligible && LETTER_REGEX.test(letterValue);
  const canReviewWordGuess = selectedWordEligibility.eligible && WORD_REGEX.test(wordValue);

  const capturedTranscript = useMemo(() => {
    return (finalTranscript || interimTranscript).trim();
  }, [finalTranscript, interimTranscript]);

  const parsedLetterResult = useMemo(() => {
    const lastEvent = snapshot.last_event;

    if (!lastEvent || lastEvent.type !== "letter_guessed") {
      return {
        data: null,
        isInvalid: false,
      };
    }

    const parsed = LetterGuessedEventDataSchema.safeParse(lastEvent.event_data);

    if (!parsed.success) {
      return {
        data: null,
        isInvalid: true,
      };
    }

    return {
      data: parsed.data,
      isInvalid: false,
    };
  }, [snapshot]);

  const parsedWordResult = useMemo(() => {
    const lastEvent = snapshot.last_event;

    if (!lastEvent || lastEvent.type !== "word_guessed") {
      return {
        data: null,
        isInvalid: false,
      };
    }

    const parsed = WordGuessedEventDataSchema.safeParse(lastEvent.event_data);

    if (!parsed.success) {
      return {
        data: null,
        isInvalid: true,
      };
    }

    return {
      data: parsed.data,
      isInvalid: false,
    };
  }, [snapshot]);

  useEffect(() => {
    return () => {
      listeningHandleRef.current?.stop();
      stopListening();
    };
  }, []);

  useEffect(() => {
    const target = wordTargetOptions.find((targetOption) => targetOption.index === selectedWordIndex);

    if (target?.eligibility.eligible) {
      return;
    }

    const firstEligible = wordTargetOptions.find((targetOption) => targetOption.eligibility.eligible);

    if (!firstEligible) {
      return;
    }

    wordForm.setValue("index", firstEligible.index, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [selectedWordIndex, wordForm, wordTargetOptions]);

  const resetSpeechCapture = (): void => {
    listeningHandleRef.current?.stop();
    stopListening();
    listeningHandleRef.current = null;
    setIsListening(false);
    setInterimTranscript("");
    setFinalTranscript("");
    setSttError(null);
    setIsCorrectionDialogOpen(false);
    setCorrectionValue("");
  };

  const applyTranscriptToForm = (rawTranscript: string): void => {
    if (guessType === "letter") {
      letterForm.setValue("letter", rawTranscript.trim(), {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const normalizedWord = rawTranscript.replace(/[^A-Za-z]/g, "");
    wordForm.setValue("word", normalizedWord, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleGuessTypeChange = (nextType: GuessType): void => {
    if (nextType === guessType) {
      return;
    }

    setGuessType(nextType);
    setPendingSubmission(null);
    setIsConfirmOpen(false);

    if (nextType === "letter") {
      wordForm.reset({
        direction: "across",
        index: 0,
        word: "",
      });
    } else {
      letterForm.reset({
        letter: "",
      });
    }

    resetSpeechCapture();
  };

  const handleStartListening = (): void => {
    if (isSubmittingGuess || isConfirmOpen) {
      return;
    }

    if (!sttSupported) {
      setSttError({
        code: "unsupported",
        message: "Speech-to-text is unavailable in this browser.",
      });
      return;
    }

    listeningHandleRef.current?.stop();
    stopListening();
    setSttError(null);
    setInterimTranscript("");
    setFinalTranscript("");

    listeningHandleRef.current = startListening({
      lang: "en-US",
      interimResults: true,
      onStatus: (status) => {
        setIsListening(status === "listening");

        if (status === "stopped") {
          listeningHandleRef.current = null;
        }
      },
      onInterimTranscript: (text) => {
        setInterimTranscript(text);
      },
      onFinalTranscript: (text) => {
        setFinalTranscript(text);
        setInterimTranscript("");
        applyTranscriptToForm(text);
      },
      onError: (error) => {
        setSttError(error);
      },
    });
  };

  const handleStopListening = (): void => {
    listeningHandleRef.current?.stop();
    stopListening();
  };

  const handleToggleListening = (): void => {
    if (isListening) {
      handleStopListening();
      return;
    }

    handleStartListening();
  };

  const handleUseTranscript = (): void => {
    if (!capturedTranscript) {
      return;
    }

    applyTranscriptToForm(capturedTranscript);
  };

  const handleOpenCorrectionDialog = (): void => {
    if (!capturedTranscript) {
      return;
    }

    setCorrectionValue(capturedTranscript);
    setIsCorrectionDialogOpen(true);
  };

  const handleConfirmCorrection = (): void => {
    const corrected = correctionValue.trim();

    setFinalTranscript(corrected);
    setInterimTranscript("");
    applyTranscriptToForm(corrected);
    setIsCorrectionDialogOpen(false);
  };

  const handlePrepareLetterSubmission = (values: LetterGuessFormValues): void => {
    const cell = cellsByIndex.get(values.cell_index);

    if (!cell || cell.revealed || cell.locked) {
      toast.error("Select an unrevealed, unlocked cell.");
      return;
    }

    const position = cellIndexToRowCol(values.cell_index);
    const displayLetter = values.letter.toUpperCase();

    setPendingSubmission({
      kind: "letter",
      payload: {
        player_number: snapshot.current_turn,
        cell_index: values.cell_index,
        letter: values.letter,
      },
      summary: `Did you mean the letter ${displayLetter} for row ${position.row}, col ${position.col}?`,
    });
    setIsConfirmOpen(true);
  };

  const handlePrepareWordSubmission = (values: WordGuessFormValues): void => {
    const indices = getWordCellIndices(values.direction, values.index);
    const eligibility = getWordGuessEligibility(cellsByIndex, indices);

    if (!eligibility.eligible) {
      if (eligibility.reason === "word_already_revealed") {
        toast.error("That word is already fully revealed.");
        return;
      }

      toast.error("That word contains locked cells.");
      return;
    }

    const displayWord = values.word.toUpperCase();
    const label =
      values.direction === "across" ? `across row ${values.index + 1}` : `down col ${values.index + 1}`;

    setPendingSubmission({
      kind: "word",
      payload: {
        player_number: snapshot.current_turn,
        direction: values.direction,
        index: values.index,
        word: values.word,
      },
      summary: `Did you mean the word ${displayWord} for ${label}?`,
    });
    setIsConfirmOpen(true);
  };

  const showLetterSuccessToast = (nextSnapshot: SessionSnapshot): void => {
    const lastEvent = nextSnapshot.last_event;

    if (!lastEvent || lastEvent.type !== "letter_guessed") {
      toast.success("Letter guess submitted.");
      return;
    }

    const parsed = LetterGuessedEventDataSchema.safeParse(lastEvent.event_data);

    if (!parsed.success) {
      toast.error("Received an incompatible guess payload.");
      return;
    }

    if (parsed.data.correct) {
      toast.success(`Correct! Revealed ${parsed.data.revealed_letter ?? parsed.data.guess}.`);
      return;
    }

    toast.error("Wrong letter. -5 to you, +1 to opponent. Cell locked.");
  };

  const showWordSuccessToast = (nextSnapshot: SessionSnapshot): void => {
    const lastEvent = nextSnapshot.last_event;

    if (!lastEvent || lastEvent.type !== "word_guessed") {
      toast.success("Word guess submitted.");
      return;
    }

    const parsed = WordGuessedEventDataSchema.safeParse(lastEvent.event_data);

    if (!parsed.success) {
      toast.error("Received an incompatible guess payload.");
      return;
    }

    if (parsed.data.correct) {
      if (parsed.data.auto_reveals.length > 0) {
        toast.success(`Correct! Word revealed. Auto-revealed ${parsed.data.auto_reveals.length}.`);
        return;
      }

      toast.success("Correct! Word revealed.");
      return;
    }

    toast.error(`Wrong word. -5/+1 and locked ${parsed.data.locks_enqueued.length} cells.`);
  };

  const handleConfirmSubmission = async (): Promise<void> => {
    if (!pendingSubmission) {
      return;
    }

    setIsSubmittingGuess(true);

    try {
      if (pendingSubmission.kind === "letter") {
        const nextSnapshot = await guessLetter(sessionId, pendingSubmission.payload);

        onSnapshotUpdate(nextSnapshot);
        showLetterSuccessToast(nextSnapshot);
        letterForm.resetField("letter", { defaultValue: "" });
      } else {
        const nextSnapshot = await guessWord(sessionId, pendingSubmission.payload);

        onSnapshotUpdate(nextSnapshot);
        showWordSuccessToast(nextSnapshot);
        wordForm.resetField("word", { defaultValue: "" });
      }

      setPendingSubmission(null);
      setIsConfirmOpen(false);
      resetSpeechCapture();
    } catch (error: unknown) {
      setPendingSubmission(null);
      setIsConfirmOpen(false);

      if (error instanceof ApiClientError) {
        const message = mapGuessErrorCodeToMessage(error.code);

        if (message) {
          toast.error(message);
          return;
        }
      }

      toastApiError(error);
    } finally {
      setIsSubmittingGuess(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Make a Guess</CardTitle>
        <CardDescription>
          Pick a target, capture or type your guess, then confirm exactly what will be submitted.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">
            Guess Type
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              aria-pressed={guessType === "letter"}
              className={cn("min-h-[44px]", guessType === "letter" && "ring-2 ring-offset-2")}
              disabled={isSubmittingGuess}
              onClick={() => {
                handleGuessTypeChange("letter");
              }}
              type="button"
              variant={guessType === "letter" ? "default" : "outline"}
            >
              Letter
            </Button>
            <Button
              aria-pressed={guessType === "word"}
              className={cn("min-h-[44px]", guessType === "word" && "ring-2 ring-offset-2")}
              disabled={isSubmittingGuess}
              onClick={() => {
                handleGuessTypeChange("word");
              }}
              type="button"
              variant={guessType === "word" ? "default" : "outline"}
            >
              Word
            </Button>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">
            Speech Capture
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!sttSupported || isSubmittingGuess}
              onClick={handleToggleListening}
              type="button"
            >
              {isListening ? "Stop" : "Start listening"}
            </Button>
            <Button
              disabled={!capturedTranscript || isSubmittingGuess}
              onClick={handleUseTranscript}
              type="button"
              variant="secondary"
            >
              Use transcript
            </Button>
            <Button
              disabled={!capturedTranscript || isSubmittingGuess}
              onClick={handleOpenCorrectionDialog}
              type="button"
              variant="outline"
            >
              I said...
            </Button>
          </div>

          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Live transcript:</span>{" "}
              {interimTranscript || "(listening will stream here)"}
            </p>
            <p>
              <span className="font-semibold">Final transcript:</span>{" "}
              {finalTranscript || "(final speech result will appear here)"}
            </p>
          </div>

          {!sttSupported ? (
            <p className="rounded-md border border-brand-accentLavender bg-white p-2 text-sm text-brand-accentBlue">
              STT unavailable in this browser; type your guess instead.
            </p>
          ) : null}

          {sttError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {sttError.message}
            </p>
          ) : null}
        </div>

        {guessType === "letter" ? (
          <Form {...letterForm}>
            <form
              className="space-y-4"
              onSubmit={letterForm.handleSubmit(handlePrepareLetterSubmission)}
            >
              <div className="space-y-2">
                <FormLabel>Target cell</FormLabel>
                <div className="grid grid-cols-5 gap-2">
                  {orderedCells.map((cell) => {
                    const isSelected = selectedCellIndex === cell.index;
                    const isDisabled = cell.revealed || cell.locked || isSubmittingGuess;

                    return (
                      <Button
                        aria-label={buildCellAriaLabel(cell.row, cell.col, cell.locked, cell.revealed)}
                        aria-pressed={isSelected}
                        className={cn(
                          "relative h-12 min-h-[48px] min-w-[48px] w-12 p-0 text-base",
                          cell.revealed &&
                            "border-brand-accentLavender bg-brand-accentLavender/30 text-brand-accentBlue",
                          cell.locked && !cell.revealed && "cursor-not-allowed opacity-60",
                          isSelected && "ring-2 ring-brand-accentPeriwinkle ring-offset-2",
                        )}
                        disabled={isDisabled}
                        key={cell.index}
                        onClick={() => {
                          letterForm.setValue("cell_index", cell.index, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                      >
                        <span>{cell.revealed ? cell.letter : "\u2022"}</span>
                        {cell.locked ? (
                          <Lock aria-hidden="true" className="absolute right-1 top-1 h-3.5 w-3.5" />
                        ) : null}
                      </Button>
                    );
                  })}
                </div>
                <FormDescription>
                  Only unrevealed, unlocked cells are selectable for letter guesses.
                </FormDescription>
                {letterForm.formState.errors.cell_index ? (
                  <p className="text-sm font-medium text-red-600">Select an eligible target cell.</p>
                ) : null}
              </div>

              <FormField
                control={letterForm.control}
                name="letter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Letter guess</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        disabled={isSubmittingGuess}
                        inputMode="text"
                        maxLength={1}
                        placeholder="Enter 1 letter"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Must be exactly one ASCII letter (A-Z or a-z).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={!canReviewLetterGuess || isSubmittingGuess} type="submit">
                Review letter guess
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...wordForm}>
            <form className="space-y-4" onSubmit={wordForm.handleSubmit(handlePrepareWordSubmission)}>
              <div className="space-y-2">
                <FormLabel>Direction</FormLabel>
                <div className="flex flex-wrap gap-2">
                  <Button
                    aria-pressed={selectedDirection === "across"}
                    className={cn(
                      "min-h-[44px]",
                      selectedDirection === "across" && "ring-2 ring-offset-2",
                    )}
                    disabled={isSubmittingGuess}
                    onClick={() => {
                      wordForm.setValue("direction", "across", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    type="button"
                    variant={selectedDirection === "across" ? "default" : "outline"}
                  >
                    Across
                  </Button>
                  <Button
                    aria-pressed={selectedDirection === "down"}
                    className={cn(
                      "min-h-[44px]",
                      selectedDirection === "down" && "ring-2 ring-offset-2",
                    )}
                    disabled={isSubmittingGuess}
                    onClick={() => {
                      wordForm.setValue("direction", "down", {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    type="button"
                    variant={selectedDirection === "down" ? "default" : "outline"}
                  >
                    Down
                  </Button>
                </div>
                {wordForm.formState.errors.direction ? (
                  <p className="text-sm font-medium text-red-600">Choose a direction.</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <FormLabel>{selectedDirection === "across" ? "Row target" : "Column target"}</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {wordTargetOptions.map((targetOption) => {
                    const isSelected = selectedWordIndex === targetOption.index;
                    const isDisabled = !targetOption.eligibility.eligible || isSubmittingGuess;
                    const buttonLabel =
                      selectedDirection === "across"
                        ? `Row ${targetOption.index + 1}`
                        : `Col ${targetOption.index + 1}`;

                    return (
                      <Button
                        aria-pressed={isSelected}
                        className={cn("min-h-[44px]", isSelected && "ring-2 ring-offset-2")}
                        disabled={isDisabled}
                        key={`${selectedDirection}-${targetOption.index}`}
                        onClick={() => {
                          wordForm.setValue("index", targetOption.index, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                      >
                        {buttonLabel}
                      </Button>
                    );
                  })}
                </div>
                <FormDescription>
                  Selected target cells: {selectedWordCoordinates}. Pattern: {selectedWordPattern}
                </FormDescription>
                {selectedWordEligibility.reason ? (
                  <p className="text-sm font-medium text-red-600">
                    {selectedWordEligibility.reason === "word_already_revealed"
                      ? "That target is already fully revealed."
                      : "That target includes locked unrevealed cells."}
                  </p>
                ) : null}
                {unavailableWordTargets.length > 0 ? (
                  <p className="text-sm text-brand-accentBlue">
                    Unavailable: {" "}
                    {unavailableWordTargets
                      .map((targetOption) => {
                        const reason = getWordTargetDescription(targetOption.eligibility.reason);
                        return `${getWordTargetLabel(selectedDirection, targetOption.index)} (${reason})`;
                      })
                      .join("; ")}
                  </p>
                ) : null}
              </div>

              <FormField
                control={wordForm.control}
                name="word"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Word guess</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        disabled={isSubmittingGuess}
                        inputMode="text"
                        maxLength={5}
                        placeholder="Enter 5-letter word"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Must be exactly five ASCII letters (A-Z or a-z).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={!canReviewWordGuess || isSubmittingGuess} type="submit">
                Review word guess
              </Button>
            </form>
          </Form>
        )}

        {parsedLetterResult.data ? (
          <div className="space-y-2 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">Result</p>
            <p className="text-sm font-medium">
              {parsedLetterResult.data.correct ? "Correct" : "Incorrect"} letter guess at row{" "}
              {parsedLetterResult.data.row + 1}, col {parsedLetterResult.data.col + 1}.
            </p>
            <p className="text-sm">
              Score delta: {parsedLetterResult.data.score_delta}; Opponent delta:{" "}
              {parsedLetterResult.data.opponent_score_delta}
            </p>
            {parsedLetterResult.data.correct ? (
              <p className="text-sm">Revealed: {parsedLetterResult.data.revealed_letter}</p>
            ) : null}
            <p className="text-sm">Locks enqueued: {formatLocks(parsedLetterResult.data.locks_enqueued)}</p>
          </div>
        ) : null}

        {parsedWordResult.data ? (
          <div className="space-y-2 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">Result</p>
            <p className="text-sm font-medium">
              {parsedWordResult.data.correct ? "Correct" : "Incorrect"} word guess for{" "}
              {parsedWordResult.data.direction === "across"
                ? `across row ${parsedWordResult.data.index + 1}`
                : `down col ${parsedWordResult.data.index + 1}`}
              .
            </p>
            <p className="text-sm">
              Score delta: {parsedWordResult.data.score_delta}; Opponent delta:{" "}
              {parsedWordResult.data.opponent_score_delta}
            </p>
            <p className="text-sm">
              Revealed cells: {parsedWordResult.data.revealed_cells.length}; Auto-reveals:{" "}
              {parsedWordResult.data.auto_reveals.length}
            </p>
            <p className="text-sm">Locks enqueued: {formatLocks(parsedWordResult.data.locks_enqueued)}</p>
          </div>
        ) : null}

        {parsedLetterResult.isInvalid || parsedWordResult.isInvalid ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Received an incompatible guess payload.
          </p>
        ) : null}
      </CardContent>

      <GuessConfirmDialog
        description={pendingSubmission?.summary ?? "Confirm this guess submission."}
        isSubmitting={isSubmittingGuess}
        onCancel={() => {
          if (isSubmittingGuess) {
            return;
          }

          setIsConfirmOpen(false);
          setPendingSubmission(null);
        }}
        onConfirm={() => {
          void handleConfirmSubmission();
        }}
        open={isConfirmOpen}
        title="Confirm Guess"
        warning="This action cannot be undone. Guesses can change score and lock cells."
      />

      {isCorrectionDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Close correction dialog"
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setIsCorrectionDialogOpen(false);
            }}
            type="button"
          />
          <div
            aria-modal="true"
            className="relative z-10 w-full max-w-md rounded-lg border border-brand-accentLavender bg-white p-4 shadow-lg"
            role="dialog"
          >
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-brand-primary">I said...</h3>
              <Input
                autoComplete="off"
                onChange={(event) => {
                  setCorrectionValue(event.target.value);
                }}
                value={correctionValue}
              />
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setIsCorrectionDialogOpen(false);
                  }}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirmCorrection} type="button">
                  Confirm
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
};
