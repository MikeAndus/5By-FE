import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiClientError } from "@/lib/api/errors";
import { createSession } from "@/lib/api/sessions";
import { toastApiError } from "@/lib/toast";

const JoinSessionFormSchema = z.object({
  sessionId: z.string().uuid("Enter a valid session ID (UUID)."),
});

type JoinSessionFormValues = z.infer<typeof JoinSessionFormSchema>;

export const HomePage = (): JSX.Element => {
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionFormSchema),
    defaultValues: {
      sessionId: "",
    },
  });

  const handleSubmitJoinSession = (values: JoinSessionFormValues): void => {
    navigate(`/s/${values.sessionId}`);
  };

  const handleClickNewGame = async (): Promise<void> => {
    try {
      setIsCreating(true);
      const snapshot = await createSession();
      navigate(`/s/${snapshot.session_id}`);
    } catch (error: unknown) {
      if (error instanceof ApiClientError && error.code === "grids_unavailable") {
        toast.error("Not enough grids available to create a new game. Please try again.");
        return;
      }

      toastApiError(error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="mx-auto w-full max-w-4xl">
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Join Existing Session</CardTitle>
            <CardDescription>
              Enter a session ID to load its current backend snapshot.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                className="flex flex-col gap-4"
                onSubmit={form.handleSubmit(handleSubmitJoinSession)}
              >
                <FormField
                  control={form.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session ID</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Session IDs are UUID values.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit">Join Session</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>New Game</CardTitle>
            <CardDescription>
              Create a new anonymous session and open it by shareable URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-brand-accentBlue">
              This calls the backend session creator and routes to the new
              <code className="px-1 font-mono"> /s/&lt;session_id&gt;</code> URL.
            </p>
            <Button
              className="w-full"
              disabled={isCreating}
              onClick={() => {
                void handleClickNewGame();
              }}
            >
              {isCreating ? "Creating..." : "New Game"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
