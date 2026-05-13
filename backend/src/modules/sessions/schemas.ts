import { SessionMediaType } from "@prisma/client";
import { z } from "../../lib/zodOpenapi.js";

const sessionMediaTypeField = z.nativeEnum(SessionMediaType).nullable().optional();

const optionalMediaUrl = z.preprocess((v) => {
  if (v === undefined) {
    return undefined;
  }
  if (v === null) {
    return null;
  }
  if (typeof v === "string" && v.trim() === "") {
    return null;
  }
  return v;
}, z.string().max(2000).nullable().optional());

export const createSessionBodySchema = z
  .object({
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
    mediaUrl: optionalMediaUrl,
    mediaType: sessionMediaTypeField
  })
  .superRefine((data, ctx) => {
    const url = typeof data.mediaUrl === "string" ? data.mediaUrl.trim() : "";
    const hasMedia = url.length > 0;
    if (hasMedia) {
      if (data.mediaType !== SessionMediaType.AUDIO && data.mediaType !== SessionMediaType.VIDEO) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "mediaType must be AUDIO or VIDEO when mediaUrl is set",
          path: ["mediaType"]
        });
      }
    } else if (data.mediaType != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Remove mediaType when there is no media URL",
        path: ["mediaType"]
      });
    }
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
    mediaUrl: optionalMediaUrl,
    mediaType: sessionMediaTypeField
  })
  .refine((o) => Object.keys(o).length > 0, { message: "At least one field required" })
  .superRefine((data, ctx) => {
    if (data.mediaUrl === undefined) {
      return;
    }
    const url = data.mediaUrl === null ? "" : data.mediaUrl.trim();
    const hasMedia = url.length > 0;
    if (hasMedia) {
      if (data.mediaType !== SessionMediaType.AUDIO && data.mediaType !== SessionMediaType.VIDEO) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "mediaType must be AUDIO or VIDEO when mediaUrl is set",
          path: ["mediaType"]
        });
      }
    } else if (data.mediaType != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Set mediaType to null when clearing mediaUrl",
        path: ["mediaType"]
      });
    }
  });

export const reorderSessionsBodySchema = z.object({
  programId: z.string().min(1),
  orderedSessionIds: z.array(z.string().min(1)).min(1)
});

export type CreateSessionBody = z.infer<typeof createSessionBodySchema>;
export type UpdateSessionBody = z.infer<typeof updateSessionBodySchema>;
export type ReorderSessionsBody = z.infer<typeof reorderSessionsBodySchema>;
