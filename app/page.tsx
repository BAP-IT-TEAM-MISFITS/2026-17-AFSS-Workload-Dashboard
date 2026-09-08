"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

const COMPANIES = [
  { id: 1,  label: "REDMEN OPERATION" },
  { id: 10, label: "ADAIR OPERATIONS" },
  { id: 8,  label: "AFAC" },
] as const;

type CompanyId = (typeof COMPANIES)[number]["id"];

const STAGES = ["Pending", "Progress"] as const;
type Stage = (typeof STAGES)[number];

const HEADERS = [
  "Job", "Status", "Created Date", "Customer", "Site",
  "Scheduled", "Est. Hours", "Due Date", "Technicians",
  "Sell Price", "Tags", "Site Suburb", "Actual Hours",
  "Customer Group", "Site Postcode", "Description", "Notes",
];

const HEADERS_AFAC_PENDING = [
  "Job", "Status", "Created Date", "Customer", "Site",
  "Scheduled", "Est. Hours", "Due Date", "Salesperson", "Technicians",
  "Sell Price", "Tags", "Site Suburb", "Job Type",
];

const HEADERS_AFAC_PROGRESS = [
  "Job", "Status", "Created Date", "Customer", "Site",
  "Scheduled", "Est. Hours", "Due Date", "Salesperson", "Technicians",
  "Sell Price", "Tags",
];

const HEADERS_ADAIR_PENDING = [
  "Job", "Created Date", "Due Date", "Scheduled",
  "Customer", "Site", "Site Contact", "Est. Hours",
  "Technicians", "Sell Price", "Tags",
  "Site Suburb", "Site State", "Site Postcode",
];

const HEADERS_ADAIR_PROGRESS = [
  "Job", "Created Date", "Due Date", "Scheduled",
  "Customer", "Site", "Technicians", "Sell Price",
  "Site Address", "Site State",
];

// Raw data behind dashboard widgets that don't otherwise expose a per-row
// list — computed live (no cache), so no Stage tabs and no 60s auto-poll.
const RAW_VIEWS = [
  { id: "afac-prospect", label: "AFAC Prospect Demand" },
  { id: "tech-ob",       label: "Tech Support: Other Billable" },
  { id: "tech-it",       label: "Tech Support: Invested Time" },
  { id: "tech-qa",       label: "Tech Support: Quality Assurance" },
] as const;

type RawViewId = (typeof RAW_VIEWS)[number]["id"];
type ViewId = CompanyId | RawViewId;

function isRawView(id: ViewId): id is RawViewId {
  return RAW_VIEWS.some(v => v.id === id);
}

const RAW_HEADERS: Record<RawViewId, string[]> = {
  "afac-prospect": ["Job", "Customer", "Site", "Date", "Hours"],
  "tech-ob":       ["Job", "Customer", "Cost Centre", "Date", "Hours"],
  "tech-it":       ["Job", "Customer", "Cost Centre", "Date", "Hours"],
  "tech-qa":       ["Job", "Customer", "Due Date", "Est. Hours"],
};

function rawJobToRow(view: RawViewId, row: RawJob): string[] {
  if (view === "afac-prospect") {
    return [s(row.jobId), s(row.customer), s(row.site), fmtDate(s(row.date)), s(row.hours)];
  }
  if (view === "tech-qa") {
    return [s(row.id), s(row.customer), fmtDate(s(row.dueDate)), s(row.estHours)];
  }
  return [s(row.jobId), s(row.customer), s(row.ccName), fmtDate(s(row.date)), s(row.hours)];
}

const POLL_MS = 60_000;

// Shared with app/dashboard/page.tsx and app/dashboard2/page.tsx — whichever
// month is selected there gets written to this key, so the raw drill-down
// views here can inherit it without their own picker.
const DASHBOARD_MONTH_FILTER_KEY = "afss-dashboard-month-filter";

type RawJob = Record<string, unknown>;

function s(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

// Convert "YYYY-MM-DD" → "DD/MM/YYYY"
function fmtDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}


function techNames(job: RawJob): string {
  const t = job.Technicians;
  if (!Array.isArray(t)) return "";
  return t.map((x: unknown) => s((x as Record<string, unknown>)?.Name)).filter(Boolean).join(", ");
}

function tagNames(job: RawJob): string {
  const t = job.Tags;
  if (!Array.isArray(t)) return "";
  return t.map((x: unknown) => s((x as Record<string, unknown>)?.Name)).filter(Boolean).join(", ");
}

