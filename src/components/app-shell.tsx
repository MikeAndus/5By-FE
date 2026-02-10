import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Sonner } from "@/components/ui/sonner";

interface AppShellProps {
  children: ReactNode;
}

const DARK_LOGO_URL =
  "https://assets.dev.anduslabs.com/kanban/logos/andus_logo_white.png";

export const AppShell = ({ children }: AppShellProps): JSX.Element => {
  return (
    <div className="min-h-screen bg-brand-secondary font-body text-brand-primary">
      <header className="border-b border-brand-accentLavender bg-brand-primary text-brand-secondary">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link className="inline-flex items-center gap-3" to="/">
            <img
              alt="Andus Labs logo"
              className="h-8 w-auto sm:h-9"
              src={DARK_LOGO_URL}
            />
            <span className="font-heading text-lg font-bold tracking-wide">
              Five-By
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>

      <Sonner />
    </div>
  );
};
