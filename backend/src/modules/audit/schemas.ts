import { AUDIT_ACTION_API_VALUES, type AuditActionApiValue } from "../../lib/auditActionWire.js";
import { z } from "../../lib/zodOpenapi.js";

const auditActionEnum = z.enum(
  AUDIT_ACTION_API_VALUES as unknown as [AuditActionApiValue, ...AuditActionApiValue[]]
);

export const auditQuerySchema = z.object({
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  action: auditActionEnum.optional()
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
