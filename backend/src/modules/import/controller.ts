import type { RequestHandler } from "express";
import { HttpError } from "../../lib/httpError.js";
import { httpErrorFromZod } from "../../lib/httpErrorFromZod.js";
import {
  importSessionsBodySchema,
  importSessionsMultipartFieldsSchema
} from "./schemas.js";
import * as importService from "./service.js";

const ALLOWED_CSV_MIMES = new Set([
  "",
  "text/csv",
  "application/csv",
  "text/plain",
  "application/octet-stream",
  "application/vnd.ms-excel"
]);

function requireTenantContext(req: Parameters<RequestHandler>[0]) {
  const tenantId = req.tenantId;
  const creatorId = req.creatorId;
  if (!tenantId || !creatorId) {
    return null;
  }
  return { tenantId, creatorId };
}

export const importSessions: RequestHandler = async (req, res, next) => {
  try {
    const ctx = requireTenantContext(req);
    if (!ctx) {
      next(new HttpError(401, "Unauthorized", "unauthorized"));
      return;
    }

    const isMultipart = req.is("multipart/form-data");

    if (isMultipart) {
      if (!req.file?.buffer?.length) {
        next(new HttpError(400, "CSV file is required", "validation_error"));
        return;
      }
      const mime = (req.file.mimetype ?? "").toLowerCase();
      if (!ALLOWED_CSV_MIMES.has(mime)) {
        next(
          new HttpError(
            400,
            "CSV file must be uploaded with a CSV-compatible content type",
            "validation_error"
          )
        );
        return;
      }
      const rawId = req.body?.clientImportId;
      const fields = importSessionsMultipartFieldsSchema.safeParse({
        clientImportId: typeof rawId === "string" ? rawId : ""
      });
      if (!fields.success) {
        next(httpErrorFromZod(fields.error));
        return;
      }
      const csv = req.file.buffer.toString("utf8");
      const out = await importService.importSessionsFromCsv(ctx.tenantId, ctx.creatorId, {
        clientImportId: fields.data.clientImportId,
        csv
      });
      res.status(200).json(out);
      return;
    }

    const parsed = importSessionsBodySchema.safeParse(req.body);
    if (!parsed.success) {
      next(httpErrorFromZod(parsed.error));
      return;
    }
    const out = await importService.importSessionsFromCsv(ctx.tenantId, ctx.creatorId, parsed.data);
    res.status(200).json(out);
  } catch (e) {
    next(e);
  }
};
