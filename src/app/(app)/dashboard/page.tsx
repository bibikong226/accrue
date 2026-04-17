"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { mockPortfolio } from "@/data/mockPortfolio";
import type { Holding } from "@/data/mockPortfolio";
import { AIResponse } from "@/components/copilot/AIResponse";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatShares,
} from "@/lib/format";

// ─── Constants ───────────────────────────────────────────────────────────────

type SortKey =
  | "symbol"
  | "shares"
  | "avgCost"
  | "currentPrice"
  | "marketValue"
  | "gainLossDollars"
  | "gainLossPercent";

type SortDirection = "ascending" | "descending";

const NEWS_TABS = ["Holdings", "Watchlist", "Market", "Education"] as const;
type NewsTabLabel = (typeof NEWS_TABS)[number];

const NEWS_TAB_CATEGORY_MAP: Record<NewsTabLabel, string> = {
  Holdings: "holdings",
  Watchlist: "watchlist",
  Market: "market",
  Education: "education",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Determine the direction arrow character and its aria-label. */
function getDirectionIndicator(value: number): {
  arrow: string;
  ariaLabel: string;
} {
  if (value > 0) return { arrow: "\u2191", ariaLabel: "up" };
  if (value < 0) return { arrow: "\u2193", ariaLabel: "down" };
  return { arrow: "", ariaLabel: "unchanged" };
}

/** Determine color class for gain/loss values. Color is supplementary per A1.6. */
function gainLossColorClass(value: number): string {
  if (value > 0) return "text-gain";
  if (value < 0) return "text-loss";
  return "text-primary";
}

/** Assess diversification level based on sector concentration. */
function assessDiversification(holdings: Holding[]): {
  level: "Well Diversified" | "Moderate" | "Low";
  description: string;
} {
  const maxWeight = Math.max(...holdings.map((h) => h.portfolioWeight));
  const uniqueSectors = new Set(holdings.map((h) => h.sector)).size;

  if (maxWeight > 30) {
    return {
      level: "Low",
      description: `Your largest position is ${maxWeight.toFixed(1)}% of your portfolio, which exceeds the 30% single-position threshold. Consider rebalancing to reduce concentration risk.`,
    };
  }
  if (maxWeight >= 10) {
    return {
      level: "Moderate",
      description: `Your largest position is ${maxWeight.toFixed(1)}% of your portfolio. Diversification is reasonable but could be improved.`,
    };
  }
  if (uniqueSectors >= 5) {
    return {
      level: "Well Diversified",
      description: `No single position exceeds 10% and you hold ${uniqueSectors} sectors. Your portfolio has strong diversification.`,
    };
  }
  return {
    level: "Moderate",
    description: `Your positions are well-sized but spread across only ${uniqueSectors} sectors. Adding more sectors could improve diversification.`,
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── Page title ──
  useEffect(() => {
    document.title = "Dashboard \u2014 Accrue";
  }, []);

  // ── "What Changed" dismissal state ──
  const [whatChangedVisible, setWhatChangedVisible] = useState(true);

  // ── Holdings table sort state ──
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortDirection, setSortDirection] = useState<SortDirection>("descending");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const sortAnnouncerRef = useRef<HTMLDivElement>(null);

  // ── News tabs state ──
  const [activeNewsTab, setActiveNewsTab] = useState<NewsTabLabel>("Holdings");
  const newsPanelRef = useRef<HTMLDivElement>(null);

  // ── Tooltip state for money-weighted return ──
  const [mwrTooltipOpen, setMwrTooltipOpen] = useState(false);
  const mwrButtonRef = useRef<HTMLButtonElement>(null);

  // ── Derived data ──
  const portfolio = mockPortfolio;
  const todayIndicator = getDirectionIndicator(portfolio.todayChangeDollars);
  const diversification = assessDiversification(portfolio.holdings);

  // ── Sorted holdings ──
  const sortedHoldings = useMemo(() => {
    const sorted = [...portfolio.holdings].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "ascending"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "ascending"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [portfolio.holdings, sortKey, sortDirection]);

  // ── Filtered news ──
  const filteredNews = useMemo(() => {
    const category = NEWS_TAB_CATEGORY_MAP[activeNewsTab];
    return portfolio.news.filter((item) => item.category === category);
  }, [portfolio.news, activeNewsTab]);

  // ── Sort handler ──
  const handleSort = useCallback(
    (key: SortKey) => {
      let newDirection: SortDirection = "ascending";
      if (sortKey === key) {
        newDirection =
          sortDirection === "ascending" ? "descending" : "ascending";
      } else {
        // Default: descending for numeric columns, ascending for symbol
        newDirection = key === "symbol" ? "ascending" : "descending";
      }
      setSortKey(key);
      setSortDirection(newDirection);

      // a11y: Announce sort change to screen readers via live region
      const label = SORT_KEY_LABELS[key];
      if (sortAnnouncerRef.current) {
        sortAnnouncerRef.current.textContent = `Sorted by ${label}, ${newDirection}.`;
      }
    },
    [sortKey, sortDirection]
  );

  // ── Row expand/collapse ──
  const toggleRowExpand = useCallback((symbol: string) => {
    setExpandedRow((prev) => (prev === symbol ? null : symbol));
  }, []);

  // ── News tab activation (manual activation per spec) ──
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      let newIndex = index;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        newIndex = (index + 1) % NEWS_TABS.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        newIndex = (index - 1 + NEWS_TABS.length) % NEWS_TABS.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        newIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        newIndex = NEWS_TABS.length - 1;
      } else {
        return; // Don't handle other keys
      }
      // Move focus to the new tab but don't activate (manual activation)
      const tablist = (e.target as HTMLElement).closest('[role="tablist"]');
      const tabs = tablist?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      tabs?.[newIndex]?.focus();
    },
    []
  );

  const activateTab = useCallback((tab: NewsTabLabel) => {
    setActiveNewsTab(tab);
    // a11y: After tab activation, move focus into the panel
    requestAnimationFrame(() => {
      newsPanelRef.current?.focus();
    });
  }, []);

  // ── Donut chart CSS ──
  const donutGradient = useMemo(() => {
    let cumulative = 0;
    const stops = portfolio.sectorAllocations.map((s) => {
      const start = cumulative;
      cumulative += s.percent;
      return `${s.color} ${start}% ${cumulative}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [portfolio.sectorAllocations]);

  // ── Largest position weight for diversification ──
  const largestPositionWeight = Math.max(
    ...portfolio.holdings.map((h) => h.portfolioWeight)
  );

  return (
    <div className="space-y-8">
      {/* ── Page heading ── */}
      <h1 className="text-3xl font-semibold text-primary">
        Portfolio Dashboard
      </h1>

      {/* ════════════════════════════════════════════════════════════════════
          § 2.7 — "What Changed Since Last Login" Card
          ════════════════════════════════════════════════════════════════════ */}
      {whatChangedVisible && (
        <section
          aria-label="Changes since last login"
          className="relative rounded-xl border border-border-default bg-surface-raised p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-primary mb-1">
                What changed since yesterday
              </h2>
              <p className="text-sm text-secondary">
                Since yesterday:{" "}
                <span className={gainLossColorClass(portfolio.todayChangeDollars)}>
                  <span aria-label={portfolio.todayChangeDollars >= 0 ? "up" : "down"} role="img">
                    {portfolio.todayChangeDollars >= 0 ? "\u2191" : "\u2193"}
                  </span>{" "}
                  {formatSignedCurrency(portfolio.todayChangeDollars)} (
                  {formatSignedPercent(portfolio.todayChangePercent)})
                </span>
                . Biggest mover:{" "}
                <span className={gainLossColorClass(portfolio.biggestMoverChangePercent)}>
                  {portfolio.biggestMoverSymbol}{" "}
                  <span aria-label={portfolio.biggestMoverChangePercent >= 0 ? "up" : "down"} role="img">
                    {portfolio.biggestMoverChangePercent >= 0 ? "\u2191" : "\u2193"}
                  </span>{" "}
                  {formatSignedPercent(portfolio.biggestMoverChangePercent)}
                </span>
                .
              </p>
              {/* Follow-up chip buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px]"
                >
                  Why did {portfolio.biggestMoverSymbol} move?
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px]"
                >
                  Show my portfolio breakdown
                </button>
                <button
                  type="button"
                  className="inline-flex items-center rounded-full border border-border-default bg-surface-base px-3 py-1.5 text-xs font-medium text-secondary hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px]"
                >
                  Am I still on track?
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWhatChangedVisible(false)}
              aria-label="Dismiss changes since last login"
              className="shrink-0 rounded-lg p-2 text-secondary hover:text-primary hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {/* Close icon */}
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M15 5L5 15M5 5l10 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          § 3.1 — Hero Metrics Section
          ════════════════════════════════════════════════════════════════════ */}
      <section aria-label="Portfolio summary">
        {/* a11y: <dl> so VoiceOver reads "Portfolio Value: $99,656.95" */}
        <dl className="space-y-3">
          {/* Total portfolio value — LARGEST typographic element */}
          <div>
            <dt className="text-sm font-medium text-secondary">
              Portfolio Value
            </dt>
            <dd className="text-5xl font-semibold text-primary tabular-nums font-mono tracking-tight">
              {formatCurrency(portfolio.totalValue)}
            </dd>
          </div>

          {/* Today's change row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <dt className="sr-only">Today&apos;s change</dt>
            <dd
              className={`text-lg font-medium tabular-nums ${gainLossColorClass(portfolio.todayChangeDollars)}`}
            >
              <span aria-label={todayIndicator.ariaLabel} role="img">
                {todayIndicator.arrow}
              </span>{" "}
              {formatSignedCurrency(portfolio.todayChangeDollars)} today{" "}
              <span aria-hidden="true">&middot;</span>{" "}
              {formatSignedPercent(portfolio.todayChangePercent)}
            </dd>
          </div>

          {/* Performance context — framed against goal and benchmark per A2.6 */}
          <div className="text-xs text-muted">
            Your goal is {formatPercent(portfolio.annualGoalReturn)} annual return.{" "}
            {portfolio.benchmarkName} returned{" "}
            {formatSignedPercent(portfolio.benchmarkReturn)} over the same period.
          </div>

          {/* Return pills */}
          <div className="flex flex-wrap items-center gap-3 mt-1">
            {/* Time-weighted return pill */}
            <div>
              <dt className="sr-only">All-time time-weighted return</dt>
              <dd className="inline-flex items-center rounded-full bg-surface-overlay px-3 py-1 text-sm font-medium text-secondary">
                All-time:{" "}
                <span
                  className={`ml-1 tabular-nums ${gainLossColorClass(portfolio.timeWeightedReturn)}`}
                >
                  {formatSignedPercent(portfolio.timeWeightedReturn)}
                </span>
              </dd>
            </div>

            {/* Money-weighted return pill with explainer tooltip */}
            <div className="relative">
              <dt className="sr-only">Your money-weighted return</dt>
              <dd className="inline-flex items-center rounded-full bg-surface-overlay px-3 py-1 text-sm font-medium text-secondary">
                Your return:{" "}
                <span
                  className={`ml-1 tabular-nums ${gainLossColorClass(portfolio.moneyWeightedReturn)}`}
                >
                  {formatSignedPercent(portfolio.moneyWeightedReturn)}
                </span>
                <button
                  ref={mwrButtonRef}
                  type="button"
                  onClick={() => setMwrTooltipOpen((prev) => !prev)}
                  onBlur={() => setMwrTooltipOpen(false)}
                  aria-expanded={mwrTooltipOpen}
                  aria-label="What is your return? Explanation"
                  className="ml-1.5 inline-flex items-center justify-center rounded-full w-5 h-5 text-xs font-bold border border-border-default text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
                >
                  ?
                </button>
              </dd>
              {mwrTooltipOpen && (
                <div
                  role="tooltip"
                  className="absolute left-0 top-full mt-2 z-10 w-72 rounded-lg border border-border-default bg-surface-raised p-3 text-sm text-secondary shadow-lg"
                >
                  <p>
                    <strong>Your return</strong> (money-weighted) reflects the
                    actual return on the cash you invested, accounting for the
                    timing and size of your deposits and withdrawals. It may
                    differ from the all-time (time-weighted) return, which
                    measures the portfolio&apos;s performance independent of cash
                    flows.
                  </p>
                </div>
              )}
            </div>
          </div>
        </dl>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          § 3.5 — Goal Progress
          ════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="goal-heading">
        <h2 id="goal-heading" className="text-xl font-semibold text-primary mb-3">
          Goal Progress
        </h2>

        {/* Status label */}
        <p className="flex items-center gap-2 mb-1">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              portfolio.goal.status === "on-track"
                ? "bg-feedback-success/10 text-feedback-success"
                : portfolio.goal.status === "behind"
                  ? "bg-feedback-warning/10 text-feedback-warning"
                  : "bg-feedback-error/10 text-feedback-error"
            }`}
          >
            {portfolio.goal.statusLabel}
          </span>
        </p>

        {/* Confidence sentence */}
        <p className="text-sm text-secondary mb-3">
          At {formatPercent(portfolio.goal.confidencePercent)} confidence, you&apos;ll
          reach {formatCurrency(portfolio.goal.targetAmount)} by{" "}
          {portfolio.goal.targetDateDisplay}.
        </p>

        {/* Progress bar — visual + text */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-muted mb-1">
            <span>
              {formatCurrency(portfolio.goal.currentAmount)} of{" "}
              {formatCurrency(portfolio.goal.targetAmount)}
            </span>
            <span>{formatPercent(portfolio.goal.progressPercent)}</span>
          </div>
          <div
            /* a11y: progressbar role with accessible values */
            role="progressbar"
            aria-valuenow={portfolio.goal.progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Goal progress: ${formatPercent(portfolio.goal.progressPercent)} toward ${formatCurrency(portfolio.goal.targetAmount)}`}
            className="h-3 w-full rounded-full bg-surface-overlay overflow-hidden"
          >
            <div
              className={`h-full rounded-full transition-all ${
                portfolio.goal.status === "on-track"
                  ? "bg-feedback-success"
                  : portfolio.goal.status === "behind"
                    ? "bg-feedback-warning"
                    : "bg-feedback-error"
              }`}
              style={{ width: `${portfolio.goal.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Lever cards — shown when not on track */}
        {portfolio.goal.status !== "on-track" && (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border-default bg-surface-raised p-4">
              <p className="text-sm font-medium text-primary">
                Add {formatCurrency(portfolio.goal.leverMonthly)}/mo
              </p>
              <p className="text-xs text-feedback-success mt-1">
                {"\u2192"} On track
              </p>
            </div>
            <div className="rounded-lg border border-border-default bg-surface-raised p-4">
              <p className="text-sm font-medium text-primary">
                Extend by {portfolio.goal.leverExtendMonths} months
              </p>
              <p className="text-xs text-feedback-success mt-1">
                {"\u2192"} On track
              </p>
            </div>
            <div className="rounded-lg border border-border-default bg-surface-raised p-4">
              <p className="text-sm font-medium text-primary">
                One-time {formatCurrency(portfolio.goal.leverOneTime)}
              </p>
              <p className="text-xs text-feedback-success mt-1">
                {"\u2192"} On track
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          § 3.3 — Asset Allocation
          ════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="allocation-heading">
        <h2
          id="allocation-heading"
          className="text-xl font-semibold text-primary mb-3"
        >
          Asset Allocation
        </h2>

        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Donut chart — CSS conic-gradient for accessibility (no canvas/SVG) */}
          <div className="relative shrink-0">
            <div
              role="img"
              aria-label={`Asset allocation donut chart. ${formatCurrency(portfolio.totalValue)} across ${portfolio.sectorCount} sectors. ${portfolio.sectorAllocations.map((s) => `${s.sector}: ${formatPercent(s.percent)}`).join(". ")}.`}
              className="w-48 h-48 rounded-full"
              style={{
                background: donutGradient,
                /* Force mask for donut hole */
                WebkitMask:
                  "radial-gradient(closest-side, transparent 65%, black 65.5%)",
                mask: "radial-gradient(closest-side, transparent 65%, black 65.5%)",
              }}
            />
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-sm font-semibold text-primary tabular-nums">
                {formatCurrency(portfolio.totalValue)}
              </span>
              <span className="text-xs text-muted">
                across {portfolio.sectorCount} sectors
              </span>
            </div>
          </div>

          {/* Legend + Diversification indicator */}
          <div className="flex-1 min-w-0">
            {/* Sector legend — semantic data table for screen readers */}
            <table className="w-full text-sm mb-4">
              {/* a11y: caption provides accessible name describing what this table shows */}
              <caption className="sr-only">
                Sector allocation breakdown showing each sector, its market value, and portfolio weight percentage
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left text-xs text-muted font-medium pb-1">
                    Sector
                  </th>
                  <th scope="col" className="text-right text-xs text-muted font-medium pb-1">
                    Market Value
                  </th>
                  <th scope="col" className="text-right text-xs text-muted font-medium pb-1">
                    Portfolio Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {portfolio.sectorAllocations.map((s) => (
                  <tr key={s.sector}>
                    <td className="py-1 pr-3">
                      <span className="flex items-center gap-2">
                        <span
                          aria-hidden="true"
                          className="inline-block w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: s.color }}
                        />
                        {s.sector}
                      </span>
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {formatCurrency(s.value)}
                    </td>
                    <td className="py-1 text-right tabular-nums">
                      {s.percent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Diversification indicator */}
            <div
              className={`rounded-lg border p-3 ${
                diversification.level === "Well Diversified"
                  ? "border-feedback-success/30 bg-feedback-success/5"
                  : diversification.level === "Moderate"
                    ? "border-feedback-warning/30 bg-feedback-warning/5"
                    : "border-feedback-error/30 bg-feedback-error/5"
              }`}
            >
              <p className="text-sm font-semibold text-primary mb-1">
                Diversification:{" "}
                <span
                  className={
                    diversification.level === "Well Diversified"
                      ? "text-feedback-success"
                      : diversification.level === "Moderate"
                        ? "text-feedback-warning"
                        : "text-feedback-error"
                  }
                >
                  {diversification.level}
                </span>
              </p>
              <p className="text-xs text-secondary">
                {diversification.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          § 3.6 — Holdings Table
          ════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="holdings-heading">
        <h2
          id="holdings-heading"
          className="text-xl font-semibold text-primary mb-3"
        >
          Holdings
        </h2>

        {/* a11y: Live region announces sort changes */}
        <div
          ref={sortAnnouncerRef}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />

        <div className="overflow-x-auto rounded-xl border border-border-default">
          <table className="w-full text-sm">
            {/* a11y: caption provides accessible name for screen readers */}
            <caption className="sr-only">
              Portfolio holdings table showing each stock position with symbol, shares owned, average cost basis, current price, market value, and gain or loss in dollars and percent
            </caption>
            <thead className="bg-surface-raised">
              <tr>
                <SortableHeader
                  label="Symbol"
                  sortKey="symbol"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Shares"
                  sortKey="shares"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Average Cost"
                  sortKey="avgCost"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Current Price"
                  sortKey="currentPrice"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Market Value"
                  sortKey="marketValue"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Gain/Loss ($)"
                  sortKey="gainLossDollars"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
                <SortableHeader
                  label="Gain/Loss (%)"
                  sortKey="gainLossPercent"
                  currentSortKey={sortKey}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                  align="right"
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-default">
              {sortedHoldings.map((holding) => {
                const glIndicator = getDirectionIndicator(
                  holding.gainLossDollars
                );
                const isExpanded = expandedRow === holding.symbol;
                return (
                  <>
                    <tr
                      key={holding.symbol}
                      className="hover:bg-surface-overlay/50 cursor-pointer"
                      style={{ height: "56px" }}
                      tabIndex={0}
                      role="row"
                      aria-expanded={isExpanded}
                      onClick={() => toggleRowExpand(holding.symbol)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRowExpand(holding.symbol);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-primary whitespace-nowrap">
                        <div>
                          <span className="font-semibold">
                            {holding.symbol}
                          </span>
                          <span className="block text-xs text-muted font-normal">
                            {holding.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-secondary">
                        {formatShares(holding.shares)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-secondary">
                        {formatCurrency(holding.avgCost)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-secondary">
                        {formatCurrency(holding.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-primary">
                        {formatCurrency(holding.marketValue)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-medium ${gainLossColorClass(holding.gainLossDollars)}`}
                      >
                        <span aria-label={glIndicator.ariaLabel} role="img">
                          {glIndicator.arrow}
                        </span>{" "}
                        {formatSignedCurrency(holding.gainLossDollars)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right tabular-nums font-medium ${gainLossColorClass(holding.gainLossPercent)}`}
                      >
                        <span aria-label={holding.gainLossPercent >= 0 ? "up" : "down"} role="img">
                          {holding.gainLossPercent >= 0 ? "\u2191" : "\u2193"}
                        </span>{" "}
                        {formatSignedPercent(holding.gainLossPercent)}
                      </td>
                    </tr>
                    {/* Expanded detail row */}
                    {isExpanded && (
                      <tr
                        key={`${holding.symbol}-detail`}
                        className="bg-surface-sunken"
                      >
                        <td colSpan={7} className="px-6 py-4">
                          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <dt className="text-xs text-muted">
                                Total Cost Basis
                              </dt>
                              <dd className="font-medium text-primary tabular-nums">
                                {formatCurrency(
                                  holding.shares * holding.avgCost
                                )}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">
                                Market Value
                              </dt>
                              <dd className="font-medium text-primary tabular-nums">
                                {formatCurrency(holding.marketValue)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">
                                Total Return ($)
                              </dt>
                              <dd
                                className={`font-medium tabular-nums ${gainLossColorClass(holding.gainLossDollars)}`}
                              >
                                <span aria-label={holding.gainLossDollars >= 0 ? "up" : "down"} role="img">
                                  {holding.gainLossDollars >= 0 ? "\u2191" : "\u2193"}
                                </span>{" "}
                                {formatSignedCurrency(holding.gainLossDollars)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">
                                Total Return (%)
                              </dt>
                              <dd
                                className={`font-medium tabular-nums ${gainLossColorClass(holding.gainLossPercent)}`}
                              >
                                <span aria-label={holding.gainLossPercent >= 0 ? "up" : "down"} role="img">
                                  {holding.gainLossPercent >= 0 ? "\u2191" : "\u2193"}
                                </span>{" "}
                                {formatSignedPercent(holding.gainLossPercent)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">
                                Today&apos;s Change
                              </dt>
                              <dd
                                className={`font-medium tabular-nums ${gainLossColorClass(holding.todayChangeDollars)}`}
                              >
                                <span aria-label={holding.todayChangeDollars >= 0 ? "up" : "down"} role="img">
                                  {holding.todayChangeDollars >= 0 ? "\u2191" : "\u2193"}
                                </span>{" "}
                                {formatSignedCurrency(
                                  holding.todayChangeDollars
                                )}{" "}
                                (
                                {formatSignedPercent(
                                  holding.todayChangePercent
                                )}
                                )
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">
                                Portfolio Weight
                              </dt>
                              <dd className="font-medium text-primary tabular-nums">
                                {holding.portfolioWeight.toFixed(2)}%
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted">
                                Sector
                              </dt>
                              <dd className="font-medium text-primary">
                                {holding.sector}
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          Proactive Copilot Card — uses the AIResponse component with
          three mandatory trust signals per § 2.8
          ════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="copilot-insight-heading">
        <h2
          id="copilot-insight-heading"
          className="text-xl font-semibold text-primary mb-3"
        >
          AI Copilot Insight
        </h2>

        <AIResponse
          response={{
            id: "dashboard-proactive",
            content: portfolio.copilotInsight.body,
            confidence: portfolio.copilotInsight.confidence,
            sources: portfolio.copilotInsight.sources.map((s, i) => ({
              id: `src-${i}`,
              title: s.title,
              publisher: s.publisher,
              lastUpdated: s.timestamp,
            })),
            type: "proactive",
            triggerPage: "dashboard",
          }}
        />
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          § 3.8 — News Feed
          ════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="news-heading">
        <h2
          id="news-heading"
          className="text-xl font-semibold text-primary mb-3"
        >
          News
        </h2>

        <p className="text-xs text-muted italic mb-4">
          News that mentions what you own or watch. We don&apos;t pick stories to
          make you trade.
        </p>

        {/* a11y: Manual activation tabs — Enter/Space activates, arrows move focus only */}
        <div
          role="tablist"
          aria-label="News categories"
          className="flex border-b border-border-default mb-4"
        >
          {NEWS_TABS.map((tab, index) => {
            const isActive = activeNewsTab === tab;
            return (
              <button
                key={tab}
                role="tab"
                /* a11y: aria-selected indicates the currently active tab */
                aria-selected={isActive}
                /* a11y: aria-controls links tab to its panel */
                aria-controls="news-tabpanel"
                id={`news-tab-${tab.toLowerCase()}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => activateTab(tab)}
                onKeyDown={(e) => handleTabKeyDown(e, index)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                  isActive
                    ? "border-action-primary text-action-primary"
                    : "border-transparent text-secondary hover:text-primary hover:border-border-strong"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Tab panel */}
        <div
          ref={newsPanelRef}
          id="news-tabpanel"
          role="tabpanel"
          /* a11y: tabindex="-1" allows programmatic focus after tab activation */
          tabIndex={-1}
          aria-labelledby={`news-tab-${activeNewsTab.toLowerCase()}`}
          className="space-y-3 outline-none"
        >
          {filteredNews.length === 0 ? (
            <p className="text-sm text-muted py-4">
              No news items in this category right now.
            </p>
          ) : (
            filteredNews.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-border-default bg-surface-raised p-4"
              >
                <h3 className="text-sm font-semibold text-primary mb-1">
                  {item.headline}
                </h3>
                <p className="text-xs text-muted mb-2">
                  {item.publisher} &middot; {item.timeAgo}
                  {item.relatedTickers.length > 0 && (
                    <>
                      {" "}
                      &middot;{" "}
                      {item.relatedTickers.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded bg-surface-overlay px-1.5 py-0.5 text-xs font-medium text-secondary ml-1"
                        >
                          {t}
                        </span>
                      ))}
                    </>
                  )}
                </p>
                {/* a11y: AI summary clearly labeled for screen readers */}
                <p className="text-sm text-secondary italic">
                  <span className="sr-only">AI-generated summary: </span>
                  {item.aiSummary}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// ─── Sort Key Labels (for announcer) ─────────────────────────────────────────

const SORT_KEY_LABELS: Record<SortKey, string> = {
  symbol: "symbol",
  shares: "shares",
  avgCost: "average cost",
  currentPrice: "current price",
  marketValue: "market value",
  gainLossDollars: "gain/loss dollars",
  gainLossPercent: "gain/loss percent",
};

// ─── SortableHeader sub-component ────────────────────────────────────────────

function SortableHeader({
  label,
  sortKey: key,
  currentSortKey,
  currentDirection,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  currentSortKey: SortKey;
  currentDirection: SortDirection;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const isActive = currentSortKey === key;
  return (
    <th
      scope="col"
      /* a11y: aria-sort only on the currently sorted column */
      aria-sort={isActive ? currentDirection : undefined}
      className={`px-4 py-3 text-xs font-medium text-muted whitespace-nowrap ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      <button
        type="button"
        onClick={() => onSort(key)}
        className={`inline-flex items-center gap-1 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
        aria-label={`Sort by ${label}`}
      >
        {label}
        <span aria-hidden="true" className="text-[10px]">
          {isActive
            ? currentDirection === "ascending"
              ? "\u25B2"
              : "\u25BC"
            : "\u25B4\u25BE"}
        </span>
      </button>
    </th>
  );
}
