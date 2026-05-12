export type MediaKind = "none" | "audio" | "video";

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

export function fileAcceptForMediaKind(kind: MediaKind): string {
  if (kind === "audio") {
    return "audio/*";
  }
  if (kind === "video") {
    return "video/*";
  }
  return "audio/*,video/*";
}
