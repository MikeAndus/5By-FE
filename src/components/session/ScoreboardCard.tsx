import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SessionSnapshot } from "@/lib/api/schemas";
import { cn } from "@/lib/utils";

interface ScoreboardCardProps {
  players: SessionSnapshot["players"];
  currentTurn: 1 | 2;
}

const getPlayerLabel = (player: SessionSnapshot["players"][number]): string => {
  const trimmedName = player.name?.trim();
  if (!trimmedName) {
    return `Player ${player.player_number}`;
  }

  return trimmedName;
};

export const ScoreboardCard = ({ players, currentTurn }: ScoreboardCardProps): JSX.Element => {
  const orderedPlayers = players.slice().sort((a, b) => a.player_number - b.player_number);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scoreboard</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orderedPlayers.map((player) => (
          <div
            key={player.player_number}
            className={cn(
              "flex items-center justify-between rounded-md border px-4 py-3",
              player.player_number === currentTurn
                ? "border-primary/40 bg-primary/5"
                : "border-border/70 bg-muted/20"
            )}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium">{getPlayerLabel(player)}</p>
              <p className="text-xs text-muted-foreground">Player {player.player_number}</p>
            </div>
            <p className="text-xl font-semibold tabular-nums">{player.score}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
