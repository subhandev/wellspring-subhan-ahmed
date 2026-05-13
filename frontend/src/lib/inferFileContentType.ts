/** Guess Content-Type when the browser leaves `File.type` empty (common for some desktop picks). */
export function inferFileContentType(file: File): string {
  const direct = file.type?.trim();
  if (direct && direct !== "application/octet-stream") {
    return direct;
  }
  const name = file.name.toLowerCase();
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1) : "";
  switch (ext) {
    case "mp3":
      return "audio/mpeg";
    case "wav":
      return "audio/wav";
    case "m4a":
    case "aac":
      return "audio/mp4";
    case "ogg":
    case "oga":
      return "audio/ogg";
    case "flac":
      return "audio/flac";
    case "webm":
      return "video/webm";
    case "mp4":
    case "m4v":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "mkv":
      return "video/x-matroska";
    default:
      return direct || "application/octet-stream";
  }
}
