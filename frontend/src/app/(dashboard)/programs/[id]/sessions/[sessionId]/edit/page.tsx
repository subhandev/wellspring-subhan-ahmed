"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiFetch, readApiErrorMessage, applyServerFieldErrors, readApiErrorDetails } from "@/lib/api";
import { fileAcceptForMediaKind, mimeToMediaKind, type MediaKind } from "@/lib/mediaKind";
import { presignAndPutFile } from "@/lib/presignUpload";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  durationSeconds: z.coerce.number().int().positive(),
  instructorName: z.string().min(1),
  tags: z.string().optional(),
  mediaKind: z.enum(["none", "audio", "video"]),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.string().optional().nullable()
});

type Form = z.infer<typeof schema>;

function tagsFromString(s: string | undefined): string[] {
  return s?.split(/[|,]/).map((t) => t.trim()).filter(Boolean) ?? [];
}

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.id === "string" ? params.id : "";
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      mediaKind: "none",
      mediaUrl: "",
      mediaType: ""
    }
  });
  const mediaKind = form.watch("mediaKind") as MediaKind;

  useEffect(() => {
    if (!sessionId) {
      setLoadError("Missing session id");
      setLoadState("error");
      return;
    }
    let cancelled = false;
    setLoadState("loading");
    setLoadError(null);
    void (async () => {
      const res = await apiFetch(`/sessions/${sessionId}`);
      const body = await res.json().catch(() => ({}));
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setLoadError(readApiErrorMessage(body, "Not found"));
        setLoadState("error");
        return;
      }
      const data = body as {
        title?: string;
        durationSeconds?: number;
        instructorName?: string;
        tags?: string[];
        mediaUrl?: string | null;
        mediaType?: string | null;
      };
      const mt = data.mediaType ?? "";
      form.reset({
        title: data.title ?? "",
        durationSeconds: data.durationSeconds ?? 0,
        instructorName: data.instructorName ?? "",
        tags: (data.tags ?? []).join(", "),
        mediaUrl: data.mediaUrl ?? "",
        mediaType: mt,
        mediaKind: mimeToMediaKind(mt || undefined)
      });
      setLoadState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, form]);

  async function onSubmit(data: Form) {
    setError(null);
    form.clearErrors();
    const pendingFile = fileRef.current?.files?.[0];
    if (pendingFile) {
      setUploading(true);
      setUploadMsg(null);
      try {
        const uploadResult = await presignAndPutFile(pendingFile);
        if (!uploadResult.ok) {
          setError(uploadResult.message);
          setUploadMsg(uploadResult.message);
          return;
        }
        const mediaUrl = uploadResult.publicUrl;
        const mediaType = uploadResult.contentType;
        form.setValue("mediaUrl", mediaUrl);
        form.setValue("mediaType", mediaType);
        if (mediaType.startsWith("audio/")) {
          form.setValue("mediaKind", "audio");
        } else if (mediaType.startsWith("video/")) {
          form.setValue("mediaKind", "video");
        }
        data = {
          ...data,
          mediaUrl,
          mediaType
        };
      } finally {
        setUploading(false);
      }
    }
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        durationSeconds: data.durationSeconds,
        instructorName: data.instructorName,
        tags: tagsFromString(data.tags),
        mediaUrl: data.mediaUrl?.trim() || null,
        mediaType: data.mediaUrl?.trim() ? data.mediaType?.trim() || null : null
      })
    });
    const resBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      const { message, details } = readApiErrorDetails(resBody);
      setError(message);
      if (details?.fieldErrors) {
        applyServerFieldErrors(form.setError, form.getValues(), details.fieldErrors);
      }
      return;
    }
    router.push(`/programs/${programId}/sessions`);
  }

  async function onPickFile() {
    setUploadMsg(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const result = await presignAndPutFile(file);
      if (!result.ok) {
        setUploadMsg(result.message);
        return;
      }
      const mediaUrl = result.publicUrl;
      const mediaType = result.contentType;
      form.setValue("mediaUrl", mediaUrl);
      form.setValue("mediaType", mediaType);
      if (mediaType.startsWith("audio/")) {
        form.setValue("mediaKind", "audio");
      } else if (mediaType.startsWith("video/")) {
        form.setValue("mediaKind", "video");
      }

      const v = form.getValues();
      const patchRes = await apiFetch(`/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: v.title,
          durationSeconds: v.durationSeconds,
          instructorName: v.instructorName,
          tags: tagsFromString(v.tags),
          mediaUrl,
          mediaType
        })
      });
      const patchBody = await patchRes.json().catch(() => ({}));
      if (!patchRes.ok) {
        form.clearErrors();
        const { message, details } = readApiErrorDetails(patchBody);
        if (details?.fieldErrors) {
          applyServerFieldErrors(form.setError, form.getValues(), details.fieldErrors);
        }
        setUploadMsg(message);
        return;
      }
      setUploadMsg("Upload complete — media saved.");
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function onConfirmDelete() {
    setDeleteError(null);
    const res = await apiFetch(`/sessions/${sessionId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setDeleteError(readApiErrorMessage(body, "Delete failed"));
      throw new Error("delete failed");
    }
    router.push(`/programs/${programId}/sessions`);
  }

  const mediaUrl = form.watch("mediaUrl")?.trim();

  if (loadState === "loading") {
    return (
      <div className="max-w-lg space-y-4">
        <p className="text-muted-foreground">Loading session…</p>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
        <div className="h-24 w-full animate-pulse rounded-md bg-muted" />
      </div>
    );
  }

  if (loadState === "error" || loadError) {
    return <p className="text-sm text-red-600">{loadError ?? "Failed to load session"}</p>;
  }

  return (
    <div className="max-w-lg space-y-4">
      <Link
        href={`/programs/${programId}/sessions`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Sessions
      </Link>
      <h1 className="text-2xl font-semibold">Edit Session</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-title">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="es-title"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-instructor">
            Instructor Name <span className="text-red-600">*</span>
          </label>
          <input
            id="es-instructor"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("instructorName")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-duration">
            Duration (seconds) <span className="text-red-600">*</span>
          </label>
          <input
            id="es-duration"
            type="number"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("durationSeconds", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-tags">
            Tags (comma separated)
          </label>
          <input
            id="es-tags"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("tags")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-media-kind">
            Media type
          </label>
          <select
            id="es-media-kind"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("mediaKind")}
          >
            <option value="none">None</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
        </div>
        {mediaUrl ? (
          <div className="space-y-2 rounded-md border p-3">
            <p className="text-sm font-medium">Current media</p>
            <p className="break-all text-sm">
              <a href={mediaUrl} className="text-primary underline underline-offset-4" target="_blank" rel="noreferrer">
                {mediaUrl}
              </a>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.value = "";
                }
                fileRef.current?.click();
              }}
            >
              Replace
            </Button>
          </div>
        ) : null}
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">{mediaUrl ? "Upload replacement" : "Media file"}</p>
          <p className="text-xs text-muted-foreground">
            New file: Save uploads then persists (or Upload first).
          </p>
          <input
            ref={fileRef}
            type="file"
            accept={fileAcceptForMediaKind(mediaKind)}
            className="text-sm"
            disabled={uploading}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => void onPickFile()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
          </div>
          {uploadMsg ? <p className="text-xs text-muted-foreground">{uploadMsg}</p> : null}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-media-url">
            Media URL
          </label>
          <input
            id="es-media-url"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("mediaUrl")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="es-media-type">
            Media type (MIME)
          </label>
          <input
            id="es-media-type"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("mediaType")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {Object.entries(form.formState.errors).map(([key, err]) =>
          err?.message ? (
            <p key={key} className="text-sm text-red-600">
              {err.message}
            </p>
          ) : null
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Link
            href={`/programs/${programId}/sessions`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
            {form.formState.isSubmitting ? "Saving…" : "Save Changes"}
          </Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete session?"
        description="This cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="destructive"
        onConfirm={onConfirmDelete}
      />
      {deleteError ? <p className="text-sm text-red-600">{deleteError}</p> : null}
    </div>
  );
}
