import { LoaderCircle, RefreshCw, Trophy } from "lucide-react";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { zUuid } from "@/lib/api/schemas";
import { sessionRoute } from "@/lib/routing";
import { useSessionStore } from "@/state/sessionStore";

export const GameOverPage = (): JSX.Element => {
  const navigate = useNavigate();
  const { sessionId: sessionIdParam } = useParams<{ sessionId: string }>();

  const snapshot = useSessionStore((state) => state.snapshot);
  const loading = useSessionStore((state) => state.loading);
  const error = useSessionStore((state) => state.error);
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
      id: `invalid-game-over-session-${sessionIdParam ?? "missing"}`,
      description: "Game-over links must include a valid session UUID."
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

    toast.error("Unable to load final snapshot.", {
      id: `game-over-load-error-${validSessionId ?? "unknown"}`,
      description: error
    });
  }, [error, validSessionId]);

  useEffect(() => {
    if (!validSessionId || !snapshot) {
      return;
    }

    if (snapshot.status !== "complete") {
      navigate(sessionRoute(validSessionId), { replace: true });
    }
  }, [navigate, snapshot, validSessionId]);

  const handleRefresh = (): void => {
    void refresh();
  };

  const handlePlayAgain = (): void => {
    navigate("/", { replace: true });
  };

  if (!validSessionId) {
    return (
      <section className="space-y-5">
        <header className="space-y-2">
          <h1 className="font-display text-3xl leading-tight">Game Over</h1>
          <p className="text-sm text-muted-foreground">This screen requires a valid session link.</p>
        </header>
        <Card>
          <CardContent className="space-y-3 pt-6">
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
        <h1 className="font-display text-3xl leading-tight">Game Over</h1>
        <p className="text-sm text-muted-foreground">Final results are rendered from the latest session snapshot.</p>
      </header>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-accentOrange" aria-hidden="true" />
            Final Scores
          </CardTitle>
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
        <CardContent className="space-y-3">
          {loading && !snapshot ? (
            <div className="flex items-center gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-3 text-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Loading final snapshot...
            </div>
          ) : null}

          {error && !snapshot ? <p className="text-sm text-destructive">{error}</p> : null}

          {snapshot ? (
            <>
              {snapshot.players
                .slice()
                .sort((a, b) => a.player_number - b.player_number)
                .map((player) => (
                  <div
                    key={player.player_number}
                    className="flex items-center justify-between rounded-md border border-border/70 bg-muted/20 px-3 py-2"
                  >
                    <span>
                      P{player.player_number}
                      {player.name ? ` · ${player.name}` : ""}
                    </span>
                    <span className="font-semibold">{player.score}</span>
                  </div>
                ))}
            </>
          ) : null}

          <Button className="tap-target mt-4 w-full text-base" onClick={handlePlayAgain}>
            Play Again
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
