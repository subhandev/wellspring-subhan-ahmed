"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import {
  dashFormActions,
  dashFormSection,
  dashInputCn,
  dashInsetCard,
  dashLabel,
  dashPageDescription,
  dashPageTitle,
  dashPrimaryLink,
  dashSectionCard
} from "@/lib/dashboardUi";
import { cn } from "@/lib/utils";
import type { CsvImportRowResult } from "@/types";

/** Header row for session CSV import; must stay aligned with backend import validation. */
const SESSIONS_IMPORT_CSV_TEMPLATE =
  "client_row_id,program_id,title,duration_seconds,instructor_name,tags,position\n";

const REQUIRED_COLUMNS = [
  "client_row_id",
  "program_id",
  "title",
  "duration_seconds",
  "instructor_name"
] as const;

const OPTIONAL_COLUMNS = ["tags", "position"] as const;

const columnChipCn =
  "inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[11px] leading-none text-foreground";

const importFormSchema = z
  .object({
    clientImportId: z.string().min(1, "Client import ID is required"),
    csvFile: z.any().optional()
  })
  .superRefine((data, ctx) => {
    const f = data.csvFile;
    if (!(f instanceof File)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CSV file is required",
        path: ["csvFile"]
      });
      return;
    }
    if (f.size === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CSV file must not be empty",
        path: ["csvFile"]
      });
      return;
    }
    const okType =
      !f.type ||
      f.type === "text/csv" ||
      f.type === "application/vnd.ms-excel" ||
      f.type === "text/plain";
    if (!okType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File must be a CSV (.csv)",
        path: ["csvFile"]
      });
    }
  });

type Form = z.infer<typeof importFormSchema>;

const defaultFormValues: Form = {
  clientImportId: "",
  csvFile: undefined
};

function rowVisuals(r: CsvImportRowResult) {
  if (!r.ok) {
    return {
      row: "border-l-[3px] border-l-destructive bg-destructive/[0.06]",
      badge: "bg-destructive/15 text-destructive ring-1 ring-destructive/25",
      label: "Failed"
    };
  }
  if (r.idempotent) {
    return {
      row: "border-l-[3px] border-l-amber-500 bg-amber-500/[0.08] dark:bg-amber-500/10",
      badge:
        "bg-amber-500/15 text-amber-950 ring-1 ring-amber-500/30 dark:text-amber-100 dark:ring-amber-400/35",
      label: "Already imported"
    };
  }
  return {
    row: "border-l-[3px] border-l-emerald-600 bg-emerald-600/[0.07] dark:bg-emerald-500/10",
    badge:
      "bg-emerald-600/15 text-emerald-950 ring-1 ring-emerald-600/25 dark:text-emerald-100 dark:ring-emerald-400/30",
    label: "Imported"
  };
}

