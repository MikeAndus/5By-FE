import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
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
import {
  AnswerQuestionRequestSchema,
  QuestionAnsweredEventDataSchema,
  type QuestionAnsweredEventData,
} from "@/lib/api/answer";
import { ApiClientError } from "@/lib/api/errors";
import { answerQuestion } from "@/lib/api/sessions";
import type { SessionSnapshot } from "@/lib/api/session-snapshot";
import { toastApiError } from "@/lib/toast";
import {
  isSttSupported,
  startListening,
  stopListening,
  type SttError,
  type SttListeningHandle,
} from "@/lib/voice/stt";
import { stop as stopTts } from "@/lib/voice/tts";

interface AnswerCapturePanelProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  onSnapshotUpdate: (snapshot: SessionSnapshot) => void;
}

const AnswerFormSchema = AnswerQuestionRequestSchema.pick({ answer: true });

type AnswerFormValues = z.infer<typeof AnswerFormSchema>;

interface ParsedAnsweredEvent {
  data: QuestionAnsweredEventData | null;
  isInvalid: boolean;
}

const STT_UNSUPPORTED_MESSAGE = "STT unsupported; type your answer.";

const toQuestionKey = (snapshot: SessionSnapshot): string | null => {
  const lastEvent = snapshot.last_event;

  if (!lastEvent || lastEvent.type !== "question_asked") {
    return null;
  }

  return lastEvent.created_at;
};

const toParsedAnsweredEvent = (snapshot: SessionSnapshot): ParsedAnsweredEvent => {
  const lastEvent = snapshot.last_event;

  if (!lastEvent || lastEvent.type !== "question_answered") {
    return {
      data: null,
      isInvalid: false,
    };
  }

  const parsed = QuestionAnsweredEventDataSchema.safeParse(lastEvent.event_data);

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
};

const toClearedLockPosition = (
  index: number | null,
): { row: number; col: number } | null => {
  if (index === null) {
    return null;
  }

  return {
    row: Math.floor(index / 5) + 1,
    col: (index % 5) + 1,
  };
};

