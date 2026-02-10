import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock } from "lucide-react";
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
import { ApiClientError } from "@/lib/api/errors";
import { QuestionAskedEventDataSchema } from "@/lib/api/ask";
import {
  TopicSchema,
  type PlayerSnapshot,
  type SessionSnapshot,
  type Topic,
} from "@/lib/api/session-snapshot";
import { askQuestion } from "@/lib/api/sessions";
import { toastApiError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { isTtsSupported, speak, stop } from "@/lib/voice/tts";

const AskFormSchema = z.object({
  cell_index: z.number().int().min(0).max(24),
  topic: TopicSchema,
});

type AskFormValues = z.infer<typeof AskFormSchema>;

type TtsStatus = "idle" | "queued" | "speaking" | "unavailable" | "failed";

interface LatestQuestion {
  text: string;
  topic: Topic;
  row: number;
  col: number;
  cellIndex: number;
  createdAt: string;
}

interface AskQuestionPanelProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  activePlayer: PlayerSnapshot;
  onSnapshotUpdate: (snapshot: SessionSnapshot) => void;
}

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

const toLatestQuestion = (snapshot: SessionSnapshot): LatestQuestion | null => {
  const lastEvent = snapshot.last_event;

  if (!lastEvent || lastEvent.type !== "question_asked") {
    return null;
  }

  const parsed = QuestionAskedEventDataSchema.safeParse(lastEvent.event_data);

  if (!parsed.success) {
    return null;
  }

  return {
    text: parsed.data.question_text,
    topic: parsed.data.topic,
    row: parsed.data.row,
    col: parsed.data.col,
    cellIndex: parsed.data.cell_index,
    createdAt: lastEvent.created_at,
  };
};

const getTtsStatusText = (status: TtsStatus): string => {
  if (status === "queued") {
    return "TTS: queued";
  }

  if (status === "speaking") {
    return "TTS: speaking...";
  }

  if (status === "unavailable") {
    return "TTS unavailable; read the question on screen.";
  }

  if (status === "failed") {
    return "TTS failed; read the question on screen.";
  }

  return "TTS ready.";
};

