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

const JoinSessionFormSchema = z.object({
  sessionId: z.string().uuid("Enter a valid session ID (UUID)."),
});

type JoinSessionFormValues = z.infer<typeof JoinSessionFormSchema>;

export const HomePage = (): JSX.Element => {
  const navigate = useNavigate();

  const form = useForm<JoinSessionFormValues>({
    resolver: zodResolver(JoinSessionFormSchema),
    defaultValues: {
      sessionId: "",
    },
  });

  const handleSubmitJoinSession = (values: JoinSessionFormValues): void => {
    navigate(`/s/${values.sessionId}`);
  };

  const handleClickNewGame = (): void => {
    const generatedSessionId = crypto.randomUUID();

    toast(
      "Phase 1: session creation isn't implemented yet; you'll see 'Session not found' unless you created a session in the DB.",
    );

    navigate(`/s/${generatedSessionId}`);
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
              Phase 1 generates a local UUID and navigates to the session route.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-brand-accentBlue">
              You can use this to jump directly to a session URL for backend-seeded
              sessions.
            </p>
            <Button className="w-full" onClick={handleClickNewGame}>
              Generate Session URL
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
