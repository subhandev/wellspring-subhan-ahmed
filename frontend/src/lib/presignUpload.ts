import { apiFetch, readApiErrorMessage } from "./api";

export type PresignPutResult =
  | { ok: true; publicUrl: string; contentType: string }
  | { ok: false; message: string };

export async function presignAndPutFile(file: File): Promise<PresignPutResult> {
  const presign = await apiFetch("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type || "application/octet-stream"
    })
  });
  const pBody = await presign.json().catch(() => ({}));
  if (!presign.ok) {
    return { ok: false, message: readApiErrorMessage(pBody, "Presign failed") };
  }
  const p = pBody as { uploadUrl?: string; publicUrl?: string; contentType?: string };
  if (!p.uploadUrl || !p.publicUrl) {
    return { ok: false, message: "Invalid presign response" };
  }
  const put = await fetch(p.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": (p.contentType ?? file.type) || "application/octet-stream"
    }
  });
  if (!put.ok) {
    return { ok: false, message: "Upload to storage failed" };
  }
  return {
    ok: true,
    publicUrl: p.publicUrl,
    contentType: (p.contentType ?? file.type) || "application/octet-stream"
  };
}