export default function ImportPage() {
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CsvImportRowResult[] | null>(null);
  const [csvFileInputKey, setCsvFileInputKey] = useState(0);

  const bumpCsvFileInput = useCallback(() => {
    setCsvFileInputKey((k) => k + 1);
  }, []);

  const form = useForm<Form>({
    resolver: zodResolver(importFormSchema),
    defaultValues: defaultFormValues
  });

  async function onSubmit(data: Form) {
    setError(null);
    setResults(null);
    const file = data.csvFile instanceof File ? data.csvFile : null;
    if (!file) {
      return;
    }
    const fd = new FormData();
    fd.append("clientImportId", data.clientImportId);
    fd.append("file", file);
    try {
      const res = await apiFetch("/import/sessions", {
        method: "POST",
        body: fd
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(readApiErrorMessage(body, "Import failed"));
        form.reset({ clientImportId: data.clientImportId, csvFile: undefined });
        bumpCsvFileInput();
        return;
      }
      setResults((body as { results?: CsvImportRowResult[] }).results ?? []);
      form.reset(defaultFormValues);
      bumpCsvFileInput();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      form.setValue("csvFile", undefined);
      bumpCsvFileInput();
    }
  }

  const summary = results
    ? {
        imported: results.filter((r) => r.ok && !r.idempotent).length,
        idempotent: results.filter((r) => r.ok && r.idempotent).length,
        failed: results.filter((r) => !r.ok).length
      }
    : null;

  const clientImportIdError = form.formState.errors.clientImportId;
  const csvFileError = form.formState.errors.csvFile;

  return (
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className={dashPageTitle}>Import sessions from CSV</h1>
        <p className={dashPageDescription}>
          Upload a CSV of sessions. Re-using a client import ID makes retries safe — duplicate rows
          will not be created.
        </p>
      </header>

      <form onSubmit={form.handleSubmit(onSubmit)} className={dashSectionCard}>
        <div className={dashFormSection}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-8">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className={dashLabel} htmlFor="import-client-id">
                  Client import ID <span className="text-destructive">*</span>
                </label>
                <input
                  id="import-client-id"
                  className={dashInputCn(Boolean(clientImportIdError))}
                  placeholder="e.g. weekly-sync-2026-05-12"
                  aria-invalid={Boolean(clientImportIdError)}
                  {...form.register("clientImportId")}
                />
                <p className="text-xs text-muted-foreground">
                  A stable identifier for this import. Submitting the same ID again will skip rows
                  already imported.
                </p>
                {clientImportIdError ? (
                  <p className="text-sm text-destructive">{clientImportIdError.message}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className={dashLabel} htmlFor="import-csv-file">
                    CSV file <span className="text-destructive">*</span>
                  </label>
                  <a
                    href={`data:text/csv;charset=utf-8,${encodeURIComponent(SESSIONS_IMPORT_CSV_TEMPLATE)}`}
                    download="wellspring-sessions-import-template.csv"
                    className={dashPrimaryLink}
                  >
                    Download template
                  </a>
                </div>
                <Controller
                  name="csvFile"
                  control={form.control}
                  render={({ field: { onChange, onBlur, name, ref } }) => (
                    <input
                      key={csvFileInputKey}
                      id="import-csv-file"
                      name={name}
                      ref={ref}
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      onBlur={onBlur}
                      aria-invalid={Boolean(csvFileError)}
                      className={cn(
                        dashInputCn(Boolean(csvFileError)),
                        "cursor-pointer py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
                      )}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        onChange(f);
                      }}
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Accepts <code className="font-mono">.csv</code> files. Maximum one file per
                  import.
                </p>
                {csvFileError ? (
                  <p className="text-sm text-destructive">
                    {typeof csvFileError.message === "string" ? csvFileError.message : "Invalid file"}
                  </p>
                ) : null}
              </div>
            </div>

            <aside className={cn(dashInsetCard, "space-y-3 lg:self-start")}>
              <p className="text-xs font-medium text-foreground">Expected CSV columns</p>
              <dl className="space-y-2 text-xs">
                <div className="space-y-1.5">
                  <dt className="text-muted-foreground">Required</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {REQUIRED_COLUMNS.map((col) => (
                      <code key={col} className={columnChipCn}>
                        {col}
                      </code>
                    ))}
                  </dd>
                </div>
                <div className="space-y-1.5">
                  <dt className="text-muted-foreground">Optional</dt>
                  <dd className="flex flex-wrap gap-1.5">
                    {OPTIONAL_COLUMNS.map((col) => (
                      <code key={col} className={columnChipCn}>
                        {col}
                      </code>
                    ))}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                <code className="font-mono">tags</code> accepts values separated by commas or pipes.
              </p>
            </aside>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className={dashFormActions}>
            <Button type="submit" size="md" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Importing…
                </>
              ) : (
                "Import sessions"
              )}
            </Button>
          </div>
        </div>
      </form>
      {results ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold tracking-tight">Row results</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                One row per CSV line. Colors reflect outcome for quick scanning.
              </p>
            </div>
            {summary ? (
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full bg-emerald-600/12 px-3 py-1 text-xs font-medium text-emerald-950 ring-1 ring-emerald-600/20 dark:text-emerald-100 dark:ring-emerald-400/25">
                  Imported: {summary.imported}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-500/12 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-500/25 dark:text-amber-100 dark:ring-amber-400/30">
                  Already imported: {summary.idempotent}
                </span>
                <span className="inline-flex items-center rounded-full bg-destructive/12 px-3 py-1 text-xs font-medium text-destructive ring-1 ring-destructive/25">
                  Failed: {summary.failed}
                </span>
              </div>
            ) : null}
          </div>
          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-[0_1px_2px_rgb(28_28_26/0.04)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-muted/55 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/45 dark:bg-muted/35 dark:supports-[backdrop-filter]:bg-muted/25">
                  <tr>
                    <th
                      scope="col"
                      title="CSV column: client_row_id"
                      className="px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-none text-foreground"
                    >
                      Client row ID
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-none text-foreground"
                    >
                      Outcome
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-none text-foreground"
                    >
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r, rowIndex) => {
                    const v = rowVisuals(r);
                    return (
                      <tr
                        key={`${rowIndex}-${r.clientRowId}`}
                        className={cn("transition-colors", v.row)}
                      >
                        <td className="px-4 py-3 align-top font-mono text-xs text-foreground">{r.clientRowId}</td>
                        <td className="px-4 py-3 align-top">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                              v.badge
                            )}
                          >
                            {v.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-xs leading-relaxed">
                          {r.ok ? (
                            <span className="font-mono text-foreground/90">{r.sessionId}</span>
                          ) : (
                            <span className="text-destructive">{(r.errors ?? []).join("; ") || "—"}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
