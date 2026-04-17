"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  portfolioSummary,
  holdings,
  type Holding,
} from "@/data/mockPortfolio";
import ChartWrapper from "@/components/chart/ChartWrapper";
import AIResponse from "@/components/copilot/AIResponse";
import { fixturesById } from "@/data/copilotFixtures";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatShares,
  formatDate,
  getGainLossDisplay,
} from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";
import { useRouter } from "next/navigation";

/* ─── Constants derived from mock data ─── */
const todayChange = holdings.reduce(
  (sum, h) => sum + (h.currentPrice - h.previousClose) * h.shares,
  0
);
const todayChangePercent =
  (todayChange / (portfolioSummary.totalValue - todayChange)) * 100;
const todayDisplay = getGainLossDisplay(todayChange, todayChangePercent);

/* TWR and MWR mock values derived from portfolio summary */
const twrPercent = portfolioSummary.totalGainLossPercent;
const mwrPercent = portfolioSummary.totalGainLossPercent - 0.8; /* MWR slightly differs from TWR */

/* Goal progress */
const goalProgress = Math.min(
  100,
  Math.round((portfolioSummary.totalGainLossPercent / portfolioSummary.annualGoal) * 100)
);
const goalStatus: "on-track" | "behind" | "needs-attention" =
  goalProgress >= 90 ? "on-track" : goalProgress >= 60 ? "behind" : "needs-attention";
const goalStatusLabels = {
  "on-track": "On track",
  behind: "Behind",
  "needs-attention": "Needs attention",
};
const goalStatusColors = {
  "on-track": "text-gain",
  behind: "text-feedback-warning",
  "needs-attention": "text-loss",
};

/* Sector allocation computed from holdings */
const sectorMap = holdings.reduce<Record<string, number>>((acc, h) => {
  acc[h.sector] = (acc[h.sector] || 0) + h.marketValue;
  return acc;
}, {});
const sectorAllocation = Object.entries(sectorMap)
  .map(([sector, value]) => ({
    sector,
    value,
    percent: (value / portfolioSummary.totalValue) * 100,
  }))
  .sort((a, b) => b.value - a.value);

/* Diversification check */
const maxSectorPercent = Math.max(...sectorAllocation.map((s) => s.percent));
const isDiversified = maxSectorPercent < 40;

/* News feed mock data */
const newsTabs = ["Holdings", "Watchlist", "Market", "Education"] as const;
type NewsTab = (typeof newsTabs)[number];

interface NewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  aiSummary: string;
  tab: NewsTab;
}

const newsItems: NewsItem[] = [
  {
    id: "n1",
    title: "Apple Reports Strong Q2 Earnings, Revenue Up 8%",
    source: "Reuters",
    date: "2026-04-15",
    aiSummary:
      "Apple exceeded analyst expectations with $94.8B revenue. Services segment grew 14% year-over-year, now representing 22% of total revenue.",
    tab: "Holdings",
  },
  {
    id: "n2",
    title: "Vanguard Reduces Expense Ratios on 12 ETFs",
    source: "Morningstar",
    date: "2026-04-14",
    aiSummary:
      "Vanguard cut fees on several funds including VTI (now 0.03%) and VXUS (now 0.05%). This benefits long-term holders by reducing the drag on returns over time.",
    tab: "Holdings",
  },
  {
    id: "n3",
    title: "Fed Signals Potential Rate Hold Through Summer",
    source: "Bloomberg",
    date: "2026-04-15",
    aiSummary:
      "The Federal Reserve indicated rates will likely remain at current levels through Q3 2026. Bond prices may stabilize, relevant for your BND holding.",
    tab: "Market",
  },
  {
    id: "n4",
    title: "Understanding Dollar-Cost Averaging",
    source: "Accrue Learn",
    date: "2026-04-13",
    aiSummary:
      "Dollar-cost averaging means investing a fixed amount at regular intervals regardless of market conditions. Research shows this approach reduces the risk of investing a large amount at a market peak.",
    tab: "Education",
  },
  {
    id: "n5",
    title: "Top Dividend ETFs for 2026",
    source: "Seeking Alpha",
    date: "2026-04-12",
    aiSummary:
      "SCHD remains a top pick among dividend ETFs. Its focus on quality dividend-paying U.S. companies has historically provided competitive total returns with lower volatility.",
    tab: "Watchlist",
  },
];