function dotColor(job: RawJob): string {
  return s((job.Status as Record<string, unknown>)?.Color) || "#94a3b8";
}

function jobToRowAFACPending(job: RawJob): string[] {
  const site        = (job.Site        ?? {}) as Record<string, unknown>;
  const siteDetail  = (job._site       ?? {}) as Record<string, unknown>;
  const address     = (siteDetail.Address ?? {}) as Record<string, unknown>;
  const customer    = (job.Customer    ?? {}) as Record<string, unknown>;
  const status      = (job.Status      ?? {}) as Record<string, unknown>;
  const total       = (job.Total       ?? {}) as Record<string, unknown>;
  const totals      = (job.Totals      ?? {}) as Record<string, unknown>;
  const resCost     = (totals.ResourcesCost ?? {}) as Record<string, unknown>;
  const labHours    = (resCost.LaborHours   ?? {}) as Record<string, unknown>;
  const salesperson = (job.Salesperson ?? {}) as Record<string, unknown>;

  const custName     = s(customer.CompanyName) || `${s(customer.GivenName)} ${s(customer.FamilyName)}`.trim();
  const scheduledRaw = s(job._scheduledDate) || s(job.Scheduled) || s(job.DateScheduled) || s(job.ScheduledDate) || s(job.DateBooked);
  const estRaw       = labHours.Estimate != null ? Number(labHours.Estimate) : null;
  const estHours     = estRaw != null && estRaw > 0 ? String(estRaw) : "2";

  return [
    s(job.ID),                                    // Job
    s(status.Name ?? job.Stage),                  // Status
    fmtDate(s(job.DateIssued)),                   // Created Date
    custName,                                     // Customer
    s(site.Name),                                 // Site
    scheduledRaw ? fmtDate(scheduledRaw) : "",    // Scheduled
    estHours,                                     // Est. Hours
    fmtDate(s(job.DueDate)),                      // Due Date
    s(salesperson.Name),                          // Salesperson
    techNames(job),                               // Technicians
    `$${Number(total.ExTax ?? 0).toFixed(2)}`,   // Sell Price
    tagNames(job),                                // Tags
    s(address.City),                              // Site Suburb
    s(job.Type as string),                        // Job Type
  ];
}

function jobToRowAFACProgress(job: RawJob): string[] {
  const site        = (job.Site        ?? {}) as Record<string, unknown>;
  const siteDetail  = (job._site       ?? {}) as Record<string, unknown>;
  const address     = (siteDetail.Address ?? {}) as Record<string, unknown>;
  const customer    = (job.Customer    ?? {}) as Record<string, unknown>;
  const status      = (job.Status      ?? {}) as Record<string, unknown>;
  const total       = (job.Total       ?? {}) as Record<string, unknown>;
  const totals      = (job.Totals      ?? {}) as Record<string, unknown>;
  const resCost     = (totals.ResourcesCost ?? {}) as Record<string, unknown>;
  const labHours    = (resCost.LaborHours   ?? {}) as Record<string, unknown>;
  const salesperson = (job.Salesperson ?? {}) as Record<string, unknown>;

  const custName     = s(customer.CompanyName) || `${s(customer.GivenName)} ${s(customer.FamilyName)}`.trim();
  const scheduledRaw = s(job._scheduledDate) || s(job.Scheduled) || s(job.DateScheduled) || s(job.ScheduledDate) || s(job.DateBooked);
  const estRaw       = labHours.Estimate != null ? Number(labHours.Estimate) : null;
  const estHours     = estRaw != null && estRaw > 0 ? String(estRaw) : "2";

  return [
    s(job.ID),                                                   // Job
    s(status.Name ?? job.Stage),                                 // Status
    fmtDate(s(job.DateIssued)),                                  // Created Date
    custName,                                                    // Customer
    s(site.Name),                                                // Site
    scheduledRaw ? fmtDate(scheduledRaw) : "",                   // Scheduled
    estHours,                                                    // Est. Hours
    fmtDate(s(job.DueDate)),                                     // Due Date
    s(salesperson.Name),                                         // Salesperson
    techNames(job),                                              // Technicians
    `$${Number(total.ExTax ?? 0).toFixed(2)}`,                  // Sell Price
    tagNames(job),                                               // Tags
  ];
}

