import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ScoreRow {
  name: string;
  score: number;
}

const PLACEHOLDER_SCORES: ScoreRow[] = [
  { name: "Player 1", score: 4 },
  { name: "Player 2", score: 3 }
];

export const GameOverPage = (): JSX.Element => {
  const navigate = useNavigate();

  const handlePlayAgain = (): void => {
    navigate("/");
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <h1 className="font-display text-3xl leading-tight">Game Over</h1>
        <p className="text-sm text-muted-foreground">Final scores are placeholders until gameplay state is integrated.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-accentOrange" aria-hidden="true" />
            Final Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PLACEHOLDER_SCORES.map((row) => (
            <div key={row.name} className="flex items-center justify-between rounded-md border border-border/70 bg-muted/20 px-3 py-2">
              <span>{row.name}</span>
              <span className="font-semibold">{row.score}</span>
            </div>
          ))}
          <Button className="mt-4 h-12 w-full text-base" onClick={handlePlayAgain}>
            Play Again
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
