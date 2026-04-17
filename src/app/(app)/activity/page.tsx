"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { transactions, tradeEntries, holdings } from "@/data/mockPortfolio";
import type { TradeEntry, Transaction as TransactionType } from "@/data/mockPortfolio";
import { formatDate, formatCurrency } from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";
import { fixturesById } from "@/data/copilotFixtures";
import AIResponse from "@/components/copilot/AIResponse";

/* ─── Unified activity item types ─── */

interface ActivityItem {
  id: string;
  date: string;
  type: "buy" | "sell" | "dividend" | "ai-insight";
  symbol: string;
  title: string;
  subtitle: string;
  amount?: number;
  tradeEntry?: TradeEntry;
  transaction?: TransactionType;
  fixtureId?: string;
}

/* ─── Filter types ─── */
type FilterChip = "all" | "filled" | "pending" | "wins" | "losses" | "dividends";

const FILTER_CHIPS: { value: FilterChip; label: string }[] = [
  { value: "all", label: "All" },
  { value: "filled", label: "Filled" },
  { value: "pending", label: "Pending" },
  { value: "wins", label: "Wins" },
  { value: "losses", label: "Losses" },
  { value: "dividends", label: "Dividends" },
];

/* ─── Tab types ─── */
type ActiveTab = "timeline" | "table" | "patterns";

/* ─── Accent color mapping ─── */
const accentColors: Record<ActivityItem["type"], string> = {
  buy: "border-l-gain",
  sell: "border-l-loss",
  dividend: "border-l-[var(--color-teal-500)]",
  "ai-insight": "border-l-[var(--color-accent)]",
};

/* ─── Build unified activity items from data ─── */
function buildActivityItems(): ActivityItem[] {
  const items: ActivityItem[] = [];

  /* Transactions -> activity items */
  for (const tx of transactions) {
    const tradeEntry = tradeEntries.find((te) => te.tradeId === tx.id);
    const holding = holdings.find((h) => h.symbol === tx.symbol);
    const currentPrice = holding?.currentPrice ?? tx.price;
    const gainPct = ((currentPrice - tx.price) / tx.price) * 100;

    items.push({
      id: tx.id,
      date: tx.date,
      type: tx.type,
      symbol: tx.symbol,
      title: `${tx.type === "buy" ? "Bought" : "Sold"} ${tx.shares} shares of ${tx.symbol}`,
      subtitle: `${formatCurrency(tx.price)}/share. Total: ${formatCurrency(tx.total)}. ${
        tx.type === "buy" ? `Now ${gainPct >= 0 ? "+" : ""}${gainPct.toFixed(1)}%` : ""
      }`,
      amount: tx.total,
      tradeEntry,
      transaction: tx,
      fixtureId: tradeEntry?.action === "Sell" ? "analyze.trade.sell1" : "analyze.trade.buy1",
    });
  }

  /* Sell trades from tradeEntries that are not in transactions */
  for (const te of tradeEntries) {
    if (te.action === "Sell" && !transactions.find((tx) => tx.id === te.tradeId)) {
      items.push({
        id: te.id,
        date: te.timestamp.split("T")[0],
        type: "sell",
        symbol: te.symbol,
        title: `Sold ${te.symbol}`,
        subtitle: te.outcomeNotes || te.thesis,
        tradeEntry: te,
        fixtureId: "analyze.trade.sell1",
      });
    }
  }

  /* Mock dividend entries */
  items.push({
    id: "div-001",
    date: "2026-04-01",
    type: "dividend",
    symbol: "AAPL",
    title: "Dividend received from AAPL",
    subtitle: "$0.25/share x 50 shares = $12.50. Reinvested automatically.",
    amount: 12.50,
  });

  items.push({
    id: "div-002",
    date: "2026-03-15",
    type: "dividend",
    symbol: "MSFT",
    title: "Dividend received from MSFT",
    subtitle: "$0.75/share x 40 shares = $30.00. Reinvested automatically.",
    amount: 30.00,
  });

  /* Mock AI insight */
  items.push({
    id: "ai-001",
    date: "2026-04-12",
    type: "ai-insight",
    symbol: "Portfolio",
    title: "AI Insight: Portfolio concentration alert",
    subtitle: "Your Technology sector allocation reached 68.4%, exceeding the recommended 40% threshold.",
    fixtureId: "risk.concentration",
  });

  /* Sort newest first */
  items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return items;
}

