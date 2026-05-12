import { z } from "../../lib/zodOpenapi.js";

export const importSessionsBodySchema = z.object({
  clientImportId: z.string().min(1).max(200),
  /** Raw CSV text including header row */
  csv: z.string().min(1).max(2_000_000)
});

export type ImportSessionsBody = z.infer<typeof importSessionsBodySchema>;
