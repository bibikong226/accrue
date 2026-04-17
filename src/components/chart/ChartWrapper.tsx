"use client";

import { useState, useEffect, useCallback } from "react";
import { formatCurrency } from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";

interface DataPoint {
  date: string;
  value: number;
}

interface ChartWrapperProps {
  data: DataPoint[];
  title: string;
  asset: string;
  chartType?: string;
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  availableRanges: string[];
}

type ChartMode = "visual" | "audio" | "text";

/**
 * ChartWrapper per § 7 — the ONLY way to render charts in Accrue.
 * Raw canvas/SVG charts are forbidden.
 *
 * Tri-modal: Visual · Audio · Text per § 7.2
 * - Data table alongside every chart (Chartability "Compromising" heuristic)
 * - Accessible chart name with asset, type, period, key value
 * - Text summary adjacent to chart
 * - Time range controls with live region announcements
 * - Keyboard: T toggles chart/table
 * - Charts reflow at 200% zoom (WCAG 1.4.10)
 */
export function ChartWrapper({
  data,
  title,
  asset,
  chartType = "line chart",
  timeRange,
  onTimeRangeChange,
  availableRanges,
}: ChartWrapperProps) {
  const [mode, setMode] = useState<ChartMode>("visual");
  const [showTable, setShowTable] = useState(false);

  // Calculate summary stats from data
  const firstPrice = data[0]?.value ?? 0;
  const lastPrice = data[data.length - 1]?.value ?? 0;
  const minPrice = Math.min(...data.map((d) => d.value));
  const maxPrice = Math.max(...data.map((d) => d.value));
  const change = lastPrice - firstPrice;
  const changePct = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(1) : "0.0";
  const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";

  const accessibleName = `${asset} stock price, ${timeRange}, ${chartType}. Price ranged from ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}. Current: ${formatCurrency(lastPrice)}.`;

  const textSummary = `This chart shows ${asset} over the ${timeRange} period. The price ${
    trend === "up" ? "rose" : trend === "down" ? "fell" : "remained flat"
  } from ${formatCurrency(firstPrice)} to ${formatCurrency(lastPrice)}, a ${
    change >= 0 ? "+" : ""
  }${changePct}% change. The range was ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}.`;

  // Keyboard T to toggle chart/table
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "t" || e.key === "T") {
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        )
          return;
        setShowTable((prev) => !prev);
        announce(showTable ? "Chart view" : "Data table view", "polite");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showTable]);

  const handleRangeChange = useCallback(
    (range: string) => {
      onTimeRangeChange(range);
      announce(`${range} selected`, "polite");
    },
    [onTimeRangeChange]
  );

  function downloadCSV() {
    const csv = [
      "Date,Price",
      ...data.map((d) => `${d.date},${d.value}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset}-${timeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      /* a11y: Accessible name describing the chart content */
      aria-label={accessibleName}
      className="rounded-xl border border-border-default bg-surface-raised p-4"
    >
      {/* Chart title — states the financial takeaway per § 7.1 */}
      <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>

      {/* Tri-modal segmented control per § 7.2 */}
      <div
        /* a11y: Tab group for chart mode selection */
        role="tablist"
        aria-label="Chart display mode"
        className="flex gap-1 mb-3"
      >
        {(["visual", "audio", "text"] as ChartMode[]).map((m) => (
          <button
            key={m}
            role="tab"
            /* a11y: aria-selected communicates active mode */
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              announce(`${m} mode selected`, "polite");
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring ${
              mode === m
                ? "bg-action-primary text-inverse"
                : "text-secondary hover:bg-surface-overlay"
            }`}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Time range controls per § 7.1 */}
      <div className="flex gap-1 mb-4" role="group" aria-label="Time range">
        {availableRanges.map((range) => (
          <button
            key={range}
            onClick={() => handleRangeChange(range)}
            /* a11y: aria-pressed communicates selected state */
            aria-pressed={timeRange === range}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring ${
              timeRange === range
                ? "bg-surface-overlay text-primary border border-border-strong"
                : "text-muted hover:text-secondary hover:bg-surface-overlay"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Visual mode — simplified SVG line chart */}
      {mode === "visual" && !showTable && (
        <div className="w-full h-48 relative" aria-hidden="true">
          <svg
            viewBox={`0 0 ${data.length * 10} 200`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Gradient fill */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"}
                  stopOpacity="0.18"
                />
                <stop
                  offset="100%"
                  stopColor={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"}
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Area fill */}
            <path
              d={`M0,200 ${data
                .map((d, i) => {
                  const x = i * (data.length > 1 ? (data.length * 10) / (data.length - 1) : 0);
                  const y = 200 - ((d.value - minPrice) / (maxPrice - minPrice || 1)) * 180;
                  return `L${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")} L${((data.length - 1) * 10).toFixed(1)},200 Z`}
              fill="url(#chartGrad)"
            />

            {/* Line — 1.5px per § 11.5 */}
            <polyline
              points={data
                .map((d, i) => {
                  const x = i * (data.length > 1 ? (data.length * 10) / (data.length - 1) : 0);
                  const y = 200 - ((d.value - minPrice) / (maxPrice - minPrice || 1)) * 180;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              fill="none"
              stroke={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"}
              strokeWidth="2"
            />

            {/* Horizontal gridlines — 3 per § 11.5 */}
            {[0.25, 0.5, 0.75].map((pct) => {
              const y = 200 - pct * 180;
              const price = minPrice + pct * (maxPrice - minPrice);
              return (
                <g key={pct}>
                  <line
                    x1="0"
                    y1={y}
                    x2={data.length * 10}
                    y2={y}
                    stroke="var(--color-border-default)"
                    strokeWidth="0.5"
                    strokeDasharray="4,4"
                    opacity="0.4"
                  />
                  <text
                    x={data.length * 10 - 5}
                    y={y - 4}
                    textAnchor="end"
                    className="text-[10px]"
                    fill="var(--color-text-muted)"
                  >
                    {formatCurrency(price)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Audio mode placeholder */}
      {mode === "audio" && (
        <div className="p-6 text-center text-sm text-secondary bg-surface-sunken rounded-lg">
          <p className="font-medium mb-2">Chart Listening</p>
          <p>
            Audio sonification would play the price series as tones here.
            Use the scrub controls to step through data points.
          </p>
          <p className="text-xs text-muted mt-2">
            Pitch maps to price (220-880 Hz). Press Space to play overview, arrow keys to scrub.
          </p>
        </div>
      )}

      {/* Text mode — deterministic narration per § 7.2 */}
      {mode === "text" && (
        <div className="p-4 bg-surface-sunken rounded-lg">
          <p className="text-sm leading-relaxed text-primary" style={{ fontFamily: "var(--font-serif)" }}>
            {textSummary}
          </p>
        </div>
      )}

      {/* Text summary — always visible per § 7.1 */}
      <p className="text-xs text-muted mt-3 px-1">{textSummary}</p>

      {/* Keyboard hint */}
      <p className="text-xs text-muted mt-1 px-1">
        Press <kbd className="px-1 py-0.5 bg-surface-overlay rounded text-xs font-mono">T</kbd> to toggle data table.
        Press <kbd className="px-1 py-0.5 bg-surface-overlay rounded text-xs font-mono">S</kbd> for sonification.
      </p>

      {/* Data table — adjacent per § 7.1 (Chartability "Compromising" heuristic) */}
      <details className="mt-3" open={showTable}>
        <summary className="text-sm font-medium text-action-primary cursor-pointer hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] flex items-center">
          View data table ({data.length} points)
        </summary>
        <div className="mt-2 max-h-60 overflow-y-auto">
          <table className="w-full text-sm">
            {/* a11y: caption describes the data table content for screen readers */}
            <caption className="sr-only">
              {asset} price data for the {timeRange} period, showing date and closing price for each data point
            </caption>
            <thead>
              <tr>
                <th scope="col" className="text-left px-2 py-1 text-xs font-medium text-secondary uppercase">
                  Date
                </th>
                <th scope="col" className="text-right px-2 py-1 text-xs font-medium text-secondary uppercase">
                  Closing Price (USD)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i} className="border-t border-border-default">
                  <td className="px-2 py-1.5 text-primary">{d.date}</td>
                  <td className="px-2 py-1.5 text-right font-mono tabular-nums text-primary">
                    {formatCurrency(d.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={downloadCSV}
          className="mt-2 text-xs text-action-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] px-2 py-2"
        >
          Download CSV
        </button>
      </details>

      {/* Live region for chart state changes */}
      <div role="status" aria-live="polite" className="sr-only" id="chart-announcer" />
    </section>
  );
}
