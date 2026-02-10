import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SessionStatus } from "@/lib/api/session-snapshot";

interface SessionHeaderProps {
  sessionId: string;
  status: SessionStatus;
  currentTurn: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}

const formatStatusLabel = (status: SessionStatus): string => {
  if (status === "in_progress") {
    return "In Progress";
  }

  return "Complete";
};

export const SessionHeader = ({
  sessionId,
  status,
  currentTurn,
  isRefreshing,
  onRefresh,
}: SessionHeaderProps): JSX.Element => {
  const handleClickCopySessionId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(sessionId);
      toast.success("Session ID copied.");
    } catch {
      toast.error("Could not copy session ID.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Viewer</CardTitle>
        <CardDescription>Read-only snapshot for this session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={status === "complete" ? "secondary" : "default"}>
            {formatStatusLabel(status)}
          </Badge>
          <Badge variant="outline">Current turn: Player {currentTurn}</Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-brand-accentLavender bg-brand-secondary/40 p-3">
          <p className="text-xs uppercase tracking-wide text-brand-accentBlue">
            Session ID
          </p>
          <code className="overflow-x-auto font-mono text-sm">{sessionId}</code>
          <Button onClick={handleClickCopySessionId} size="sm" variant="secondary">
            Copy
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={isRefreshing} onClick={onRefresh} variant="secondary">
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Back to home</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
