import { useState } from "react";
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

export const HomePage = (): JSX.Element => {
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
          <CardTitle>Five-By</CardTitle>
          <CardDescription>
            Phase 0 scaffold with typed API health checks and routing.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-brand-accentBlue">
            Use this page to confirm the frontend can reach the backend contract.
          </p>
          <div>
            <Button disabled={isLoading} onClick={handleClickHealth}>
              {isLoading ? "Checking..." : "Check backend health"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
};
