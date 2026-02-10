import { LoaderCircle, RefreshCw } from "lucide-react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zUuid } from "@/lib/api/schemas";
import { sessionOverRoute } from "@/lib/routing";
import { useSessionStore } from "@/state/sessionStore";

const formatTimestamp = (value: number | null): string => {
  if (!value) {
    return "Not loaded yet";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });
};

export const SessionPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();

  const snapshot = useSessionStore((state) => state.snapshot);
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);
  const lastLoadedAt = useSessionStore((state) => state.lastLoadedAt);
  const loadSession = useSessionStore((state) => state.loadSession);
  const refresh = useSessionStore((state) => state.refresh);
  const clear = useSessionStore((state) => state.clear);

  const parsedSessionId = useMemo(() => {
    return zUuid.safeParse(sessionIdParam);
  }, [sessionIdParam]);

  const validSessionId = parsedSessionId.success ? parsedSessionId.data : null;

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

    void loadSession(validSessionId);
  }, [loadSession, validSessionId]);

  useEffect(() => {
    if (!error) {
      return;
    }

    toast.error("Unable to load session.", {
      id: `session-load-error-${validSessionId ?? "unknown"}`,
      description: error
    });
  }, [error, validSessionId]);

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

  if (!validSessionId) {
    return (
      <section className="space-y-5">
        <header className="space-y-2">
          <h1 className="font-display text-3xl leading-tight">Session Error</h1>
          <p className="text-sm text-muted-foreground">This session link is not valid.</p>
        </header>
        <Card>
          <CardContent className="space-y-3 pt-6">
            <p className="text-sm text-muted-foreground">Use a valid session URL in the form `/s/:sessionId`.</p>
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
        <Badge variant="secondary" className="border border-border/60 bg-accentPeriwinkle text-primary">
          Session Snapshot
        </Badge>
        <h1 className="font-display text-2xl leading-tight">Session {validSessionId}</h1>
        <p className="text-sm text-muted-foreground">
          UI state is driven only by the latest backend snapshot for this session.
        </p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Live Session</CardTitle>
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
            <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-3 text-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading session snapshot...
            </div>
          ) : null}

          {error && !snapshot ? (
            <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button asChild variant="outline" className="tap-target w-full">
                <Link to="/">Back to New Game</Link>
              </Button>
            </div>
          ) : null}

          {snapshot ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border/70 bg-muted/15 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Status</p>
                  <p className="mt-1 font-medium">{snapshot.status}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-muted/15 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Turn</p>
                  <p className="mt-1 font-medium">Player {snapshot.current_turn}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Scores</p>
                {snapshot.players
                  .slice()
                  .sort((a, b) => a.player_number - b.player_number)
                  .map((player) => (
                    <div
                      key={player.player_number}
                      className="flex items-center justify-between rounded-md border border-border/70 bg-card px-3 py-2"
                    >
                      <span className="text-sm">
                        P{player.player_number}
                        {player.name ? ` · ${player.name}` : ""}
                      </span>
                      <span className="font-semibold">{player.score}</span>
                    </div>
                  ))}
              </div>

              <p className="text-xs text-muted-foreground">Last loaded: {formatTimestamp(lastLoadedAt)}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  );
};
