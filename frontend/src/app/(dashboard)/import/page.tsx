"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashFormSection, dashInputCn, dashLabel, dashSectionCard, dashTextareaCn } from "@/lib/dashboardUi";
import { cn } from "@/lib/utils";
import type { CsvImportRowResult } from "@/types";

/** Header row for session CSV import; must stay aligned with backend import validation. */
const SESSIONS_IMPORT_CSV_TEMPLATE =
  "client_row_id,program_id,title,duration_seconds,instructor_name,tags,position\n";

const schema = z.object({
  clientImportId: z.string().min(1),
  csv: z.string().min(1)
});

type Form = z.infer<typeof schema>;

export default function ImportPage() {
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CsvImportRowResult[] | null>(null);
  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      clientImportId: "",
      csv: SESSIONS_IMPORT_CSV_TEMPLATE
    }
  });

  async function onSubmit(data: Form) {
    setError(null);
    setResults(null);
    const res = await apiFetch("/import/sessions", {
      method: "POST",
      body: JSON.stringify(data)
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Import failed"));
      return;
    }
    setResults((body as { results?: CsvImportRowResult[] }).results ?? []);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Bulk import</h1>
          <p className="text-sm text-muted-foreground">
            Upload session rows from CSV. Use a client-provided import ID so retries stay idempotent.
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
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className={dashLabel} htmlFor="import-csv">
                CSV
              </label>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent(SESSIONS_IMPORT_CSV_TEMPLATE)}`}
                download="wellspring-sessions-import-template.csv"
                className="text-sm font-medium text-primary underline underline-offset-4 hover:no-underline"
              >
                Download template
              </a>
            </div>
            <textarea
              id="import-csv"
              rows={12}
              className={cn(dashTextareaCn(), "font-mono text-xs")}
              {...form.register("csv")}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="border-t border-border pt-6">
            <Button type="submit" size="md" disabled={form.formState.isSubmitting}>
              Run import
            </Button>
          </div>
        </div>
      </form>
      {results ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {(() => {
              const ok = results.filter((r) => r.ok).length;
              const fail = results.length - ok;
              return `${ok} row${ok === 1 ? "" : "s"} succeeded${fail > 0 ? ` · ${fail} row${fail === 1 ? "" : "s"} failed` : ""}`;
            })()}
          </p>
          <h2 className="font-medium">Results</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="px-3 py-2">client_row_id</th>
                  <th className="px-3 py-2">status</th>
                  <th className="px-3 py-2">detail</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.clientRowId} className="border-b last:border-0">
                    <td className="px-3 py-2 font-mono text-xs">{r.clientRowId}</td>
                    <td className="px-3 py-2">
                      {r.ok ? (r.idempotent ? "ok (idempotent)" : "ok") : "error"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {r.ok ? r.sessionId : (r.errors ?? []).join("; ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