export const AskQuestionPanel = ({
  sessionId,
  snapshot,
  activePlayer,
  onSnapshotUpdate,
}: AskQuestionPanelProps): JSX.Element => {
  const [latestQuestion, setLatestQuestion] = useState<LatestQuestion | null>(() => {
    return toLatestQuestion(snapshot);
  });
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>(() => {
    return isTtsSupported() ? "idle" : "unavailable";
  });
  const [systemMessage, setSystemMessage] = useState<string>(
    "Select a square and a topic to ask a question.",
  );

  const form = useForm<AskFormValues>({
    resolver: zodResolver(AskFormSchema),
  });

  const orderedCells = useMemo(() => {
    return activePlayer.cells.slice().sort((a, b) => a.index - b.index);
  }, [activePlayer.cells]);

  const selectedCellIndex = form.watch("cell_index");
  const selectedCell = orderedCells.find((cell) => cell.index === selectedCellIndex) ?? null;
  const isSubmitting = form.formState.isSubmitting;

  useEffect(() => {
    const parsedQuestion = toLatestQuestion(snapshot);

    if (!parsedQuestion) {
      return;
    }

    setLatestQuestion((currentQuestion) => {
      if (currentQuestion?.createdAt === parsedQuestion.createdAt) {
        return currentQuestion;
      }

      return parsedQuestion;
    });
  }, [snapshot]);

  useEffect(() => {
    if (selectedCell && selectedCell.revealed) {
      form.resetField("cell_index");
    }
  }, [form, selectedCell]);

  const handleAskQuestion = async (values: AskFormValues): Promise<void> => {
    setSystemMessage("Submitting question...");

    try {
      const nextSnapshot = await askQuestion(sessionId, {
        player_number: snapshot.current_turn,
        cell_index: values.cell_index,
        topic: values.topic,
      });

      onSnapshotUpdate(nextSnapshot);

      const lastEvent = nextSnapshot.last_event;
      if (!lastEvent || lastEvent.type !== "question_asked") {
        setSystemMessage("Question submitted. Awaiting question payload.");
        setTtsStatus(isTtsSupported() ? "idle" : "unavailable");
        return;
      }

      const parsedEventData = QuestionAskedEventDataSchema.safeParse(lastEvent.event_data);
      if (!parsedEventData.success) {
        toast.error("Incompatible question payload.");
        setSystemMessage("Question received with an incompatible payload.");
        setTtsStatus("failed");
        return;
      }

      const nextQuestion: LatestQuestion = {
        text: parsedEventData.data.question_text,
        topic: parsedEventData.data.topic,
        row: parsedEventData.data.row,
        col: parsedEventData.data.col,
        cellIndex: parsedEventData.data.cell_index,
        createdAt: lastEvent.created_at,
      };

      setLatestQuestion(nextQuestion);
      setSystemMessage(
        `Asked ${nextQuestion.topic} for row ${nextQuestion.row + 1}, col ${nextQuestion.col + 1}.`,
      );

      if (!isTtsSupported()) {
        setTtsStatus("unavailable");
        return;
      }

      try {
        setTtsStatus("queued");
        await speak(nextQuestion.text);
        setTtsStatus("speaking");
      } catch (ttsError: unknown) {
        setTtsStatus("failed");
        const message =
          ttsError instanceof Error
            ? ttsError.message
            : "Could not play speech. Read the question on screen.";
        toast.error(message);
      }
    } catch (error: unknown) {
      if (error instanceof ApiClientError) {
        if (error.code === "out_of_turn") {
          toast.error("It's not your turn.");
          return;
        }

        if (error.code === "topics_exhausted") {
          toast.error("No topics remaining for this cell.");
          return;
        }

        if (error.code === "session_not_in_progress") {
          toast.error("Session is not in progress.");
          return;
        }

        if (error.code === "session_not_found") {
          toast.error("Session not found.");
          return;
        }
      }

      toastApiError(error);
      setSystemMessage("Ask request failed. Choose a square/topic and try again.");
    }
  };

  const handleRepeatQuestion = async (): Promise<void> => {
    if (!latestQuestion) {
      return;
    }

    if (!isTtsSupported()) {
      setTtsStatus("unavailable");
      toast.error("TTS unavailable in this browser.");
      return;
    }

    try {
      setTtsStatus("queued");
      await speak(latestQuestion.text);
      setTtsStatus("speaking");
      setSystemMessage("Repeated the latest question.");
    } catch (error: unknown) {
      setTtsStatus("failed");
      const message =
        error instanceof Error
          ? error.message
          : "Could not repeat speech. Read the question on screen.";
      toast.error(message);
    }
  };

  const handleSkipTurnStub = (): void => {
    stop();
    toast.info("Skip turn not implemented yet.");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ask a Question</CardTitle>
        <CardDescription>
          Choose an unrevealed square and one canonical topic for the active player.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleAskQuestion)}>
            <FormField
              control={form.control}
              name="cell_index"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select square</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-5 gap-2">
                      {orderedCells.map((cell) => {
                        const isSelected = field.value === cell.index;
                        const isRevealed = cell.revealed;

                        return (
                          <Button
                            aria-label={buildCellAriaLabel(
                              cell.row,
                              cell.col,
                              cell.locked,
                              isRevealed,
                            )}
                            aria-pressed={isSelected}
                            className={cn(
                              "relative h-12 min-h-[48px] min-w-[48px] w-12 p-0 text-base",
                              isRevealed &&
                                "cursor-not-allowed border-brand-accentLavender bg-brand-accentLavender/30 text-brand-accentBlue",
                              isSelected &&
                                "ring-2 ring-brand-accentPeriwinkle ring-offset-2",
                            )}
                            disabled={isRevealed || isSubmitting}
                            key={cell.index}
                            onClick={() => {
                              field.onChange(cell.index);
                            }}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                          >
                            <span>{isRevealed ? cell.letter : "•"}</span>
                            {cell.locked ? (
                              <Lock
                                aria-hidden="true"
                                className="absolute right-1 top-1 h-3.5 w-3.5"
                              />
                            ) : null}
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Revealed squares are disabled. Locked squares are selectable and marked with a
                    lock.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="topic"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select topic</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {snapshot.topics.map((topic) => {
                        const isSelected = field.value === topic;

                        return (
                          <Button
                            aria-pressed={isSelected}
                            className={cn("min-h-[44px]", isSelected && "ring-2 ring-offset-2")}
                            disabled={isSubmitting}
                            key={topic}
                            onClick={() => {
                              field.onChange(topic);
                            }}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                          >
                            {topic}
                          </Button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedCell ? (
              <p className="text-sm text-brand-accentBlue">
                Selected cell topics used: {selectedCell.topics_used.length}/5
              </p>
            ) : null}

            <Button disabled={isSubmitting} type="submit">
              {isSubmitting ? "Asking..." : "Ask Question"}
            </Button>
          </form>
        </Form>

        <div className="space-y-4 rounded-lg border border-brand-accentLavender bg-brand-secondary/40 p-4">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">
              Question
            </p>
            {latestQuestion ? (
              <div className="space-y-2">
                <p className="text-base font-semibold text-brand-primary">{latestQuestion.text}</p>
                <p className="text-sm text-brand-accentBlue">
                  Topic: {latestQuestion.topic} | Row {latestQuestion.row + 1}, Col{" "}
                  {latestQuestion.col + 1}
                </p>
              </div>
            ) : (
              <p className="text-sm text-brand-accentBlue">
                Ask a question to display the latest prompt here.
              </p>
            )}
          </div>

          <div className="space-y-2 border-t border-brand-accentLavender pt-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-accentBlue">
              TTS / Status
            </p>
            <p className="text-sm">{getTtsStatusText(ttsStatus)}</p>
            <p className="text-sm text-brand-accentBlue">{systemMessage}</p>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-brand-accentLavender pt-3">
            <Button
              disabled={!latestQuestion || isSubmitting}
              onClick={() => {
                void handleRepeatQuestion();
              }}
              type="button"
              variant="secondary"
            >
              Repeat question
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleSkipTurnStub}
              type="button"
              variant="outline"
            >
              Skip turn
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