function jobToRowADAIRPending(job: RawJob): string[] {
  const site        = (job.Site        ?? {}) as Record<string, unknown>;
  const siteDetail  = (job._site       ?? {}) as Record<string, unknown>;
  const address     = (siteDetail.Address ?? {}) as Record<string, unknown>;
  const customer    = (job.Customer    ?? {}) as Record<string, unknown>;
  const total       = (job.Total       ?? {}) as Record<string, unknown>;
  const totals      = (job.Totals      ?? {}) as Record<string, unknown>;
  const resCost     = (totals.ResourcesCost ?? {}) as Record<string, unknown>;
  const labHours    = (resCost.LaborHours   ?? {}) as Record<string, unknown>;
  const contact     = (siteDetail.PrimaryContact ?? {}) as Record<string, unknown>;

  const custName     = s(customer.CompanyName) || `${s(customer.GivenName)} ${s(customer.FamilyName)}`.trim();
  const scheduledRaw = s(job._scheduledDate) || s(job.Scheduled) || s(job.DateScheduled) || s(job.ScheduledDate) || s(job.DateBooked);
  const estRaw       = labHours.Estimate != null ? Number(labHours.Estimate) : null;
  // A job with no real estimate, no real price, AND no booked schedule yet
  // (still at an early sales-contact stage in SimPRO) shows 0 rather than the
  // fabricated 2 hr default — same rule as the dashboard's AE Evac tentative
  // row. The scheduledRaw check matters: AE Evac's real hours/price live in
  // the schedule block, not Totals.Estimate/Total.ExTax — those SimPRO fields
  // are $0/0 for EVERY AE Evac job, scheduled or not.
  const estHours     = estRaw != null && estRaw > 0 ? String(estRaw) : (scheduledRaw ? "2" : "0");

  return [
    s(job.ID),                                                   // Job
    fmtDate(s(job.DateIssued)),                                  // Created Date
    fmtDate(s(job.DueDate)),                                     // Due Date
    scheduledRaw ? fmtDate(scheduledRaw) : "",                   // Scheduled
    custName,                                                    // Customer
    s(site.Name),                                                // Site
    `${s(contact.GivenName)} ${s(contact.FamilyName)}`.trim(),  // Site Contact
    estHours,                                                    // Est. Hours
    techNames(job),                                              // Technicians
    `$${Number(total.ExTax ?? 0).toFixed(2)}`,                  // Sell Price
    tagNames(job),                                               // Tags
    s(address.City),                                             // Site Suburb
    s(address.State),                                            // Site State
    s(address.PostalCode),                                       // Site Postcode
  ];
}

function jobToRowADAIRProgress(job: RawJob): string[] {
  const site       = (job.Site     ?? {}) as Record<string, unknown>;
  const siteDetail = (job._site    ?? {}) as Record<string, unknown>;
  const address    = (siteDetail.Address ?? {}) as Record<string, unknown>;
  const customer   = (job.Customer ?? {}) as Record<string, unknown>;
  const total      = (job.Total    ?? {}) as Record<string, unknown>;

  const custName     = s(customer.CompanyName) || `${s(customer.GivenName)} ${s(customer.FamilyName)}`.trim();
  const scheduledRaw = s(job._scheduledDate) || s(job.Scheduled) || s(job.DateScheduled) || s(job.ScheduledDate) || s(job.DateBooked);
  const siteAddr  = s(address.Address);
  const siteState = s(address.State);

  return [
    s(job.ID),                                                   // Job
    fmtDate(s(job.DateIssued)),                                  // Created Date
    fmtDate(s(job.DueDate)),                                     // Due Date
    scheduledRaw ? fmtDate(scheduledRaw) : "",                   // Scheduled
    custName,                                                    // Customer
    s(site.Name),                                                // Site
    techNames(job),                                              // Technicians
    `$${Number(total.ExTax ?? 0).toFixed(2)}`,                  // Sell Price
    siteAddr,                                                    // Site Address
    siteState,                                                   // Site State
  ];
}

