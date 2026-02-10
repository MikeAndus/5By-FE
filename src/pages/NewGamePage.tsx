import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

interface NewGameFormValues {
  playerOne: string;
  playerTwo: string;
}

export const NewGamePage = (): JSX.Element => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<NewGameFormValues>({
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
          FE-0 Placeholder
        </Badge>
        <h1 className="font-display text-3xl leading-tight">New Game</h1>
        <p className="text-sm text-muted-foreground">
          Five-By is a voice-first party game scaffold. This screen is local-only for FE-0.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Start Round Setup</CardTitle>
          <CardDescription>Add player names and initialize a placeholder session.</CardDescription>
        </CardHeader>
        <CardContent>
          <form id="new-game-form" className="space-y-4" onSubmit={handleSubmit(handleCreateGame)}>
            <div className="space-y-2">
              <Label htmlFor="playerOne">Player 1 name</Label>
              <Input id="playerOne" placeholder="Alex" autoComplete="off" {...register("playerOne")} />
              {errors.playerOne ? (
                <p className="text-sm text-destructive">{errors.playerOne.message}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="playerTwo">Player 2 name</Label>
              <Input id="playerTwo" placeholder="Jordan" autoComplete="off" {...register("playerTwo")} />
              {errors.playerTwo ? (
                <p className="text-sm text-destructive">{errors.playerTwo.message}</p>
              ) : null}
            </div>
          </form>
        </CardContent>
        <CardFooter>
          <Button className="h-12 w-full text-base" form="new-game-form" type="submit" disabled={isSubmitting}>
            <Sparkles className="mr-2 h-5 w-5" aria-hidden="true" />
            New Game
          </Button>
        </CardFooter>
      </Card>
    </section>
  );
};
