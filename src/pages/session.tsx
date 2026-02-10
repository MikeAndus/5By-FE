import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getHealth } from "@/lib/api/health";
import { toastApiError } from "@/lib/toast";

export const SessionPage = (): JSX.Element => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [isLoading, setIsLoading] = useState(false);

  const handleClickHealth = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const health = await getHealth();

      toast.success(
        `Backend healthy: ${health.service} (db: ${health.db.status})`,
      );
    } catch (error: unknown) {
      toastApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>Session Link</CardTitle>
          <CardDescription>
            Display-only route scaffold for future session integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p>
            Session ID: <span className="font-semibold">{sessionId ?? "N/A"}</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={isLoading} onClick={handleClickHealth} variant="secondary">
              {isLoading ? "Checking..." : "Check backend health"}
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
