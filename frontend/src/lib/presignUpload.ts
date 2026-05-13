import { apiFetch, readApiErrorMessage } from "./api";
import { inferFileContentType } from "./inferFileContentType";

export type PresignPutResult =
  | { ok: true; publicUrl: string; contentType: string }
  | { ok: false; message: string };

const s3ReachabilityHint =
  "Confirm the bucket CORS policy allows PUT from this admin origin (include http://localhost:3000 and http://127.0.0.1:3000 in dev), that the API's AWS_REGION matches the bucket's region, and that browser extensions or proxies are not blocking the S3 hostname.";

/** Presign → browser PUT directly to S3 (signed URL). */
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
  const { uploadUrl, publicUrl } = p;
  const contentType = (p.contentType ?? contentTypeForPresign) || "application/octet-stream";

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
    return {
      ok: false,
      message: `Could not reach S3 from the browser (network error before any response). ${s3ReachabilityHint}`
    };
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
