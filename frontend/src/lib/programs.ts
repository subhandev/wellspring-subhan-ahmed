import { z } from "zod";

/** Mirrors `backend/src/modules/programs/schemas.ts` string limits. */
export const PROGRAM_TITLE_MAX = 500;
export const PROGRAM_DESCRIPTION_MAX = 5000;

export const newProgramFormSchema = z.object({
  title: z.string().min(1).max(PROGRAM_TITLE_MAX),
  description: z.string().max(PROGRAM_DESCRIPTION_MAX).optional()
});

export const editProgramFormSchema = z.object({
  title: z.string().min(1).max(PROGRAM_TITLE_MAX),
  description: z.string().max(PROGRAM_DESCRIPTION_MAX).optional().nullable()
});

export type NewProgramForm = z.infer<typeof newProgramFormSchema>;
export type EditProgramForm = z.infer<typeof editProgramFormSchema>;
