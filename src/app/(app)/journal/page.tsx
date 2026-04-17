"use client";

import React, { useState, useMemo } from "react";
import { formatDate } from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Journal Entry types ─── */
type Calibration = "correct" | "incorrect" | "partial" | "pending";

interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  action: "Buy" | "Sell";
  rationale: string;
  preMortem: string;
  calibration: Calibration;
  reflection: string;
}

const calibrationColors: Record<Calibration, string> = {
  correct: "border-l-gain",
  incorrect: "border-l-loss",
  partial: "border-l-feedback-warning",
  pending: "border-l-border-default",
};

const calibrationLabels: Record<Calibration, string> = {
  correct: "Correct",
  incorrect: "Incorrect",
  partial: "Partially Correct",
  pending: "Pending",
};

const calibrationBadgeColors: Record<Calibration, string> = {
  correct: "bg-green-50 text-gain",
  incorrect: "bg-red-50 text-loss",
  partial: "bg-yellow-50 text-feedback-warning",
  pending: "bg-gray-50 text-muted",
};

/* ─── Mock journal data ─── */
const journalEntries: JournalEntry[] = [
  {
    id: "j1",
    date: "2026-04-10",
    symbol: "AAPL",
    action: "Buy",
    rationale:
      "Adding to my AAPL position after strong earnings. I believe in the long-term growth of services revenue and the ecosystem lock-in.",
    preMortem:
      "If this goes wrong, it could be because iPhone sales decline as the smartphone market saturates, or because services growth slows.",
    calibration: "pending",
    reflection: "",
  },
  {
    id: "j2",
    date: "2026-03-28",
    symbol: "VTI",
    action: "Buy",
    rationale:
      "Regular monthly contribution to broad market index. Dollar-cost averaging into my core position regardless of market conditions.",
    preMortem:
      "Market-wide downturn could reduce value short-term, but I am investing for the long term so this should not matter.",
    calibration: "correct",
    reflection:
      "VTI has continued its upward trend since this purchase. Dollar-cost averaging continues to work well for reducing timing risk.",
  },
  {
    id: "j3",
    date: "2026-03-15",
    symbol: "SCHD",
    action: "Buy",
    rationale:
      "Building dividend income stream. SCHD has a strong track record of dividend growth and lower volatility than the broader market.",
    preMortem:
      "Dividend stocks could underperform growth stocks in a rising market. SCHD could also cut dividends if underlying companies face headwinds.",
    calibration: "correct",
    reflection:
      "SCHD continues to deliver consistent dividends. The thesis about building passive income is on track.",
  },
  {
    id: "j4",
    date: "2026-02-20",
    symbol: "MSFT",
    action: "Buy",
    rationale:
      "Cloud and AI growth story remains strong. Adding a small position below analyst target price.",
    preMortem:
      "AI competition could intensify, reducing Microsoft's advantage. Cloud growth could slow if enterprises reduce spending.",
    calibration: "correct",
    reflection:
      "MSFT has appreciated nicely since purchase. The AI narrative continues to support the stock.",
  },
  {
    id: "j5",
    date: "2026-02-05",
    symbol: "VXUS",
    action: "Buy",
    rationale:
      "Diversifying internationally. International valuations look attractive compared to US markets based on P/E ratios.",
    preMortem:
      "Strong US dollar could reduce returns from international holdings. Geopolitical risks could cause underperformance.",
    calibration: "partial",
    reflection:
      "International markets have been mixed. The valuation thesis was sound but currency headwinds partially offset gains.",
  },
  {
    id: "j6",
    date: "2026-01-18",
    symbol: "BND",
    action: "Buy",
    rationale:
      "Adding bond allocation for stability. Rates may have peaked, which would benefit bond prices.",
    preMortem:
      "If rates continue to rise, bond prices would fall further. Inflation could erode real returns.",
    calibration: "incorrect",
    reflection:
      "Rates stayed higher for longer than expected, and BND is slightly down from purchase. The timing was premature, though the diversification rationale remains valid.",
  },
];

