"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  AUDIT_ACTION_FILTERS,
  AUDIT_LIST_MAX,
  auditRowMatchesSearch,
  humanAuditAction,
  summarizeAuditRow,
  targetTypeLabel,
  truncateAuditId
} from "@/lib/auditDisplay";
import { apiFetch, readApiErrorMessage } from "@/lib/api";
import { dashDateInputCn, dashInputCn, dashLabel, dashSectionCard, dashSelectCn } from "@/lib/dashboardUi";
import { formatAuditLogTime, formatRelativeShort } from "@/lib/formatDisplay";
import { cn } from "@/lib/utils";
import type { AuditLogRow } from "@/types";

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLogRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  const hasServerFilters = Boolean(from || to || action);

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

  const filteredRows = useMemo(() => {
    if (!rows) {
      return null;
    }
    return rows.filter((r) => auditRowMatchesSearch(r, search));
  }, [rows, search]);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Filter admin actions by date range or action type. Search applies to the loaded list (up to{" "}
          {AUDIT_LIST_MAX} events).
        </p>
      </header>
      <div className={dashSectionCard}>
        <div className="space-y-4 p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
            <div className="space-y-2 sm:col-span-1 lg:col-span-3">
              <label className={dashLabel} htmlFor="audit-from">
                From
              </label>
              <input
                id="audit-from"
                type="date"
                className={cn(dashDateInputCn(), "min-w-0")}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-1 lg:col-span-3">
              <label className={dashLabel} htmlFor="audit-to">
                To
              </label>
              <input
                id="audit-to"
                type="date"
                className={cn(dashDateInputCn(), "min-w-0")}
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2 lg:col-span-4">
              <label className={dashLabel} htmlFor="audit-action">
                Action
              </label>
              <select
                id="audit-action"
                className={cn(dashSelectCn, "min-w-0")}
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                {AUDIT_ACTION_FILTERS.map((opt) => (
                  <option key={opt.value || "__all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex sm:col-span-2 lg:col-span-2 lg:justify-end">
              <Button type="button" size="md" className="w-full sm:w-auto" onClick={load}>
                Apply filters
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <label className={dashLabel} htmlFor="audit-search">
              Search in results
            </label>
            <input
              id="audit-search"
              type="search"
              className={cn(dashInputCn(), "max-w-md")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Action, actor, target id, details…"
              disabled={!rows?.length}
            />
          </div>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!rows ? (
        <PageLoader message="Loading audit log…" className="py-16" />
      ) : filteredRows && filteredRows.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground md:px-8">
          {rows.length === 0 ? (
            <>
              <p className="font-medium text-foreground">No events yet.</p>
              <p className="mt-2">
                {hasServerFilters
                  ? "Try widening the date range or clearing the action filter."
                  : "Admin writes will appear here after you create or change programs, sessions, imports, or media."}
              </p>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">No rows match your search.</p>
              <p className="mt-2">Clear the search box or try different keywords.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-muted-foreground">
            <p>
              Showing <span className="font-medium text-foreground">{filteredRows!.length}</span>
              {search.trim() && rows.length !== filteredRows!.length ? (
                <>
                  {" "}
                  of <span className="font-medium text-foreground">{rows.length}</span>
                </>
              ) : null}{" "}
              event{filteredRows!.length === 1 ? "" : "s"}
            </p>
            <p className="text-xs">API returns at most {AUDIT_LIST_MAX} newest events per request.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 border-b bg-muted/95 backdrop-blur-sm">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Time</th>
                  <th className="px-3 py-2.5 font-medium">Actor</th>
                  <th className="px-3 py-2.5 font-medium">Action</th>
                  <th className="px-3 py-2.5 font-medium">Target</th>
                  <th className="px-3 py-2.5 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows!.map((r) => {
                  const details = summarizeAuditRow(r);
                  const targetIdParts = truncateAuditId(r.targetId);
                  return (
                    <tr key={r.id} className="border-b border-border/80 transition-colors last:border-0 hover:bg-muted/25">
                      <td
                        className="align-top px-3 py-2.5 text-muted-foreground"
                        title={new Date(r.createdAt).toISOString()}
                      >
                        <div className="whitespace-nowrap text-foreground">{formatAuditLogTime(r.createdAt)}</div>
                        <div className="text-xs">{formatRelativeShort(r.createdAt)}</div>
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2.5 align-top" title={r.actorEmail}>
                        {r.actorEmail}
                      </td>
                      <td className="max-w-[220px] px-3 py-2.5 align-top">
                        <div className="font-medium leading-snug">{humanAuditAction(r.action)}</div>
                        <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.action}</div>
                      </td>
                      <td className="max-w-[240px] px-3 py-2.5 align-top">
                        <span className="inline-flex rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground">
                          {targetTypeLabel(r.targetType)}
                        </span>
                        {r.targetId ? (
                          <div className="mt-1 font-mono text-xs text-muted-foreground" title={targetIdParts.full}>
                            {targetIdParts.short}
                          </div>
                        ) : null}
                      </td>
                      <td className="max-w-[280px] px-3 py-2.5 align-top text-muted-foreground">{details ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
