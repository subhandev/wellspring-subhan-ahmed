import type { Logger } from "pino";
import type { Creator } from "@prisma/client";
import type { TenantId } from "./tenant.js";

/** Creator profile attached after JWT verification (secrets stripped). */
export type AuthenticatedCreator = Omit<
  Creator,
  "passwordHash" | "passwordResetTokenHash" | "passwordResetExpiresAt"
>;

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      /** Pino request logger from pino-http. */
      log: Logger;
      /** Set after JWT verification; omit on pre-auth routes. */
      tenantId?: TenantId;
      /** Authenticated creator id (same as tenant for this product). */
      creatorId?: string;
      /** Full creator row without sensitive hash fields after authentication middleware. */
      creator?: AuthenticatedCreator;
    }
  }
}

export {};
