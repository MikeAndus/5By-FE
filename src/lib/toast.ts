import { toast } from "sonner";
import { ApiClientError } from "@/lib/api/errors";

export const toastApiError = (error: unknown): void => {
  if (error instanceof ApiClientError) {
    toast.error(error.message);
    return;
  }

  toast.error("Something went wrong. Please try again.");
};
