import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSessionStore } from "@/state/sessionStore";

const newGameSchema = z.object({
  playerOne: z
    .string()
    .min(1, "Player 1 name is required.")
    .max(24, "Player 1 name must be 24 characters or less."),
  playerTwo: z
    .string()
    .min(1, "Player 2 name is required.")
    .max(24, "Player 2 name must be 24 characters or less.")
});

type NewGameFormValues = z.infer<typeof newGameSchema>;

export const NewGamePage = (): JSX.Element => {
  const clearSession = useSessionStore((state) => state.clear);

  useEffect(() => {
    clearSession();
  }, [clearSession]);

  const form = useForm<NewGameFormValues>({
    resolver: zodResolver(newGameSchema),
    defaultValues: {
      playerOne: "",
      playerTwo: ""
    }
  });

  const handleCreateGame = (values: NewGameFormValues): void => {
    toast("Backend not connected yet.", {
      description: `${values.playerOne} vs ${values.playerTwo} is queued locally only.`
    });
  };

  return (
    <section className="space-y-5">
      <header className="space-y-2">
        <Badge variant="secondary" className="border border-border/60 bg-accentPeriwinkle text-primary">
          FE-1 Placeholder
        </Badge>
        <h1 className="font-display text-3xl leading-tight">New Game</h1>
        <p className="text-sm text-muted-foreground">
          Five-By is resilient to refresh and reconnect through `session_id` links. Session creation lands here.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Start Round Setup</CardTitle>
          <CardDescription>Add player names and initialize a placeholder session.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="new-game-form" className="space-y-4" onSubmit={form.handleSubmit(handleCreateGame)}>
              <FormField
                control={form.control}
                name="playerOne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 1 name</FormLabel>
                    <FormControl>
                      <Input placeholder="Alex" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="playerTwo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Player 2 name</FormLabel>
                    <FormControl>
                      <Input placeholder="Jordan" autoComplete="off" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
            New Game
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
};
