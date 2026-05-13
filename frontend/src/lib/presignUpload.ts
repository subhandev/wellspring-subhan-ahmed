import { apiFetch, readApiErrorMessage } from "./api";
import { inferFileContentType } from "./inferFileContentType";

export type PresignPutResult =
  | { ok: true; publicUrl: string; contentType: string }
  | { ok: false; message: string };

/** Presign → PUT to S3 (preferred); on failure, POST `/v1/uploads/relay` with same bytes. */
export async function presignAndPutFile(file: File): Promise<PresignPutResult> {
  const contentTypeForPresign = inferFileContentType(file);
  if (contentTypeForPresign === "application/octet-stream") {
    return {
      ok: false,
      message:
        "Could not detect file type. Rename the file with a common extension (e.g. .mp3, .mp4) or try another browser."
    };
  }
  const presign = await apiFetch("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: contentTypeForPresign
    })
  });
  const pBody = await presign.json().catch(() => ({}));
  if (!presign.ok) {
    return { ok: false, message: readApiErrorMessage(pBody, "Presign failed") };
  }
  const p = pBody as {
    uploadUrl?: string;
    publicUrl?: string;
    key?: string;
    contentType?: string;
  };
  if (!p.uploadUrl || !p.publicUrl || !p.key) {
    return { ok: false, message: "Invalid presign response" };
  }
  const { uploadUrl, publicUrl, key: objectKey } = p;
  const contentType = (p.contentType ?? contentTypeForPresign) || "application/octet-stream";

  const relay = () =>
    apiFetch("/uploads/relay", {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        "X-Wellspring-S3-Key": objectKey
      },
      body: file.slice(0, file.size, contentType)
    });

  let res: Response;
  try {
    res = await fetch(uploadUrl, {
      method: "PUT",
      mode: "cors",
      credentials: "omit",
      body: file,
      headers: { "Content-Type": contentType }
    });
  } catch {
    res = await relay();
  }
  if (!res.ok && res.status === 403) {
    res = await relay();
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    return {
      ok: false,
      message: readApiErrorMessage(errBody, `Upload failed (HTTP ${res.status})`)
    };
  }
  return {
    ok: true,
    publicUrl,
    contentType: (p.contentType ?? contentTypeForPresign) || "application/octet-stream"
  };
}
