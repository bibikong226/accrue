"use client";

import React, { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { holdings, portfolioSummary } from "@/data/mockPortfolio";
import {
  formatCurrency,
  formatSignedCurrency,
  formatSignedPercent,
  formatPercent,
  formatCompactCurrency,
  formatDate,
  getGainLossDisplay,
} from "@/lib/format";
import { glossaryByKey as glossary } from "@/data/glossary";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Sub-nav tabs ─── */
const TABS = ["Overview", "Fundamentals", "Analysts", "Earnings", "News"] as const;
type Tab = (typeof TABS)[number];

/* ─── Mock analyst data ─── */
interface AnalystData {
  buy: number;
  hold: number;
  sell: number;
  targetLow: number;
  targetMean: number;
  targetHigh: number;
}

function getAnalystData(currentPrice: number): AnalystData {
  return {
    buy: 18,
    hold: 15,
    sell: 7,
    targetLow: Math.round(currentPrice * 0.85 * 100) / 100,
    targetMean: Math.round(currentPrice * 1.1 * 100) / 100,
    targetHigh: Math.round(currentPrice * 1.35 * 100) / 100,
  };
}

/* ─── Mock earnings data ─── */
interface EarningsQuarter {
  quarter: string;
  reportDate: string;
  epsEstimate: number;
  epsActual: number;
  beat: boolean;
  surprise: number;
}

function getEarningsData(): EarningsQuarter[] {
  return [
    {
      quarter: "Q1 2026",
      reportDate: "2026-01-28",
      epsEstimate: 2.35,
      epsActual: 2.42,
      beat: true,
      surprise: 2.98,
    },
    {
      quarter: "Q4 2025",
      reportDate: "2025-10-30",
      epsEstimate: 2.18,
      epsActual: 2.25,
      beat: true,
      surprise: 3.21,
    },
    {
      quarter: "Q3 2025",
      reportDate: "2025-07-29",
      epsEstimate: 1.98,
      epsActual: 1.92,
      beat: false,
      surprise: -3.03,
    },
    {
      quarter: "Q2 2025",
      reportDate: "2025-04-28",
      epsEstimate: 2.09,
      epsActual: 2.15,
      beat: true,
      surprise: 2.87,
    },
  ];
}

/* ─── Mock news ─── */
interface ResearchNewsItem {
  id: string;
  title: string;
  source: string;
  date: string;
  aiSummary: string;
}

function getNewsData(symbol: string): ResearchNewsItem[] {
  return [
    {
      id: "rn1",
      title: `${symbol} Quarterly Results Exceed Expectations`,
      source: "Reuters",
      date: "2026-04-14",
      aiSummary: `${symbol} reported revenue and earnings above analyst consensus estimates. Management raised full-year guidance, citing strong demand across all segments.`,
    },
    {
      id: "rn2",
      title: `Analyst Upgrades ${symbol} to Overweight`,
      source: "Barron's",
      date: "2026-04-12",
      aiSummary: `Morgan Stanley upgraded ${symbol} citing improved margin outlook and growing market share. The new price target represents approximately 15% upside from current levels.`,
    },
    {
      id: "rn3",
      title: `${symbol} Announces New Product Line`,
      source: "Bloomberg",
      date: "2026-04-10",
      aiSummary: `${symbol} announced expansion into adjacent markets with a new product line expected to contribute to revenue in the second half of 2026. Analysts are cautiously optimistic about the growth potential.`,
    },
  ];
}

/* ─── Glossary Term Component ─── */
function GlossaryTerm({
  termKey,
  children,
}: {
  termKey: string;
  children: React.ReactNode;
}) {
  const entry = glossary[termKey];
  if (!entry) return <>{children}</>;

  return (
    <abbr
      title={entry.definition}
      className="no-underline border-b border-dashed border-muted cursor-help"
    >
      {children}
    </abbr>
  );
}

/* ─── Chart time ranges ─── */
const TIME_RANGES = ["1W", "1M", "3M", "6M", "1Y", "ALL"] as const;

export default function ResearchDetailPage() {
  const params = useParams();
  const ticker = (params.ticker as string).toUpperCase();
  const holding = holdings.find((h) => h.symbol === ticker);

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [selectedRange, setSelectedRange] = useState<string>("1Y");
  const panelRef = useRef<HTMLDivElement>(null);

  if (!holding) {
    return (
      <>
        <h1 className="text-2xl font-bold text-primary mb-4">
          Research: {ticker}
        </h1>
        <p className="text-secondary">
          Ticker &quot;{ticker}&quot; was not found in your holdings. Please{" "}
          <Link
            href="/research"
            className="text-action-primary underline focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            return to Research
          </Link>
          .
        </p>
      </>
    );
  }

  const display = getGainLossDisplay(holding.gainLossDollar, holding.gainLossPercent);
  const todayChange = holding.currentPrice - holding.previousClose;
  const todayChangePercent = (todayChange / holding.previousClose) * 100;
  const todayDisplay = getGainLossDisplay(todayChange, todayChangePercent);
  const analystData = getAnalystData(holding.currentPrice);
  const earningsData = getEarningsData();
  const newsData = getNewsData(ticker);
  const totalAnalysts = analystData.buy + analystData.hold + analystData.sell;
  const beatCount = earningsData.filter((e) => e.beat).length;

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    announce(`${tab} tab selected`, "polite");
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-2">
        {holding.name} ({ticker})
      </h1>

      {/* ─── Price Display ─── */}
      <section aria-labelledby="price-heading" className="mb-6">
        <h2 id="price-heading" className="sr-only">
          Current Price and Actions
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <dl className="flex flex-wrap gap-6">
              <div>
                <dt className="text-sm text-muted font-medium">
                  Current Price
                </dt>
                <dd className="text-3xl font-bold tabular-nums text-primary">
                  {formatCurrency(holding.currentPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted font-medium">
                  Today&apos;s Change
                </dt>
                <dd
                  className={`text-lg font-semibold tabular-nums ${
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
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted font-medium">
                  Your Total Return
                </dt>
                <dd
                  className={`text-lg font-semibold tabular-nums ${
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
                  {display.text}
                </dd>
                <span className="text-xs text-muted block mt-0.5">
                  Goal: {portfolioSummary.goalLabel} |{" "}
                  {portfolioSummary.benchmarkLabel}:{" "}
                  {formatSignedPercent(portfolioSummary.benchmarkReturn)}
                </span>
              </div>
            </dl>
            <div className="flex gap-2">
              <Link
                href={`/orders?symbol=${ticker}&action=buy`}
                className="inline-flex items-center min-h-[44px] min-w-[44px] px-6 py-2 rounded-md bg-action-primary text-inverse font-medium hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
              >
                Buy {ticker}
              </Link>
              <button
                className="inline-flex items-center min-h-[44px] min-w-[44px] px-6 py-2 rounded-md border border-border-default text-secondary font-medium hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                onClick={() =>
                  announce(`${ticker} added to watchlist`, "polite")
                }
              >
                Watchlist
              </button>
            </div>
          </div>
          <div className="mt-3">
            <Link
              href={`/dashboard`}
              className="text-sm text-action-primary underline focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Compare with my portfolio
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Chart Section ─── */}
      <section aria-labelledby="chart-heading" className="mb-6">
        <h2 id="chart-heading" className="text-lg font-semibold text-primary mb-3">
          Price Chart
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-4">
          {/* Time range selectors */}
          <div className="flex gap-1 mb-4" role="group" aria-label="Chart time range">
            {TIME_RANGES.map((range) => (
              <button
                key={range}
                onClick={() => {
                  setSelectedRange(range);
                  announce(`Chart range changed to ${range}`, "polite");
                }}
                aria-pressed={selectedRange === range}
                className={`min-h-[44px] min-w-[44px] px-3 py-2 text-sm font-medium rounded-md focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
                  selectedRange === range
                    ? "bg-action-primary text-inverse"
                    : "text-muted hover:bg-surface-sunken hover:text-primary"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Chart placeholder with accessible data table */}
          <div
            aria-hidden="true"
            className="h-48 bg-surface-sunken rounded-md flex items-center justify-center text-muted text-sm"
          >
            Chart: {ticker} price over {selectedRange} (visual placeholder
            &mdash; see data table below)
          </div>
          <p className="text-xs text-muted mt-2">
            Price data for {ticker} over the last {selectedRange}.{" "}
            {holding.currentPrice > holding.averageCost
              ? `Currently trading above your average cost of ${formatCurrency(holding.averageCost)}.`
              : `Currently trading below your average cost of ${formatCurrency(holding.averageCost)}.`}
          </p>
        </div>
      </section>

      {/* ─── Sticky Sub-nav Tabs ─── */}
      <div
        role="tablist"
        aria-label={`${ticker} research sections`}
        className="sticky top-0 bg-surface-base border-b border-border-default flex gap-0 mb-6 z-10"
      >
        {TABS.map((tab) => (
          <button
            key={tab}
            role="tab"
            id={`research-tab-${tab}`}
            aria-selected={activeTab === tab}
            aria-controls={`research-panel-${tab}`}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => handleTabChange(tab)}
            onKeyDown={(e) => {
              const idx = TABS.indexOf(activeTab);
              if (e.key === "ArrowRight") {
                e.preventDefault();
                handleTabChange(TABS[(idx + 1) % TABS.length]);
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                handleTabChange(TABS[(idx - 1 + TABS.length) % TABS.length]);
              }
            }}
            className={`min-h-[44px] min-w-[44px] px-4 py-2 text-sm font-medium border-b-2 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
              activeTab === tab
                ? "border-action-primary text-action-primary"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ─── Tab Panels ─── */}

      {/* Overview */}
      <div
        role="tabpanel"
        id="research-panel-Overview"
        aria-labelledby="research-tab-Overview"
        ref={activeTab === "Overview" ? panelRef : undefined}
        tabIndex={0}
        hidden={activeTab !== "Overview"}
        className="focus:outline-none"
      >
        <section aria-labelledby="overview-heading" className="mb-6">
          <h2
            id="overview-heading"
            className="text-lg font-semibold text-primary mb-3"
          >
            Overview
          </h2>
          <div className="bg-surface-raised border border-border-default rounded-lg p-6">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm text-muted">Shares Owned</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {holding.shares}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Market Value</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(holding.marketValue)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Cost Basis</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(holding.costBasis)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Avg Cost Per Share</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(holding.averageCost)}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* Fundamentals */}
      <div
        role="tabpanel"
        id="research-panel-Fundamentals"
        aria-labelledby="research-tab-Fundamentals"
        ref={activeTab === "Fundamentals" ? panelRef : undefined}
        tabIndex={0}
        hidden={activeTab !== "Fundamentals"}
        className="focus:outline-none"
      >
        <section aria-labelledby="fundamentals-heading" className="mb-6">
          <h2
            id="fundamentals-heading"
            className="text-lg font-semibold text-primary mb-3"
          >
            Fundamentals
          </h2>
          <div className="bg-surface-raised border border-border-default rounded-lg p-6">
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div>
                <dt className="text-sm text-muted">
                  <GlossaryTerm termKey="pe-ratio">P/E Ratio</GlossaryTerm>
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {holding.peRatio ?? "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">
                  <GlossaryTerm termKey="dividend">Dividend Yield</GlossaryTerm>
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {holding.dividendYield
                    ? `${holding.dividendYield.toFixed(2)}%`
                    : "N/A"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">
                  <GlossaryTerm termKey="market-cap">Market Cap</GlossaryTerm>
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCompactCurrency(holding.currentPrice * 1000000000)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Sector</dt>
                <dd className="text-lg font-semibold text-primary">
                  {holding.sector}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">52-Week High</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(holding.currentPrice * 1.15)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">52-Week Low</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(holding.currentPrice * 0.78)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">
                  <GlossaryTerm termKey="volatility">Beta</GlossaryTerm>
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  1.12
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">
                  <GlossaryTerm termKey="expense-ratio">
                    Expense Ratio
                  </GlossaryTerm>
                </dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {holding.sector === "Broad Market" ||
                  holding.sector === "International" ||
                  holding.sector === "Fixed Income" ||
                  holding.sector === "Dividend"
                    ? "0.03%"
                    : "N/A"}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </div>

      {/* Analysts */}
      <div
        role="tabpanel"
        id="research-panel-Analysts"
        aria-labelledby="research-tab-Analysts"
        ref={activeTab === "Analysts" ? panelRef : undefined}
        tabIndex={0}
        hidden={activeTab !== "Analysts"}
        className="focus:outline-none"
      >
        <section aria-labelledby="analysts-heading" className="mb-6">
          <h2
            id="analysts-heading"
            className="text-lg font-semibold text-primary mb-3"
          >
            Analyst Ratings
          </h2>
          <div className="bg-surface-raised border border-border-default rounded-lg p-6">
            {/* Horizontal bar */}
            <div className="mb-4">
              <p className="text-sm font-medium text-primary mb-2">
                Consensus: Buy {analystData.buy} of {totalAnalysts} analysts
              </p>
              <div
                className="flex h-8 rounded-md overflow-hidden"
                role="img"
                aria-label={`Analyst ratings: ${analystData.buy} buy, ${analystData.hold} hold, ${analystData.sell} sell out of ${totalAnalysts} total`}
              >
                <div
                  className="bg-gain flex items-center justify-center text-xs font-bold text-inverse"
                  style={{
                    width: `${(analystData.buy / totalAnalysts) * 100}%`,
                  }}
                >
                  Buy: {analystData.buy}
                </div>
                <div
                  className="bg-feedback-warning flex items-center justify-center text-xs font-bold text-primary"
                  style={{
                    width: `${(analystData.hold / totalAnalysts) * 100}%`,
                  }}
                >
                  Hold: {analystData.hold}
                </div>
                <div
                  className="bg-loss flex items-center justify-center text-xs font-bold text-inverse"
                  style={{
                    width: `${(analystData.sell / totalAnalysts) * 100}%`,
                  }}
                >
                  Sell: {analystData.sell}
                </div>
              </div>
            </div>

            {/* Price targets */}
            <dl className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <dt className="text-sm text-muted">Low Target</dt>
                <dd className="text-lg font-semibold tabular-nums text-loss">
                  {formatCurrency(analystData.targetLow)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">Mean Target</dt>
                <dd className="text-lg font-semibold tabular-nums text-primary">
                  {formatCurrency(analystData.targetMean)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted">High Target</dt>
                <dd className="text-lg font-semibold tabular-nums text-gain">
                  {formatCurrency(analystData.targetHigh)}
                </dd>
              </div>
            </dl>

            {/* Disclaimer */}
            <p className="text-xs text-muted p-3 bg-surface-sunken rounded-md">
              Analysts are often wrong. Price targets are estimates based on
              models and assumptions that may not materialize. Use analyst
              ratings as one of many inputs, not as a recommendation to buy or
              sell. Past accuracy of analyst estimates is not a reliable
              predictor of future accuracy.
            </p>
          </div>
        </section>
      </div>

      {/* Earnings */}
      <div
        role="tabpanel"
        id="research-panel-Earnings"
        aria-labelledby="research-tab-Earnings"
        ref={activeTab === "Earnings" ? panelRef : undefined}
        tabIndex={0}
        hidden={activeTab !== "Earnings"}
        className="focus:outline-none"
      >
        <section aria-labelledby="earnings-heading" className="mb-6">
          <h2
            id="earnings-heading"
            className="text-lg font-semibold text-primary mb-3"
          >
            Earnings History
          </h2>
          <div className="bg-surface-raised border border-border-default rounded-lg p-6">
            <p className="text-sm font-medium text-primary mb-4">
              Beat {beatCount} of {earningsData.length} quarters
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="text-left text-sm text-muted mb-2">
                  Quarterly earnings results showing <abbr title="Earnings Per Share">EPS</abbr> estimates versus actual
                  results
                </caption>
                <thead>
                  <tr className="border-b border-border-default">
                    <th
                      scope="col"
                      className="text-left py-2 pr-4 font-semibold text-primary"
                    >
                      Quarter
                    </th>
                    <th
                      scope="col"
                      className="text-left py-2 pr-4 font-semibold text-primary"
                    >
                      Report Date
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 pr-4 font-semibold text-primary"
                    >
                      <abbr title="Earnings Per Share">EPS</abbr> Estimate
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 pr-4 font-semibold text-primary"
                    >
                      <abbr title="Earnings Per Share">EPS</abbr> Actual
                    </th>
                    <th
                      scope="col"
                      className="text-right py-2 pr-4 font-semibold text-primary"
                    >
                      Surprise
                    </th>
                    <th
                      scope="col"
                      className="text-center py-2 font-semibold text-primary"
                    >
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {earningsData.map((q) => (
                    <tr
                      key={q.quarter}
                      className="border-b border-border-default last:border-0"
                    >
                      <td className="py-2 pr-4 text-primary">{q.quarter}</td>
                      <td className="py-2 pr-4 text-muted">
                        {formatDate(q.reportDate)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-primary">
                        ${q.epsEstimate.toFixed(2)}
                      </td>
                      <td className="py-2 pr-4 text-right tabular-nums text-primary">
                        ${q.epsActual.toFixed(2)}
                      </td>
                      <td
                        className={`py-2 pr-4 text-right tabular-nums ${
                          q.surprise >= 0
                            ? "text-gain gain-text"
                            : "text-loss loss-text"
                        }`}
                      >
                        <span
                          aria-label={q.surprise >= 0 ? "gain" : "loss"}
                          role="img"
                        >
                          {q.surprise >= 0 ? "\u25B2" : "\u25BC"}
                        </span>{" "}
                        {q.surprise >= 0 ? "+" : ""}
                        {q.surprise.toFixed(2)}%
                      </td>
                      <td className="py-2 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            q.beat
                              ? "bg-green-50 text-gain"
                              : "bg-red-50 text-loss"
                          }`}
                        >
                          {q.beat ? "Beat" : "Miss"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* News */}
      <div
        role="tabpanel"
        id="research-panel-News"
        aria-labelledby="research-tab-News"
        ref={activeTab === "News" ? panelRef : undefined}
        tabIndex={0}
        hidden={activeTab !== "News"}
        className="focus:outline-none"
      >
        <section aria-labelledby="research-news-heading" className="mb-6">
          <h2
            id="research-news-heading"
            className="text-lg font-semibold text-primary mb-3"
          >
            News for {ticker}
          </h2>
          <div className="space-y-4">
            {newsData.map((item) => (
              <article
                key={item.id}
                className="bg-surface-raised border border-border-default rounded-lg p-4"
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
        </section>
      </div>

      {/* ─── Inline AI Response ─── */}
      <section aria-labelledby="ai-research-heading" className="mb-6">
        <h2
          id="ai-research-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          AI Analysis
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
                {ticker} has returned{" "}
                {formatSignedPercent(holding.totalReturnPercent)} since your
                purchase at {formatCurrency(holding.averageCost)} per share.{" "}
                {holding.totalReturnPercent >= portfolioSummary.annualGoal
                  ? `This exceeds your ${portfolioSummary.goalLabel}.`
                  : `This trails your ${portfolioSummary.goalLabel}.`}{" "}
                The {portfolioSummary.benchmarkLabel} returned{" "}
                {formatSignedPercent(portfolioSummary.benchmarkReturn)} over the
                same period.{" "}
                {holding.analystTargetPrice
                  ? `Analysts' mean price target of ${formatCurrency(analystData.targetMean)} implies ${((analystData.targetMean / holding.currentPrice - 1) * 100).toFixed(1)}% potential upside, though analyst forecasts are frequently inaccurate.`
                  : "No analyst price target is available for this security."}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-ai-confidence-medium font-medium">
                  <span aria-hidden="true">&#9679;</span> Confidence: Moderate
                </span>
                <span className="text-muted">
                  Sources: Accrue portfolio data; S&P Global Market Intelligence
                  (Apr 2026); Morningstar Analyst Ratings (Apr 2026)
                </span>
              </div>
              <div className="mt-2">
                <Link
                  href="/help"
                  className="text-xs text-action-primary underline focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                >
                  Verify in Research &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
