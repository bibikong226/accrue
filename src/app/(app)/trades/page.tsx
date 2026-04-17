"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { tradeEntries } from "@/data/mockPortfolio";
import type { TradeEntry } from "@/data/mockPortfolio";
import { formatDate, formatCurrency } from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Filter types ─── */
type FilterChip = "all" | "open" | "closed" | "wins" | "losses";

const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "wins", label: "Wins" },
  { value: "losses", label: "Losses" },
];

/* ─── AI outcome badge mapping ─── */
type ThesisOutcome = "played_out" | "failed" | "mixed" | "too_early";

const outcomeBadgeConfig: Record<
  ThesisOutcome,
  { label: string; className: string }
> = {
  played_out: {
    label: "Thesis played out",
    className: "bg-green-50 text-gain border border-green-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-loss border border-red-200",
  },
  mixed: {
    label: "Mixed",
    className: "bg-yellow-50 text-feedback-warning border border-yellow-200",
  },
  too_early: {
    label: "Too early",
    className: "bg-gray-50 text-muted border border-gray-200",
  },
};

/* ─── Helpers ─── */

/** Parse price from thesis or transaction context -- for display header */
function getTradePrice(entry: TradeEntry): string | null {
  // Extract price from outcomeNotes for sell trades
  if (entry.outcomeNotes) {
    const match = entry.outcomeNotes.match(/\$(\d+(?:\.\d{2})?)/);
    if (match) return match[0];
  }
  return null;
}

/** Determine if a trade is "closed" (has a sell with linked buy, or is a completed sell) */
function isClosedTrade(entry: TradeEntry): boolean {
  return entry.action === "Sell" && !!entry.aiAnalysis;
}

/** Determine if a trade is a "win" based on AI analysis */
function isWinTrade(entry: TradeEntry): boolean {
  return entry.aiAnalysis?.thesisOutcome === "played_out";
}

/** Determine if a trade is a "loss" based on AI analysis */
function isLossTrade(entry: TradeEntry): boolean {
  return entry.aiAnalysis?.thesisOutcome === "failed";
}

/* ─── Trade Card Component ─── */
function TradeCard({ entry }: { entry: TradeEntry }) {
  const [expanded, setExpanded] = useState(false);
  const cardId = `trade-card-${entry.id}`;
  const detailsId = `trade-details-${entry.id}`;

  const accentColor =
    entry.action === "Buy" ? "border-l-gain" : "border-l-loss";

  const actionLabel = entry.action === "Buy" ? "Buy" : "Sell";
  const dateFormatted = formatDate(entry.timestamp);

  const headerText = `${actionLabel} ${entry.symbol} -- ${dateFormatted}`;

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      announce(
        next
          ? `${entry.symbol} trade details expanded`
          : `${entry.symbol} trade details collapsed`,
        "polite"
      );
      return next;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpanded();
    }
  };

  return (
    <li className="list-none">
      <article
        id={cardId}
        className={`bg-surface-raised border border-border-default rounded-lg border-l-4 ${accentColor} transition-shadow hover:shadow-md`}
        /* aria-label provides full trade details for screen readers */
        aria-label={`${actionLabel} ${entry.symbol}, ${dateFormatted}. ${entry.thesis}`}
      >
        {/* ─── Card Header (always visible, ~160px card height) ─── */}
        <button
          type="button"
          className="p-4 cursor-pointer min-h-[160px] flex flex-col justify-between w-full text-left focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={toggleExpanded}
        >
          <div>
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${
                  entry.action === "Buy"
                    ? "bg-green-50 text-gain"
                    : "bg-red-50 text-loss"
                }`}
                /* aria-hidden because the full label is on the article */
                aria-hidden="true"
              >
                {actionLabel}
              </span>
              <h3 className="text-base font-semibold text-primary">
                {entry.symbol}
              </h3>
              <span className="text-sm text-muted" aria-hidden="true">
                --
              </span>
              <span className="text-sm text-secondary">{dateFormatted}</span>
            </div>

            {/* Thesis in italic serif */}
            <p
              className="mt-2 text-sm text-secondary italic leading-relaxed"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {entry.thesis}
            </p>

            {/* AI outcome badge */}
            {entry.aiAnalysis && (
              <div className="mt-3 flex items-center gap-2">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    outcomeBadgeConfig[entry.aiAnalysis.thesisOutcome].className
                  }`}
                >
                  {outcomeBadgeConfig[entry.aiAnalysis.thesisOutcome].label}
                </span>
                {/* Confidence indicator per CLAUDE.md A3.3 -- icon + text + color */}
                <span className="text-xs text-muted">
                  (AI confidence: {entry.aiAnalysis.confidence})
                </span>
              </div>
            )}
          </div>

          {/* Expand indicator */}
          <div className="flex items-center justify-end mt-2">
            <span
              className="text-xs text-muted"
              aria-hidden="true"
            >
              {expanded ? "Collapse" : "Expand"} details{" "}
              {expanded ? "\u25B2" : "\u25BC"}
            </span>
          </div>
        </button>

        {/* ─── Expanded Details ─── */}
        {expanded && (
          <div
            id={detailsId}
            className="border-t border-border-default p-4 space-y-4"
            role="region"
            /* aria-label for screen readers navigating to the expanded region */
            aria-label={`Details for ${actionLabel} ${entry.symbol} trade`}
          >
            {/* Thesis */}
            <div>
              <h4 className="text-sm font-semibold text-primary">Thesis</h4>
              <p
                className="text-sm text-secondary mt-1 italic"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                {entry.thesis}
              </p>
            </div>

            {/* Catalyst */}
            {entry.catalyst && (
              <div>
                <h4 className="text-sm font-semibold text-primary">Catalyst</h4>
                <p className="text-sm text-secondary mt-1">{entry.catalyst}</p>
              </div>
            )}

            {/* Pre-Mortem */}
            {entry.preMortem && (
              <div>
                <h4 className="text-sm font-semibold text-primary">
                  Pre-Mortem
                </h4>
                <p className="text-sm text-secondary mt-1">
                  {entry.preMortem}
                </p>
              </div>
            )}

            {/* Outcome Notes (for sells) */}
            {entry.outcomeNotes && (
              <div>
                <h4 className="text-sm font-semibold text-primary">
                  Outcome
                </h4>
                <p className="text-sm text-secondary mt-1">
                  {entry.outcomeNotes}
                </p>
              </div>
            )}

            {/* AI Analysis */}
            {entry.aiAnalysis && (
              <div className="bg-surface-sunken rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-muted uppercase tracking-wide">
                    AI Analysis
                  </span>
                  {/* AI provenance badge per CLAUDE.md A3.3 */}
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-action-primary text-inverse">
                    AI
                  </span>
                </div>

                {/* What happened */}
                <div>
                  <h5 className="text-sm font-semibold text-primary">
                    What happened
                  </h5>
                  <p className="text-sm text-secondary mt-1">
                    {entry.aiAnalysis.summary}
                  </p>
                </div>

                {/* Lesson */}
                <div>
                  <h5 className="text-sm font-semibold text-primary">Lesson</h5>
                  <p className="text-sm text-secondary mt-1">
                    {entry.aiAnalysis.lesson}
                  </p>
                </div>

                {/* Luck vs Skill */}
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>
                    Luck vs. Skill:{" "}
                    {entry.aiAnalysis.luckVsSkill.replace(/_/g, " ")}
                  </span>
                  <span>--</span>
                  <span>Confidence: {entry.aiAnalysis.confidence}</span>
                </div>
              </div>
            )}

            {/* Mini chart reference link */}
            <div>
              <Link
                href={`/research/${entry.symbol}`}
                className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-md text-sm font-medium text-action-primary hover:underline focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                View {entry.symbol} chart and research →
              </Link>
            </div>
          </div>
        )}
      </article>
    </li>
  );
}

