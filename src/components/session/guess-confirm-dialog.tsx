import { useEffect, useId, useRef } from "react";
import { Button } from "@/components/ui/button";

interface GuessConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  warning: string;
  isSubmitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const GuessConfirmDialog = ({
  open,
  title,
  description,
  warning,
  isSubmitting,
  onConfirm,
  onCancel,
}: GuessConfirmDialogProps): JSX.Element | null => {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    cancelButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();

        if (!isSubmitting) {
          onCancel();
        }

        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableButtons = [cancelButtonRef.current, confirmButtonRef.current].filter(
        (element): element is HTMLButtonElement => element !== null,
      );

      if (focusableButtons.length === 0) {
        return;
      }

      const firstButton = focusableButtons[0];
      const lastButton = focusableButtons[focusableButtons.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey) {
        if (activeElement === firstButton) {
          event.preventDefault();
          lastButton.focus();
        }

        return;
      }

      if (activeElement === lastButton) {
        event.preventDefault();
        firstButton.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isSubmitting, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close confirmation dialog"
        className="absolute inset-0 bg-black/40"
        disabled={isSubmitting}
        onClick={() => {
          if (!isSubmitting) {
            onCancel();
          }
        }}
        type="button"
      />

      <div
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-lg border border-brand-accentLavender bg-white p-5 shadow-lg"
        role="dialog"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-brand-primary" id={titleId}>
            {title}
          </h3>

          <p className="text-sm text-brand-primary" id={descriptionId}>
            {description}
          </p>

          <p className="rounded-md border border-brand-accentOrange/40 bg-brand-accentOrange/10 p-3 text-sm text-brand-primary">
            {warning}
          </p>

          <div className="flex justify-end gap-2">
            <Button
              disabled={isSubmitting}
              onClick={onCancel}
              ref={cancelButtonRef}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={onConfirm}
              ref={confirmButtonRef}
              type="button"
            >
              {isSubmitting ? "Submitting..." : "Confirm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
