import { z } from "zod";

/** Media fields shared by new/edit session forms (aligned with API max lengths). */
export const sessionMediaShape = z.object({
  mediaKind: z.enum(["none", "audio", "video"]),
  mediaUrl: z.string().max(2000),
  mediaType: z.string().max(200)
});

export type SessionMediaForm = z.infer<typeof sessionMediaShape>;

/**
 * Cross-field rules: none vs URL/MIME, http(s) URL shape, MIME prefix vs media kind.
 * Does not require a URL when kind is audio/video (file may be supplied on submit).
 */
export function refineSessionMedia(data: SessionMediaForm, ctx: z.RefinementCtx): void {
  const url = data.mediaUrl.trim();
  const mime = data.mediaType.trim();

  if (data.mediaKind === "none") {
    if (url) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remove the media URL or set media type to Audio or Video.",
        path: ["mediaUrl"]
      });
    }
    if (mime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Clear MIME type when media type is None.",
        path: ["mediaType"]
      });
    }
    return;
  }

  if (url) {
    try {
      const u = new URL(url);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use an http or https URL.",
          path: ["mediaUrl"]
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid absolute URL.",
        path: ["mediaUrl"]
      });
    }
  }

  if (mime) {
    if (data.mediaKind === "audio" && !mime.startsWith("audio/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MIME type must start with audio/ when media type is Audio.",
        path: ["mediaType"]
      });
    } else if (data.mediaKind === "video" && !mime.startsWith("video/")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "MIME type must start with video/ when media type is Video.",
        path: ["mediaType"]
      });
    }
  }
}

/** When kind is audio/video, require a URL or a file chosen for upload. */
export function missingMediaSourceMessage(
  mediaKind: SessionMediaForm["mediaKind"],
  url: string,
  hasPendingFile: boolean
): string | null {
  if (mediaKind === "none") {
    return null;
  }
  if (url.trim()) {
    return null;
  }
  if (hasPendingFile) {
    return null;
  }
  return "Upload a file or enter a media URL.";
}
