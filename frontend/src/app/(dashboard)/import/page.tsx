"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashFormSection, dashInputCn, dashLabel, dashSectionCard } from "@/lib/dashboardUi";
import { cn } from "@/lib/utils";
import type { CsvImportRowResult } from "@/types";

/** Header row for session CSV import; must stay aligned with backend import validation. */
const SESSIONS_IMPORT_CSV_TEMPLATE =
  "client_row_id,program_id,title,duration_seconds,instructor_name,tags,position\n";

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

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Import sessions from CSV</h1>
          <p className="text-sm text-muted-foreground">
            Upload a CSV of sessions. Use a client import ID so safe retries do not create duplicate rows.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Required columns: <code className="text-xs">client_row_id</code>,{" "}
          <code className="text-xs">program_id</code>, <code className="text-xs">title</code>,{" "}
          <code className="text-xs">duration_seconds</code>,{" "}
          <code className="text-xs">instructor_name</code>. Optional:{" "}
          <code className="text-xs">tags</code> (comma or pipe),{" "}
          <code className="text-xs">position</code>.
        </p>
      </header>
      <form onSubmit={form.handleSubmit(onSubmit)} className={dashSectionCard}>
        <div className={dashFormSection}>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="import-client-id">
              Client import ID
            </label>
            <input
              id="import-client-id"
              className={cn(dashInputCn(), "max-w-md")}
              placeholder="e.g. weekly-sync-2026-05-12"
              {...form.register("clientImportId")}
            />
            {form.formState.errors.clientImportId ? (
              <p className="text-sm text-destructive">{form.formState.errors.clientImportId.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className={dashLabel} htmlFor="import-csv-file">
                CSV file
              </label>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(SESSIONS_IMPORT_CSV_TEMPLATE)}`}
                download="wellspring-sessions-import-template.csv"
                className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
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
                  className={cn(
                    dashInputCn(),
                    "cursor-pointer py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-xs file:font-medium"
                  )}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    onChange(f);
                  }}
                />
              )}
            />
            {form.formState.errors.csvFile ? (
              <p className="text-sm text-destructive">
                {typeof form.formState.errors.csvFile.message === "string"
                  ? form.formState.errors.csvFile.message
                  : "Invalid file"}
              </p>
            ) : null}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="border-t border-border pt-6">
            <Button type="submit" size="md" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Importing…
                </>
              ) : (
                "Run Import Sessions (CSV)"
              )}
            </Button>
          </div>
        </div>
      </form>
      {results ? (
        <section className={cn(dashSectionCard, "space-y-4")}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                <thead>
                  <tr className="border-b border-border bg-muted/60">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      client_row_id
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Outcome
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Detail
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {results.map((r) => {
                    const v = rowVisuals(r);
                    return (
                      <tr key={r.clientRowId} className={cn("transition-colors", v.row)}>
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
