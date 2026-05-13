"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/Button";
import { apiFetch, applyServerFieldErrors, readApiErrorDetails } from "@/lib/api";
import {
  DASH_PAGE_MAX,
  dashBackLink,
  dashFormActions,
  dashFormSection,
  dashInsetButtonRow,
  dashInsetCard,
  dashInputCn,
  dashLabel,
  dashPageDescription,
  dashPageTitle,
  dashSectionCard,
  dashSelectCn
} from "@/lib/dashboardUi";
import { fileAcceptForMediaKind, type MediaKind } from "@/lib/mediaKind";
import { missingMediaSourceMessage, refineSessionMedia, sessionMediaShape } from "@/lib/sessionFormSchema";
import { presignAndPutFile } from "@/lib/presignUpload";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    title: z.string().min(1),
    durationSeconds: z.coerce.number().int().positive(),
    instructorName: z.string().min(1),
    tags: z.string().optional(),
    position: z.coerce.number().int().min(0).optional()
  })
  .merge(sessionMediaShape)
  .superRefine((data, ctx) => {
    refineSessionMedia(data, ctx);
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
      position: undefined,
      mediaKind: "none",
      mediaUrl: "",
      mediaType: ""
    }
  });
  const mediaKind = form.watch("mediaKind") as MediaKind;
  const {
    formState: { errors }
  } = form;

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
    const pendingFile = fileRef.current?.files?.[0];
    const missingMedia = missingMediaSourceMessage(data.mediaKind, data.mediaUrl, Boolean(pendingFile));
    if (missingMedia) {
      form.setError("mediaUrl", { type: "manual", message: missingMedia });
      return;
    }
    let mediaUploadedInSubmit: { url: string; type: string; kind: Form["mediaKind"] } | null = null;
    if (pendingFile && !data.mediaUrl?.trim()) {
      setUploading(true);
      setUploadMsg(null);
      try {
        const uploadResult = await presignAndPutFile(pendingFile);
        if (!uploadResult.ok) {
          setError(uploadResult.message);
          setUploadMsg(uploadResult.message);
          return;
        }
        const nextKind =
          uploadResult.contentType.startsWith("video/")
            ? "video"
            : uploadResult.contentType.startsWith("audio/")
              ? "audio"
              : data.mediaKind;
        data = {
          ...data,
          mediaUrl: uploadResult.publicUrl,
          mediaType: uploadResult.contentType,
          mediaKind: nextKind
        };
        mediaUploadedInSubmit = {
          url: uploadResult.publicUrl,
          type: uploadResult.contentType,
          kind: nextKind
        };
      } finally {
        setUploading(false);
      }
    }
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
      if (mediaUploadedInSubmit) {
        form.setValue("mediaUrl", mediaUploadedInSubmit.url);
        form.setValue("mediaType", mediaUploadedInSubmit.type);
        form.setValue("mediaKind", mediaUploadedInSubmit.kind);
      }
      if (details?.fieldErrors) {
        applyServerFieldErrors(form.setError, form.getValues(), details.fieldErrors);
      }
      return;
    }
    router.push(`/programs/${programId}/sessions`);
  }

  return (
    <div className={cn(DASH_PAGE_MAX, "space-y-8")}>
      <div>
        <Link href={`/programs/${programId}/sessions`} className={dashBackLink}>
          ← Back to sessions
        </Link>
        <h1 className={cn(dashPageTitle, "mt-6")}>New session</h1>
        <p className={dashPageDescription}>Add a session with optional media attachment.</p>
      </div>

      <div className={dashSectionCard}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={dashFormSection}>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="sess-title">
              Title <span className="text-destructive">*</span>
            </label>
            <input id="sess-title" className={dashInputCn()} {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="sess-instructor">
              Instructor name <span className="text-destructive">*</span>
            </label>
            <input id="sess-instructor" className={dashInputCn()} {...form.register("instructorName")} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label className={dashLabel} htmlFor="sess-duration">
                Duration (seconds) <span className="text-destructive">*</span>
              </label>
              <input
                id="sess-duration"
                type="number"
                className={dashInputCn()}
                {...form.register("durationSeconds", { valueAsNumber: true })}
              />
            </div>
            <div className="space-y-2">
              <label className={dashLabel} htmlFor="sess-position">
                Position <span className="text-muted-foreground">(optional)</span>
              </label>
              <input id="sess-position" type="number" className={dashInputCn()} {...form.register("position")} />
            </div>
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="sess-tags">
              Tags <span className="text-muted-foreground">(comma separated)</span>
            </label>
            <input id="sess-tags" className={dashInputCn()} {...form.register("tags")} />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="sess-media-kind">
              Media type
            </label>
            <select
              id="sess-media-kind"
              className={cn(
                dashSelectCn,
                (errors.mediaKind ?? errors.mediaUrl ?? errors.mediaType) && "border-destructive"
              )}
              aria-invalid={Boolean(errors.mediaKind ?? errors.mediaUrl ?? errors.mediaType)}
              {...form.register("mediaKind")}
            >
              <option value="none">None</option>
              <option value="audio">Audio</option>
              <option value="video">Video</option>
            </select>
          </div>

          <div className={dashInsetCard}>
            <p className="text-sm font-medium text-foreground">Media file</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a file; use Upload to preview, or submit — create uploads if a file is still selected.
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={fileAcceptForMediaKind(mediaKind)}
              className="mt-3 w-full max-w-full text-sm text-muted-foreground"
              disabled={uploading}
            />
            <div className={cn(dashInsetButtonRow, "mt-4")}>
              <Button type="button" variant="secondary" size="sm" onClick={() => void onPickFile()} disabled={uploading}>
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
              <p className="mt-3 break-all text-xs text-muted-foreground">{form.watch("mediaUrl")}</p>
            ) : null}
            {uploadMsg ? <p className="mt-2 text-xs text-muted-foreground">{uploadMsg}</p> : null}
            {errors.mediaUrl?.message ? (
              <p className="mt-2 text-sm text-destructive">{errors.mediaUrl.message}</p>
            ) : null}
            {errors.mediaType?.message ? (
              <p className="mt-2 text-sm text-destructive">{errors.mediaType.message}</p>
            ) : null}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {Object.entries(form.formState.errors).map(([key, err]) =>
            key === "mediaUrl" || key === "mediaType" || !err?.message ? null : (
              <p key={key} className="text-sm text-destructive">
                {err.message}
              </p>
            )
          )}
          <div className={dashFormActions}>
            <Link
              href={`/programs/${programId}/sessions`}
              className={cn(buttonVariants({ variant: "outline", size: "md" }))}
            >
              Cancel
            </Link>
            <Button type="submit" size="md" disabled={form.formState.isSubmitting || uploading}>
              {form.formState.isSubmitting ? "Creating…" : "Create session"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
