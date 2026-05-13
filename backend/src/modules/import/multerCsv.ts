import multer from "multer";
import { MAX_CSV_IMPORT_BYTES } from "./limits.js";

const storage = multer.memoryStorage();

export const csvFileUpload = multer({
  storage,
  limits: { fileSize: MAX_CSV_IMPORT_BYTES }
});