function jobToRow(job: RawJob): string[] {
  const site      = (job.Site     ?? {}) as Record<string, unknown>;
  const siteDetail= (job._site    ?? {}) as Record<string, unknown>;
  const address   = (siteDetail.Address ?? {}) as Record<string, unknown>;
  const customer  = (job.Customer ?? {}) as Record<string, unknown>;
  const status    = (job.Status   ?? {}) as Record<string, unknown>;
  const total     = (job.Total    ?? {}) as Record<string, unknown>;
  const totals    = (job.Totals   ?? {}) as Record<string, unknown>;
  const resCost   = (totals.ResourcesCost ?? {}) as Record<string, unknown>;
  const labHours  = (resCost.LaborHours   ?? {}) as Record<string, unknown>;
  const custGroup = (customer.CustomerGroup ?? job.CustomerGroup ?? {}) as Record<string, unknown>; // fallback only

  const custName     = s(customer.CompanyName) || `${s(customer.GivenName)} ${s(customer.FamilyName)}`.trim();
  // _scheduledDate from schedule blocks; fall back to job-level date fields
  const scheduledRaw = s(job._scheduledDate)
    || s(job.Scheduled)
    || s(job.DateScheduled)
    || s(job.ScheduledDate)
    || s(job.DateBooked);
  const estRaw       = labHours.Estimate  != null ? Number(labHours.Estimate)  : null;
  const actRaw       = labHours.Actual    != null ? Number(labHours.Actual)    : null;
  const comRaw       = labHours.Committed != null ? Number(labHours.Committed) : null;

  // Use SimPRO's estimate if > 0; otherwise default to 2 per business rule
  const estHours  = estRaw != null && estRaw > 0 ? String(estRaw) : "2";
  const actHours  = actRaw !== null && actRaw > 0
    ? String(actRaw)
    : comRaw !== null && comRaw > 0 ? String(comRaw) : "";

  return [
    s(job.ID),                                                        // Job
    s(status.Name ?? job.Stage),                                      // Status
    fmtDate(s(job.DateIssued)),                                       // Created Date
    custName,                                                         // Customer
    s(site.Name),                                                     // Site
    scheduledRaw ? fmtDate(scheduledRaw) : "",                        // Scheduled
    estHours,                                                         // Est. Hours
    fmtDate(s(job.DueDate)),                                          // Due Date
    techNames(job),                                                   // Technicians
    `$${(Number(total.ExTax ?? 0) || 330).toFixed(2)}`,              // Sell Price
    tagNames(job),                                                    // Tags
    s(address.City),                                                  // Site Suburb
    actHours,                                                         // Actual Hours
    s(job._customerGroup) || s(custGroup.Name) || s(custGroup as unknown as string), // Customer Group
    s(address.PostalCode),                                            // Site Postcode
    s(job.Name),                                                      // Description
    s(job.Notes).replace(/<[^>]*>/g, "").trim(),                     // Notes
  ];
}