/* ─── Sortable column type ─── */
type SortKey = "symbol" | "marketValue" | "gainLossDollar" | "totalReturnPercent";
type SortDir = "asc" | "desc";

/* ─── What Changed card text ─── */
const whatChangedText = `Your portfolio ${todayDisplay.signal === "up" ? "gained" : todayDisplay.signal === "down" ? "lost" : "is unchanged"} ${formatSignedCurrency(todayChange)} today. AAPL led with a ${formatSignedCurrency((holdings.find((h) => h.symbol === "AAPL")?.currentPrice ?? 0) - (holdings.find((h) => h.symbol === "AAPL")?.previousClose ?? 0))} per-share move. Your overall return of ${formatSignedPercent(portfolioSummary.totalGainLossPercent)} is ${portfolioSummary.totalGainLossPercent >= portfolioSummary.annualGoal ? "ahead of" : "trailing"} your ${portfolioSummary.goalLabel} goal.`;

const followUpChips = [
  "Why did AAPL move?",
  "Am I on track for my goal?",
  "Should I rebalance?",
  "Explain my bond position",
];

export default function DashboardPage() {
  const [whatChangedDismissed, setWhatChangedDismissed] = useState(false);
  const [milestoneDismissed, setMilestoneDismissed] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("marketValue");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeNewsTab, setActiveNewsTab] = useState<NewsTab>("Holdings");
  const newsPanelRef = useRef<HTMLDivElement>(null);
  const [dismissedInsights, setDismissedInsights] = useState<Set<number>>(new Set());
  const [insightQuery, setInsightQuery] = useState("");
  const [leverConfirm, setLeverConfirm] = useState<string | null>(null);
  const [currentGoalStatus, setCurrentGoalStatus] = useState(goalStatus);
  const router = useRouter();

  const sortedHoldings = [...holdings].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDir === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDir === "asc"
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    announce(
      `Holdings sorted by ${key} ${sortDir === "asc" ? "descending" : "ascending"}`,
      "polite"
    );
  };

  const toggleRow = (symbol: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) {
        next.delete(symbol);
        announce(`${symbol} collapsed.`, "polite");
      } else {
        next.add(symbol);
        announce(`${symbol} position expanded. Use Tab to explore details.`, "polite");
        requestAnimationFrame(() => {
          const panel = document.getElementById(`expansion-${symbol}`);
          panel?.focus();
        });
      }
      return next;
    });
  };

  const handleNewsTabChange = (tab: NewsTab) => {
    setActiveNewsTab(tab);
    announce(`Showing ${tab} news`, "polite");
    if (newsPanelRef.current) {
      newsPanelRef.current.focus();
    }
  };

  const SortButton = ({
    label,
    columnKey,
  }: {
    label: string;
    columnKey: SortKey;
  }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] font-medium text-left focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
      aria-sort={
        sortKey === columnKey
          ? sortDir === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      {label}
      {sortKey === columnKey && (
        <span aria-hidden="true">{sortDir === "asc" ? " \u25B2" : " \u25BC"}</span>
      )}
    </button>
  );

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">
        Portfolio Dashboard
      </h1>

      {/* ─── Section 1: What Changed ─── */}
      {!whatChangedDismissed && (
        <section aria-labelledby="what-changed-heading" className="mb-6">
          <div className="bg-surface-raised border border-border-default rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div>
                <h2
                  id="what-changed-heading"
                  className="text-lg font-semibold text-primary mb-2"
                >
                  What Changed
                </h2>
                <p className="text-sm text-secondary">{whatChangedText}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {followUpChips.map((chip) => (
                    <button
                      key={chip}
                      className="px-3 py-1.5 min-h-[44px] text-xs font-medium rounded-full border border-border-default text-secondary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                      onClick={() => {
                        window.dispatchEvent(
                          new CustomEvent("accrue-copilot-query", {
                            detail: chip,
                          })
                        );
                      }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => {
                  setWhatChangedDismissed(true);
                  announce("What Changed card dismissed", "polite");
                }}
                aria-label="Dismiss What Changed card"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">&#10005;</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ─── Section 2: Hero Metrics ─── */}
      <section aria-labelledby="hero-metrics-heading" className="mb-6">
        <h2 id="hero-metrics-heading" className="sr-only">
          Portfolio Summary Metrics
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* a11y: tabIndex={0} on each financial metric so Tab stops here
                and VoiceOver reads the label+value pair. role="group" with
                aria-label provides a complete reading even if dt/dd aren't
                announced as pairs in all VoiceOver modes. */}
            {/* Portfolio Value */}
            <div
              tabIndex={0}
              role="group"
              aria-label={`Portfolio Value: ${formatCurrency(portfolioSummary.totalValue)}`}
              className="focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-md p-1"
            >
              <dt className="text-sm font-medium text-muted">
                Portfolio Value
              </dt>
              <dd className="text-3xl font-bold text-primary tabular-nums mt-1">
                {formatCurrency(portfolioSummary.totalValue)}
              </dd>
            </div>

            {/* Today's Change */}
            <div
              tabIndex={0}
              role="group"
              aria-label={`Today's Change: ${todayDisplay.text}`}
              className="focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-md p-1"
            >
              <dt className="text-sm font-medium text-muted">
                Today&apos;s Change
              </dt>
              <dd className="mt-1">
                <span
                  className={`text-xl font-semibold tabular-nums ${
                    todayDisplay.signal === "up"
                      ? "text-gain gain-text"
                      : todayDisplay.signal === "down"
                        ? "text-loss loss-text"
                        : "text-primary"
                  }`}
                >
                  <span aria-label={todayDisplay.arrowLabel} role="img">
                    {todayDisplay.arrow}
                  </span>{" "}
                  {todayDisplay.text}
                </span>
              </dd>
            </div>

            {/* All-time TWR */}
            <div
              tabIndex={0}
              role="group"
              aria-label={`All-time Return, Time-Weighted: ${formatSignedPercent(twrPercent)}`}
              className="focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-md p-1"
            >
              <dt className="text-sm font-medium text-muted">
                All-time Return{" "}
                <abbr
                  title="Time-Weighted Return: measures portfolio performance independent of cash flows"
                  className="no-underline cursor-help"
                >
                  (TWR)
                </abbr>
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold tabular-nums ${
                    twrPercent >= 0
                      ? "bg-green-50 text-gain"
                      : "bg-red-50 text-loss"
                  }`}
                >
                  {formatSignedPercent(twrPercent)}
                </span>
                <span className="block text-xs text-muted mt-1">
                  Goal: {portfolioSummary.goalLabel} |{" "}
                  {portfolioSummary.benchmarkLabel}:{" "}
                  {formatSignedPercent(portfolioSummary.benchmarkReturn)}
                </span>
              </dd>
            </div>

            {/* Your Return MWR */}
            <div
              tabIndex={0}
              role="group"
              aria-label={`Your Return, Money-Weighted: ${formatSignedPercent(mwrPercent)}`}
              className="focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-md p-1"
            >
              <dt className="text-sm font-medium text-muted">
                Your Return{" "}
                <abbr
                  title="Money-Weighted Return: measures your personal return including timing of deposits and withdrawals"
                  className="no-underline cursor-help"
                >
                  (MWR)
                </abbr>
              </dt>
              <dd className="mt-1">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold tabular-nums ${
                    mwrPercent >= 0
                      ? "bg-green-50 text-gain"
                      : "bg-red-50 text-loss"
                  }`}
                >
                  {formatSignedPercent(mwrPercent)}
                </span>
                <span className="block text-xs text-muted mt-1">
                  Difference from TWR reflects your deposit/withdrawal timing
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ─── Section 2b: Portfolio Performance Chart ─── */}
      <section aria-labelledby="portfolio-chart-heading" className="mb-6">
        <h2
          id="portfolio-chart-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Portfolio Performance
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-4">
          <ChartWrapper
            data={holdings[0].priceHistory}
            title={`Portfolio ${portfolioSummary.totalGainLossPercent >= 0 ? "up" : "down"} ${Math.abs(portfolioSummary.totalGainLossPercent).toFixed(1)}% overall`}
            defaultTimeframe="1M"
            size="md"
            showAICard={false}
          />
        </div>
      </section>

      {/* ─── Section 3: Goal Progress ─── */}
      <section aria-labelledby="goal-progress-heading" className="mb-6">
        <h2
          id="goal-progress-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Goal Progress
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <div
            tabIndex={0}
            role="group"
            aria-label={`Goal status: ${goalStatusLabels[currentGoalStatus]}`}
            className="flex items-center gap-3 mb-4 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-md p-1"
          >
            <span
              className={`text-sm font-bold ${goalStatusColors[currentGoalStatus]}`}
            >
              {goalStatusLabels[currentGoalStatus]}
            </span>
            <span className="text-sm text-secondary">
              {currentGoalStatus === "on-track"
                ? `You are exceeding your ${portfolioSummary.goalLabel} target with ${formatSignedPercent(portfolioSummary.totalGainLossPercent)} return.`
                : currentGoalStatus === "behind"
                  ? `Your return of ${formatSignedPercent(portfolioSummary.totalGainLossPercent)} is slightly behind your ${portfolioSummary.goalLabel} target.`
                  : `Your return of ${formatSignedPercent(portfolioSummary.totalGainLossPercent)} needs attention to meet your ${portfolioSummary.goalLabel} target.`}
            </span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted mb-1">
              <span>0%</span>
              <span>
                Goal: {portfolioSummary.annualGoal}% annual
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={portfolioSummary.totalGainLossPercent}
              aria-valuemin={0}
              aria-valuemax={portfolioSummary.annualGoal}
              aria-label={`Goal progress: ${formatPercent(portfolioSummary.totalGainLossPercent)} of ${portfolioSummary.annualGoal}% target`}
              className="w-full h-4 bg-surface-sunken rounded-full overflow-hidden"
            >
              <div
                className="h-full bg-action-primary rounded-full transition-all"
                style={{ width: `${Math.min(goalProgress, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted mt-1">
              {formatPercent(portfolioSummary.totalGainLossPercent)} achieved of{" "}
              {portfolioSummary.annualGoal}% annual goal ({goalProgress}%
              complete)
            </p>
          </div>

          {/* Milestone strip per § 6.1 */}
          {!milestoneDismissed && (() => {
            let milestoneMessage: string | null = null;
            if (goalProgress >= 100) {
              milestoneMessage = "You did it. What's next?";
            } else if (goalProgress >= 75) {
              milestoneMessage = `75% there. ${formatPercent(portfolioSummary.annualGoal - portfolioSummary.totalGainLossPercent)}% to go.`;
            } else if (goalProgress >= 50) {
              milestoneMessage = "You hit 50% of your goal.";
            } else if (goalProgress >= 25) {
              milestoneMessage = "You're 25% to your goal.";
            }

            if (!milestoneMessage) return null;

            return (
              <div
                className="mb-4 p-3 bg-surface-sunken rounded-md flex items-center justify-between"
                role="status"
              >
                <p className="text-sm font-medium text-primary">
                  {milestoneMessage}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMilestoneDismissed(true);
                    announce("Milestone message dismissed", "polite");
                  }}
                  aria-label="Dismiss milestone message"
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface-base focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 flex-shrink-0 ml-2"
                >
                  <span aria-hidden="true">&#10005;</span>
                </button>
              </div>
            );
          })()}

          {/* Lever cards for off-track — three actionable options per § 3.5 */}
          {currentGoalStatus !== "on-track" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <button
                  type="button"
                  className="border border-border-default rounded-md p-3 text-left hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px] w-full"
                  onClick={() => {
                    setLeverConfirm("recurring");
                    setCurrentGoalStatus("on-track");
                    announce("Recurring $45 per month set up for House goal. You're now on track.", "assertive");
                  }}
                >
                  <h3 className="text-sm font-semibold text-primary">
                    Add $45/mo
                  </h3>
                  <p className="text-xs text-gain font-medium mt-1">
                    &rarr; On track
                  </p>
                </button>
                {leverConfirm === "recurring" && (
                  <p className="text-xs text-gain font-medium mt-2 p-2 bg-green-50 rounded" role="status">
                    Recurring $45/month set up for House goal. You&apos;re now on track.
                  </p>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="border border-border-default rounded-md p-3 text-left hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px] w-full"
                  onClick={() => {
                    setLeverConfirm("extend");
                    setCurrentGoalStatus("on-track");
                    announce("Timeline extended by 7 months for House goal. You're now on track.", "assertive");
                  }}
                >
                  <h3 className="text-sm font-semibold text-primary">
                    Extend by 7 months
                  </h3>
                  <p className="text-xs text-gain font-medium mt-1">
                    &rarr; On track
                  </p>
                </button>
                {leverConfirm === "extend" && (
                  <p className="text-xs text-gain font-medium mt-2 p-2 bg-green-50 rounded" role="status">
                    Timeline extended by 7 months. You&apos;re now on track.
                  </p>
                )}
              </div>
              <div>
                <button
                  type="button"
                  className="border border-border-default rounded-md p-3 text-left hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px] w-full"
                  onClick={() => {
                    announce("Navigating to trade flow for a one-time $1,200 VTI purchase.", "assertive");
                    router.push("/orders?ticker=VTI&amount=1200");
                  }}
                >
                  <h3 className="text-sm font-semibold text-primary">
                    One-time $1,200
                  </h3>
                  <p className="text-xs text-gain font-medium mt-1">
                    &rarr; On track
                  </p>
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Section 4: Asset Allocation ─── */}
      <section aria-labelledby="allocation-heading" className="mb-6">
        <h2
          id="allocation-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Asset Allocation
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donut chart — tabIndex so screen readers can Tab to it; aria-label provides summary */}
            <div
              tabIndex={0}
              role="img"
              aria-label={`Donut chart showing portfolio allocation across ${sectorAllocation.length} sectors. Largest sector: ${sectorAllocation[0].sector} at ${sectorAllocation[0].percent.toFixed(1)}%. Total value: ${formatCurrency(portfolioSummary.totalValue)}. See allocation table for full details.`}
              className="flex items-center justify-center focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded-md"
            >
              {(() => {
                const colors = ['#2563EB', '#047857', '#B91C1C', '#B45309', '#71717A', '#1E40AF'];
                let cumulative = 0;
                const gradientStops = sectorAllocation.map((s, i) => {
                  const start = cumulative;
                  cumulative += s.percent;
                  return `${colors[i % colors.length]} ${start}% ${cumulative}%`;
                }).join(', ');
                return (
                  <div
                    className="w-48 h-48 rounded-full relative"
                    style={{ background: `conic-gradient(${gradientStops})` }}
                  >
                    <div className="absolute inset-6 rounded-full bg-surface-raised flex items-center justify-center">
                      <div className="text-center">
                        <span className="text-lg font-bold tabular-nums">{formatCurrency(portfolioSummary.totalValue)}</span>
                        <span className="block text-xs text-muted">{sectorAllocation.length} sectors</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Accessible allocation table — tabIndex={0} so Tab can land on it */}
            <table className="w-full text-sm" tabIndex={0} aria-label="Portfolio allocation by sector, showing value and percentage of total portfolio">
              <caption className="text-left text-sm font-medium text-muted mb-2">
                Portfolio allocation by sector, showing value and percentage of
                total portfolio
              </caption>
              <thead>
                <tr className="border-b border-border-default">
                  <th
                    scope="col"
                    className="text-left py-2 font-semibold text-primary"
                  >
                    Sector
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 font-semibold text-primary"
                  >
                    Value
                  </th>
                  <th
                    scope="col"
                    className="text-right py-2 font-semibold text-primary"
                  >
                    Weight
                  </th>
                </tr>
              </thead>
              <tbody>
                {sectorAllocation.map((s) => (
                  <tr
                    key={s.sector}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="py-2 text-primary">{s.sector}</td>
                    <td className="py-2 text-right tabular-nums text-primary">
                      {formatCurrency(s.value)}
                    </td>
                    <td className="py-2 text-right tabular-nums text-primary">
                      {s.percent.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Diversification indicator — tabIndex so Tab stops here */}
          <div
            tabIndex={0}
            role="group"
            aria-label={`Diversification: ${isDiversified ? "Well Diversified" : "Concentration Risk"}`}
            className="mt-4 p-3 rounded-md bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            <p className="text-sm text-secondary">
              <span
                className={`font-semibold ${isDiversified ? "text-gain" : "text-feedback-warning"}`}
              >
                {isDiversified ? "Well Diversified" : "Concentration Risk"}
              </span>
              {" \u2014 "}
              {isDiversified
                ? `No single sector exceeds 40% of your portfolio. Your largest allocation is ${sectorAllocation[0].sector} at ${sectorAllocation[0].percent.toFixed(1)}%.`
                : `${sectorAllocation[0].sector} represents ${sectorAllocation[0].percent.toFixed(1)}% of your portfolio. Consider diversifying to reduce concentration risk.`}
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section 5: Holdings Table ─── */}
      <section aria-labelledby="holdings-heading" className="mb-6">
        <h2
          id="holdings-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Holdings
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left text-sm font-medium text-muted p-4 pb-2">
              Your investment holdings with current values, gains and losses,
              and total returns. Click or press Enter on a row to see details.
            </caption>
            <thead>
              <tr className="border-b border-border-default">
                <th scope="col" className="text-left p-3 w-8">
                  <span className="sr-only">Expand</span>
                </th>
                <th scope="col" className="text-left p-3">
                  <SortButton label="Symbol" columnKey="symbol" />
                </th>
                <th scope="col" className="text-right p-3">
                  Shares
                </th>
                <th scope="col" className="text-right p-3">
                  Price
                </th>
                <th scope="col" className="text-right p-3">
                  <SortButton label="Market Value" columnKey="marketValue" />
                </th>
                <th scope="col" className="text-right p-3">
                  <SortButton label="Gain/Loss" columnKey="gainLossDollar" />
                </th>
                <th scope="col" className="text-right p-3">
                  <SortButton
                    label="Total Return"
                    columnKey="totalReturnPercent"
                  />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h) => {
                const display = getGainLossDisplay(
                  h.gainLossDollar,
                  h.gainLossPercent
                );
                const isExpanded = expandedRows.has(h.symbol);
                return (
                  <React.Fragment key={h.symbol}>
                    <tr
                      className="border-b border-border-default hover:bg-surface-sunken cursor-pointer"
                      tabIndex={0}
                      role="row"
                      aria-expanded={isExpanded}
                      onClick={() => toggleRow(h.symbol)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRow(h.symbol);
                        }
                      }}
                    >
                      <td className="p-3">
                        <span aria-hidden="true">
                          {isExpanded ? "\u25BC" : "\u25B6"}
                        </span>
                        <span className="sr-only">
                          {isExpanded
                            ? `Collapse ${h.symbol} details`
                            : `Expand ${h.symbol} details`}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-primary">
                        <div>{h.symbol}</div>
                        <div className="text-xs text-muted font-normal">
                          {h.name}
                        </div>
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatShares(h.shares)}
                      </td>
                      <td className="p-3 text-right tabular-nums">
                        {formatCurrency(h.currentPrice)}
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium">
                        {formatCurrency(h.marketValue)}
                      </td>
                      <td
                        className={`p-3 text-right tabular-nums ${
                          display.signal === "up"
                            ? "text-gain gain-text"
                            : display.signal === "down"
                              ? "text-loss loss-text"
                              : "text-primary"
                        }`}
                      >
                        <span aria-label={display.arrowLabel} role="img">
                          {display.arrow}
                        </span>{" "}
                        {formatSignedCurrency(h.gainLossDollar)}
                      </td>
                      <td
                        className={`p-3 text-right tabular-nums ${
                          h.totalReturnPercent >= 0
                            ? "text-gain gain-text"
                            : "text-loss loss-text"
                        }`}
                      >
                        {formatSignedPercent(h.totalReturnPercent)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-sunken">
                        <td colSpan={7} className="p-4" id={`expansion-${h.symbol}`} tabIndex={-1}>
                          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <dt className="text-muted font-medium">
                                Cost Basis
                              </dt>
                              <dd className="tabular-nums text-primary">
                                {formatCurrency(h.costBasis)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                Avg Cost
                              </dt>
                              <dd className="tabular-nums text-primary">
                                {formatCurrency(h.averageCost)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                Sector
                              </dt>
                              <dd className="text-primary">{h.sector}</dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                Analyst Target
                              </dt>
                              <dd className="tabular-nums text-primary">
                                {h.analystTargetPrice
                                  ? formatCurrency(h.analystTargetPrice)
                                  : "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                <abbr title="Price-to-Earnings Ratio">P/E</abbr> Ratio
                              </dt>
                              <dd className="tabular-nums text-primary">
                                {h.peRatio ?? "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                Dividend Yield
                              </dt>
                              <dd className="tabular-nums text-primary">
                                {h.dividendYield
                                  ? `${h.dividendYield.toFixed(2)}%`
                                  : "N/A"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                Prev Close
                              </dt>
                              <dd className="tabular-nums text-primary">
                                {formatCurrency(h.previousClose)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-muted font-medium">
                                Goal Context
                              </dt>
                              <dd className="text-primary text-xs">
                                {h.totalReturnPercent >=
                                portfolioSummary.annualGoal
                                  ? `Beating your ${portfolioSummary.goalLabel}`
                                  : `Below your ${portfolioSummary.goalLabel}`}
                              </dd>
                            </div>
                          </dl>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── Section 6: AI Copilot Insight ─── */}
      <section aria-labelledby="ai-insight-heading" className="mb-6">
        <h2
          id="ai-insight-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          AI Copilot Insight
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span
              className="inline-block px-1.5 py-0.5 text-xs font-medium bg-feedback-info text-inverse rounded flex-shrink-0 mt-1"
              aria-label="AI generated content"
            >
              AI
            </span>
            <div className="flex-1">
              <p className="text-sm text-primary">
                Your portfolio is well-diversified across {sectorAllocation.length}{" "}
                sectors. Your overall return of{" "}
                {formatSignedPercent(portfolioSummary.totalGainLossPercent)} is{" "}
                {portfolioSummary.totalGainLossPercent >=
                portfolioSummary.annualGoal
                  ? "exceeding"
                  : "trailing"}{" "}
                your {portfolioSummary.goalLabel}, while the{" "}
                {portfolioSummary.benchmarkLabel} returned{" "}
                {formatSignedPercent(portfolioSummary.benchmarkReturn)}. Your
                bond allocation (BND) has a small loss, which is typical in a
                rising-rate environment. Consider whether this aligns with your
                risk tolerance.
              </p>
              <div className="mt-3 flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-gain font-medium">
                  <span aria-hidden="true">&#9679;</span> Confidence: High
                </span>
                <span className="text-muted">
                  Sources: Portfolio data, Market indices
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 7: News Feed ─── */}
      <section aria-labelledby="news-heading" className="mb-6">
        <h2
          id="news-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          News Feed
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg">
          {/* Tabs */}
          <div
            role="tablist"
            aria-label="News categories"
            className="flex border-b border-border-default px-4"
          >
            {newsTabs.map((tab, idx) => (
              <button
                key={tab}
                role="tab"
                id={`news-tab-${tab}`}
                aria-selected={activeNewsTab === tab}
                aria-controls={`news-panel-${tab}`}
                tabIndex={activeNewsTab === tab ? 0 : -1}
                onClick={() => handleNewsTabChange(tab)}
                onKeyDown={(e) => {
                  const currentIdx = newsTabs.indexOf(tab);
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    const nextIdx = (currentIdx + 1) % newsTabs.length;
                    const nextTab = newsTabs[nextIdx];
                    const tabButton = document.getElementById(`news-tab-${nextTab}`);
                    tabButton?.focus();
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    const prevIdx =
                      (currentIdx - 1 + newsTabs.length) % newsTabs.length;
                    const prevTab = newsTabs[prevIdx];
                    const tabButton = document.getElementById(`news-tab-${prevTab}`);
                    tabButton?.focus();
                  }
                }}
                className={`min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium border-b-2 transition-colors focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
                  activeNewsTab === tab
                    ? "border-action-primary text-action-primary"
                    : "border-transparent text-muted hover:text-primary hover:border-border-strong"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab panels */}
          {newsTabs.map((tab) => (
            <div
              key={tab}
              role="tabpanel"
              id={`news-panel-${tab}`}
              ref={activeNewsTab === tab ? newsPanelRef : undefined}
              aria-labelledby={`news-tab-${tab}`}
              tabIndex={0}
              hidden={activeNewsTab !== tab}
              className="p-4 focus:outline-none"
            >
              {newsItems.filter((n) => n.tab === tab).length === 0 ? (
                <p className="text-sm text-muted py-4">
                  No {tab.toLowerCase()} news available right now.
                </p>
              ) : (
                <div className="space-y-4">
                  {newsItems
                    .filter((n) => n.tab === tab)
                    .map((item) => (
                      <article
                        key={item.id}
                        className="border-b border-border-default last:border-0 pb-4 last:pb-0"
                      >
                        <h3 className="text-sm font-semibold text-primary">
                          {item.title}
                        </h3>
                        <p className="text-xs text-muted mt-1">
                          {item.source} &middot; {formatDate(item.date)}
                        </p>
                        <div className="mt-2 p-2 rounded bg-surface-sunken">
                          <p className="text-xs text-secondary">
                            <span
                              className="inline-block px-1 py-0.5 text-[10px] font-medium bg-feedback-info text-inverse rounded mr-1"
                              aria-label="AI generated summary"
                            >
                              AI Summary
                            </span>
                            {item.aiSummary}
                          </p>
                        </div>
                      </article>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 8: AI Insights ─── */}
      <section aria-labelledby="ai-insights-heading" className="mb-6">
        <h2
          id="ai-insights-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          AI Insights
        </h2>
        <div className="space-y-4">
          {/* Insight card 1: What changed since last login */}
          {!dismissedInsights.has(0) && fixturesById["dashboard.sinceLastLogin"] && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDismissedInsights((prev) => new Set(prev).add(0));
                  announce("What changed insight dismissed", "polite");
                }}
                aria-label="Dismiss what changed insight"
                className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">&#10005;</span>
              </button>
              <AIResponse response={fixturesById["dashboard.sinceLastLogin"]} />
            </div>
          )}

          {/* Insight card 2: Diversification analysis */}
          {!dismissedInsights.has(1) && fixturesById["diversification.status"] && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDismissedInsights((prev) => new Set(prev).add(1));
                  announce("Diversification insight dismissed", "polite");
                }}
                aria-label="Dismiss diversification insight"
                className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">&#10005;</span>
              </button>
              <AIResponse response={fixturesById["diversification.status"]} />
            </div>
          )}

          {/* Insight card 3: Goal progress */}
          {!dismissedInsights.has(2) && fixturesById["goal.projectedPace"] && (
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setDismissedInsights((prev) => new Set(prev).add(2));
                  announce("Goal progress insight dismissed", "polite");
                }}
                aria-label="Dismiss goal progress insight"
                className="absolute top-2 right-2 z-10 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                <span aria-hidden="true">&#10005;</span>
              </button>
              <AIResponse response={fixturesById["goal.projectedPace"]} />
            </div>
          )}
        </div>

        {/* Ask Accrue anything input */}
        <div className="mt-4">
          <label
            htmlFor="ai-insights-query"
            className="sr-only"
          >
            Ask Accrue anything
          </label>
          <div className="flex gap-2">
            <input
              id="ai-insights-query"
              type="text"
              value={insightQuery}
              onChange={(e) => setInsightQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && insightQuery.trim()) {
                  window.dispatchEvent(
                    new CustomEvent("accrue-copilot-query", {
                      detail: insightQuery.trim(),
                    })
                  );
                  setInsightQuery("");
                  announce("Query sent to AI Copilot", "polite");
                }
              }}
              placeholder="Ask Accrue anything..."
              className="flex-1 min-h-[44px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary text-sm focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            />
            <button
              type="button"
              onClick={() => {
                if (insightQuery.trim()) {
                  window.dispatchEvent(
                    new CustomEvent("accrue-copilot-query", {
                      detail: insightQuery.trim(),
                    })
                  );
                  setInsightQuery("");
                  announce("Query sent to AI Copilot", "polite");
                }
              }}
              className="min-w-[44px] min-h-[44px] px-4 py-2 rounded-md bg-action-primary text-inverse font-medium text-sm hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Ask
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
