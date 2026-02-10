import { Link, Navigate, Route, Routes } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GameOverPage } from "@/pages/GameOverPage";
import { NewGamePage } from "@/pages/NewGamePage";
import { SessionPage } from "@/pages/SessionPage";

const NotFoundPage = (): JSX.Element => {
  return (
    <section className="space-y-4 rounded-lg border border-border/80 bg-card p-6 text-card-foreground shadow-sm">
      <h1 className="font-display text-2xl">Page Not Found</h1>
      <p className="text-sm text-muted-foreground">The route you entered does not exist in this scaffold.</p>
      <Button asChild>
        <Link to="/">Back to New Game</Link>
      </Button>
    </section>
  );
};

export const AppRoutes = (): JSX.Element => {
  return (
    <Routes>
      <Route path="/" element={<NewGamePage />} />
      <Route path="/s/:sessionId" element={<SessionPage />} />
      <Route path="/s/:sessionId/over" element={<GameOverPage />} />
      <Route path="/game-over" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
