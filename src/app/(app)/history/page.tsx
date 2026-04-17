"use client";

import { useState, useCallback, useMemo } from "react";
import { mockPortfolio, type Transaction } from "@/data/mockPortfolio";
import {
  SortableHeader,
  SortLive,
} from "@/components/finance/SortableHeader";

/**
 * Transaction History page per spec section 8.
 *
 * Accessibility notes:
 * - Semantic <table> with <th scope="col"> on every column header
 * - VoiceOver reads all fields per row via proper table cell semantics
 * - Buy/Sell indicated with text + icon + color (never color alone, per A1.6)
 * - Expandable rows use aria-expanded + visible chevron affordance
 * - Sortable headers use SortableHeader component with aria-sort
 * - Unique page title via document.title
 */

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

type SortKey =
  | "date"
  | "symbol"
  | "tradeType"
  | "quantity"
  | "pricePerShare"
  | "total"
  | "fees"
  | "orderType";

type SortDirection = "ascending" | "descending" | "none";

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function getSortValue(txn: Transaction, key: SortKey): string | number {
  switch (key) {
    case "date":
      return new Date(txn.date).getTime();
    case "symbol":
      return txn.symbol;
    case "tradeType":
      return txn.tradeType;
    case "quantity":
      return txn.quantity;
    case "pricePerShare":
      return txn.pricePerShare;
    case "total":
      return txn.total;
    case "fees":
      return txn.fees;
    case "orderType":
      return txn.orderType;
    default:
      return 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function HistoryPage() {
  const [sortKey, setSortKey] = useState<SortKey | null>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("descending");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  /* Set the page title for a11y (unique page title requirement) */
  if (typeof document !== "undefined") {
    document.title = "Transaction History — Accrue";
  }

  /* Sort handler cycles: ascending -> descending -> ascending */
  const handleSort = useCallback(
    (key: string) => {
      const typedKey = key as SortKey;
      if (sortKey === typedKey) {
        setSortDirection((prev) =>
          prev === "ascending" ? "descending" : "ascending"
        );
      } else {
        setSortKey(typedKey);
        setSortDirection("ascending");
      }
    },
    [sortKey]
  );

  /* Sorted transactions derived from mock data */
  const sortedTransactions = useMemo(() => {
    const txns = [...mockPortfolio.transactions];
    if (!sortKey || sortDirection === "none") return txns;

    txns.sort((a, b) => {
      const aVal = getSortValue(a, sortKey);
      const bVal = getSortValue(b, sortKey);

      if (typeof aVal === "string" && typeof bVal === "string") {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === "ascending" ? cmp : -cmp;
      }
      const cmp = (aVal as number) - (bVal as number);
      return sortDirection === "ascending" ? cmp : -cmp;
    });

    return txns;
  }, [sortKey, sortDirection]);

  /* Toggle row expansion */
  const toggleRow = useCallback(
    (txnId: string) => {
      setExpandedRow((prev) => (prev === txnId ? null : txnId));
    },
    []
  );

  /* Find journal entry for a given transaction */
  const getJournalEntry = useCallback((journalEntryId: string | null) => {
    if (!journalEntryId) return null;
    return mockPortfolio.journalEntries.find((j) => j.id === journalEntryId) ?? null;
  }, []);

  /* Keyboard handler for row expansion — Enter or Space */
  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableRowElement>, txnId: string) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleRow(txnId);
      }
    },
    [toggleRow]
  );

  return (
    <>
      <h1 className="text-2xl font-semibold text-text-primary mb-2">
        Transaction History
      </h1>

      <p className="text-sm text-text-secondary mb-6">
        Select a row to see full details.
      </p>

      {/* a11y: Live region for sort change announcements */}
      <SortLive sortKey={sortKey} direction={sortDirection} />

      <div className="overflow-x-auto border border-border-default rounded-lg">
        <table className="w-full border-collapse">
          {/* a11y: caption provides an accessible name for the table for screen readers */}
          <caption className="sr-only">
            Transaction history table showing all trades with date, symbol, type, quantity, price per share, total amount, fees, and order type. Select a row to view the decision journal entry for that trade.
          </caption>
          <thead className="bg-surface-raised">
            <tr>
              {/* Chevron column — visual only, hidden from AT */}
              <th
                scope="col"
                className="w-8 px-2 py-3"
                /* a11y: This column is decorative; the aria-expanded on each row
                   communicates expansion state to screen readers */
              >
                <span className="sr-only">Expand row</span>
              </th>
              <SortableHeader
                label="Date"
                sortKey="date"
                currentSort={sortKey}
                currentDirection={sortKey === "date" ? sortDirection : "none"}
                onSort={handleSort}
              />
              <SortableHeader
                label="Symbol"
                sortKey="symbol"
                currentSort={sortKey}
                currentDirection={sortKey === "symbol" ? sortDirection : "none"}
                onSort={handleSort}
              />
              <SortableHeader
                label="Trade Type"
                sortKey="tradeType"
                currentSort={sortKey}
                currentDirection={sortKey === "tradeType" ? sortDirection : "none"}
                onSort={handleSort}
              />
              <SortableHeader
                label="Quantity"
                sortKey="quantity"
                currentSort={sortKey}
                currentDirection={sortKey === "quantity" ? sortDirection : "none"}
                onSort={handleSort}
              />
              <SortableHeader
                label="Price per Share"
                sortKey="pricePerShare"
                currentSort={sortKey}
                currentDirection={
                  sortKey === "pricePerShare" ? sortDirection : "none"
                }
                onSort={handleSort}
              />
              <SortableHeader
                label="Total Amount"
                sortKey="total"
                currentSort={sortKey}
                currentDirection={sortKey === "total" ? sortDirection : "none"}
                onSort={handleSort}
              />
              <SortableHeader
                label="Fees"
                sortKey="fees"
                currentSort={sortKey}
                currentDirection={sortKey === "fees" ? sortDirection : "none"}
                onSort={handleSort}
              />
              <SortableHeader
                label="Order Type"
                sortKey="orderType"
                currentSort={sortKey}
                currentDirection={
                  sortKey === "orderType" ? sortDirection : "none"
                }
                onSort={handleSort}
              />
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((txn) => {
              const isExpanded = expandedRow === txn.id;
              const journalEntry = getJournalEntry(txn.journalEntryId);
              const isBuy = txn.tradeType === "Buy";

              return (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  isBuy={isBuy}
                  isExpanded={isExpanded}
                  journalEntry={journalEntry}
                  onToggle={toggleRow}
                  onKeyDown={handleRowKeyDown}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedTransactions.length === 0 && (
        <p className="text-text-secondary text-sm mt-6 text-center">
          No transactions yet. Your trade history will appear here after you
          place your first trade.
        </p>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Transaction Row sub-component                                      */
/* ------------------------------------------------------------------ */

interface TransactionRowProps {
  txn: Transaction;
  isBuy: boolean;
  isExpanded: boolean;
  journalEntry: ReturnType<
    typeof mockPortfolio.journalEntries extends (infer T)[] ? () => T | null : never
  > | null;
  onToggle: (txnId: string) => void;
  onKeyDown: (
    e: React.KeyboardEvent<HTMLTableRowElement>,
    txnId: string
  ) => void;
}

function TransactionRow({
  txn,
  isBuy,
  isExpanded,
  journalEntry,
  onToggle,
  onKeyDown,
}: TransactionRowProps) {
  return (
    <>
      <tr
        /* a11y: tabindex makes the row focusable for keyboard users */
        tabIndex={0}
        role="row"
        /* a11y: aria-expanded communicates whether the detail panel is open */
        aria-expanded={isExpanded}
        onClick={() => onToggle(txn.id)}
        onKeyDown={(e) => onKeyDown(e, txn.id)}
        className="border-t border-border-default hover:bg-surface-raised cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring"
      >
        {/* Chevron affordance — visible indicator of expandability */}
        <td className="px-2 py-3 text-center" aria-hidden="true">
          <span
            className={`inline-block transition-transform duration-150 text-text-secondary ${
              isExpanded ? "rotate-90" : ""
            }`}
          >
            {/* Right-pointing chevron that rotates to down when expanded */}
            &#9654;
          </span>
        </td>

        {/* Date */}
        <td className="px-4 py-3 text-sm text-text-primary font-mono tabular-nums whitespace-nowrap">
          <span>{formatDate(txn.date)}</span>
          <span className="block text-xs text-text-muted">
            {formatTime(txn.date)}
          </span>
        </td>

        {/* Symbol */}
        <td className="px-4 py-3 text-sm">
          <span className="font-semibold text-text-primary">{txn.symbol}</span>
          <span className="block text-xs text-text-muted">
            {txn.companyName}
          </span>
        </td>

        {/* Trade Type — text + icon + color (never color alone per A1.6) */}
        <td className="px-4 py-3 text-sm">
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              isBuy ? "text-gain" : "text-loss"
            }`}
          >
            {/* a11y: Arrow icon is decorative — the text label "Buy"/"Sell"
                provides the primary meaning */}
            <span aria-hidden="true">{isBuy ? "\u2191" : "\u2193"}</span>
            {txn.tradeType}
          </span>
        </td>

        {/* Quantity */}
        <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-primary text-right">
          {txn.quantity}
        </td>

        {/* Price per Share */}
        <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-primary text-right">
          {formatCurrency(txn.pricePerShare)}
        </td>

        {/* Total Amount */}
        <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-primary text-right">
          {/* a11y: Explicit +/- sign for gain/loss context per A1.6 */}
          <span>
            {isBuy ? "\u2212" : "+"}
            {formatCurrency(txn.total)}
          </span>
        </td>

        {/* Fees */}
        <td className="px-4 py-3 text-sm font-mono tabular-nums text-text-muted text-right">
          {txn.fees === 0 ? "$0.00" : formatCurrency(txn.fees)}
        </td>

        {/* Order Type */}
        <td className="px-4 py-3 text-sm text-text-secondary">
          {txn.orderType}
        </td>
      </tr>

      {/* Expanded detail row — Decision Journal entry */}
      {isExpanded && (
        <tr>
          <td
            colSpan={9}
            className="px-4 py-4 bg-surface-raised border-t border-border-default"
          >
            <div className="ml-6">
              {journalEntry ? (
                <div className="space-y-3 max-w-prose">
                  <h2 className="text-sm font-semibold text-text-primary">
                    Decision Journal Entry
                  </h2>

                  <div>
                    <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                      Rationale
                    </h3>
                    <p className="text-sm text-text-primary leading-relaxed">
                      {journalEntry.rationale}
                    </p>
                  </div>

                  {journalEntry.regretRehearsal && (
                    <div>
                      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                        Regret Rehearsal
                      </h3>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {journalEntry.regretRehearsal}
                      </p>
                    </div>
                  )}

                  {journalEntry.calibrationOutcome && (
                    <div>
                      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                        Calibration Outcome
                      </h3>
                      <CalibrationBadge
                        outcome={journalEntry.calibrationOutcome}
                      />
                    </div>
                  )}

                  {journalEntry.reflection && (
                    <div>
                      <h3 className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-1">
                        Reflection
                      </h3>
                      <p className="text-sm text-text-primary leading-relaxed">
                        {journalEntry.reflection}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-text-muted">
                  No journal entry recorded for this transaction.
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  CalibrationBadge                                                   */
/* ------------------------------------------------------------------ */

function CalibrationBadge({
  outcome,
}: {
  outcome: "right" | "wrong" | "unlucky" | "lucky";
}) {
  const config = {
    right: {
      label: "Right",
      description: "Right thesis, right outcome",
      className: "text-gain bg-gain/10",
    },
    wrong: {
      label: "Wrong",
      description: "Wrong thesis, wrong outcome",
      className: "text-loss bg-loss/10",
    },
    unlucky: {
      label: "Unlucky",
      description: "Right thesis, wrong outcome",
      className: "text-feedback-warning bg-feedback-warning/10",
    },
    lucky: {
      label: "Lucky",
      description: "Wrong thesis, right outcome",
      className: "text-feedback-warning bg-feedback-warning/10",
    },
  }[outcome];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${config.className}`}
    >
      {config.label}
      <span className="text-text-muted">
        — {config.description}
      </span>
    </span>
  );
}