export default function BacklogPage() {
  const [view,        setView]        = useState<ViewId>(1);
  const [stage,       setStage]       = useState<Stage>("Pending");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [jobs,        setJobs]        = useState<RawJob[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [loadingSecs, setLoadingSecs] = useState(0);
  const [error,       setError]       = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing,  setRefreshing]  = useState(false);
  // No picker here — inherited from whatever month was last selected on the
  // Dashboard (see DASHBOARD_MONTH_FILTER_KEY there), so switching months on
  // the Dashboard and then opening a Tech Support raw view shows that same
  // month automatically instead of needing to be set again.
  const [monthFilter] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(DASHBOARD_MONTH_FILTER_KEY);
        if (stored) return stored;
      } catch {}
    }
    return "all";
  });

  const raw = isRawView(view);
  const companyLabel = COMPANIES.find((c) => c.id === view)?.label
    ?? RAW_VIEWS.find((v) => v.id === view)?.label
    ?? "";

  // Same range the Dashboard's month picker offers — current month through
  // December — used only to render a human label for the inherited month.
  const now = new Date();
  const monthOptions = [
    { value: "all", label: "All" },
    ...Array.from({ length: 12 - now.getMonth() }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      return {
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: d.toLocaleString("en-AU", { month: "long", year: "numeric" }),
      };
    }),
  ];

  // Track elapsed seconds while loading so the UI can show a "still working" message
  useEffect(() => {
    if (!loading) { setLoadingSecs(0); return; }
    setLoadingSecs(0);
    const t = setInterval(() => setLoadingSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [loading]);

  // No manual "force refresh" — every view stays in sync on its own via the
  // 60s auto-poll below plus the server-side background warmup, same as
  // RM/AFAC/ADAIR already work.
  const fetchJobs = useCallback(async (bg = false, v = view, st = stage, mf = monthFilter) => {
    if (bg) setRefreshing(true);
    else setLoading(true);
    try {
      let url: string;
      if (isRawView(v)) {
        const p = new URLSearchParams();
        if (mf !== "all") {
          const [y, m] = mf.split("-");
          p.set("year", y);
          p.set("month", m);
        }
        const base = v === "afac-prospect" ? "/api/afac-prospect/raw"
          : v === "tech-ob" ? "/api/tech-support/raw?type=ob"
          : v === "tech-it" ? "/api/tech-support/raw?type=it"
          : "/api/tech-support/raw?type=qa";
        const qs = p.toString();
        url = qs ? `${base}${base.includes("?") ? "&" : "?"}${qs}` : base;
      } else {
        url = `/api/data?company=${v}&stage=${st}`;
      }
      const res  = await fetch(url);
      const data = await res.json();
      if (data.error) {
        setError(`${data.error}${data.detail ? ": " + data.detail : ""}`);
      } else {
        setJobs(Array.isArray(data) ? data : (data.rows ?? data.Result ?? []));
        setError(null);
        setLastUpdated(new Date());
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [view, stage, monthFilter]);

  // Re-fetch when the view, stage, or (for raw views) month changes. Raw
  // views are cache-first server-side (see the /raw routes) so polling them
  // is cheap, same as /api/data for RM/AFAC/ADAIR.
  useEffect(() => {
    setJobs([]);
    fetchJobs(false, view, stage, monthFilter);
    const id = setInterval(() => fetchJobs(true, view, stage, monthFilter), POLL_MS);
    return () => clearInterval(id);
  }, [view, stage, monthFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const headers = isRawView(view)
    ? RAW_HEADERS[view]
    : view === 8
      ? (stage === "Pending" ? HEADERS_AFAC_PENDING : HEADERS_AFAC_PROGRESS)
      : view === 10
        ? (stage === "Pending" ? HEADERS_ADAIR_PENDING : HEADERS_ADAIR_PROGRESS)
        : HEADERS;
  const getRow = isRawView(view)
    ? (job: RawJob) => rawJobToRow(view, job)
    : view === 8
      ? (stage === "Pending" ? jobToRowAFACPending : jobToRowAFACProgress)
      : view === 10
        ? (stage === "Pending" ? jobToRowADAIRPending : jobToRowADAIRProgress)
        : jobToRow;

  const sortedJobs = raw ? jobs : [...jobs].sort((a, b) => {
    const ad = s(a._scheduledDate as string);
    const bd = s(b._scheduledDate as string);
    if (!ad && !bd) return 0;
    if (!ad) return 1;  // unscheduled → end
    if (!bd) return -1;
    return ad.localeCompare(bd); // ascending by date
  });

  function downloadCsv() {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const lines = [headers, ...sortedJobs.map(getRow)].map(r => r.map(esc).join(","));
    // BOM so Excel opens UTF-8 correctly
    const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const d = new Date();
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `backlog-${companyLabel.replace(/\s+/g, "-")}${raw ? "" : `-${stage}`}-${ymd}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--afss-bg)" }} onClick={() => setDropdownOpen(false)}>

      {/* Control bar: brand + company dropdown + dashboard select + stage tabs + actions */}
      <div className="afss-control-bar flex flex-wrap items-center gap-3 px-4 py-2.5 shrink-0">
        <span className="text-white text-sm font-bold tracking-wide whitespace-nowrap">
          AFSS <span style={{ color: "var(--afss-accent)", opacity: 0.9 }}>BACKLOG</span>
        </span>

        {/* Company dropdown */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="afss-input flex items-center gap-2 min-w-[200px]"
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "var(--afss-red)" }} />
            {companyLabel}
            <svg className="ml-auto w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-[#1a1a2e] border border-[#3d3d5c] rounded-xl shadow-2xl min-w-[240px] overflow-hidden py-1">
              {COMPANIES.map((co) => (
                <button
                  key={co.id}
                  onClick={() => { setView(co.id); setDropdownOpen(false); }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 ${
                    co.id === view ? "font-semibold text-white" : "text-gray-300"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "var(--afss-red)" }} />
                  {co.label}
                  {co.id === view && (
                    <svg className="ml-auto w-4 h-4" style={{ color: "var(--afss-accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              <div className="border-t border-[#3d3d5c] my-1" />
              <div className="px-4 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                Raw data (dashboard widgets)
              </div>
              {RAW_VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => { setView(v.id); setDropdownOpen(false); }}
                  className={`w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5 ${
                    v.id === view ? "font-semibold text-white" : "text-gray-300"
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-sm bg-purple-400 shrink-0" />
                  {v.label}
                  {v.id === view && (
                    <svg className="ml-auto w-4 h-4" style={{ color: "var(--afss-accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dashboard select */}
        <select
          defaultValue=""
          onChange={e => { if (e.target.value) window.location.href = e.target.value; }}
          className="afss-input"
          style={{ background: "rgba(255, 255, 255, 0.05)", color: "#fff" }}
        >
          <option value="" disabled hidden>Dashboard</option>
          <option value="/dashboard">Dashboard</option>
          <option value="/dashboard2">Dashboard (NO DATACOM)</option>
        </select>

        {/* Stage tabs (not applicable to raw data views) */}
        {!raw && (
          <div className="flex items-center gap-1.5">
            {STAGES.map((st) => (
              <button
                key={st}
                onClick={() => setStage(st)}
                className="afss-btn-outline"
                data-active={st === stage}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {!loading && (
          <span className={`afss-pill ${raw ? "afss-pill-info" : stage === "Pending" ? "afss-pill-warning" : "afss-pill-neutral"}`}>
            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
          </span>
        )}
        {refreshing && <span className="text-xs" style={{ color: "var(--afss-accent)" }}>Syncing…</span>}
        {lastUpdated && (
          <span className="hidden sm:inline text-xs text-gray-400 whitespace-nowrap">
            Updated: {lastUpdated.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={downloadCsv}
          disabled={loading || jobs.length === 0}
          className="afss-btn"
        >
          Download CSV
        </button>
        <span className="hidden sm:inline text-xs text-gray-500 whitespace-nowrap">Auto every 60s</span>
      </div>

      {/* Sub-header: current view label */}
      <div className="px-4 py-2 text-xs text-gray-500 shrink-0">
        <span className="font-semibold text-[#111] text-sm">
          {companyLabel}{!raw && ` — ${stage}${view === 8 ? "" : " · A CFSP ONLY"}`}
          {raw && monthFilter !== "all" && ` — ${monthOptions.find(o => o.value === monthFilter)?.label ?? ""}`}
        </span>
      </div>

      {error && (
        <div className="mx-4 mb-2 px-4 py-2 afss-pill-error rounded-lg text-xs shrink-0" style={{ borderRadius: 10 }}>
          Error: {error}
        </div>
      )}
      {loading && (
        <div className="flex items-center gap-3 px-4 py-4 text-sm text-gray-500 shrink-0">
          <span className="afss-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          <span>Loading {raw ? "data" : `${stage.toLowerCase()} jobs`} for {companyLabel}… ({loadingSecs}s)</span>
          {loadingSecs >= 10 && (
            <span className="afss-pill afss-pill-warning">
              Fetching data from SimPRO — this can take up to 2 minutes on first load.
            </span>
          )}
        </div>
      )}

      <div className="flex-1 min-h-0 px-4 pb-4">
        <div className="afss-card afss-card-scroll h-full">
          <table className="afss-table w-full border-collapse" style={{ minWidth: "1800px" }}>
            <thead className="sticky top-0 z-10">
              <tr>
                {headers.map((h, i) => (
                  <th key={i} className="text-left text-xs px-3 py-2.5 whitespace-nowrap border-r border-r-[#444] last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!loading && jobs.length === 0 && !error && (
                <tr>
                  <td colSpan={headers.length} className="px-3 py-8 text-sm text-gray-400 text-center">
                    {raw
                      ? `No data found for ${companyLabel}.`
                      : `No ${stage.toLowerCase()} jobs found for A CFSP ONLY in ${companyLabel}.`}
                  </td>
                </tr>
              )}
              {sortedJobs.map((job, row) => {
                const cells = getRow(job);
                return (
                  <tr key={s(job.ID) || row} className="border-b transition-colors">
                    {cells.map((val, col) => (
                      col === 1 && val && !raw ? (
                        <td key={col} className="px-3 py-2 text-xs border-r max-w-xs" title={val}>
                          <span className="afss-pill afss-pill-light max-w-full">
                            <span className="w-1.5 h-1.5 rounded-full shrink-0 mr-1.5" style={{ backgroundColor: dotColor(job) }} />
                            <span className="truncate min-w-0">{val}</span>
                          </span>
                        </td>
                      ) : (
                        <td key={col} className="px-3 py-2 text-xs text-[#333] border-r whitespace-nowrap max-w-xs truncate" title={val}>
                          {val || " "}
                        </td>
                      )
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
