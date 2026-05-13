import { URL } from "node:url";
import { HttpError } from "./httpError.js";
import type { TenantId } from "../types/tenant.js";

function tenantMediaPathPrefix(tenantId: TenantId): string {
  return `/tenants/${tenantId as string}/media/`;
}

/**
 * Ensures a non-empty session `mediaUrl` points at the tenant-owned S3 key prefix
 * used by presign (`tenants/{tenantId}/media/...`).
 */
export function assertSessionMediaUrlForTenant(
  tenantId: TenantId,
  mediaUrl: string | null | undefined
): void {
  if (mediaUrl == null || typeof mediaUrl !== "string") {
    return;
  }
  const trimmed = mediaUrl.trim();
  if (trimmed === "") {
    return;
  }

  let pathname: string;
  try {
    pathname = new URL(trimmed).pathname;
  } catch {
    throw new HttpError(400, "mediaUrl must be a valid absolute URL", "validation_error", {
      fieldErrors: { mediaUrl: ["Must be a valid absolute URL"] },
      formErrors: [] as string[]
    });
  }

  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // keep pathname as-is
  }

  const prefix = tenantMediaPathPrefix(tenantId);
  if (!decoded.startsWith(prefix)) {
    throw new HttpError(
      400,
      "mediaUrl must point to an object under this tenant's media prefix",
      "validation_error",
      {
        fieldErrors: {
          mediaUrl: ["URL must be under this tenant's uploaded media path (use presigned upload)."]
        },
        formErrors: [] as string[]
      }
    );
  }
}

/** S3 object key (no leading slash) after {@link assertSessionMediaUrlForTenant} rules. */
export function parseTenantMediaObjectKey(tenantId: TenantId, mediaUrl: string): string {
  assertSessionMediaUrlForTenant(tenantId, mediaUrl);
  const pathname = new URL(mediaUrl.trim()).pathname;
  let decoded = pathname;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    // keep pathname as-is
  }
  return decoded.replace(/^\//, "");
}
