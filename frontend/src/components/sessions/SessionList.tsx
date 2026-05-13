"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashListActions, dashListRowLinkLayer, dashListRowSurface, dashSectionCard } from "@/lib/dashboardUi";
import { formatSessionDuration } from "@/lib/formatDisplay";
import { sessionOrderSignature, sortSessionsByPosition } from "@/lib/sessionOrder";
import { cn } from "@/lib/utils";
import type { SessionRow } from "@/types";

export type { SessionRow };

function SortableRow({
  session,
  programId,
  onRequestDelete,
  isFirst
}: {
  session: SessionRow;
  programId: string;
  onRequestDelete: (s: SessionRow) => void;
  isFirst: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
    zIndex: isDragging ? 2 : 0
  };

  const firstTag = session.tags?.[0];
  const meta = [session.instructorName, formatSessionDuration(session.durationSeconds), firstTag]
    .filter(Boolean)
    .join(" · ");

  const viewHref = `/programs/${programId}/sessions/${session.id}`;

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        dashListRowSurface,
        "flex flex-wrap items-center justify-between gap-3 px-6 py-4",
        !isFirst && "border-t border-border"
      )}
    >
      <Link
        href={viewHref}
        className={dashListRowLinkLayer}
        aria-label={`Open session ${session.title}`}
      />
      <div className="pointer-events-none relative z-[1] flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
        <button
          type="button"
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "pointer-events-auto mt-0.5 touch-none cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          )}
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{session.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <div className={cn(dashListActions, "relative z-[1] pointer-events-auto pl-9 sm:pl-0")}>
        <Link
          href={`/programs/${programId}/sessions/${session.id}/edit`}
          className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
        >
          Edit
        </Link>
        <button
          type="button"
          className={cn(buttonVariants({ variant: "destructive", size: "sm" }))}
          onClick={() => onRequestDelete(session)}
        >
          Delete
        </button>
      </div>
    </li>
  );
}

/** Session list with drag-and-drop reorder and persistence. */
export function SessionList({
  programId,
  initialSessions,
  onSessionsChanged
}: {
  programId: string;
  initialSessions: SessionRow[];
  /** Keeps parent list in sync so local order is not overwritten after reorder/delete. */
  onSessionsChanged?: (sessions: SessionRow[]) => void;
}) {
  const [items, setItems] = useState<SessionRow[]>(() => sortSessionsByPosition(initialSessions));

  /** When set, local row order is ahead of `initialSessions` until reorder API finishes. */
  const pendingOrderSigRef = useRef<string | null>(null);

  const multisetKey = useMemo(
    () => [...initialSessions.map((s) => s.id)].sort().join("|"),
    [initialSessions]
  );

  const parentOrderSig = useMemo(() => sessionOrderSignature(initialSessions), [initialSessions]);

  useEffect(() => {
    setItems((prev) => {
      const sortedInitial = sortSessionsByPosition(initialSessions);
      if (prev.length !== sortedInitial.length) {
        return sortedInitial;
      }
      const prevIds = new Set(prev.map((p) => p.id));
      if (!sortedInitial.every((s) => prevIds.has(s.id))) {
        return sortedInitial;
      }
      const prevSig = sessionOrderSignature(prev);
      if (prevSig === parentOrderSig) {
        return prev;
      }
      const pending = pendingOrderSigRef.current;
      if (pending !== null && prevSig === pending) {
        return prev;
      }
      return sortedInitial;
    });
  }, [multisetKey, parentOrderSig, initialSessions]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistOrder(nextIds: string[]): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await apiFetch("/sessions/reorder", {
        method: "POST",
        body: JSON.stringify({
          programId,
          orderedSessionIds: nextIds
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(readApiErrorMessage(body, "Reorder failed"));
        return false;
      }
      const data = body as { sessions?: SessionRow[] };
      if (Array.isArray(data.sessions)) {
        const next = sortSessionsByPosition(data.sessions);
        setItems(next);
        onSessionsChanged?.(next);
      }
      pendingOrderSigRef.current = null;
      return true;
    } finally {
      setSaving(false);
    }
  }

  function onDragEnd(ev: DragEndEvent) {
    const { active, over } = ev;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = items.findIndex((s) => s.id === active.id);
    const newIndex = items.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }
    const previous = items;
    const reordered = arrayMove(items, oldIndex, newIndex);
    pendingOrderSigRef.current = sessionOrderSignature(reordered);
    setItems(reordered);
    void (async () => {
      const ok = await persistOrder(reordered.map((s) => s.id));
      if (!ok) {
        pendingOrderSigRef.current = null;
        setItems(previous);
      }
    })();
  }

  async function onConfirmDeleteSession() {
    if (!deleteTarget) {
      return;
    }
    setDeleteError(null);
    const res = await apiFetch(`/sessions/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(readApiErrorMessage(body, "Delete failed"));
      throw new Error("delete failed");
    }
    const id = deleteTarget.id;
    setItems((prev) => {
      const next = prev.filter((s) => s.id !== id);
      onSessionsChanged?.(next);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {(error ?? saving) ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {error ? <p className="text-destructive">{error}</p> : null}
          {saving ? <p className="text-xs text-muted-foreground">Saving order…</p> : null}
        </div>
      ) : null}
      <div className={cn(dashSectionCard, "overflow-hidden")}>
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul>
              {items.map((s, idx) => (
                <SortableRow
                  key={s.id}
                  session={s}
                  programId={programId}
                  isFirst={idx === 0}
                  onRequestDelete={setDeleteTarget}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title="Delete session?"
        description={
          deleteTarget ? `This will permanently delete “${deleteTarget.title}”.` : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={onConfirmDeleteSession}
      />
      {deleteError ? <p className="text-sm text-destructive">{deleteError}</p> : null}
    </div>
  );
}
