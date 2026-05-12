import { parse } from "csv-parse/sync";
import { Prisma } from "@prisma/client";
import { prisma } from "../../config/database.js";
import { HttpError } from "../../lib/httpError.js";
import { appendAuditLog } from "../../lib/auditWriter.js";
import * as sessionsRepo from "../sessions/sessions.repository.js";
import type { TenantId } from "../../types/tenant.js";
import type { ImportSessionsBody } from "./schemas.js";

type RowResult =
  | { clientRowId: string; ok: true; sessionId: string; idempotent?: boolean }
  | { clientRowId: string; ok: false; errors: string[] };

const REQUIRED_HEADERS = [
  "client_row_id",
  "program_id",
  "title",
  "duration_seconds",
  "instructor_name"
] as const;

export async function importSessionsFromCsv(
  tenantId: TenantId,
  actorId: string,
  body: ImportSessionsBody
) {
  let records: Record<string, string>[];
  try {
    records = parse(body.csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    }) as Record<string, string>[];
  } catch {
    throw new HttpError(400, "Invalid CSV format", "csv_parse_error");
  }

  if (records.length === 0) {
    throw new HttpError(400, "CSV has no data rows", "validation_error");
  }

  const headers = Object.keys(records[0]).map((h) => h.trim().toLowerCase());
  for (const h of REQUIRED_HEADERS) {
    if (!headers.includes(h)) {
      throw new HttpError(
        400,
        `CSV header must include ${REQUIRED_HEADERS.join(", ")}`,
        "validation_error"
      );
    }
  }

  const results: RowResult[] = [];

  for (let i = 0; i < records.length; i++) {
    const row = records[i];
    const line = i + 2;
    const clientRowId = (row.client_row_id ?? "").trim();
    if (!clientRowId) {
      results.push({
        clientRowId: `row_${line}`,
        ok: false,
        errors: ["client_row_id is required"]
      });
      continue;
    }

    const errs: string[] = [];
    const programId = (row.program_id ?? "").trim();
    const title = (row.title ?? "").trim();
    const durationRaw = (row.duration_seconds ?? "").trim();
    const instructorName = (row.instructor_name ?? "").trim();
    const tagsRaw = (row.tags ?? "").trim();
    const positionRaw = (row.position ?? "").trim();

    if (!programId) {
      errs.push("program_id is required");
    }
    if (!title) {
      errs.push("title is required");
    }
    if (!durationRaw) {
      errs.push("duration_seconds is required");
    }
    if (!instructorName) {
      errs.push("instructor_name is required");
    }

    let durationSeconds = 0;
    if (durationRaw) {
      const d = Number.parseInt(durationRaw, 10);
      if (!Number.isFinite(d) || d <= 0) {
        errs.push("duration_seconds must be a positive integer");
      } else {
        durationSeconds = d;
      }
    }

    let position: number | undefined;
    if (positionRaw) {
      const p = Number.parseInt(positionRaw, 10);
      if (!Number.isFinite(p) || p < 0) {
        errs.push("position must be a non-negative integer");
      } else {
        position = p;
      }
    }

    const tags =
      tagsRaw.length > 0
        ? tagsRaw
            .split(/[|,]/)
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

    if (errs.length > 0) {
      results.push({ clientRowId, ok: false, errors: errs });
      continue;
    }

    const program = await sessionsRepo.assertProgramOwnedByTenant(
      tenantId,
      programId
    );
    if (!program) {
      results.push({
        clientRowId,
        ok: false,
        errors: ["program not found for this tenant"]
      });
      continue;
    }

    try {
      const rowResult = await processRow(
        tenantId,
        body.clientImportId,
        {
          clientRowId,
          programId,
          title,
          durationSeconds,
          instructorName,
          tags,
          position
        }
      );
      results.push(rowResult);
    } catch (e) {
      results.push({
        clientRowId,
        ok: false,
        errors: [e instanceof Error ? e.message : "import failed"]
      });
    }
  }

  const failed = results.filter((r) => !r.ok).length;

  await appendAuditLog({
    tenantId,
    actorId,
    action: "sessions.imported",
    targetType: "import",
    targetId: body.clientImportId,
    metadata: {
      rows: records.length,
      failed,
      clientImportId: body.clientImportId
    }
  });

  return { results, clientImportId: body.clientImportId };
}

async function processRow(
  tenantId: TenantId,
  clientImportId: string,
  row: {
    clientRowId: string;
    programId: string;
    title: string;
    durationSeconds: number;
    instructorName: string;
    tags: string[];
    position?: number;
  }
): Promise<RowResult> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.sessionImportKey.findUnique({
      where: {
        tenantId_clientImportId_clientRowId: {
          tenantId: tenantId as string,
          clientImportId,
          clientRowId: row.clientRowId
        }
      }
    });

    if (existing?.sessionId) {
      return {
        clientRowId: row.clientRowId,
        ok: true,
        sessionId: existing.sessionId,
        idempotent: true
      };
    }

    try {
      await tx.sessionImportKey.create({
        data: {
          tenantId: tenantId as string,
          clientImportId,
          clientRowId: row.clientRowId,
          status: "pending",
          errorMsg: null,
          sessionId: null
        }
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const after = await tx.sessionImportKey.findUnique({
          where: {
            tenantId_clientImportId_clientRowId: {
              tenantId: tenantId as string,
              clientImportId,
              clientRowId: row.clientRowId
            }
          }
        });
        if (after?.sessionId) {
          return {
            clientRowId: row.clientRowId,
            ok: true,
            sessionId: after.sessionId,
            idempotent: true
          };
        }
      }
      throw e;
    }

    let pos =
      row.position !== undefined
        ? row.position
        : await nextPositionTx(tx, tenantId, row.programId);

    const session = await tx.session.create({
      data: {
        tenantId: tenantId as string,
        programId: row.programId,
        title: row.title,
        durationSeconds: row.durationSeconds,
        position: pos,
        instructorName: row.instructorName,
        tags: row.tags,
        mediaUrl: undefined,
        mediaType: undefined
      }
    });

    await tx.sessionImportKey.update({
      where: {
        tenantId_clientImportId_clientRowId: {
          tenantId: tenantId as string,
          clientImportId,
          clientRowId: row.clientRowId
        }
      },
      data: {
        sessionId: session.id,
        status: "success",
        errorMsg: null
      }
    });

    return {
      clientRowId: row.clientRowId,
      ok: true,
      sessionId: session.id
    };
  });
}

async function nextPositionTx(
  tx: Omit<
    Prisma.DefaultPrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
  >,
  tenantId: TenantId,
  programId: string
): Promise<number> {
  const agg = await tx.session.aggregate({
    where: { tenantId: tenantId as string, programId },
    _max: { position: true }
  });
  return (agg._max.position ?? -1) + 1;
}
