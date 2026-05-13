import { z } from "../../lib/zodOpenapi.js";

export const presignBodySchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1).max(200)
});

export type PresignBody = z.infer<typeof presignBodySchema>;

export const presignGetBodySchema = z.object({
  mediaUrl: z.string().url().max(2000)
});

export type PresignGetBody = z.infer<typeof presignGetBodySchema>;
