import { LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ScoreboardCard } from "@/components/session/ScoreboardCard";
import { SessionLinkCard } from "@/components/session/SessionLinkCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { SessionSnapshot } from "@/lib/api/schemas";
import { isUuidLike, sessionOverRoute } from "@/lib/routing";
import { useSessionStore } from "@/state/sessionStore";

const getPlayerDisplayName = (
  playerNumber: 1 | 2,
  players: SessionSnapshot["players"]
): string => {
  const player = players.find((item) => item.player_number === playerNumber);
  const trimmedName = player?.name?.trim();
  if (!trimmedName) {
    return `Player ${playerNumber}`;
  }

  return trimmedName;
};

const getLoadErrorMessage = (errorStatus: number | null, error: string | null): string => {
  if (errorStatus === 404) {
    return "Session not found or expired.";
  }

  if (error === "Unexpected server response.") {
    return error;
  }

  return "Couldn't load session. Please try again.";
};

export const SessionPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();

  const snapshot = useSessionStore((state) => state.snapshot);
  const storeSessionId = useSessionStore((state) => state.sessionId);
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);
  const errorStatus = useSessionStore((state) => state.errorStatus);
  const loadSession = useSessionStore((state) => state.loadSession);
  const refresh = useSessionStore((state) => state.refresh);
  const clear = useSessionStore((state) => state.clear);

  const validSessionId = useMemo(() => {
    const trimmedSessionId = sessionIdParam?.trim();
    if (!trimmedSessionId || !isUuidLike(trimmedSessionId)) {
      return null;
    }

    return trimmedSessionId;
  }, [sessionIdParam]);

  useEffect(() => {
    if (validSessionId) {
      return;
    }

    clear();
    toast.error("Invalid session link.", {
      id: `invalid-session-${sessionIdParam ?? "missing"}`,
      description: "This URL must include a valid session UUID."
    });
  }, [clear, sessionIdParam, validSessionId]);

  useEffect(() => {
    if (!validSessionId) {
      return;
    }

    if (storeSessionId === validSessionId && snapshot) {
      return;
    }

    void loadSession(validSessionId);
  }, [loadSession, snapshot, storeSessionId, validSessionId]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error(getLoadErrorMessage(errorStatus, error), {
      id: `session-load-error-${validSessionId ?? "unknown"}`,
      description: error
    });
  }, [error, errorStatus, validSessionId]);

  useEffect(() => {
    if (!validSessionId || !snapshot) {
      return;
    }

    if (snapshot.status === "complete") {
      navigate(sessionOverRoute(validSessionId), { replace: true });
    }
  }, [navigate, snapshot, validSessionId]);

  const handleRefresh = (): void => {
    void refresh();
  };

  const loadErrorMessage = getLoadErrorMessage(errorStatus, error);
  const currentTurnLabel = snapshot
    ? getPlayerDisplayName(snapshot.current_turn, snapshot.players)
    : null;
  const isNotFoundError = errorStatus === 404;

  if (!validSessionId) {
    return (
      <section className="space-y-5">
        <header className="space-y-2">
          <h1 className="font-display text-3xl leading-tight">Session</h1>
          <p className="text-sm text-muted-foreground">Invalid session link.</p>
        </header>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Use a valid session URL in the format `/s/:sessionId`.
            </p>
            <Button asChild className="tap-target w-full text-base">
              <Link to="/">Back to New Game</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <Badge
          variant={snapshot?.status === "complete" ? "default" : "secondary"}
          className="border border-border/60 bg-accentPeriwinkle text-primary"
        >
          {snapshot ? snapshot.status : "loading"}
        </Badge>
        <h1 className="font-display text-2xl leading-tight">Game Session</h1>
        <p className="break-all text-sm text-muted-foreground">{validSessionId}</p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Session Status</CardTitle>
          <Button
            type="button"
            variant="outline"
            className="tap-target gap-2"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && !snapshot ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-3 text-sm">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading session snapshot...
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : null}

          {error && !snapshot ? (
            <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{loadErrorMessage}</p>
              {isNotFoundError ? (
                <Button asChild variant="outline" className="tap-target w-full">
                  <Link to="/">Back to New Game</Link>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="tap-target w-full"
                  onClick={() => void loadSession(validSessionId)}
                  disabled={loading}
                >
                  Retry
                </Button>
              )}
            </div>
          ) : null}

          {snapshot ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-muted/15 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium">{snapshot.status}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/15 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Turn</p>
                  <p className="mt-1 font-medium">{currentTurnLabel}</p>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {snapshot ? <ScoreboardCard players={snapshot.players} currentTurn={snapshot.current_turn} /> : null}
      {snapshot ? <SessionLinkCard sessionId={validSessionId} /> : null}
    </section>
  );
};
