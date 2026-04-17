"use client";

import React, { useState } from "react";
import { holdings } from "@/data/mockPortfolio";
import { formatCurrency, formatDate } from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Mock transaction data ─── */
interface Transaction {
  id: string;
  date: string;
  symbol: string;
  type: "Buy" | "Sell";
  quantity: number;
  price: number;
  total: number;
  journalEntry: string;
}

const transactions: Transaction[] = [
  {
    id: "t1",
    date: "2026-04-10",
    symbol: "AAPL",
    type: "Buy",
    quantity: 5,
    price: 187.50,
    total: 937.50,
    journalEntry:
      "Adding to my AAPL position after strong earnings. I believe in the long-term growth of services revenue.",
  },
  {
    id: "t2",
    date: "2026-03-28",
    symbol: "VTI",
    type: "Buy",
    quantity: 10,
    price: 215.80,
    total: 2158.00,
    journalEntry:
      "Regular monthly contribution to broad market index. Dollar-cost averaging into my core position.",
  },
  {
    id: "t3",
    date: "2026-03-15",
    symbol: "SCHD",
    type: "Buy",
    quantity: 20,
    price: 74.30,
    total: 1486.00,
    journalEntry:
      "Building dividend income stream. SCHD has a strong track record of dividend growth.",
  },
  {
    id: "t4",
    date: "2026-02-20",
    symbol: "MSFT",
    type: "Buy",
    quantity: 3,
    price: 370.25,
    total: 1110.75,
    journalEntry:
      "Cloud and AI growth story remains strong. Adding a small position below analyst target.",
  },
  {
    id: "t5",
    date: "2026-02-05",
    symbol: "VXUS",
    type: "Buy",
    quantity: 15,
    price: 54.10,
    total: 811.50,
    journalEntry:
      "Diversifying internationally. International valuations look attractive compared to US markets.",
  },
  {
    id: "t6",
    date: "2026-01-18",
    symbol: "BND",
    type: "Buy",
    quantity: 25,
    price: 72.80,
    total: 1820.00,
    journalEntry:
      "Adding bond allocation for stability. Rates may have peaked, which would benefit bond prices.",
  },
  {
    id: "t7",
    date: "2025-12-10",
    symbol: "VTI",
    type: "Buy",
    quantity: 12,
    price: 202.40,
    total: 2428.80,
    journalEntry:
      "Year-end contribution. Market pulled back from highs, seems like a reasonable entry point.",
  },
  {
    id: "t8",
    date: "2025-11-22",
    symbol: "AAPL",
    type: "Buy",
    quantity: 10,
    price: 145.60,
    total: 1456.00,
    journalEntry:
      "Initial AAPL position. Strong balance sheet and ecosystem lock-in make this a core holding.",
  },
];

export default function HistoryPage() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      const tx = transactions.find((t) => t.id === id);
      if (next.has(id)) {
        next.delete(id);
        announce(`Transaction ${tx?.symbol ?? ""} details collapsed`, "polite");
      } else {
        next.add(id);
        announce(`Transaction ${tx?.symbol ?? ""} details expanded`, "polite");
      }
      return next;
    });
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">
        Transaction History
      </h1>

      <section aria-labelledby="transactions-heading">
        <h2 id="transactions-heading" className="sr-only">
          All Transactions
        </h2>

        <div className="bg-surface-raised border border-border-default rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="text-left text-sm font-medium text-muted p-4 pb-2">
              Transaction history showing all buy and sell orders. Click or
              press Enter to see the decision journal entry for each trade.
            </caption>
            <thead>
              <tr className="border-b border-border-default">
                <th scope="col" className="text-left p-3 w-8">
                  <span className="sr-only">Expand details</span>
                </th>
                <th
                  scope="col"
                  className="text-left p-3 font-semibold text-primary"
                >
                  Date
                </th>
                <th
                  scope="col"
                  className="text-left p-3 font-semibold text-primary"
                >
                  Symbol
                </th>
                <th
                  scope="col"
                  className="text-left p-3 font-semibold text-primary"
                >
                  Type
                </th>
                <th
                  scope="col"
                  className="text-right p-3 font-semibold text-primary"
                >
                  Quantity
                </th>
                <th
                  scope="col"
                  className="text-right p-3 font-semibold text-primary"
                >
                  Price
                </th>
                <th
                  scope="col"
                  className="text-right p-3 font-semibold text-primary"
                >
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => {
                const isExpanded = expandedRows.has(tx.id);
                return (
                  <React.Fragment key={tx.id}>
                    <tr
                      className="border-b border-border-default hover:bg-surface-sunken cursor-pointer"
                      tabIndex={0}
                      role="row"
                      aria-expanded={isExpanded}
                      onClick={() => toggleRow(tx.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRow(tx.id);
                        }
                      }}
                    >
                      <td className="p-3">
                        <span aria-hidden="true">
                          {isExpanded ? "\u25BC" : "\u25B6"}
                        </span>
                        <span className="sr-only">
                          {isExpanded
                            ? `Collapse ${tx.symbol} transaction details`
                            : `Expand ${tx.symbol} transaction details`}
                        </span>
                      </td>
                      <td className="p-3 text-primary">
                        {formatDate(tx.date)}
                      </td>
                      <td className="p-3 font-medium text-primary">
                        {tx.symbol}
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            tx.type === "Buy"
                              ? "bg-green-50 text-gain"
                              : "bg-red-50 text-loss"
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>
                      <td className="p-3 text-right tabular-nums text-primary">
                        {tx.quantity}
                      </td>
                      <td className="p-3 text-right tabular-nums text-primary">
                        {formatCurrency(tx.price)}
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium text-primary">
                        {formatCurrency(tx.total)}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className="bg-surface-sunken">
                        <td colSpan={7} className="p-4">
                          <div className="max-w-2xl">
                            <h3 className="text-sm font-semibold text-primary mb-1">
                              Decision Journal Entry
                            </h3>
                            <p className="text-sm text-secondary">
                              {tx.journalEntry}
                            </p>
                          </div>
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
    </>
  );
}
