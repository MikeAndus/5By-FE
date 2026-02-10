import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { sessionRoute } from "@/lib/routing";

interface SessionLinkCardProps {
  sessionId: string;
}

const getShareLink = (sessionId: string): string => {
  const route = sessionRoute(sessionId);
  if (typeof window === "undefined") {
    return route;
  }

  return `${window.location.origin}${route}`;
};

export const SessionLinkCard = ({ sessionId }: SessionLinkCardProps): JSX.Element => {
  const shareLink = getShareLink(sessionId);

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success("Session link copied.");
    } catch {
      toast.error("Couldn't copy session link.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input value={shareLink} readOnly aria-label="Shareable session link" />
        <Button type="button" variant="outline" className="w-full gap-2" onClick={handleCopyLink}>
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy Link
        </Button>
      </CardContent>
    </Card>
  );
};
