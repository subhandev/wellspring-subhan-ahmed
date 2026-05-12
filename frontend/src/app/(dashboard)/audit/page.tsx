"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";

type AuditRow = {
  id: string;
  tenantId: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: unknown;
  createdAt: string;
};

export default function AuditPage() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
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
    const data = (await res.json().catch(() => ({}))) as { auditLogs?: AuditRow[]; message?: string };
    if (!res.ok) {
      setError(data.message ?? "Failed to load audit log");
      return;
    }
    setRows(data.auditLogs ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Audit log</h1>
      <div className="flex max-w-3xl flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">From (ISO date)</label>
          <input
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="2026-01-01"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">To (ISO date)</label>
          <input
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="2026-12-31"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Action</label>
          <input
            className="flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder="program.create"
          />
        </div>
        <Button type="button" onClick={load}>
          Apply filters
        </Button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!rows ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-muted-foreground">No events.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
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
