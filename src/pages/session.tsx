import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { ActivePlayerCellsDebug } from "@/components/session/active-player-cells-debug";
import { AskQuestionPanel } from "@/components/session/ask-question-panel";
import { GameplayInstructions } from "@/components/session/gameplay-instructions";
import { PlayerScoreboard } from "@/components/session/player-scoreboard";
import { SessionHeader } from "@/components/session/session-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/errors";
import { getSessionSnapshot } from "@/lib/api/sessions";
import type { SessionSnapshot } from "@/lib/api/session-snapshot";
import { toastApiError } from "@/lib/toast";

const SessionIdParamSchema = z.string().uuid();

type SessionLoadStatus = "idle" | "loading" | "success" | "error";
const POLL_INTERVAL_MS = 5000;

interface FetchSnapshotOptions {
  silent?: boolean;
}

interface ErrorStateCardProps {
  title: string;
  description: string;
  showRetry: boolean;
  isLoading: boolean;
  onRetry: () => void;
}

const ErrorStateCard = ({
  title,
  description,
  showRetry,
  isLoading,
  onRetry,
}: ErrorStateCardProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {showRetry ? (
          <Button disabled={isLoading} onClick={onRetry} variant="secondary">
            {isLoading ? "Loading..." : "Retry"}
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link to="/">Back to home</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export const SessionPage = (): JSX.Element => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [status, setStatus] = useState<SessionLoadStatus>("idle");
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const snapshotRef = useRef<SessionSnapshot | null>(null);

  const parsedSessionId = SessionIdParamSchema.safeParse(sessionId);
  const validSessionId = parsedSessionId.success ? parsedSessionId.data : null;

  useEffect(() => {
    snapshotRef.current = snapshot;
  }, [snapshot]);

  const fetchSnapshot = useCallback(
    async (options: FetchSnapshotOptions = {}): Promise<void> => {
      const { silent = false } = options;

      if (!validSessionId) {
        return;
      }

      const hasSnapshot = snapshotRef.current !== null;

      if (!silent) {
        if (hasSnapshot) {
          setIsRefreshing(true);
        } else {
          setStatus("loading");
        }

        setError(null);
      }

      try {
        const nextSnapshot = await getSessionSnapshot(validSessionId);

        setSnapshot(nextSnapshot);
        setError(null);
        setStatus("success");
      } catch (nextError: unknown) {
        if (!silent) {
          if (!hasSnapshot) {
            setSnapshot(null);
            setError(nextError);
            setStatus("error");
          }

          toastApiError(nextError);
        }
      } finally {
        if (!silent) {
          setIsRefreshing(false);
        }
      }
    },
    [validSessionId],
  );

  useEffect(() => {
    if (!validSessionId) {
      snapshotRef.current = null;
      return;
    }

    snapshotRef.current = null;
    setSnapshot(null);
    setError(null);
    setStatus("idle");
    void fetchSnapshot();
  }, [fetchSnapshot, validSessionId]);

  useEffect(() => {
    if (!validSessionId) {
      setStatus("idle");
      setSnapshot(null);
      setError(null);
      setIsRefreshing(false);
      snapshotRef.current = null;
      return;
    }

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void fetchSnapshot({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchSnapshot, validSessionId]);

  const handleRetry = (): void => {
    void fetchSnapshot({ silent: false });
  };

  const handleSnapshotUpdate = (nextSnapshot: SessionSnapshot): void => {
    snapshotRef.current = nextSnapshot;
    setSnapshot(nextSnapshot);
    setError(null);
    setStatus("success");
  };

  const isLoading = status === "loading";

  if (!validSessionId) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <ErrorStateCard
          description="Session IDs must be UUID values."
          isLoading={false}
          onRetry={handleRetry}
          showRetry={false}
          title="Invalid session id"
        />
      </section>
    );
  }

  if (status === "loading" && !snapshot) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Loading session</CardTitle>
            <CardDescription>Fetching snapshot from the backend.</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button disabled variant="secondary">
              Loading...
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  } else if (status === "error") {
    const apiError = error instanceof ApiClientError ? error : null;

    if (apiError?.code === "session_not_found") {
      return (
        <section className="mx-auto w-full max-w-4xl">
          <ErrorStateCard
            description="No session exists for this ID."
            isLoading={isLoading}
            onRetry={handleRetry}
            showRetry={true}
            title="Session not found"
          />
        </section>
      );
    }

    if (apiError?.code === "validation_error") {
      return (
        <section className="mx-auto w-full max-w-4xl">
          <ErrorStateCard
            description="The backend rejected the session ID format."
            isLoading={isLoading}
            onRetry={handleRetry}
            showRetry={false}
            title="Invalid session id"
          />
        </section>
      );
    }

    if (apiError?.code === "invalid_response_shape") {
      return (
        <section className="mx-auto w-full max-w-4xl">
          <ErrorStateCard
            description="Snapshot response does not match the Phase Contract. Check backend and frontend versions."
            isLoading={isLoading}
            onRetry={handleRetry}
            showRetry={true}
            title="Incompatible API response"
          />
        </section>
      );
    }

    return (
      <section className="mx-auto w-full max-w-4xl">
        <ErrorStateCard
          description="Could not load session. Please retry."
          isLoading={isLoading}
          onRetry={handleRetry}
          showRetry={true}
          title="Could not load session"
        />
      </section>
    );
  } else if (!snapshot) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <ErrorStateCard
          description="Snapshot is unavailable."
          isLoading={false}
          onRetry={handleRetry}
          showRetry={true}
          title="Could not load session"
        />
      </section>
    );
  }

  const activePlayer =
    snapshot.players.find((player) => player.player_number === snapshot.current_turn) ??
    null;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <SessionHeader
        currentTurn={snapshot.current_turn}
        isRefreshing={isRefreshing}
        onRefresh={handleRetry}
        sessionId={snapshot.session_id}
        status={snapshot.status}
      />

      <GameplayInstructions />

      <Card>
        <CardHeader>
          <CardTitle>Topics</CardTitle>
          <CardDescription>Canonical topic order from backend snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {snapshot.topics.map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
            </Badge>
          ))}
        </CardContent>
      </Card>

      <PlayerScoreboard currentTurn={snapshot.current_turn} players={snapshot.players} />

      {snapshot.status === "in_progress" && activePlayer ? (
        <AskQuestionPanel
          activePlayer={activePlayer}
          onSnapshotUpdate={handleSnapshotUpdate}
          sessionId={snapshot.session_id}
          snapshot={snapshot}
        />
      ) : null}

      <ActivePlayerCellsDebug activePlayer={activePlayer} />

      {snapshot.last_event ? (
        <Card>
          <CardHeader>
            <CardTitle>Last Event</CardTitle>
            <CardDescription>Developer-facing event payload.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge>{snapshot.last_event.type}</Badge>
              <Badge variant="outline">{snapshot.last_event.created_at}</Badge>
            </div>
            <pre className="overflow-x-auto rounded-md border border-brand-accentLavender bg-brand-secondary/50 p-3 text-xs">
              {JSON.stringify(snapshot.last_event.event_data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
};
