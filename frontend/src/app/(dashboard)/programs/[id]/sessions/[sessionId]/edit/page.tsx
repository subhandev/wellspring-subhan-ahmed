"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  durationSeconds: z.coerce.number().int().positive(),
  instructorName: z.string().min(1),
  tags: z.string().optional(),
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
      mediaUrl: "",
      mediaType: ""
    }
  });

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
      form.reset({
        title: data.title ?? "",
        durationSeconds: data.durationSeconds ?? 0,
        instructorName: data.instructorName ?? "",
        tags: (data.tags ?? []).join(", "),
        mediaUrl: data.mediaUrl ?? "",
        mediaType: data.mediaType ?? ""
      });
      setLoadState("ready");
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, form]);

  async function onSubmit(data: Form) {
    setError(null);
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        durationSeconds: data.durationSeconds,
        instructorName: data.instructorName,
        tags: tagsFromString(data.tags),
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null
      })
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Update failed"));
      return;
    }
    router.refresh();
  }

  async function onPickFile() {
    setUploadMsg(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      return;
    }
    setUploading(true);
    try {
      const presign = await apiFetch("/uploads/presign", {
        method: "POST",
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream"
        })
      });
      const pBody = await presign.json().catch(() => ({}));
      if (!presign.ok) {
        setUploadMsg(readApiErrorMessage(pBody, "Presign failed (configure S3 on the API)"));
        return;
      }
      const p = pBody as {
        uploadUrl?: string;
        publicUrl?: string;
        contentType?: string;
      };
      if (!p.uploadUrl || !p.publicUrl) {
        setUploadMsg("Invalid presign response");
        return;
      }
      const put = await fetch(p.uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": (p.contentType ?? file.type) || "application/octet-stream"
        }
      });
      if (!put.ok) {
        setUploadMsg("Upload to storage failed");
        return;
      }
      const mediaUrl = p.publicUrl;
      const mediaType = (p.contentType ?? file.type) || null;
      form.setValue("mediaUrl", mediaUrl);
      form.setValue("mediaType", mediaType);

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
        setUploadMsg(readApiErrorMessage(patchBody, "Could not save media to session"));
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
      <h1 className="text-2xl font-semibold">Edit session</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Duration (sec)</label>
          <input
            type="number"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("durationSeconds", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Instructor</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("instructorName")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Tags</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("tags")}
          />
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Media file</p>
          <input
            ref={fileRef}
            type="file"
            accept="audio/*,video/*"
            className="text-sm"
            disabled={uploading}
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => void onPickFile()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload via presigned URL"}
            </Button>
          </div>
          {uploadMsg ? <p className="text-xs text-muted-foreground">{uploadMsg}</p> : null}
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Media URL</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("mediaUrl")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Media type (MIME)</label>
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("mediaType")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={form.formState.isSubmitting || uploading}>
            Save
          </Button>
          <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
          <Link
            href={`/programs/${programId}/sessions`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Back
          </Link>
        </div>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this session?"
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