/* ─── Trades Page ─── */
export default function TradesPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");

  // Sort newest first by timestamp
  const sortedEntries = useMemo(
    () =>
      [...tradeEntries].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      ),
    []
  );

  const filteredEntries = useMemo(() => {
    switch (activeFilter) {
      case "open":
        return sortedEntries.filter(
          (e) =>
            e.action === "Buy" &&
            (!e.aiAnalysis ||
              e.aiAnalysis.thesisOutcome === "too_early")
        );
      case "closed":
        return sortedEntries.filter(
          (e) => isClosedTrade(e) || e.aiAnalysis?.thesisOutcome === "played_out" || e.aiAnalysis?.thesisOutcome === "failed"
        );
      case "wins":
        return sortedEntries.filter((e) => isWinTrade(e));
      case "losses":
        return sortedEntries.filter((e) => isLossTrade(e));
      default:
        return sortedEntries;
    }
  }, [activeFilter, sortedEntries]);

  const handleFilterChange = (filter: FilterChip) => {
    setActiveFilter(filter);
    const chipLabel = FILTER_CHIPS.find((c) => c.value === filter)?.label ?? filter;
    announce(
      `Filter changed to ${chipLabel}. Showing ${filteredEntries.length} trades.`,
      "polite"
    );
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-2">Trades</h1>
      <p className="text-sm text-secondary mb-6">
        Timeline of your completed and open trades, newest first.
      </p>

      {/* ─── Filter Chips ─── */}
      <section aria-labelledby="trades-filter-heading" className="mb-6">
        <h2 id="trades-filter-heading" className="sr-only">
          Filter trades
        </h2>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-labelledby="trades-filter-heading"
        >
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilter === chip.value;
            return (
              <button
                key={chip.value}
                role="radio"
                aria-checked={isActive}
                onClick={() => handleFilterChange(chip.value)}
                className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
                  isActive
                    ? "bg-action-primary text-inverse"
                    : "bg-surface-raised border border-border-default text-secondary hover:bg-surface-sunken"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Live region for filter count ─── */}
      <div aria-live="polite" className="sr-only">
        Showing {filteredEntries.length} of {sortedEntries.length} trades
      </div>

      {/* ─── Trades Timeline ─── */}
      <section aria-labelledby="trades-timeline-heading">
        <h2 id="trades-timeline-heading" className="sr-only">
          Trades timeline
        </h2>

        {filteredEntries.length === 0 ? (
          <div className="bg-surface-raised border border-border-default rounded-lg p-8 text-center">
            <p className="text-secondary">
              No trades match the current filter.
            </p>
          </div>
        ) : (
          <ol
            className="space-y-4"
            /* Semantic list for screen readers -- each trade is a list item */
            aria-label="Trades timeline, newest first"
          >
            {filteredEntries.map((entry) => (
              <TradeCard key={entry.id} entry={entry} />
            ))}
          </ol>
        )}
      </section>
    </>
  );
}
