"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
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
import { ArrowRight, GripVertical } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashPrimaryLink, dashSectionCard } from "@/lib/dashboardUi";
import { formatSessionDuration } from "@/lib/formatDisplay";
import { cn } from "@/lib/utils";
import type { SessionRow } from "@/types";

export type { SessionRow };

function SortableRow({
  session,
  programId,
  indexDisplay,
  onRequestDelete,
  isFirst
}: {
  session: SessionRow;
  programId: string;
  indexDisplay: number;
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
    zIndex: isDragging ? 1 : 0
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
        "flex flex-wrap items-center justify-between gap-3 px-6 py-4 transition-shadow",
        !isFirst && "border-t border-border"
      )}
    >
      <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">
            <span className="tabular-nums text-muted-foreground">{indexDisplay}.</span>{" "}
            {session.title}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{meta}</p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 pl-9 sm:pl-0">
        <Link href={viewHref} className={cn(dashPrimaryLink, "inline-flex items-center gap-1")}>
          View
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
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
  initialSessions
}: {
  programId: string;
  initialSessions: SessionRow[];
}) {
  const [items, setItems] = useState<SessionRow[]>(initialSessions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SessionRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setItems(initialSessions);
  }, [initialSessions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistOrder(nextIds: string[]): Promise<boolean> {
    setSaving(true);
    setError(null);
    const res = await apiFetch("/sessions/reorder", {
      method: "POST",
      body: JSON.stringify({
        programId,
        orderedSessionIds: nextIds
      })
    });
    const body = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Reorder failed"));
      return false;
    }
    const data = body as { sessions?: SessionRow[] };
    if (data.sessions) {
      setItems(data.sessions);
    }
    return true;
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
    setItems(reordered);
    void (async () => {
      const ok = await persistOrder(reordered.map((s) => s.id));
      if (!ok) {
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
    setItems((prev) => prev.filter((s) => s.id !== deleteTarget.id));
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
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul>
              {items.map((s, idx) => (
                <SortableRow
                  key={s.id}
                  session={s}
                  programId={programId}
                  indexDisplay={idx + 1}
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
