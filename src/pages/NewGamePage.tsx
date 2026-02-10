import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/http";
import { createSession } from "@/lib/api/sessions";
import { parseSessionIdInput, sessionRoute } from "@/lib/routing";
import { useSessionStore } from "@/state/sessionStore";

const optionalPlayerNameSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value.length <= 30, {
    message: "Names must be 30 characters or fewer."
  });

const newGameSchema = z.object({
  player1Name: optionalPlayerNameSchema,
  player2Name: optionalPlayerNameSchema
});

type NewGameFormValues = z.infer<typeof newGameSchema>;

const joinSessionSchema = z.object({
  sessionInput: z
    .string()
    .trim()
    .min(1, "Enter a session link or ID.")
    .refine((value) => parseSessionIdInput(value) !== null, {
      message: "Enter a valid session ID or link."
    })
});

type JoinSessionFormValues = z.infer<typeof joinSessionSchema>;

const toNullableName = (value: string): string | null => {
  return value.length > 0 ? value : null;
};

const resolveCreateErrorMessage = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 422) {
      return "Name validation failed. Use names up to 30 characters.";
    }

    if (error.status >= 500) {
      return "Server error while creating the session. Please try again.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Couldn't create game. Please try again.";
};

export const NewGamePage = (): JSX.Element => {
  const navigate = useNavigate();
  const clearSession = useSessionStore((state) => state.clear);
  const hydrate = useSessionStore((state) => state.hydrate);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    clearSession();
  }, [clearSession]);

  const form = useForm<NewGameFormValues>({
    resolver: zodResolver(newGameSchema),
    defaultValues: {
      player1Name: "",
      player2Name: ""
    }
  });

  const joinForm = useForm<JoinSessionFormValues>({
    resolver: zodResolver(joinSessionSchema),
    defaultValues: {
      sessionInput: ""
    }
  });

  const handleCreateGame = async (values: NewGameFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      const snapshot = await createSession({
        player_1_name: toNullableName(values.player1Name),
        player_2_name: toNullableName(values.player2Name)
      });

      hydrate(snapshot.session_id, snapshot);
      navigate(sessionRoute(snapshot.session_id));
    } catch (error) {
      const message = resolveCreateErrorMessage(error);
      setSubmitError(message);
      toast.error("Couldn't create game.", {
        description: message
      });
    }
  };

  const handleJoinSession = (values: JoinSessionFormValues): void => {
    const sessionId = parseSessionIdInput(values.sessionInput);
    if (!sessionId) {
      joinForm.setError("sessionInput", {
        type: "manual",
        message: "Enter a valid session ID or link."
      });
      return;
    }

    navigate(sessionRoute(sessionId));
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="border border-border/60 bg-accentPeriwinkle text-primary">
          New Session
        </Badge>
        <h1 className="font-display text-3xl leading-tight">New Game</h1>
        <p className="text-sm text-muted-foreground">
          Start a new game session, then share the session link so both players can join.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create Game</CardTitle>
          <CardDescription>Leave names blank to use defaults: Player 1 / Player 2.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="new-game-form" className="space-y-4" onSubmit={form.handleSubmit(handleCreateGame)}>
              <FormField
                control={form.control}
                name="player1Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 1 name</FormLabel>
                    <FormControl>
                      <Input placeholder="Player 1" autoComplete="off" maxLength={30} {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="player2Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 2 name</FormLabel>
                    <FormControl>
                      <Input placeholder="Player 2" autoComplete="off" maxLength={30} {...field} />
                    </FormControl>
                    <FormDescription>Optional</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitError ? <p className="text-sm font-medium text-destructive">{submitError}</p> : null}
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            className="tap-target w-full text-base"
            form="new-game-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
            )}
            {form.formState.isSubmitting ? "Creating game..." : "Create Game"}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Join Existing Session</CardTitle>
          <CardDescription>Paste a session ID or full session URL.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...joinForm}>
            <form id="join-session-form" className="space-y-4" onSubmit={joinForm.handleSubmit(handleJoinSession)}>
              <FormField
                control={joinForm.control}
                name="sessionInput"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session link or ID</FormLabel>
                    <FormControl>
                      <Input placeholder="https://app.example.com/s/{session_id}" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button className="tap-target w-full gap-2 text-base" form="join-session-form" type="submit">
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
            Join Session
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
};