export default function JournalPage() {
  const [tickerFilter, setTickerFilter] = useState<string>("all");
  const [calibrationFilter, setCalibrationFilter] = useState<string>("all");

  const uniqueTickers = [...new Set(journalEntries.map((e) => e.symbol))].sort();

  const filteredEntries = useMemo(() => {
    return journalEntries.filter((entry) => {
      if (tickerFilter !== "all" && entry.symbol !== tickerFilter) return false;
      if (
        calibrationFilter !== "all" &&
        entry.calibration !== calibrationFilter
      )
        return false;
      return true;
    });
  }, [tickerFilter, calibrationFilter]);

  const handleExportCSV = () => {
    const headers = [
      "Date",
      "Symbol",
      "Action",
      "Rationale",
      "Pre-Mortem",
      "Calibration",
      "Reflection",
    ];
    const rows = filteredEntries.map((e) => [
      e.date,
      e.symbol,
      e.action,
      `"${e.rationale.replace(/"/g, '""')}"`,
      `"${e.preMortem.replace(/"/g, '""')}"`,
      e.calibration,
      `"${e.reflection.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "decision-journal.csv";
    a.click();
    URL.revokeObjectURL(url);
    announce("Decision journal exported as CSV", "polite");
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">
        Decision Journal
      </h1>

      {/* ─── Filters ─── */}
      <section aria-labelledby="journal-filters-heading" className="mb-6">
        <h2
          id="journal-filters-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Filters
        </h2>
        <div className="flex flex-wrap items-end gap-4 bg-surface-raised border border-border-default rounded-lg p-4">
          <div>
            <label
              htmlFor="ticker-filter"
              className="block text-sm font-medium text-primary mb-1"
            >
              Ticker
            </label>
            <select
              id="ticker-filter"
              value={tickerFilter}
              onChange={(e) => {
                setTickerFilter(e.target.value);
                announce(
                  `Filtered by ${e.target.value === "all" ? "all tickers" : e.target.value}`,
                  "polite"
                );
              }}
              className="min-h-[44px] min-w-[120px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              <option value="all">All Tickers</option>
              {uniqueTickers.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="calibration-filter"
              className="block text-sm font-medium text-primary mb-1"
            >
              Calibration
            </label>
            <select
              id="calibration-filter"
              value={calibrationFilter}
              onChange={(e) => {
                setCalibrationFilter(e.target.value);
                announce(
                  `Filtered by ${e.target.value === "all" ? "all calibrations" : e.target.value}`,
                  "polite"
                );
              }}
              className="min-h-[44px] min-w-[150px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              <option value="all">All</option>
              <option value="correct">Correct</option>
              <option value="incorrect">Incorrect</option>
              <option value="partial">Partially Correct</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <button
            onClick={handleExportCSV}
            className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-md border border-border-default text-sm font-medium text-secondary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Export CSV
          </button>
        </div>
      </section>

      {/* ─── Journal Entries ─── */}
      <section aria-labelledby="entries-heading">
        <h2 id="entries-heading" className="sr-only">
          Journal Entries
        </h2>
        <div aria-live="polite" className="sr-only">
          Showing {filteredEntries.length} of {journalEntries.length} entries
        </div>

        {filteredEntries.length === 0 ? (
          <div className="bg-surface-raised border border-border-default rounded-lg p-8 text-center">
            <p className="text-secondary">
              No journal entries match your filters.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <article
                key={entry.id}
                className={`bg-surface-raised border border-border-default rounded-lg p-6 border-l-4 ${calibrationColors[entry.calibration]}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-base font-semibold text-primary">
                      {entry.action} {entry.symbol}
                    </h3>
                    <p className="text-xs text-muted">
                      {formatDate(entry.date)}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${calibrationBadgeColors[entry.calibration]}`}
                  >
                    {calibrationLabels[entry.calibration]}
                  </span>
                </div>

                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="font-semibold text-primary">Rationale</dt>
                    <dd className="text-secondary mt-0.5">
                      {entry.rationale}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-primary">Pre-Mortem</dt>
                    <dd className="text-secondary mt-0.5">
                      {entry.preMortem}
                    </dd>
                  </div>
                  {entry.reflection && (
                    <div>
                      <dt className="font-semibold text-primary">
                        Reflection
                      </dt>
                      <dd className="text-secondary mt-0.5">
                        {entry.reflection}
                      </dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
