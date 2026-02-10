import { Toaster as Sonner, type ToasterProps } from "sonner";

export const Toaster = (props: ToasterProps): JSX.Element => {
  return (
    <Sonner
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast: "font-sans",
          title: "font-display"
        }
      }}
      {...props}
    />
  );
};
