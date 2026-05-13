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
