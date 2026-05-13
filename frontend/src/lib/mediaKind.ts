import { inferFileContentType } from "./inferFileContentType";

export type MediaKind = "none" | "audio" | "video";

/** API + DB enum for session media (see Prisma `SessionMediaType`). */
export type SessionMediaTypeApi = "AUDIO" | "VIDEO";

export function mimeToMediaKind(mime: string | null | undefined): MediaKind {
  if (!mime) {
    return "none";
  }
  if (mime.startsWith("audio/")) {
    return "audio";
  }
  if (mime.startsWith("video/")) {
    return "video";
  }
  return "none";
}

/** Map persisted session `mediaType` (enum) or legacy MIME to UI kind. */
export function sessionMediaKindFromApi(mt: string | null | undefined): MediaKind {
  if (mt === "AUDIO") {
    return "audio";
  }
  if (mt === "VIDEO") {
    return "video";
  }
  return mimeToMediaKind(mt);
}

/** Body field for `POST/PATCH /v1/sessions` when a media URL is present. */
export function sessionMediaTypeForApi(kind: MediaKind, hasMediaUrl: boolean): SessionMediaTypeApi | null {
  if (!hasMediaUrl || kind === "none") {
    return null;
  }
  return kind === "audio" ? "AUDIO" : "VIDEO";
}

export function fileAcceptForMediaKind(kind: MediaKind): string {
  if (kind === "audio") {
    return "audio/*";
  }
  if (kind === "video") {
    return "video/*";
  }
  return "audio/*,video/*";
}

/** When a file is chosen, ensure its (inferred) MIME matches the selected session media kind. */
export function fileMediaKindMismatchMessage(kind: MediaKind, file: File): string | null {
  if (kind === "none") {
    return null;
  }
  const ct = inferFileContentType(file);
  if (ct === "application/octet-stream") {
    return "Could not tell if this file is audio or video. Use a clear extension (.mp3, .mp4, …) or set the media type to match the file.";
  }
  if (kind === "audio" && !ct.startsWith("audio/")) {
    return "This file does not look like audio. Set media type to Video, or choose an audio file.";
  }
  if (kind === "video" && !ct.startsWith("video/")) {
    return "This file does not look like video. Set media type to Audio, or choose a video file.";
  }
  return null;
}
