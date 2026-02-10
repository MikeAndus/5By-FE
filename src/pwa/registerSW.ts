import { toast } from "sonner";
import { registerSW } from "virtual:pwa-register";

export const registerServiceWorker = (): void => {
  if (import.meta.env.DEV || !("serviceWorker" in navigator)) {
    return;
  }

  const updateServiceWorker = registerSW({
    onOfflineReady() {
      toast("Five-By is ready for offline use.");
    },
    onNeedRefresh() {
      toast("A new version is available.", {
        action: {
          label: "Update",
          onClick: () => {
            void updateServiceWorker(true);
          }
        }
      });
    }
  });
};
