"use client";

import { useState } from "react";
import { mockPortfolio } from "@/data/mockPortfolio";
import { formatCurrency, formatDate } from "@/lib/format";

const CALIBRATION_LABELS: Record<string, { label: string; color: string }> = {
  right: { label: "Right — thesis played out", color: "border-l-gain" },
  wrong: { label: "Wrong — thesis failed", color: "border-l-loss" },
  unlucky: { label: "Right thesis, wrong outcome (unlucky)", color: "border-l-feedback-warning" },
  lucky: { label: "Wrong thesis, right outcome (lucky)", color: "border-l-feedback-warning" },
};

/**
 * Decision Journal page per § 4.4.
 * Stacked cards with left-border color-coding by calibration outcome.
 * The thesis contribution to behavioral-finance UX.
 */
export default function JournalPage() {
  const entries = mockPortfolio.journalEntries ?? [];
  const [tickerFilter, setTickerFilter] = useState("all");
  const [calibrationFilter, setCalibrationFilter] = useState("all");

  const uniqueTickers = [...new Set(entries.map((e) => e.symbol))];

  const filtered = entries.filter((e) => {
    if (tickerFilter !== "all" && e.symbol !== tickerFilter) return false;
    if (calibrationFilter !== "all") {
      if (!e.calibrationOutcome) return calibrationFilter === "none";
      if (e.calibrationOutcome !== calibrationFilter) return false;
    }
    return true;
  });

  function downloadCSV() {
    const csv = [
      "Date,Symbol,Action,Quantity,Price,Rationale,Regret Rehearsal,Calibration,Reflection",
      ...entries.map((e) =>
        [
          e.date,
          e.symbol,
          e.action,
          e.quantity,
          e.pricePerShare,
          `"${e.rationale}"`,
          `"${e.regretRehearsal ?? ""}"`,
          e.calibrationOutcome ?? "",
          `"${e.reflection ?? ""}"`,
        ].join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decision-journal.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <title>Decision Journal — Accrue</title>
      <h1 className="text-2xl font-semibold text-primary mb-2">Decision Journal</h1>
      <p className="text-sm text-secondary mb-6">
        Your trade reflections — rationale, pre-mortems, and calibration outcomes.
        Entries are immutable after confirmation.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label htmlFor="ticker-filter" className="block text-xs font-medium text-secondary mb-1">
            Filter by Ticker
          </label>
          <select
            id="ticker-filter"
            value={tickerFilter}
            onChange={(e) => setTickerFilter(e.target.value)}
            className="rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[44px]"
          >
            <option value="all">All tickers</option>
            {uniqueTickers.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="calibration-filter" className="block text-xs font-medium text-secondary mb-1">
            Filter by Calibration
          </label>
          <select
            id="calibration-filter"
            value={calibrationFilter}
            onChange={(e) => setCalibrationFilter(e.target.value)}
            className="rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[44px]"
          >
            <option value="all">All outcomes</option>
            <option value="right">Right</option>
            <option value="wrong">Wrong</option>
            <option value="unlucky">Right thesis, unlucky</option>
            <option value="lucky">Wrong thesis, lucky</option>
            <option value="none">Not yet calibrated</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={downloadCSV}
            className="rounded-lg border border-border-default px-4 py-2 text-sm font-medium text-secondary hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[44px]"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Journal entries */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">
          {entries.length === 0
            ? "No journal entries yet. Your trade reflections will appear here after you place your first trade."
            : "No entries match your filters."}
        </p>
      ) : (
        <ul className="space-y-4" role="list">
          {filtered.map((entry) => {
            const cal = entry.calibrationOutcome ? CALIBRATION_LABELS[entry.calibrationOutcome] : null;
            return (
              <li
                key={entry.id}
                className={`rounded-xl border border-border-default bg-surface-raised p-5 border-l-4 ${
                  cal ? cal.color : "border-l-border-default"
                }`}
              >
                {/* Header */}
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      {entry.symbol}
                    </span>
                    <span className="text-xs text-muted ml-2">
                      {entry.action} {entry.quantity} shares @ {formatCurrency(entry.pricePerShare)}
                    </span>
                  </div>
                  <time className="text-xs text-muted" dateTime={entry.date}>
                    {formatDate(entry.date)}
                  </time>
                </div>

                {/* Rationale */}
                <div className="mb-3">
                  <h3 className="text-xs font-medium text-secondary mb-1">Why this trade?</h3>
                  <p className="text-sm text-primary" style={{ fontFamily: "var(--font-serif)" }}>
                    &ldquo;{entry.rationale}&rdquo;
                  </p>
                </div>

                {/* Regret Rehearsal */}
                {entry.regretRehearsal && (
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-secondary mb-1">Pre-mortem</h3>
                    <p className="text-sm text-primary italic">
                      &ldquo;{entry.regretRehearsal}&rdquo;
                    </p>
                  </div>
                )}

                {/* Calibration */}
                {cal && (
                  <div className="mb-2">
                    <h3 className="text-xs font-medium text-secondary mb-1">Calibration</h3>
                    <p className="text-sm text-primary">{cal.label}</p>
                  </div>
                )}

                {/* Reflection */}
                {entry.reflection && (
                  <div>
                    <h3 className="text-xs font-medium text-secondary mb-1">What actually happened?</h3>
                    <p className="text-sm text-primary italic">
                      &ldquo;{entry.reflection}&rdquo;
                    </p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
