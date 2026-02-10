import { Separator } from "@/components/ui/separator";

export const AppFooter = (): JSX.Element => {
  return (
    <footer className="space-y-3 pt-4">
      <Separator />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>Five-By FE-0 scaffold</p>
        <p>{import.meta.env.MODE.toUpperCase()}</p>
      </div>
    </footer>
  );
};
