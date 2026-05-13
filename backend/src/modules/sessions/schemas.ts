import { SessionMediaType } from "@prisma/client";
import { z } from "../../lib/zodOpenapi.js";

const sessionMediaTypeField = z.nativeEnum(SessionMediaType).nullable().optional();

export const createSessionBodySchema = z.object({
  programId: z.string().min(1),
  title: z.string().min(1).max(500),
  durationSeconds: z
    .number()
    .int()
    .positive()
    .max(86400 * 365),
  position: z.number().int().min(0).optional(),
  instructorName: z.string().min(1).max(200),
  tags: z.array(z.string().max(100)).max(50).default([]),
  mediaUrl: z.string().max(2000).optional().nullable(),
  mediaType: sessionMediaTypeField
});

export const updateSessionBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    durationSeconds: z
      .number()
      .int()
      .positive()
      .max(86400 * 365)
      .optional(),
    position: z.number().int().min(0).optional(),
    instructorName: z.string().min(1).max(200).optional(),
    tags: z.array(z.string().max(100)).max(50).optional(),
    mediaUrl: z.string().max(2000).optional().nullable(),
    mediaType: sessionMediaTypeField
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" });

export const reorderSessionsBodySchema = z.object({
  programId: z.string().min(1),
  orderedSessionIds: z.array(z.string().min(1)).min(1)
});

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
export type UpdateSessionBody = z.infer<typeof updateSessionBodySchema>;
export type ReorderSessionsBody = z.infer<typeof reorderSessionsBodySchema>;
