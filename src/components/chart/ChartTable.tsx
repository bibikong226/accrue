"use client";

import React, { useState, useCallback, useMemo } from "react";
import type { DataPoint } from "@/data/mockPortfolio";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Types ─── */

type SortKey = "date" | "value";
type SortDir = "asc" | "desc";

interface ChartTableProps {
  points: DataPoint[];
  title: string;
  timeframe: string;
  formatValue?: (v: number) => string;
}

/* ─── Helpers ─── */

function defaultFormat(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(v);
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * ChartTable -- Table mode for chart data.
 * Columns: Date, Price. Sortable. CSV download.
 *
 * § 11 of the Chart Rebuild Spec.
 */
export default function ChartTable({
  points,
  title,
  timeframe,
  formatValue = defaultFormat,
}: ChartTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const sortedPoints = useMemo(() => {
    const sorted = [...points].map((pt, i) => ({ ...pt, _origIdx: i }));
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") {
        cmp = a.date.localeCompare(b.date);
      } else {
        cmp = a.value - b.value;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [points, sortKey, sortDir]);

  const handleSort = useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
      announce(
        `Table sorted by ${key} ${sortKey === key && sortDir === "asc" ? "descending" : "ascending"}`,
        "polite"
      );
    },
    [sortKey, sortDir]
  );

  const handleCSVDownload = useCallback(() => {
    const header = "Date,Price\n";
    const rows = sortedPoints.map((pt) => `${pt.date},${pt.value}`);
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${timeframe}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    announce("CSV file downloaded.", "polite");
  }, [sortedPoints, title, timeframe]);

  if (points.length === 0) {
    return <p className="text-sm text-muted p-4">No data available.</p>;
  }

  const SortButton = ({
    label,
    colKey,
  }: {
    label: string;
    colKey: SortKey;
  }) => (
    <button
      type="button"
      onClick={() => handleSort(colKey)}
      className="inline-flex items-center gap-1 min-h-[44px] min-w-[44px] font-semibold text-left focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
      aria-sort={
        sortKey === colKey
          ? sortDir === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      {label}
      {sortKey === colKey && (
        <span aria-hidden="true">{sortDir === "asc" ? " \u25B2" : " \u25BC"}</span>
      )}
    </button>
  );

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <caption className="sr-only">
            {/* a11y: sr-only caption provides table context for screen readers */}
            {title} data table for {timeframe} range. {points.length} data
            points. Sortable by date or price.
          </caption>
          <thead>
            <tr className="border-b border-border-default">
              <th scope="col" className="text-left py-2 px-3 text-secondary">
                <SortButton label="Date" colKey="date" />
              </th>
              <th scope="col" className="text-right py-2 px-3 text-secondary">
                <SortButton label="Price" colKey="value" />
              </th>
              <th scope="col" className="text-right py-2 px-3 text-secondary font-semibold">
                Change
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedPoints.map((pt) => {
              const origIdx = pt._origIdx;
              const prev = origIdx > 0 ? points[origIdx - 1] : null;
              const change = prev ? pt.value - prev.value : null;
              const changePct =
                prev && change !== null
                  ? (change / prev.value) * 100
                  : null;
              return (
                <tr
                  key={pt.date}
                  className="border-b border-border-default last:border-b-0"
                >
                  <td className="py-2 px-3 text-primary">{fmtDate(pt.date)}</td>
                  <td className="py-2 px-3 text-right text-primary tabular-nums">
                    {formatValue(pt.value)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums">
                    {change !== null && changePct !== null ? (
                      <span
                        className={
                          change >= 0
                            ? "text-gain"
                            : "text-loss"
                        }
                      >
                        {change >= 0 ? "+" : ""}
                        {changePct.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-muted">{"\u2014"}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={handleCSVDownload}
        /* a11y: aria-label provides full description of the download action */
        aria-label={`Download ${title} data for ${timeframe} range as CSV`}
        className={[
          "min-h-[44px] px-4 py-2",
          "rounded-lg border border-border-default",
          "text-sm font-medium text-action-primary",
          "hover:bg-surface-sunken",
          "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
        ].join(" ")}
      >
        Download CSV
      </button>
    </div>
  );
}
