"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void | Promise<void>;
};

/**
 * Accessible confirm pattern using the native `<dialog>` element.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "default",
  onConfirm
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const onClose = () => {
      onOpenChange(false);
    };
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onOpenChange]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    if (open && !el.open) {
      el.showModal();
    }
    if (!open && el.open) {
      el.close();
    }
  }, [open]);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      ref.current?.close();
    } catch {
      /* onConfirm may throw to keep the dialog open after a failed mutation */
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={ref}
      className="fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-background p-6 shadow-lg backdrop:bg-black/50"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={busy} onClick={() => ref.current?.close()}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={confirmVariant}
          disabled={busy}
          onClick={() => void handleConfirm()}
        >
          {busy ? "…" : confirmLabel}
        </Button>
      </div>
    </dialog>
  );
}
