import { z } from "../../lib/zodOpenapi.js";
import { MAX_CSV_IMPORT_BYTES } from "./limits.js";

export const importSessionsBodySchema = z.object({
  clientImportId: z.string().min(1).max(200),
  /** Raw CSV text including header row */
  csv: z.string().min(1).max(MAX_CSV_IMPORT_BYTES)
});

export type ImportSessionsBody = z.infer<typeof importSessionsBodySchema>;

/** Multipart form fields (file handled by multer, not Zod). */
export const importSessionsMultipartFieldsSchema = z.object({
  clientImportId: z.string().min(1).max(200)
});

export type ImportSessionsMultipartFields = z.infer<typeof importSessionsMultipartFieldsSchema>;
