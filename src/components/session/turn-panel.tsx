import { useState } from "react";
import { AnswerCapturePanel } from "@/components/session/answer-capture-panel";
import { AskQuestionPanel } from "@/components/session/ask-question-panel";
import { GuessPanel } from "@/components/session/guess-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PlayerSnapshot, SessionSnapshot } from "@/lib/api/session-snapshot";
import { cn } from "@/lib/utils";

interface TurnPanelProps {
  sessionId: string;
  snapshot: SessionSnapshot;
  activePlayer: PlayerSnapshot;
  onSnapshotUpdate: (snapshot: SessionSnapshot) => void;
}

export const TurnPanel = ({
  sessionId,
  snapshot,
  activePlayer,
  onSnapshotUpdate,
}: TurnPanelProps): JSX.Element => {
  const [mode, setMode] = useState<"ask" | "guess">("ask");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Your Turn</CardTitle>
          <CardDescription>Choose how Player {snapshot.current_turn} will act.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              aria-pressed={mode === "ask"}
              className={cn("min-h-[44px]", mode === "ask" && "ring-2 ring-offset-2")}
              onClick={() => {
                setMode("ask");
              }}
              type="button"
              variant={mode === "ask" ? "default" : "outline"}
            >
              Ask a Question
            </Button>
            <Button
              aria-pressed={mode === "guess"}
              className={cn("min-h-[44px]", mode === "guess" && "ring-2 ring-offset-2")}
              onClick={() => {
                setMode("guess");
              }}
              type="button"
              variant={mode === "guess" ? "default" : "outline"}
            >
              Make a Guess
            </Button>
          </div>

          {mode === "guess" ? (
            <p className="rounded-md border border-brand-accentOrange/40 bg-brand-accentOrange/10 p-3 text-sm text-brand-primary">
              Guesses are risky: wrong guesses cost -5 and give the opponent +1, and may lock
              cells.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {mode === "ask" ? (
        <div className="space-y-4">
          <AskQuestionPanel
            activePlayer={activePlayer}
            onSnapshotUpdate={onSnapshotUpdate}
            sessionId={sessionId}
            snapshot={snapshot}
          />
          <AnswerCapturePanel
            onSnapshotUpdate={onSnapshotUpdate}
            sessionId={sessionId}
            snapshot={snapshot}
          />
        </div>
      ) : (
        <GuessPanel
          activePlayer={activePlayer}
          onSnapshotUpdate={onSnapshotUpdate}
          sessionId={sessionId}
          snapshot={snapshot}
        />
      )}
    </div>
  );
};
