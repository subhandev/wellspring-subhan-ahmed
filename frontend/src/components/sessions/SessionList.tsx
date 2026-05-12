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
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { SessionRow } from "@/types";

export type { SessionRow };

function SortableRow({ session, programId }: { session: SessionRow; programId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: session.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Drag handle"
        {...attributes}
        {...listeners}
      >
        ⣿
      </button>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{session.title}</p>
        <p className="text-xs text-muted-foreground">
          {session.durationSeconds}s · {session.instructorName}
          {session.tags?.length ? ` · ${session.tags.join(", ")}` : ""}
        </p>
      </div>
      <Link
        href={`/programs/${programId}/sessions/${session.id}/edit`}
        className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
      >
        Edit
      </Link>
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

  useEffect(() => {
    setItems(initialSessions);
  }, [initialSessions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistOrder(nextIds: string[]) {
    setSaving(true);
    setError(null);
    const res = await apiFetch("/sessions/reorder", {
      method: "POST",
      body: JSON.stringify({
        programId,
        orderedSessionIds: nextIds
      })
    });
    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      sessions?: SessionRow[];
    };
    setSaving(false);
    if (!res.ok) {
      setError(data.message ?? "Reorder failed");
      return;
    }
    if (data.sessions) {
      setItems(data.sessions);
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
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    void persistOrder(reordered.map((s) => s.id));
  }

  return (
    <div className="space-y-2">
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saving ? <p className="text-xs text-muted-foreground">Saving order…</p> : null}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {items.map((s) => (
              <SortableRow key={s.id} session={s} programId={programId} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
