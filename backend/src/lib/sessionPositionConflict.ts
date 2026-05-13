import { Prisma } from "@prisma/client";

/** User-facing copy for @@unique([programId, position]) on Session (HTTP 409 and CSV row errors). */
export const SESSION_POSITION_CONFLICT_USER_MESSAGE =
  "Position is already in use for this program. Choose another position or use the reorder endpoint.";

/**
 * Maps database errors from session CSV import to short, non-leaky messages.
 * Never returns raw Prisma error text.
 */
export function errorsForSessionImportCatch(err: unknown): string[] {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = err.meta?.target;
      const fields = Array.isArray(target) ? target.map(String) : [];
      if (fields.includes("programId") && fields.includes("position")) {
        return [SESSION_POSITION_CONFLICT_USER_MESSAGE];
      }
      return ["This row could not be imported because it duplicates unique data."];
    }
    return ["This row could not be imported due to a database constraint."];
  }
  return [err instanceof Error ? err.message : "import failed"];
}
