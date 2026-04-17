"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { mockPortfolio, researchData } from "@/data/mockPortfolio";
import { formatCurrency, formatSignedCurrency, formatSignedPercent, formatNumber } from "@/lib/format";
import { GlossaryTerm } from "@/components/ui/GlossaryTerm";
import { AIResponse } from "@/components/copilot/AIResponse";
import { announce } from "@/lib/a11y/useAnnouncer";

const RESEARCH_TABS = ["Overview", "Fundamentals", "Analysts", "Earnings", "News"] as const;
type ResearchTab = (typeof RESEARCH_TABS)[number];

/**
 * Company detail/research page per § 5.2.
 * Single scroll with sticky sub-nav using role="tablist".
 */
export default function ResearchTickerPage() {
  const params = useParams();
  const ticker = (params.ticker as string)?.toUpperCase();
  const stock = researchData.find((r) => r.symbol === ticker);
  const holding = mockPortfolio.holdings.find((h) => h.symbol === ticker);

  const [activeTab, setActiveTab] = useState<ResearchTab>("Overview");

  const handleTabChange = useCallback((tab: ResearchTab) => {
    setActiveTab(tab);
    announce(`${tab} section selected`, "polite");
  }, []);

  if (!stock) {
    return (
      <>
        <h1 className="text-2xl font-semibold text-primary">Stock not found</h1>
        <p className="text-secondary mt-2">
          No data available for &quot;{ticker}&quot;.{" "}
          <Link href="/research" className="text-action-primary underline">
            Back to Research
          </Link>
        </p>
      </>
    );
  }

  const isUp = stock.todayChangeDollars >= 0;
  const totalAnalysts = stock.analystRatings.total;
  const priceTargetDiff = (
    ((stock.analystRatings.priceTarget.mean - stock.currentPrice) / stock.currentPrice) * 100
  ).toFixed(0);
  const beatCount = stock.earningsHistory.filter((e) => e.surprisePercent > 1).length;

  // Generate chart data from chartData30d
  const chartData = stock.chartData30d.map((price, i) => ({
    date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split("T")[0],
    value: price,
  }));
  const minPrice = Math.min(...stock.chartData30d);
  const maxPrice = Math.max(...stock.chartData30d);
  const firstP = stock.chartData30d[0] ?? stock.currentPrice;
  const chartChange = stock.currentPrice - firstP;
  const chartChangePct = firstP > 0 ? ((chartChange / firstP) * 100).toFixed(1) : "0.0";

  return (
    <>
      <title>{`${stock.name} (${stock.symbol}) — Research — Accrue`}</title>

      {/* Above the fold: ticker, price, actions */}
      <div className="mb-6">
        <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
          {stock.symbol}
        </p>
        <h1 className="text-2xl font-semibold text-primary">{stock.name}</h1>

        <div className="flex items-baseline gap-4 mt-2">
          <span className="text-[40px] font-mono tabular-nums font-medium text-primary leading-tight">
            {formatCurrency(stock.currentPrice)}
          </span>
          <span
            data-signal={isUp ? "gain" : "loss"}
            className={`text-base font-mono tabular-nums ${isUp ? "text-gain" : "text-loss"}`}
          >
            {/* a11y: Arrow with aria-label so screen readers announce direction */}
            <span aria-label={isUp ? "up" : "down"} role="img">{isUp ? "\u2191" : "\u2193"}</span>{" "}
            {formatSignedCurrency(stock.todayChangeDollars)} ({formatSignedPercent(stock.todayChangePercent)})
          </span>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href={`/orders?ticker=${stock.symbol}&action=buy`}
            className="inline-flex items-center px-6 py-3 rounded-full bg-gain text-inverse text-[15px] font-semibold hover:bg-[#267040] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[48px]"
          >
            Buy {stock.symbol}
          </Link>
          <button
            type="button"
            className="inline-flex items-center px-6 py-3 rounded-full border-[1.5px] border-border-default text-secondary text-[15px] font-medium hover:bg-surface-overlay focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[48px]"
          >
            Add to Watchlist
          </button>
        </div>

        {/* "Compare with my portfolio" CTA per § 2.7 — persistent on every ticker research page.
            Converts the research page from a dead-end into a decision-support tool. */}
        {holding && (
          <div className="mt-4 rounded-xl border border-border-default bg-surface-raised p-4">
            <h2 className="text-sm font-semibold text-primary mb-2">Compare with my portfolio</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted">Your position</dt>
                <dd className="font-medium text-primary">{holding.shares} shares ({holding.portfolioWeight}%)</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Sector overlap</dt>
                <dd className="font-medium text-primary">{holding.sector}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">If you add 2% more</dt>
                <dd className="font-medium text-primary">
                  {holding.sector} goes {holding.portfolioWeight}% → {(holding.portfolioWeight + 2).toFixed(1)}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Goal impact</dt>
                <dd className="font-medium text-gain">Still on track</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Compact chart */}
      <section
        aria-label={`${stock.symbol} stock price, last 30 days, line chart. Price ranged from ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}.`}
        className="rounded-xl border border-border-default bg-surface-raised p-4 mb-6"
      >
        <h2 className="text-base font-semibold text-primary mb-2">
          {stock.symbol} {chartChange >= 0 ? "rose" : "fell"} {chartChangePct}% over 30 days
        </h2>
        {/* Simple SVG chart */}
        <div className="w-full h-32" aria-hidden="true">
          <svg viewBox={`0 0 300 120`} className="w-full h-full" preserveAspectRatio="none">
            <polyline
              points={stock.chartData30d
                .map((p, i) => {
                  const x = (i / (stock.chartData30d.length - 1)) * 300;
                  const y = 110 - ((p - minPrice) / (maxPrice - minPrice || 1)) * 100;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke={chartChange >= 0 ? "var(--color-gain)" : "var(--color-loss)"}
              strokeWidth="2"
            />
          </svg>
        </div>
        <p className="text-xs text-muted mt-2">
          30-day range: {formatCurrency(minPrice)} – {formatCurrency(maxPrice)}. Current: {formatCurrency(stock.currentPrice)}.
        </p>
        <details className="mt-2">
          <summary className="text-xs font-medium text-action-primary cursor-pointer min-h-[44px] flex items-center">
            View data table ({stock.chartData30d.length} points)
          </summary>
          <div className="mt-2 max-h-40 overflow-y-auto">
            <table className="w-full text-xs">
              {/* a11y: caption describes the chart data table */}
              <caption className="sr-only">
                {stock.symbol} daily closing prices over the last 30 days
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left px-2 py-1 text-secondary uppercase">Date</th>
                  <th scope="col" className="text-right px-2 py-1 text-secondary uppercase">Closing Price</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((d, i) => (
                  <tr key={i} className="border-t border-border-default">
                    <td className="px-2 py-1">{d.date}</td>
                    <td className="px-2 py-1 text-right font-mono tabular-nums">{formatCurrency(d.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      {/* Sticky sub-nav */}
      <nav className="sticky top-16 z-30 bg-surface-base border-b border-border-default -mx-4 px-4">
        <div role="tablist" aria-label="Research sections" className="flex gap-1 py-2">
          {RESEARCH_TABS.map((tab) => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring ${
                activeTab === tab
                  ? "bg-surface-overlay text-primary"
                  : "text-secondary hover:text-primary hover:bg-surface-overlay/50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      <div className="mt-6">
        {/* Overview */}
        {activeTab === "Overview" && (
          <section aria-label="Overview">
            <h2 className="text-lg font-semibold text-primary mb-3">Overview</h2>
            {holding ? (
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-muted uppercase tracking-wider">Your Position</dt>
                  <dd className="text-sm font-medium text-primary mt-0.5">
                    {holding.shares} shares · {formatCurrency(holding.marketValue)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted uppercase tracking-wider">Average Cost</dt>
                  <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-0.5">
                    {formatCurrency(holding.avgCost)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted uppercase tracking-wider">Portfolio Weight</dt>
                  <dd className="text-sm font-medium text-primary mt-0.5">{holding.portfolioWeight}%</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted uppercase tracking-wider">Sector</dt>
                  <dd className="text-sm font-medium text-primary mt-0.5">{holding.sector}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted">You don&apos;t own this stock yet.</p>
            )}

            <div className="mt-6">
              <AIResponse
                response={{
                  id: `research-${stock.symbol}`,
                  content: holding
                    ? `You own ${holding.shares} shares of ${stock.name} worth ${formatCurrency(holding.marketValue)}, representing ${holding.portfolioWeight}% of your portfolio. ${totalAnalysts > 0 ? `${stock.analystRatings.buy} of ${totalAnalysts} analysts rate it Buy, with a mean price target of ${formatCurrency(stock.analystRatings.priceTarget.mean)}.` : ""} ${beatCount > 0 ? `The stock beat estimates in ${beatCount} of ${stock.earningsHistory.length} recent quarters.` : ""}`
                    : `${stock.name} is trading at ${formatCurrency(stock.currentPrice)}. ${totalAnalysts > 0 ? `${stock.analystRatings.buy} of ${totalAnalysts} analysts rate it Buy.` : ""}`,
                  confidence: "high",
                  sources: [
                    {
                      id: "src-analyst-behavior",
                      title: "All that glitters: The effect of attention and news on the buying behavior of individual and institutional investors",
                      publisher: "Review of Financial Studies, 21(2), 785\u2013818. Barber, B. M., & Odean, T.",
                      lastUpdated: "2008",
                    },
                  ],
                  type: "proactive",
                }}
              />
            </div>
          </section>
        )}

        {/* Fundamentals */}
        {activeTab === "Fundamentals" && (
          <section aria-label="Fundamentals">
            <h2 className="text-lg font-semibold text-primary mb-3">Fundamentals</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-surface-sunken">
                <dt className="text-xs text-muted"><GlossaryTerm term="Market cap">Market Cap</GlossaryTerm></dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">
                  {stock.marketCap >= 1e12 ? `$${(stock.marketCap / 1e12).toFixed(2)}T` : `$${(stock.marketCap / 1e9).toFixed(0)}B`}
                </dd>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <dt className="text-xs text-muted"><GlossaryTerm term="P/E ratio"><abbr title="Price-to-Earnings Ratio">P/E</abbr></GlossaryTerm></dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">{stock.peRatio ?? "N/A"}</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <dt className="text-xs text-muted"><GlossaryTerm term="Dividend yield">Dividend Yield</GlossaryTerm></dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">{(stock.dividendYield * 100).toFixed(2)}%</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <dt className="text-xs text-muted"><GlossaryTerm term="EPS"><abbr title="Earnings Per Share">EPS</abbr> TTM</GlossaryTerm></dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">{stock.epsTTM != null ? `$${stock.epsTTM.toFixed(2)}` : "N/A"}</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <dt className="text-xs text-muted"><GlossaryTerm term="Beta">Beta</GlossaryTerm></dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">{stock.beta.toFixed(2)}</dd>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken">
                <dt className="text-xs text-muted">Revenue Growth Year over Year</dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">
                  {stock.revenueGrowthYoY != null ? `${(stock.revenueGrowthYoY * 100).toFixed(1)}%` : "N/A"}
                </dd>
              </div>
              <div className="p-3 rounded-lg bg-surface-sunken col-span-2">
                <dt className="text-xs text-muted"><GlossaryTerm term="52-week range">52-Week Range</GlossaryTerm></dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary mt-1">
                  {formatCurrency(stock.fiftyTwoWeekLow)} — {formatCurrency(stock.fiftyTwoWeekHigh)}
                </dd>
              </div>
            </dl>
          </section>
        )}

        {/* Analysts */}
        {activeTab === "Analysts" && (
          <section aria-label="Analyst Ratings">
            <h2 className="text-lg font-semibold text-primary mb-3">Analyst Ratings</h2>
            <div className="mb-4">
              {/* a11y: Visual bar with adjacent text description */}
              <div
                role="img"
                aria-label={`Analyst ratings: ${stock.analystRatings.buy} Buy, ${stock.analystRatings.hold} Hold, ${stock.analystRatings.sell} Sell out of ${totalAnalysts} total analysts`}
                className="flex h-8 rounded-full overflow-hidden"
              >
                {stock.analystRatings.buy > 0 && (
                  <div className="bg-gain flex items-center justify-center text-xs font-medium text-inverse" style={{ width: `${(stock.analystRatings.buy / totalAnalysts) * 100}%` }}>
                    Buy: {stock.analystRatings.buy}
                  </div>
                )}
                {stock.analystRatings.hold > 0 && (
                  <div className="bg-feedback-warning flex items-center justify-center text-xs font-medium text-inverse" style={{ width: `${(stock.analystRatings.hold / totalAnalysts) * 100}%` }}>
                    Hold: {stock.analystRatings.hold}
                  </div>
                )}
                {stock.analystRatings.sell > 0 && (
                  <div className="bg-loss flex items-center justify-center text-xs font-medium text-inverse" style={{ width: `${(stock.analystRatings.sell / totalAnalysts) * 100}%` }}>
                    Sell: {stock.analystRatings.sell}
                  </div>
                )}
              </div>
              {/* a11y: Text alternative for the analyst bar chart */}
              <p className="text-sm text-secondary mt-2">
                Buy: {stock.analystRatings.buy} of {totalAnalysts} analysts · Hold: {stock.analystRatings.hold} of {totalAnalysts} · Sell: {stock.analystRatings.sell} of {totalAnalysts}
              </p>
            </div>
            <dl className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <dt className="text-xs text-muted">Low Price Target</dt>
                <dd className="text-lg font-mono tabular-nums font-medium text-primary">{formatCurrency(stock.analystRatings.priceTarget.low)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Mean Price Target</dt>
                <dd className="text-lg font-mono tabular-nums font-medium text-primary">{formatCurrency(stock.analystRatings.priceTarget.mean)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">High Price Target</dt>
                <dd className="text-lg font-mono tabular-nums font-medium text-primary">{formatCurrency(stock.analystRatings.priceTarget.high)}</dd>
              </div>
            </dl>
            <p className="text-sm text-secondary" style={{ fontFamily: "var(--font-serif)" }}>
              {totalAnalysts} Wall Street analysts cover this stock. Their average 12-month price target is {formatCurrency(stock.analystRatings.priceTarget.mean)} — {priceTargetDiff}% above today&apos;s price. Analysts are often wrong.
            </p>
          </section>
        )}

        {/* Earnings */}
        {activeTab === "Earnings" && (
          <section aria-label="Earnings History">
            <h2 className="text-lg font-semibold text-primary mb-3">Earnings History</h2>
            {stock.earningsHistory.length > 0 ? (
              <>
                <p className="text-sm font-medium text-primary mb-4">Beat estimates {beatCount} of {stock.earningsHistory.length} quarters.</p>
                <table className="w-full text-sm">
                  {/* a11y: caption describes the earnings table */}
                  <caption className="sr-only">
                    Quarterly earnings history for {stock.symbol} showing actual earnings per share versus analyst estimates and the surprise percentage
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col" className="text-left px-3 py-2 text-xs font-medium text-secondary uppercase">Quarter</th>
                      <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-secondary uppercase">Actual <abbr title="Earnings Per Share">EPS</abbr></th>
                      <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-secondary uppercase">Estimated <abbr title="Earnings Per Share">EPS</abbr></th>
                      <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-secondary uppercase">Earnings Surprise</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stock.earningsHistory.map((e) => {
                      const beat = e.surprisePercent > 1;
                      const miss = e.surprisePercent < -1;
                      return (
                        <tr key={e.quarter} className="border-t border-border-default">
                          <td className="px-3 py-3 text-primary">{e.quarter}</td>
                          <td className="px-3 py-3 text-right font-mono tabular-nums">${e.actual.toFixed(2)}</td>
                          <td className="px-3 py-3 text-right font-mono tabular-nums text-muted">${e.estimate.toFixed(2)}</td>
                          <td className={`px-3 py-3 text-right font-mono tabular-nums ${beat ? "text-gain" : miss ? "text-loss" : "text-muted"}`}>
                            {/* a11y: Direction arrow with aria-label + explicit +/- sign */}
                            <span aria-label={beat ? "beat estimate" : miss ? "missed estimate" : "in line with estimate"} role="img">{beat ? "\u2191" : miss ? "\u2193" : "\u2192"}</span>{" "}
                            {e.surprisePercent > 0 ? "+" : ""}{e.surprisePercent.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-sm text-muted">No earnings history available for this stock.</p>
            )}
          </section>
        )}

        {/* News */}
        {activeTab === "News" && (
          <section aria-label="Related News">
            <h2 className="text-lg font-semibold text-primary mb-3">News</h2>
            {stock.news.length > 0 ? (
              <ul className="space-y-4" role="list">
                {stock.news.map((item, i) => (
                  <li key={i}>
                    <article className="border-b border-border-default pb-4">
                      <h3 className="text-sm font-medium text-primary">{item.headline}</h3>
                      <p className="text-xs text-muted mt-0.5">{item.publisher} · {item.timestamp.split("T")[0]}</p>
                      {/* a11y: AI summary clearly labeled for screen readers */}
                      <p className="text-sm text-secondary mt-1 italic">
                        <span className="sr-only">AI-generated summary: </span>
                        {item.aiSummary}
                      </p>
                    </article>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No recent news for this stock.</p>
            )}
          </section>
        )}
      </div>
    </>
  );
}
