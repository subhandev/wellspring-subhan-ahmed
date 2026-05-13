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
import {
  fileAcceptForMediaKind,
  fileMediaKindMismatchMessage,
  sessionMediaKindFromApi,
  sessionMediaTypeForApi,
  type MediaKind
} from "@/lib/mediaKind";
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
  const [uploading, setUploading] = useState(false);
  const [originalMediaKind, setOriginalMediaKind] = useState<MediaKind>("none");
  const [originalMediaUrl, setOriginalMediaUrl] = useState<string>("");
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
      const loadedKind = sessionMediaKindFromApi(data.mediaType ?? undefined);
      const loadedUrl = data.mediaUrl ?? "";
      form.reset({
        title: data.title ?? "",
        durationSeconds: data.durationSeconds ?? 0,
        instructorName: data.instructorName ?? "",
        tags: (data.tags ?? []).join(", "),
        mediaUrl: loadedUrl,
        mediaType: "",
        mediaKind: loadedKind
      });
      setOriginalMediaKind(loadedKind);
      setOriginalMediaUrl(loadedUrl);
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
    if (pendingFile && data.mediaKind !== "none") {
      const mismatch = fileMediaKindMismatchMessage(data.mediaKind, pendingFile);
      if (mismatch) {
        form.setError("mediaUrl", { type: "manual", message: mismatch });
        return;
      }
    }
    const missingMedia = missingMediaSourceMessage(data.mediaKind, data.mediaUrl, Boolean(pendingFile));
    if (missingMedia) {
      form.setError("mediaUrl", { type: "manual", message: missingMedia });
      return;
    }
    if (pendingFile) {
      setUploading(true);
      try {
        const uploadResult = await presignAndPutFile(pendingFile);
        if (!uploadResult.ok) {
          setError(uploadResult.message);
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
    const submittedUrl = data.mediaUrl?.trim() || null;
    const urlUnchanged = submittedUrl !== null && submittedUrl === originalMediaUrl.trim();
    const submittedMediaType = !submittedUrl
      ? null
      : urlUnchanged
        ? sessionMediaTypeForApi(originalMediaKind, true)
        : sessionMediaTypeForApi(data.mediaKind, true);
    const res = await apiFetch(`/sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: data.title,
        durationSeconds: data.durationSeconds,
        instructorName: data.instructorName,
        tags: tagsFromString(data.tags),
        mediaUrl: submittedUrl,
        mediaType: submittedMediaType
      })
    });
    const resBody = await res.json().catch(() => ({}));
    if (!res.ok) {
      const { message, details } = readApiErrorDetails(resBody);
      const values = form.getValues();
      if (details?.fieldErrors) {
        applyServerFieldErrors(form.setError, values, details.fieldErrors);
      }
      const hasMappedFieldError = Boolean(
        details?.fieldErrors &&
          Object.entries(details.fieldErrors).some(
            ([field, msgs]) => Boolean(msgs?.[0]) && field in values
          )
      );
      setError(hasMappedFieldError ? null : message);
      return;
    }
    router.push(`/programs/${programId}/sessions`);
  }

  const trimmedMediaUrl = form.watch("mediaUrl")?.trim() ?? "";
  const originalKindLabel =
    originalMediaKind === "audio" ? "Audio" : originalMediaKind === "video" ? "Video" : null;

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
        <p className={dashPageDescription}>Update session details and media.</p>
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
          <div className={dashInsetCard}>
            <p className="text-sm font-medium text-foreground">Session media</p>

            {trimmedMediaUrl ? (
              <div className="mt-4 space-y-2">
                <label className={dashLabel} htmlFor="es-media-url-readonly">
                  Media URL <span className="text-muted-foreground">(read-only)</span>
                </label>
                <input
                  id="es-media-url-readonly"
                  readOnly
                  className={cn(dashInputCn(), "cursor-default bg-muted/40")}
                  {...form.register("mediaUrl")}
                />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  {originalKindLabel ? (
                    <p className="text-xs text-muted-foreground">
                      Currently stored as <span className="font-medium text-foreground">{originalKindLabel}</span>
                    </p>
                  ) : null}
                  <a
                    href={trimmedMediaUrl}
                    className={cn(dashPrimaryLink, "text-xs")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open media
                  </a>
                </div>
              </div>
            ) : null}

            <div className={cn(trimmedMediaUrl ? "mt-5" : "mt-4", "space-y-2")}>
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

            <div className="mt-5 space-y-2">
              <label className={dashLabel} htmlFor="es-media-file">
                {trimmedMediaUrl ? "Replace with file" : "Attach file"}
              </label>
              <input
                id="es-media-file"
                ref={fileRef}
                type="file"
                accept={fileAcceptForMediaKind(mediaKind)}
                className="w-full max-w-full text-sm text-muted-foreground"
                disabled={uploading || mediaKind === "none"}
              />
              {mediaKind === "none" ? (
                <p className="text-xs text-muted-foreground">
                  Set media type to Audio or Video to {trimmedMediaUrl ? "replace" : "attach"} a file.
                </p>
              ) : null}
            </div>

            {trimmedMediaUrl ? (
              <div className={cn(dashInsetButtonRow, "mt-4")}>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    form.setValue("mediaUrl", "");
                    form.setValue("mediaType", "");
                    form.setValue("mediaKind", "none");
                    if (fileRef.current) {
                      fileRef.current.value = "";
                    }
                  }}
                >
                  Remove media
                </Button>
              </div>
            ) : null}

            {errors.mediaUrl?.message ? (
              <p className="mt-3 text-sm text-destructive">{errors.mediaUrl.message}</p>
            ) : null}
            {errors.mediaType?.message ? (
              <p className="mt-2 text-sm text-destructive">{errors.mediaType.message}</p>
            ) : null}
          </div>

          <input type="hidden" {...form.register("mediaType")} />
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