export const AnswerCapturePanel = ({
  sessionId,
  snapshot,
  onSnapshotUpdate,
}: AnswerCapturePanelProps): JSX.Element => {
  const sttSupported = useMemo(() => {
    return isSttSupported();
  }, []);

  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [sttError, setSttError] = useState<SttError | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isTypedFallbackForced, setIsTypedFallbackForced] = useState(!sttSupported);
  const [isCorrectionDialogOpen, setIsCorrectionDialogOpen] = useState(false);
  const [correctionValue, setCorrectionValue] = useState("");
  const listeningHandleRef = useRef<SttListeningHandle | null>(null);
  const answerInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<AnswerFormValues>({
    resolver: zodResolver(AnswerFormSchema),
    defaultValues: {
      answer: "",
    },
  });

  const questionKey = toQuestionKey(snapshot);
  const hasPendingQuestion = questionKey !== null;
  const isSubmitting = form.formState.isSubmitting;
  const selectedAnswer = form.watch("answer");

  const parsedAnsweredEvent = useMemo(() => {
    return toParsedAnsweredEvent(snapshot);
  }, [snapshot]);

  const capturedTranscript = useMemo(() => {
    return (finalTranscript || interimTranscript).trim();
  }, [finalTranscript, interimTranscript]);

  const shouldShowTypedInput = !sttSupported || isTypedFallbackForced || sttError !== null;

  const inlineSttError = !sttSupported ? STT_UNSUPPORTED_MESSAGE : sttError?.message ?? null;

  useEffect(() => {
    return () => {
      listeningHandleRef.current?.stop();
      stopListening();
    };
  }, []);

  useEffect(() => {
    listeningHandleRef.current?.stop();
    stopListening();
    setIsListening(false);
    setInterimTranscript("");
    setFinalTranscript("");
    setSttError(null);
    setSubmitError(null);
    setIsTypedFallbackForced(!sttSupported);
    setIsCorrectionDialogOpen(false);
    setCorrectionValue("");
    form.reset({ answer: "" });
  }, [form, questionKey, sttSupported]);

  const handleStartListening = (): void => {
    if (!hasPendingQuestion || isSubmitting) {
      return;
    }

    if (!sttSupported) {
      setSttError({
        code: "unsupported",
        message: STT_UNSUPPORTED_MESSAGE,
      });
      setIsTypedFallbackForced(true);
      return;
    }

    stopTts();
    listeningHandleRef.current?.stop();
    stopListening();

    setSubmitError(null);
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
        form.setValue("answer", text, {
          shouldDirty: true,
          shouldValidate: true,
        });
      },
      onError: (error) => {
        setSttError(error);
        setIsTypedFallbackForced(true);
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

    form.setValue("answer", capturedTranscript, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleTypeInstead = (): void => {
    setIsTypedFallbackForced(true);
    answerInputRef.current?.focus();
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
    form.setValue("answer", corrected, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setIsTypedFallbackForced(true);
    setIsCorrectionDialogOpen(false);
    answerInputRef.current?.focus();
  };

  const handleSubmit = async (values: AnswerFormValues): Promise<void> => {
    setSubmitError(null);

    if (!hasPendingQuestion) {
      const message = "Ask a question to answer it.";
      setSubmitError(message);
      toast.error(message);
      return;
    }

    try {
      const nextSnapshot = await answerQuestion(sessionId, {
        player_number: snapshot.current_turn,
        answer: values.answer,
      });

      listeningHandleRef.current?.stop();
      stopListening();
      setIsListening(false);
      setInterimTranscript("");
      setFinalTranscript("");
      setSttError(null);
      setSubmitError(null);
      setIsTypedFallbackForced(!sttSupported);
      setIsCorrectionDialogOpen(false);
      setCorrectionValue("");
      form.reset({ answer: "" });

      onSnapshotUpdate(nextSnapshot);
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        let message: string | null = null;

        if (error.code === "out_of_turn") {
          message = "It's not your turn.";
        } else if (error.code === "no_pending_question") {
          message = "No pending question to answer.";
        } else if (error.code === "session_not_in_progress") {
          message = "Session is not in progress.";
        } else if (error.code === "session_not_found") {
          message = "Session not found.";
        }

        if (message) {
          setSubmitError(message);
          toast.error(message);
          return;
        }
      }

      setSubmitError("Could not submit answer. Please try again.");
      toastApiError(error);
    }
  };

  const lockClearedPosition = toClearedLockPosition(
    parsedAnsweredEvent.data?.lock_cleared_cell_index ?? null,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Answer Capture</CardTitle>
        <CardDescription>
          Capture speech when available, then confirm or edit before submitting.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasPendingQuestion ? (
          <p className="rounded-md border border-brand-accentLavender bg-brand-secondary/40 p-3 text-sm text-brand-accentBlue">
            Ask a question to answer it.
          </p>
        ) : null}

        <div className="space-y-3 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">
            Speech Capture
          </p>

          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!hasPendingQuestion || !sttSupported || isSubmitting}
              onClick={handleToggleListening}
              type="button"
            >
              {isListening ? "Stop" : "Start listening"}
            </Button>

            <Button
              disabled={!capturedTranscript || isSubmitting || !hasPendingQuestion}
              onClick={handleUseTranscript}
              type="button"
              variant="secondary"
            >
              Use transcript
            </Button>

            {capturedTranscript ? (
              <Button
                disabled={isSubmitting || !hasPendingQuestion}
                onClick={handleOpenCorrectionDialog}
                type="button"
                variant="outline"
              >
                I said...
              </Button>
            ) : null}

            <Button
              disabled={isSubmitting || !hasPendingQuestion}
              onClick={handleTypeInstead}
              type="button"
              variant="outline"
            >
              Type instead
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

          {inlineSttError ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {inlineSttError}
            </p>
          ) : null}
        </div>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            {shouldShowTypedInput ? (
              <FormField
                control={form.control}
                name="answer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Answer</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="off"
                        disabled={isSubmitting || !hasPendingQuestion}
                        maxLength={100}
                        placeholder="Type your answer"
                        {...field}
                        ref={(node) => {
                          field.ref(node);
                          answerInputRef.current = node;
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter 1-100 characters. Backend validates and decides correctness.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <p className="text-sm text-brand-accentBlue">
                Selected answer: {selectedAnswer || "Use speech capture or choose Type instead."}
              </p>
            )}

            {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

            <Button disabled={isSubmitting || !hasPendingQuestion} type="submit">
              {isSubmitting ? "Submitting..." : "Submit answer"}
            </Button>
          </form>
        </Form>

        {parsedAnsweredEvent.data ? (
          <div className="space-y-2 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">Result</p>
            {parsedAnsweredEvent.data.correct ? (
              <p className="text-sm font-medium">
                Correct - revealed {parsedAnsweredEvent.data.revealed_letter ?? "?"}.
              </p>
            ) : (
              <p className="text-sm font-medium">Incorrect.</p>
            )}
            {parsedAnsweredEvent.data.correct && lockClearedPosition ? (
              <p className="text-sm text-brand-accentBlue">
                Cleared a lock on row {lockClearedPosition.row}, col {lockClearedPosition.col}.
              </p>
            ) : null}
            <p className="text-sm">Next turn: Player {snapshot.current_turn}</p>
          </div>
        ) : null}

        {parsedAnsweredEvent.isInvalid ? (
          <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Received an incompatible question_answered payload.
          </p>
        ) : null}
      </CardContent>

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
                maxLength={100}
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
