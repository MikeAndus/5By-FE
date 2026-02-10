import { Toaster } from "sonner";

export const Sonner = (): JSX.Element => {
  return (
    <Toaster
      closeButton
      position="top-right"
      richColors
      toastOptions={{
        className: "font-body",
      }}
    />
  );
};
