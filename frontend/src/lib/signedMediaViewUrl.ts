import { apiFetch, readApiErrorMessage } from "./api";

export async function fetchSignedMediaViewUrl(
  mediaUrl: string
): Promise<{ ok: true; viewUrl: string } | { ok: false; message: string }> {
  const res = await apiFetch("/uploads/presign-get", {
    method: "POST",
    body: JSON.stringify({ mediaUrl })
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false, message: readApiErrorMessage(body, "Could not prepare media link") };
  }
  const viewUrl = (body as { viewUrl?: unknown }).viewUrl;
  if (typeof viewUrl !== "string" || !viewUrl.trim()) {
    return { ok: false, message: "Invalid presign-get response" };
  }
  return { ok: true, viewUrl: viewUrl.trim() };
}
