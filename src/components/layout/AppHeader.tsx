import { Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

export const AppHeader = (): JSX.Element => {
  return (
    <header className="rounded-lg border border-border/70 bg-card/80 p-3 text-card-foreground shadow-sm backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <Logo className="h-8 w-8 rounded-full object-cover" />
          <div className="min-w-0">
            <p className="font-display text-lg leading-none">Five-By</p>
            <p className="truncate text-xs text-muted-foreground">Session Snapshot UI Foundation</p>
          </div>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          <Button asChild variant="ghost" size="icon" className="tap-target" aria-label="New game">
            <Link to="/">
              <Home className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};
