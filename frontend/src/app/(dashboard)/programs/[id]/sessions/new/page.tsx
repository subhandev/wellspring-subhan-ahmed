"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, applyServerFieldErrors, readApiErrorDetails } from "@/lib/api";
import { fileAcceptForMediaKind, type MediaKind } from "@/lib/mediaKind";
import { presignAndPutFile } from "@/lib/presignUpload";
import { cn } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1),
  durationSeconds: z.coerce.number().int().positive(),
  instructorName: z.string().min(1),
  tags: z.string().optional(),
  position: z.coerce.number().int().min(0).optional(),
  mediaKind: z.enum(["none", "audio", "video"]),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.string().optional().nullable()
});

type Form = z.infer<typeof schema>;

export default function NewSessionPage() {
  const params = useParams();
  const router = useRouter();
  const programId = typeof params.id === "string" ? params.id : "";
  const [error, setError] = useState<string | null>(null);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      durationSeconds: 600,
      instructorName: "",
      tags: "",
      mediaKind: "none",
      mediaUrl: "",
      mediaType: ""
    }
  });
  const mediaKind = form.watch("mediaKind") as MediaKind;

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
      form.setValue("mediaUrl", result.publicUrl);
      form.setValue("mediaType", result.contentType);
      if (result.contentType.startsWith("audio/")) {
        form.setValue("mediaKind", "audio");
      } else if (result.contentType.startsWith("video/")) {
        form.setValue("mediaKind", "video");
      }
      setUploadMsg("Uploaded — URL will be saved when you create the session.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: Form) {
    setError(null);
    form.clearErrors();
    const tags =
      data.tags
        ?.split(/[|,]/)
        .map((t) => t.trim())
        .filter(Boolean) ?? [];
    const payload: Record<string, unknown> = {
      programId,
      title: data.title,
      durationSeconds: data.durationSeconds,
      instructorName: data.instructorName,
      tags
    };
    if (data.position !== undefined && !Number.isNaN(data.position)) {
      payload.position = data.position;
    }
    const mu = data.mediaUrl?.trim();
    if (mu) {
      payload.mediaUrl = mu;
      payload.mediaType = data.mediaType?.trim() || null;
    }
    const res = await apiFetch("/sessions", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      form.clearErrors();
      const { message, details } = readApiErrorDetails(body);
      setError(message);
      if (details?.fieldErrors) {
        applyServerFieldErrors(form.setError, form.getValues(), details.fieldErrors);
      }
      return;
    }
    const created = body as { id?: string };
    if (created.id) {
      router.push(`/programs/${programId}/sessions/${created.id}/edit`);
    }
  }

  return (
    <div className="max-w-lg space-y-4">
      <Link
        href={`/programs/${programId}/sessions`}
        className="text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        ← Back to Sessions
      </Link>
      <h1 className="text-2xl font-semibold">New Session</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="sess-title">
            Title <span className="text-red-600">*</span>
          </label>
          <input
            id="sess-title"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("title")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="sess-instructor">
            Instructor Name <span className="text-red-600">*</span>
          </label>
          <input
            id="sess-instructor"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("instructorName")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sess-duration">
              Duration (seconds) <span className="text-red-600">*</span>
            </label>
            <input
              id="sess-duration"
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...form.register("durationSeconds", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="sess-position">
              Position (optional)
            </label>
            <input
              id="sess-position"
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              {...form.register("position")}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="sess-tags">
            Tags (comma separated)
          </label>
          <input
            id="sess-tags"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("tags")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="sess-media-kind">
            Media type
          </label>
          <select
            id="sess-media-kind"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            {...form.register("mediaKind")}
          >
            <option value="none">None</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
          </select>
        </div>
        <div className="space-y-2 rounded-md border p-3">
          <p className="text-sm font-medium">Media file</p>
          <input
            ref={fileRef}
            type="file"
            accept={fileAcceptForMediaKind(mediaKind)}
            className="text-sm"
            disabled={uploading}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => void onPickFile()} disabled={uploading}>
              {uploading ? "Uploading…" : "Upload"}
            </Button>
            {form.watch("mediaUrl") ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  form.setValue("mediaUrl", "");
                  form.setValue("mediaType", "");
                  setUploadMsg(null);
                  if (fileRef.current) {
                    fileRef.current.value = "";
                  }
                }}
              >
                Clear media
              </Button>
            ) : null}
          </div>
          {form.watch("mediaUrl") ? (
            <p className="break-all text-xs text-muted-foreground">
              Uploaded: {form.watch("mediaUrl")}
            </p>
          ) : null}
          {uploadMsg ? <p className="text-xs text-muted-foreground">{uploadMsg}</p> : null}
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
            {form.formState.isSubmitting ? "Creating…" : "Create Session"}
          </Button>
        </div>
      </form>
    </div>
  );
}
