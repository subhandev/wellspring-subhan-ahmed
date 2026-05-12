"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import type { CsvImportRowResult } from "@/types";

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
      csv: "client_row_id,program_id,title,duration_seconds,instructor_name,tags,position\n"
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
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Import</h1>
      <p className="text-sm text-muted-foreground">
        Required columns: <code className="text-xs">client_row_id</code>,{" "}
        <code className="text-xs">program_id</code>, <code className="text-xs">title</code>,{" "}
        <code className="text-xs">duration_seconds</code>,{" "}
        <code className="text-xs">instructor_name</code>. Optional:{" "}
        <code className="text-xs">tags</code> (comma or pipe),{" "}
        <code className="text-xs">position</code>.
      </p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">Client import ID</label>
          <input
            className="flex h-9 w-full max-w-md rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            placeholder="e.g. weekly-sync-2026-05-12"
            {...form.register("clientImportId")}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">CSV</label>
          <textarea
            rows={12}
            className="font-mono text-xs w-full rounded-md border border-input bg-transparent px-3 py-2 shadow-sm"
            {...form.register("csv")}
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          Run import
        </Button>
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
