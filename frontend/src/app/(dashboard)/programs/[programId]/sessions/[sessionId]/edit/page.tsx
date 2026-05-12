"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
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

export default function EditSessionPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.programId === "string" ? params.programId : "";
  const sessionId = typeof params.sessionId === "string" ? params.sessionId : "";
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
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
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await apiFetch(`/sessions/${sessionId}`);
      const data = (await res.json().catch(() => ({}))) as {
        title?: string;
        durationSeconds?: number;
        instructorName?: string;
        tags?: string[];
        mediaUrl?: string | null;
        mediaType?: string | null;
        message?: string;
      };
      if (cancelled) {
        return;
      }
      if (!res.ok) {
        setLoadError(data.message ?? "Not found");
        return;
      }
      form.reset({
        title: data.title ?? "",
        durationSeconds: data.durationSeconds ?? 0,
        instructorName: data.instructorName ?? "",
        tags: (data.tags ?? []).join(", "),
        mediaUrl: data.mediaUrl ?? "",
        mediaType: data.mediaType ?? ""
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, form]);

  async function onSubmit(data: Form) {
    setError(null);
    const tags =
      data.tags
        ?.split(/[|,]/)
        .map((t) => t.trim())
        .filter(Boolean) ?? [];
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        durationSeconds: data.durationSeconds,
        instructorName: data.instructorName,
        tags,
        mediaUrl: data.mediaUrl || null,
        mediaType: data.mediaType || null
      })
    });
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    if (!res.ok) {
      setError(body.message ?? "Update failed");
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
    const presign = await apiFetch("/uploads/presign", {
      method: "POST",
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || "application/octet-stream"
      })
    });
    const p = (await presign.json().catch(() => ({}))) as {
      uploadUrl?: string;
      publicUrl?: string;
      contentType?: string;
      message?: string;
    };
    if (!presign.ok) {
      setUploadMsg(p.message ?? "Presign failed (configure S3 on the API)");
      return;
    }
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
    form.setValue("mediaUrl", p.publicUrl);
    form.setValue("mediaType", p.contentType ?? file.type);
    setUploadMsg("Upload complete — save session to persist URL.");
  }

  async function onDelete() {
    if (!confirm("Delete this session?")) {
      return;
    }
    const res = await apiFetch(`/sessions/${sessionId}`, { method: "DELETE" });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      alert(body.message ?? "Delete failed");
      return;
    }
    router.push(`/programs/${programId}/sessions`);
  }

  if (loadError) {
    return <p className="text-sm text-red-600">{loadError}</p>;
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
          <input ref={fileRef} type="file" accept="audio/*,video/*" className="text-sm" />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={onPickFile}>
              Upload via presigned URL
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save
          </Button>
          <Button type="button" variant="destructive" onClick={onDelete}>
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
    </div>
  );
}
