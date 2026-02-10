import { BrowserRouter } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Toaster } from "@/components/ui/sonner";
import { AppRoutes } from "@/routes";

export const App = (): JSX.Element => {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppRoutes />
      </AppLayout>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
};
