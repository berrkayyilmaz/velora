import { X } from "lucide-react";
import { useEffect, type PropsWithChildren, type ReactNode } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/ui/button";

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  footer?: ReactNode;
  onOpenChange: (open: boolean) => void;
}>;

export function Modal({
  children,
  open,
  title,
  description,
  footer,
  onOpenChange
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-lg border border-border bg-card shadow-xl">
        <div className="flex items-start border-b border-border p-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{title}</h2>
            {description === undefined ? null : (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <Button
            aria-label={`Close ${title}`}
            className="-mr-2 -mt-2"
            onClick={() => onOpenChange(false)}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" size={18} />
          </Button>
        </div>
        <div className="p-5">{children}</div>
        {footer === undefined ? null : (
          <div className="flex justify-end gap-3 border-t border-border p-5">{footer}</div>
        )}
      </div>
    </div>,
    document.body
  );
}