/* ─── Activity Card Component ─── */
function ActivityCard({ item }: { item: ActivityItem }) {
  const [expanded, setExpanded] = useState(false);
  const cardId = `activity-card-${item.id}`;
  const detailsId = `activity-details-${item.id}`;

  const accent = accentColors[item.type];
  const dateFormatted = formatDate(item.date);

  const toggleExpanded = () => {
    setExpanded((prev) => {
      const next = !prev;
      announce(
        next
          ? `${item.title} details expanded`
          : `${item.title} details collapsed`,
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

  /* AI analysis fixture */
  const aiResponse = item.fixtureId ? fixturesById[item.fixtureId] : undefined;

  return (
    <li className="list-none">
      <article
        id={cardId}
        className={`bg-surface-raised border border-border-default rounded-lg border-l-4 ${accent}`}
        /* a11y: aria-label provides full card context for screen readers */
        aria-label={`${item.title}, ${dateFormatted}. ${item.subtitle}`}
      >
        {/* Card header -- always visible */}
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={toggleExpanded}
          className="p-4 cursor-pointer min-h-[80px] flex flex-col justify-between w-full text-left focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded"
        >
          <div>
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-xs font-bold ${
                  item.type === "buy"
                    ? "bg-gain-bg text-gain"
                    : item.type === "sell"
                      ? "bg-loss-bg text-loss"
                      : item.type === "dividend"
                        ? "bg-[var(--color-teal-50)] text-[var(--color-teal-500)]"
                        : "bg-accent-bg text-accent"
                }`}
                /* a11y: aria-hidden because the title text already conveys the type */
                aria-hidden="true"
              >
                {item.type === "buy" ? "Buy" : item.type === "sell" ? "Sell" : item.type === "dividend" ? "Dividend" : "AI"}
              </span>
              <h3 className="text-sm font-semibold text-primary">
                {item.title}
              </h3>
              <span className="text-xs text-muted ml-auto">{dateFormatted}</span>
            </div>

            {/* Subtitle */}
            <p className="mt-1 text-sm text-secondary">
              {item.subtitle}
            </p>
          </div>

          {/* Expand indicator */}
          <div className="flex items-center justify-end mt-2">
            <span className="text-xs text-muted" aria-hidden="true">
              {expanded ? "Collapse" : "Expand"} {expanded ? "\u25B2" : "\u25BC"}
            </span>
          </div>
        </button>

        {/* Expanded details */}
        {expanded && (
          <div
            id={detailsId}
            className="border-t border-border-default p-4 space-y-4"
            role="region"
            /* a11y: aria-label for screen readers navigating to the expanded region */
            aria-label={`Details for ${item.title}`}
          >
            {/* Trade entry details (no thesis field -- AI analyzes from data alone per Section 9) */}
            {item.tradeEntry && (
              <div className="space-y-3">
                {item.tradeEntry.catalyst && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary">Catalyst</h4>
                    <p className="text-sm text-secondary mt-1">{item.tradeEntry.catalyst}</p>
                  </div>
                )}
                {item.tradeEntry.outcomeNotes && (
                  <div>
                    <h4 className="text-sm font-semibold text-primary">Outcome</h4>
                    <p className="text-sm text-secondary mt-1">{item.tradeEntry.outcomeNotes}</p>
                  </div>
                )}

                {/* AI Analysis from tradeEntry */}
                {item.tradeEntry.aiAnalysis && (
                  <div className="bg-surface-sunken rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted uppercase tracking-wide">
                        AI Analysis
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-action-primary text-inverse">
                        AI
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.tradeEntry.aiAnalysis.thesisOutcome === "played_out"
                            ? "bg-gain-bg text-gain"
                            : item.tradeEntry.aiAnalysis.thesisOutcome === "failed"
                              ? "bg-loss-bg text-loss"
                              : item.tradeEntry.aiAnalysis.thesisOutcome === "mixed"
                                ? "bg-[var(--color-feedback-warning)]/15 text-feedback-warning"
                                : "bg-surface-overlay text-muted"
                        }`}
                      >
                        {item.tradeEntry.aiAnalysis.thesisOutcome.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div>
                      <h5 className="text-sm font-semibold text-primary">What happened</h5>
                      <p className="text-sm text-secondary mt-1">{item.tradeEntry.aiAnalysis.summary}</p>
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-primary">Lesson</h5>
                      <p className="text-sm text-secondary mt-1">{item.tradeEntry.aiAnalysis.lesson}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span>Luck vs. Skill: {item.tradeEntry.aiAnalysis.luckVsSkill.replace(/_/g, " ")}</span>
                      <span>--</span>
                      <span>Confidence: {item.tradeEntry.aiAnalysis.confidence}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* AI fixture response */}
            {aiResponse && !item.tradeEntry?.aiAnalysis && (
              <AIResponse response={aiResponse} />
            )}

            {/* Research link */}
            {item.symbol !== "Portfolio" && (
              <div>
                <Link
                  href={`/research/${item.symbol}`}
                  className="inline-flex items-center min-h-[44px] px-3 py-2 rounded-md text-sm font-medium text-action-primary hover:underline focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                >
                  View {item.symbol} research
                </Link>
              </div>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

/* ─── Transaction table sort types ─── */
type TableSortKey = "date" | "symbol" | "type" | "shares" | "price" | "total" | "status";
type TableSortDir = "ascending" | "descending" | "none";

/* ─── Activity Page ─── */
export default function ActivityPage() {
  const [activeFilter, setActiveFilter] = useState<FilterChip>("all");
  const [activeTab, setActiveTab] = useState<ActiveTab>("timeline");
  const [tableSortKey, setTableSortKey] = useState<TableSortKey>("date");
  const [tableSortDir, setTableSortDir] = useState<TableSortDir>("descending");
  const [sortAnnouncement, setSortAnnouncement] = useState("");

  const allItems = useMemo(() => buildActivityItems(), []);

  const filteredItems = useMemo(() => {
    switch (activeFilter) {
      case "filled":
        return allItems.filter(
          (item) => (item.type === "buy" || item.type === "sell") && item.transaction?.status === "completed"
        );
      case "pending":
        return allItems.filter(
          (item) => item.transaction?.status === "pending"
        );
      case "wins":
        return allItems.filter(
          (item) => item.tradeEntry?.aiAnalysis?.thesisOutcome === "played_out"
        );
      case "losses":
        return allItems.filter(
          (item) => item.tradeEntry?.aiAnalysis?.thesisOutcome === "failed"
        );
      case "dividends":
        return allItems.filter((item) => item.type === "dividend");
      default:
        return allItems;
    }
  }, [activeFilter, allItems]);

  /* Sorted transactions for the table view */
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions];
    if (tableSortDir === "none") return sorted;
    sorted.sort((a, b) => {
      let cmp = 0;
      switch (tableSortKey) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "symbol":
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case "type":
          cmp = a.type.localeCompare(b.type);
          break;
        case "shares":
          cmp = a.shares - b.shares;
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "total":
          cmp = a.total - b.total;
          break;
        case "status":
          cmp = a.status.localeCompare(b.status);
          break;
      }
      return tableSortDir === "ascending" ? cmp : -cmp;
    });
    return sorted;
  }, [tableSortKey, tableSortDir]);

  const handleTableSort = (key: TableSortKey) => {
    let nextDir: TableSortDir;
    if (tableSortKey === key) {
      nextDir = tableSortDir === "ascending" ? "descending" : "ascending";
    } else {
      nextDir = "descending";
    }
    setTableSortKey(key);
    setTableSortDir(nextDir);
    setSortAnnouncement(`Sorted by ${key}, ${nextDir}`);
  };

  const handleCsvDownload = () => {
    const header = "Date,Symbol,Action,Quantity,Price,Total,Status";
    const rows = sortedTransactions.map(
      (tx) =>
        `${tx.date},${tx.symbol},${tx.type === "buy" ? "Buy" : "Sell"},${tx.shares},${tx.price},${tx.total},${tx.status}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transaction-history.csv";
    a.click();
    URL.revokeObjectURL(url);
    announce("Transaction history CSV downloaded", "polite");
  };

  const handleFilterChange = (filter: FilterChip) => {
    setActiveFilter(filter);
    const chipLabel = FILTER_CHIPS.find((c) => c.value === filter)?.label ?? filter;
    announce(
      `Filter changed to ${chipLabel}. Showing ${filteredItems.length} items.`,
      "polite"
    );
  };

  /* Patterns fixture from copilotFixtures */
  const patternsResponse = fixturesById["lessons.across.trades"];

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-2">Activity</h1>
      <p className="text-sm text-secondary mb-6">
        Unified timeline of trades, dividends, and AI insights.
      </p>

      {/* ─── Tab switcher: Timeline / Patterns ─── */}
      <div
        role="tablist"
        aria-label="Activity view"
        className="flex gap-1 rounded-lg bg-surface-sunken p-1 w-fit mb-6"
      >
        {([
          { key: "timeline" as const, label: "Timeline" },
          { key: "table" as const, label: "Table" },
          { key: "patterns" as const, label: "Patterns" },
        ]).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              /* a11y: aria-selected indicates which tab is currently active */
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setActiveTab(tab.key);
                announce(`${tab.label} tab selected`, "polite");
              }}
              className={[
                "min-h-[44px] min-w-[44px] px-4 py-2",
                "rounded-md text-sm font-medium",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                isActive
                  ? "bg-surface-raised text-primary shadow-sm"
                  : "text-muted hover:text-secondary",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── Timeline Tab ─── */}
      {activeTab === "timeline" && (
        <>
          {/* Filter chips */}
          <section aria-labelledby="activity-filter-heading" className="mb-6">
            <h2 id="activity-filter-heading" className="sr-only">
              Filter activity
            </h2>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-labelledby="activity-filter-heading"
            >
              {FILTER_CHIPS.map((chip) => {
                const isActive = activeFilter === chip.value;
                return (
                  <button
                    key={chip.value}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => handleFilterChange(chip.value)}
                    className={`min-h-[44px] min-w-[44px] px-4 py-2 rounded-full text-sm font-medium focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
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

          {/* Live region for filter count */}
          <div aria-live="polite" className="sr-only">
            Showing {filteredItems.length} of {allItems.length} activity items
          </div>

          {/* Activity timeline */}
          <section aria-labelledby="activity-timeline-heading">
            <h2 id="activity-timeline-heading" className="sr-only">
              Activity timeline
            </h2>

            {filteredItems.length === 0 ? (
              <div className="bg-surface-raised border border-border-default rounded-lg p-8 text-center">
                <p className="text-secondary">
                  No activity matches the current filter.
                </p>
              </div>
            ) : (
              <ol
                className="space-y-3"
                /* a11y: Semantic ordered list for screen readers -- each item is a list item */
                aria-label="Activity timeline, newest first"
              >
                {filteredItems.map((item) => (
                  <ActivityCard key={item.id} item={item} />
                ))}
              </ol>
            )}
          </section>
        </>
      )}

      {/* ─── Table Tab: Transaction History ─── */}
      {activeTab === "table" && (
        <section aria-labelledby="activity-table-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="activity-table-heading" className="text-lg font-semibold text-primary">
              Transaction History
            </h2>
            <button
              type="button"
              onClick={handleCsvDownload}
              className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-md text-sm font-medium border border-border-default text-secondary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Download CSV
            </button>
          </div>

          {/* a11y: live region for sort announcements */}
          <div role="status" className="sr-only" aria-live="polite">
            {sortAnnouncement}
          </div>

          <div className="bg-surface-raised border border-border-default rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="text-left text-sm font-medium text-muted p-4 pb-2">
                All transactions showing date, symbol, action, quantity, price per share, total cost, and status. Click column headers to sort.
              </caption>
              <thead>
                <tr className="border-b border-border-default">
                  {([
                    { key: "date" as const, label: "Date" },
                    { key: "symbol" as const, label: "Symbol" },
                    { key: "type" as const, label: "Action" },
                    { key: "shares" as const, label: "Quantity" },
                    { key: "price" as const, label: "Price" },
                    { key: "total" as const, label: "Total" },
                    { key: "status" as const, label: "Status" },
                  ]).map((col) => (
                    <th key={col.key} scope="col" className="text-left p-3">
                      <button
                        type="button"
                        onClick={() => handleTableSort(col.key)}
                        aria-sort={tableSortKey === col.key ? tableSortDir : undefined}
                        className="inline-flex items-center gap-1 min-h-[44px] font-semibold text-primary text-left focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                      >
                        {col.label}
                        {tableSortKey === col.key && (
                          <span aria-hidden="true">
                            {tableSortDir === "ascending" ? " \u25B2" : " \u25BC"}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-border-default last:border-0"
                  >
                    <td className="p-3 tabular-nums">
                      <time dateTime={tx.date}>{formatDate(tx.date)}</time>
                    </td>
                    <td className="p-3 font-medium text-primary">{tx.symbol}</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          tx.type === "buy"
                            ? "bg-gain-bg text-gain"
                            : "bg-loss-bg text-loss"
                        }`}
                      >
                        {tx.type === "buy" ? "Buy" : "Sell"}
                      </span>
                    </td>
                    <td className="p-3 text-right tabular-nums">{tx.shares}</td>
                    <td className="p-3 text-right tabular-nums">
                      {formatCurrency(tx.price)}
                    </td>
                    <td className="p-3 text-right tabular-nums font-medium">
                      {formatCurrency(tx.total)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          tx.status === "completed"
                            ? "bg-gain-bg text-gain"
                            : tx.status === "pending"
                              ? "bg-[var(--color-feedback-warning)]/15 text-feedback-warning"
                              : "bg-surface-sunken text-muted"
                        }`}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── Patterns Tab ─── */}
      {activeTab === "patterns" && (
        <section aria-labelledby="patterns-heading">
          <h2 id="patterns-heading" className="text-lg font-semibold text-primary mb-4">
            AI-Identified Cross-Trade Patterns
          </h2>
          <p className="text-sm text-secondary mb-4">
            The AI copilot analyzes your trade history to identify recurring patterns, strengths, and areas for improvement.
          </p>
          {patternsResponse ? (
            <AIResponse response={patternsResponse} />
          ) : (
            <div className="bg-surface-raised border border-border-default rounded-lg p-6">
              <p className="text-secondary text-sm">
                Not enough trade history to identify patterns yet. Complete more trades to see AI-generated insights.
              </p>
            </div>
          )}
        </section>
      )}
    </>
  );
}
