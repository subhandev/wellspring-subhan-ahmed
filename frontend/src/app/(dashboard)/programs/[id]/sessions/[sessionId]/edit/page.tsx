"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import { apiFetch, readApiErrorMessage, applyServerFieldErrors, readApiErrorDetails } from "@/lib/api";
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
  dashPrimaryLink,
  dashSectionCard,
  dashSelectCn
} from "@/lib/dashboardUi";
import { fileAcceptForMediaKind, sessionMediaKindFromApi, sessionMediaTypeForApi, type MediaKind } from "@/lib/mediaKind";
import { missingMediaSourceMessage, refineSessionMedia, sessionMediaShape } from "@/lib/sessionFormSchema";
import { presignAndPutFile } from "@/lib/presignUpload";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    title: z.string().min(1),
    durationSeconds: z.coerce.number().int().positive(),
    instructorName: z.string().min(1),
    tags: z.string().optional()
  })
  .merge(sessionMediaShape)
  .superRefine((data, ctx) => {
    refineSessionMedia(data, ctx);
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
  const {
    formState: { errors }
  } = form;

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
        mediaType?: "AUDIO" | "VIDEO" | null;
      };
      form.reset({
        title: data.title ?? "",
        durationSeconds: data.durationSeconds ?? 0,
        instructorName: data.instructorName ?? "",
        tags: (data.tags ?? []).join(", "),
        mediaUrl: data.mediaUrl ?? "",
        mediaType: "",
        mediaKind: sessionMediaKindFromApi(data.mediaType ?? undefined)
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
    const missingMedia = missingMediaSourceMessage(data.mediaKind, data.mediaUrl, Boolean(pendingFile));
    if (missingMedia) {
      form.setError("mediaUrl", { type: "manual", message: missingMedia });
      return;
    }
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
          mediaType: uploadResult.contentType
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
        mediaType: sessionMediaTypeForApi(data.mediaKind, Boolean(data.mediaUrl?.trim()))
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
          mediaType: sessionMediaTypeForApi(v.mediaKind, true)
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

  const mediaUrl = form.watch("mediaUrl")?.trim();

  if (loadState === "loading") {
    return <PageLoader message="Loading session…" />;
  }

  if (loadState === "error" || loadError) {
    return <p className="text-sm text-destructive">{loadError ?? "Failed to load session"}</p>;
  }

  return (
    <div className={cn(DASH_PAGE_MAX, "space-y-8")}>
      <div>
        <Link href={`/programs/${programId}/sessions`} className={dashBackLink}>
          ← Back to sessions
        </Link>
        <h1 className={cn(dashPageTitle, "mt-6")}>Edit session</h1>
        <p className={dashPageDescription}>Update metadata, URLs, or replace media.</p>
      </div>

      <div className={dashSectionCard}>
        <form onSubmit={form.handleSubmit(onSubmit)} className={dashFormSection}>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-title">
              Title <span className="text-destructive">*</span>
            </label>
            <input id="es-title" className={dashInputCn()} {...form.register("title")} />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-instructor">
              Instructor name <span className="text-destructive">*</span>
            </label>
            <input id="es-instructor" className={dashInputCn()} {...form.register("instructorName")} />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-duration">
              Duration (seconds) <span className="text-destructive">*</span>
            </label>
            <input
              id="es-duration"
              type="number"
              className={dashInputCn()}
              {...form.register("durationSeconds", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-tags">
              Tags <span className="text-muted-foreground">(comma separated)</span>
            </label>
            <input id="es-tags" className={dashInputCn()} {...form.register("tags")} />
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-media-kind">
              Media type
            </label>
            <select
              id="es-media-kind"
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

          {mediaUrl ? (
            <div className={dashInsetCard}>
              <p className="text-sm font-medium text-foreground">Current media</p>
              <a
                href={mediaUrl}
                className={cn(dashPrimaryLink, "mt-2 inline-flex break-all text-sm")}
                target="_blank"
                rel="noreferrer"
              >
                {mediaUrl}
              </a>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  if (fileRef.current) {
                    fileRef.current.value = "";
                  }
                  fileRef.current?.click();
                }}
              >
                Replace file
              </Button>
            </div>
          ) : null}

          <div className={dashInsetCard}>
            <p className="text-sm font-medium text-foreground">
              {mediaUrl ? "Upload replacement" : "Media file"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Choose a file and upload — or save the form after selecting to upload on submit.
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
            </div>
            {uploadMsg ? <p className="mt-2 text-xs text-muted-foreground">{uploadMsg}</p> : null}
          </div>

          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-media-url">
              Media URL <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="es-media-url"
              className={dashInputCn(Boolean(errors.mediaUrl))}
              aria-invalid={Boolean(errors.mediaUrl)}
              {...form.register("mediaUrl")}
            />
            {errors.mediaUrl?.message ? (
              <p className="text-sm text-destructive">{errors.mediaUrl.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="es-media-type">
              MIME type <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="es-media-type"
              className={dashInputCn(Boolean(errors.mediaType))}
              aria-invalid={Boolean(errors.mediaType)}
              {...form.register("mediaType")}
            />
            {errors.mediaType?.message ? (
              <p className="text-sm text-destructive">{errors.mediaType.message}</p>
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
              {form.formState.isSubmitting ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
