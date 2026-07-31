import { useEffect, useRef, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/shared/components/Button";
import { cn } from "@/shared/utils/cn";

const FADE_MS = 220;

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  className,
}: ModalProps) {
  const [rendered, setRendered] = useState(open);
  const [visible, setVisible] = useState(open);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    if (open) {
      setRendered(true);
      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setVisible(true));
      });
      return () => window.cancelAnimationFrame(frame);
    }

    setVisible(false);
    const delay = prefersReducedMotion() ? 0 : FADE_MS;
    closeTimer.current = window.setTimeout(() => {
      setRendered(false);
      closeTimer.current = null;
    }, delay);

    return () => {
      if (closeTimer.current !== null) {
        window.clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
    };
  }, [open]);

  useEffect(() => {
    if (!rendered) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [rendered, onClose]);

  if (!rendered) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fermer"
        className={cn(
          "absolute inset-0 bg-forest-950/40 transition-opacity duration-[220ms] ease-out",
          visible ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "relative z-10 flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden",
          "rounded-t-2xl border border-forest-200 bg-surface-elevated shadow-soft sm:rounded-2xl",
          "transition-[opacity,transform] duration-[220ms] ease-out",
          visible
            ? "translate-y-0 opacity-100"
            : "translate-y-2 opacity-0 sm:translate-y-1",
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-forest-100 px-4 py-3 sm:px-5">
          <h2
            id="modal-title"
            className="text-lg font-semibold text-forest-900"
          >
            {title}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
