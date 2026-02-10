import { HelpCircle, Lightbulb, Mic } from "lucide-react";
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const PLACEHOLDER_GRID = Array.from({ length: 25 }, (_, index) => index);

export const SessionPage = (): JSX.Element => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const resolvedSessionId = sessionId ?? "missing-session-id";

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="border border-border/60 bg-accentPeriwinkle text-primary">
          Session Placeholder
        </Badge>
        <h1 className="font-display text-2xl leading-tight">Session {resolvedSessionId}</h1>
        <p className="text-sm text-muted-foreground">
          Voice and realtime gameplay state will be connected in downstream nodes.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mic className="h-5 w-5" aria-hidden="true" />
            Turn Screen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Button size="lg" className="h-14 text-base">
              <HelpCircle className="mr-2 h-5 w-5" aria-hidden="true" />
              Ask a Question
            </Button>
            <Button size="lg" variant="outline" className="h-14 text-base">
              <Lightbulb className="mr-2 h-5 w-5" aria-hidden="true" />
              Make a Guess
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-5 gap-2">
            {PLACEHOLDER_GRID.map((cell) => (
              <Skeleton key={cell} className="aspect-square rounded-md" />
            ))}
          </div>

          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">State snapshot</p>
            <p className="mt-1 text-sm text-muted-foreground">(not loaded)</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
