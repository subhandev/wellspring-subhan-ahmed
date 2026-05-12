import type { TenantId } from "./tenant.js";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      /** Set after JWT verification; omit on pre-auth routes. */
      tenantId?: TenantId;
      /** Authenticated creator id (same as tenant for this product). */
      creatorId?: string;
    }
  }
}

export {};
