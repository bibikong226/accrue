"use client";

import React, { useState, useCallback, useId } from "react";
import type { Holding } from "@/data/mockPortfolio";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Types ─── */

type SortColumn =
  | "symbol"
  | "shares"
  | "avgCost"
  | "currentPrice"
  | "marketValue"
  | "gainLoss"
  | "gainLossPercent";

type SortDirection = "ascending" | "descending" | "none";

interface HoldingsTableProps {
  holdings: Holding[];
}

/* ─── Helpers ─── */

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPercent(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatSignedCurrency(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatCurrency(value)}`;
}

/**
 * HoldingsTable — the portfolio holdings data table.
 *
 * Accessibility contract (CLAUDE.md A1):
 * - Real <table> with <caption class="sr-only"> for screen reader context
 * - <thead> with <th scope="col"> for every column
 * - Sortable headers: <button> inside <th> with aria-sort on active column only
 * - Sort changes announced via role="status" aria-live="polite"
 * - Expandable rows: tabIndex={0}, aria-expanded, Enter/Space toggle
 * - Expanded detail row uses <dl>/<dt>/<dd>
 * - 56px row height, no zebra striping
 * - Gain/loss: explicit +/- sign + arrow with aria-label + color
 * - All interactive elements: min 44x44px, visible focus ring
 * - Color is never the sole channel: direction arrows + sign always present
 */
export default function HoldingsTable({ holdings }: HoldingsTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("none");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const uniqueId = useId();
  const sortAnnouncementId = `sort-announcement-${uniqueId}`;

  /* ─── Sort logic ─── */
  const handleSort = useCallback(
    (column: SortColumn) => {
      let newDirection: SortDirection;
      if (sortColumn === column) {
        // Cycle: none -> ascending -> descending -> none
        if (sortDirection === "none") newDirection = "ascending";
        else if (sortDirection === "ascending") newDirection = "descending";
        else newDirection = "none";
      } else {
        newDirection = "ascending";
      }

      setSortColumn(newDirection === "none" ? null : column);
      setSortDirection(newDirection);

      const columnLabels: Record<SortColumn, string> = {
        symbol: "Symbol",
        shares: "Shares",
        avgCost: "Average Cost",
        currentPrice: "Current Price",
        marketValue: "Market Value",
        gainLoss: "Gain/Loss dollars",
        gainLossPercent: "Gain/Loss percent",
      };

      if (newDirection === "none") {
        announce("Sort cleared. Table in default order.", "polite");
      } else {
        announce(
          `Sorted by ${columnLabels[column]}, ${newDirection}.`,
          "polite"
        );
      }
    },
    [sortColumn, sortDirection]
  );

  /* ─── Sort data ─── */
  const sortedHoldings = [...holdings];
  if (sortColumn && sortDirection !== "none") {
    sortedHoldings.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "ascending"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "ascending" ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  /* ─── Row expand/collapse ─── */
  const toggleRow = useCallback(
    (symbol: string) => {
      setExpandedRow((prev) => {
        const next = prev === symbol ? null : symbol;
        if (next) {
          announce(`${symbol} details expanded.`, "polite");
        } else {
          announce(`${symbol} details collapsed.`, "polite");
        }
        return next;
      });
    },
    []
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, symbol: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleRow(symbol);
      }
    },
    [toggleRow]
  );

  /* ─── Column definitions ─── */
  const columns: {
    key: SortColumn;
    label: string;
    align: "left" | "right";
  }[] = [
    { key: "symbol", label: "Symbol", align: "left" },
    { key: "shares", label: "Shares", align: "right" },
    { key: "avgCost", label: "Average Cost", align: "right" },
    { key: "currentPrice", label: "Current Price", align: "right" },
    { key: "marketValue", label: "Market Value", align: "right" },
    { key: "gainLoss", label: "Gain/Loss ($)", align: "right" },
    { key: "gainLossPercent", label: "Gain/Loss (%)", align: "right" },
  ];

  /* ─── Gain/loss cell renderer ─── */
  function renderGainLoss(value: number, type: "currency" | "percent") {
    const isPositive = value > 0;
    const isNegative = value < 0;
    const arrow = isPositive ? "\u2191" : isNegative ? "\u2193" : "";
    const colorClass = isPositive
      ? "text-gain"
      : isNegative
        ? "text-loss"
        : "text-secondary";
    const formatted =
      type === "currency" ? formatSignedCurrency(value) : formatPercent(value);
    const directionWord = isPositive
      ? "gain"
      : isNegative
        ? "loss"
        : "unchanged";

    return (
      <span
        className={`inline-flex items-center gap-1 ${colorClass} tabular-nums`}
        /* a11y: aria-label provides complete description including direction for screen readers, since color alone is insufficient */
        aria-label={`${formatted}, ${directionWord}`}
      >
        {arrow && (
          <span
            /* a11y: aria-hidden="true" because the aria-label on the parent already conveys direction */
            aria-hidden="true"
          >
            {arrow}
          </span>
        )}
        {formatted}
      </span>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Sort change announcement region */}
      <div
        id={sortAnnouncementId}
        /* a11y: role="status" with aria-live="polite" announces sort changes to screen readers */
        role="status"
        /* a11y: aria-live="polite" waits for user idle before announcing */
        aria-live="polite"
        /* a11y: aria-atomic="true" ensures complete message is announced */
        aria-atomic="true"
        className="sr-only"
      />

      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">
          {/* a11y: sr-only caption provides table purpose for screen readers without visual clutter */}
          Portfolio holdings. {holdings.length} holdings. Use column headers to
          sort. Select a row to expand details.
        </caption>
        <thead>
          <tr className="border-b-2 border-border-strong">
            {columns.map((col) => {
              const isActiveSort = sortColumn === col.key;
              return (
                <th
                  key={col.key}
                  /* a11y: scope="col" identifies this as a column header for screen readers */
                  scope="col"
                  /* a11y: aria-sort is ONLY set on the actively sorted column to avoid confusion */
                  aria-sort={
                    isActiveSort && sortDirection !== "none"
                      ? sortDirection
                      : undefined
                  }
                  className={[
                    "py-3 px-3",
                    col.align === "right" ? "text-right" : "text-left",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => handleSort(col.key)}
                    className={[
                      "inline-flex items-center gap-1",
                      "min-h-[44px] min-w-[44px] px-1",
                      "text-sm font-semibold",
                      isActiveSort ? "text-primary" : "text-secondary",
                      "hover:text-primary",
                      "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                      "rounded",
                      col.align === "right"
                        ? "ml-auto flex-row-reverse"
                        : "",
                    ].join(" ")}
                  >
                    {col.label}
                    <span
                      /* a11y: aria-hidden="true" because aria-sort on <th> already conveys sort state */
                      aria-hidden="true"
                      className="text-xs"
                    >
                      {isActiveSort && sortDirection === "ascending"
                        ? "\u25B2"
                        : isActiveSort && sortDirection === "descending"
                          ? "\u25BC"
                          : "\u25B4\u25BE"}
                    </span>
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sortedHoldings.map((holding) => {
            const isExpanded = expandedRow === holding.symbol;
            const costBasis = holding.shares * holding.avgCost;
            const totalReturn = holding.gainLoss;
            const totalReturnPercent = holding.gainLossPercent;
            return (
              <React.Fragment key={holding.symbol}>
                {/* Main row */}
                <tr
                  /* a11y: tabIndex={0} makes the row focusable for keyboard users to expand details */
                  tabIndex={0}
                  /* a11y: aria-expanded communicates whether the detail row is shown */
                  aria-expanded={isExpanded}
                  /* a11y: aria-label provides context that this row is expandable */
                  aria-label={`${holding.symbol}, ${holding.name}. ${isExpanded ? "Details expanded" : "Press Enter to expand details"}`}
                  onClick={() => toggleRow(holding.symbol)}
                  onKeyDown={(e) => handleRowKeyDown(e, holding.symbol)}
                  className={[
                    "h-[56px] border-b border-border-default",
                    "cursor-pointer",
                    "hover:bg-surface-sunken",
                    "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                    "focus-visible:z-10 focus-visible:relative",
                  ].join(" ")}
                >
                  <td className="py-3 px-3">
                    <div>
                      <span className="font-semibold text-primary">
                        {holding.symbol}
                      </span>
                      <span className="block text-xs text-muted">
                        {holding.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-primary">
                    {holding.shares}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-primary">
                    {formatCurrency(holding.avgCost)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-primary">
                    {formatCurrency(holding.currentPrice)}
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums text-primary font-medium">
                    {formatCurrency(holding.marketValue)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {renderGainLoss(holding.gainLoss, "currency")}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {renderGainLoss(holding.gainLossPercent, "percent")}
                  </td>
                </tr>

                {/* Expandable detail row */}
                {isExpanded && (
                  <tr className="border-b border-border-default bg-surface-sunken">
                    <td colSpan={7} className="py-4 px-6">
                      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-3 text-sm">
                        <div>
                          <dt className="text-muted font-medium">Cost Basis</dt>
                          <dd className="text-primary tabular-nums mt-0.5">
                            {formatCurrency(costBasis)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted font-medium">Total Return</dt>
                          <dd className="mt-0.5">
                            {renderGainLoss(totalReturn, "currency")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted font-medium">
                            Total Return %
                          </dt>
                          <dd className="mt-0.5">
                            {renderGainLoss(totalReturnPercent, "percent")}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-muted font-medium">Sector</dt>
                          <dd className="text-primary mt-0.5">{holding.sector}</dd>
                        </div>
                        <div>
                          <dt className="text-muted font-medium">Allocation</dt>
                          <dd className="text-primary tabular-nums mt-0.5">
                            {holding.allocation.toFixed(2)}%
                          </dd>
                        </div>
                        {holding.fundamentals.peRatio !== null && (
                          <div>
                            <dt className="text-muted font-medium">P/E Ratio</dt>
                            <dd className="text-primary tabular-nums mt-0.5">
                              {holding.fundamentals.peRatio.toFixed(1)}
                            </dd>
                          </div>
                        )}
                        {holding.fundamentals.dividendYield !== null && (
                          <div>
                            <dt className="text-muted font-medium">
                              Dividend Yield
                            </dt>
                            <dd className="text-primary tabular-nums mt-0.5">
                              {holding.fundamentals.dividendYield.toFixed(2)}%
                            </dd>
                          </div>
                        )}
                        {holding.analystRatings.priceTargetMean > 0 && (
                          <div>
                            <dt className="text-muted font-medium">
                              Analyst Target
                            </dt>
                            <dd className="text-primary tabular-nums mt-0.5">
                              {formatCurrency(
                                holding.analystRatings.priceTargetMean
                              )}
                            </dd>
                          </div>
                        )}
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
  );
}
