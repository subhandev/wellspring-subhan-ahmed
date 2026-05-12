/**
 * HTTP body validation for Programs. Response shapes follow Prisma `Program`;
 * paths are documented in `openapi/openapiDocument.ts` (tag Programs) and
 * `docs/CODE_SUMMARY.md` (Programs API contract).
 */
import { z } from "../../lib/zodOpenapi.js";

export const createProgramBodySchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional()
});

export const updateProgramBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(5000).nullable().optional()
  })
  .refine((o) => o.title !== undefined || o.description !== undefined, {
    message: "At least one field required"
  });

export type CreateProgramBody = z.infer<typeof createProgramBodySchema>;
export type UpdateProgramBody = z.infer<typeof updateProgramBodySchema>;
