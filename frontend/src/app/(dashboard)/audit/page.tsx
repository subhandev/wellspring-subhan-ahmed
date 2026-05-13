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
import {
  dashDateInputCn,
  dashFormActions,
  dashFormSection,
  dashInputCn,
  dashInsetCard,
  dashLabel,
  dashPageDescription,
  dashPageTitle,
  dashSectionCard,
  dashSelectCn
} from "@/lib/dashboardUi";
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
    <div className="space-y-8">
      <header className="space-y-1.5">
        <h1 className={dashPageTitle}>Audit log</h1>
        <p className={dashPageDescription}>
          Filter your admin actions by date or action type, then search within the loaded results (up
          to {AUDIT_LIST_MAX} newest events per request). Events are always for your signed-in account.
        </p>
      </header>
      <form
        className={dashSectionCard}
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <div className={dashFormSection}>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-8">
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
                <div className="space-y-2">
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
                  <p className="text-xs text-muted-foreground">Leave empty for no lower bound.</p>
                </div>
                <div className="space-y-2">
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
                  <p className="text-xs text-muted-foreground">Leave empty for no upper bound.</p>
                </div>
              </div>
              <div className="space-y-2">
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
                <p className="text-xs text-muted-foreground">
                  Sent to the server with <span className="font-mono">Apply filters</span>. Search
                  below only filters the rows already loaded in your browser.
                </p>
              </div>
              <div className="space-y-2">
                <label className={dashLabel} htmlFor="audit-search">
                  Search in results
                </label>
                <input
                  id="audit-search"
                  type="search"
                  className={dashInputCn()}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Action, target id, details…"
                  disabled={!rows?.length}
                />
                <p className="text-xs text-muted-foreground">
                  Matches action name, target, and summary text. Does not fetch new data from the API.
                </p>
              </div>
            </div>
            <aside className={cn(dashInsetCard, "space-y-3 lg:self-start")}>
              <p className="text-xs font-medium text-foreground">Tips</p>
              <ul className="list-inside list-disc space-y-2 text-xs text-muted-foreground">
                <li>Use a narrow date range when you know roughly when something changed.</li>
                <li>
                  Combine <span className="font-medium text-foreground/90">Action</span> with search
                  to find a specific program or session id in the merged target column.
                </li>
                <li>Clear dates and action, apply, then search to scan everything returned.</li>
              </ul>
            </aside>
          </div>
          <div className={dashFormActions}>
            <Button type="submit" size="md" className="w-full sm:w-auto">
              Apply filters
            </Button>
          </div>
        </div>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {!rows ? (
        <PageLoader compact message="Loading audit log…" className="min-h-[260px] py-12" />
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
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(28_28_26/0.04)] dark:shadow-[0_1px_2px_rgb(0_0_0/0.2)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="sticky top-0 z-10 border-b border-border bg-muted/55 backdrop-blur-sm supports-[backdrop-filter]:bg-muted/45 dark:bg-muted/35 dark:supports-[backdrop-filter]:bg-muted/25">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-none text-foreground"
                    >
                      Time
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-none text-foreground"
                    >
                      Action
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-2.5 text-left align-bottom text-xs font-semibold leading-none text-foreground"
                    >
                      {"Target & details"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows!.map((r) => {
                    const details = summarizeAuditRow(r);
                    const targetIdParts = truncateAuditId(r.targetId);
                    return (
                      <tr key={r.id} className="transition-colors hover:bg-muted/25">
                        <td
                          className="align-top px-4 py-3 text-muted-foreground"
                          title={new Date(r.createdAt).toISOString()}
                        >
                          <div className="whitespace-nowrap text-foreground">{formatAuditLogTime(r.createdAt)}</div>
                          <div className="text-xs">{formatRelativeShort(r.createdAt)}</div>
                        </td>
                        <td className="max-w-[14rem] px-4 py-3 align-top sm:max-w-[16rem]">
                          <div className="font-medium leading-snug">{humanAuditAction(r.action)}</div>
                          <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">{r.action}</div>
                        </td>
                        <td className="min-w-0 px-4 py-3 align-top">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex rounded-md border border-border bg-muted/30 px-2 py-0.5 text-xs font-medium text-foreground">
                                {targetTypeLabel(r.targetType)}
                              </span>
                              {r.targetId ? (
                                <code
                                  className="break-all font-mono text-[11px] text-muted-foreground"
                                  title={targetIdParts.full}
                                >
                                  {targetIdParts.short}
                                </code>
                              ) : null}
                            </div>
                            {details ? (
                              <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                                {details}
                              </p>
                            ) : (
                              <p className="text-xs text-muted-foreground/80">—</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
