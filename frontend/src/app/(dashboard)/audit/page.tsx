"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashInputCn, dashLabel } from "@/lib/dashboardUi";
import { cn } from "@/lib/utils";
import type { AuditLogRow } from "@/types";

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [action, setAction] = useState("");

  async function load() {
    setError(null);
    const q = new URLSearchParams();
    if (from) {
      q.set("from", from);
    }
    if (to) {
      q.set("to", to);
    }
    if (action) {
      q.set("action", action);
    }
    const qs = q.toString();
    const res = await apiFetch(`/audit${qs ? `?${qs}` : ""}`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(readApiErrorMessage(body, "Failed to load audit log"));
      return;
    }
    const data = body as { auditLogs?: AuditLogRow[] };
    setRows(data.auditLogs ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Filter admin actions by date range or action type.
        </p>
      </header>
      <div className="flex max-w-3xl flex-wrap items-end gap-3">
        <div className="space-y-2">
          <label className={dashLabel} htmlFor="audit-from">
            From (ISO date)
          </label>
          <input
            id="audit-from"
            className={cn(dashInputCn(), "w-48")}
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="2026-01-01"
          />
        </div>
        <div className="space-y-2">
          <label className={dashLabel} htmlFor="audit-to">
            To (ISO date)
          </label>
          <input
            id="audit-to"
            className={cn(dashInputCn(), "w-48")}
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="2026-12-31"
          />
        </div>
        <div className="space-y-2">
          <label className={dashLabel} htmlFor="audit-action">
            Action
          </label>
          <input
            id="audit-action"
            className={cn(dashInputCn(), "w-48 font-mono text-xs")}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="program.created"
            list="audit-action-suggestions"
          />
          <datalist id="audit-action-suggestions">
            <option value="program.created" />
            <option value="program.updated" />
            <option value="program.deleted" />
            <option value="session.created" />
            <option value="session.updated" />
            <option value="session.deleted" />
            <option value="session.reordered" />
            <option value="sessions.imported" />
            <option value="media.presigned" />
            <option value="media.relay_uploaded" />
          </datalist>
        </div>
        <Button type="button" size="md" onClick={load}>
          Apply filters
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!rows ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No events.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-3 py-2">Time</th>
                <th className="px-3 py-2">Action</th>
                <th className="px-3 py-2">Target</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(r.createdAt).toISOString()}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{r.action}</td>
                  <td className="px-3 py-2 text-xs">
                    {r.targetType} {r.targetId ? `· ${r.targetId}` : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
