import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const NotFoundPage = (): JSX.Element => {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>404</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-3">
          <p>The page you requested does not exist.</p>
          <Button asChild>
            <Link to="/">Go home</Link>
          </Button>
        </CardContent>
      </Card>
    </section>
  );
};
