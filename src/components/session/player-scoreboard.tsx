import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlayerSnapshot } from "@/lib/api/session-snapshot";

interface PlayerScoreboardProps {
  players: PlayerSnapshot[];
  currentTurn: 1 | 2;
}

export const PlayerScoreboard = ({
  players,
  currentTurn,
}: PlayerScoreboardProps): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Players</CardTitle>
        <CardDescription>Score and grid state summary.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.map((player) => {
          const isActive = player.player_number === currentTurn;

          return (
            <article
              className={cn(
                "rounded-lg border border-brand-accentLavender bg-white p-4",
                isActive && "border-brand-accentPeriwinkle ring-1 ring-brand-accentPeriwinkle",
              )}
              key={player.player_number}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-1">
                  <p className="font-semibold">
                    Player {player.player_number}: {player.name ?? "Anonymous"}
                  </p>
                  <p className="text-sm text-brand-accentBlue">
                    Grid: <code className="font-mono">{player.grid_id}</code>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {isActive ? <Badge variant="outline">Active</Badge> : null}
                  {player.completed ? <Badge variant="secondary">Completed</Badge> : null}
                </div>
              </div>

              <p className="mt-3 text-lg font-bold">Score: {player.score}</p>
            </article>
          );
        })}
      </CardContent>
    </Card>
  );
};
