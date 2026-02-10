import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const GameplayInstructions = (): JSX.Element => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gameplay Instructions</CardTitle>
        <CardDescription>Phase 2 MVP guidance for reconnect + read-only play.</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="list-disc space-y-2 pl-5 text-sm text-brand-accentBlue">
          <li>Sessions are anonymous. Share this URL to reconnect on another device.</li>
          <li>
            Backend state is authoritative. Use Refresh if the view looks stale.
          </li>
          <li>
            Each player has a separate grid, and the active player is highlighted by
            Current turn.
          </li>
          <li>Topics are canonical and shown in order below.</li>
        </ul>
      </CardContent>
    </Card>
  );
};
