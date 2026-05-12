import { z } from "../../lib/zodOpenapi.js";

export const auditQuerySchema = z.object({
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  action: z.string().min(1).max(200).optional()
});

export type AuditQuery = z.infer<typeof auditQuerySchema>;
