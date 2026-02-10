import { Outlet, createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/app-shell";
import { HomePage } from "@/pages/home";
import { NotFoundPage } from "@/pages/not-found";
import { SessionPage } from "@/pages/session";

const RootLayout = (): JSX.Element => {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "s/:sessionId",
        element: <SessionPage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      },
    ],
  },
]);
