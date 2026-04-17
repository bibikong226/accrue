"use client";

import { useState, useRef, useCallback } from "react";
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
 *
 * Tri-modal: Visual · Audio · Text per § 7.2
 * - FULLY keyboard accessible scrub mode (arrow keys step through data)
 * - Data table alongside every chart (Chartability "Compromising" heuristic)
 * - Accessible chart name with asset, type, period, key value
 * - Text summary adjacent to chart
 * - Time range controls with live region announcements
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
  const [scrubIndex, setScrubIndex] = useState(data.length - 1);
  const scrubRef = useRef<HTMLDivElement>(null);

  // Calculate summary stats
  const firstPrice = data[0]?.value ?? 0;
  const lastPrice = data[data.length - 1]?.value ?? 0;
  const minPrice = data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0;
  const maxPrice = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0;
  const change = lastPrice - firstPrice;
  const changePct = firstPrice > 0 ? ((change / firstPrice) * 100).toFixed(1) : "0.0";
  const trend = change > 0 ? "up" : change < 0 ? "down" : "flat";

  const accessibleName = `${asset} stock price, ${timeRange}, ${chartType}. Price ranged from ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}. Current: ${formatCurrency(lastPrice)}.`;

  const textSummary = `This chart shows ${asset} over the ${timeRange} period. The price ${
    trend === "up" ? "rose" : trend === "down" ? "fell" : "remained flat"
  } from ${formatCurrency(firstPrice)} to ${formatCurrency(lastPrice)}, a ${
    change >= 0 ? "+" : ""
  }${changePct}% change. The range was ${formatCurrency(minPrice)} to ${formatCurrency(maxPrice)}.`;

  const currentPoint = data[scrubIndex];
  const prevPoint = scrubIndex > 0 ? data[scrubIndex - 1] : null;
  const pointChange = prevPoint ? currentPoint.value - prevPoint.value : 0;
  const pointChangePct = prevPoint && prevPoint.value > 0
    ? ((pointChange / prevPoint.value) * 100).toFixed(1)
    : "0.0";

  // Keyboard scrub handler — arrow keys step through data points per § 7.2
  const handleScrubKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(scrubIndex + 1, data.length - 1);
        setScrubIndex(next);
        const pt = data[next];
        const prev = next > 0 ? data[next - 1] : null;
        const chg = prev ? ((pt.value - prev.value) / prev.value * 100).toFixed(1) : "0.0";
        announce(
          `${pt.date}. ${formatCurrency(pt.value)}. ${
            prev ? (pt.value >= prev.value ? `Up ${chg}%` : `Down ${chg}%`) + " from previous." : "First data point."
          }`,
          "assertive"
        );
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(scrubIndex - 1, 0);
        setScrubIndex(prev);
        const pt = data[prev];
        const before = prev > 0 ? data[prev - 1] : null;
        const chg = before ? ((pt.value - before.value) / before.value * 100).toFixed(1) : "0.0";
        announce(
          `${pt.date}. ${formatCurrency(pt.value)}. ${
            before ? (pt.value >= before.value ? `Up ${chg}%` : `Down ${chg}%`) + " from previous." : "First data point."
          }`,
          "assertive"
        );
      } else if (e.key === "Home") {
        e.preventDefault();
        setScrubIndex(0);
        announce(`${data[0].date}. ${formatCurrency(data[0].value)}. First data point.`, "assertive");
      } else if (e.key === "End") {
        e.preventDefault();
        const last = data.length - 1;
        setScrubIndex(last);
        announce(`${data[last].date}. ${formatCurrency(data[last].value)}. Most recent data point.`, "assertive");
      }
    },
    [scrubIndex, data]
  );

  const handleRangeChange = useCallback(
    (range: string) => {
      onTimeRangeChange(range);
      setScrubIndex(0);
      announce(`${range} selected. Chart and data table updated.`, "polite");
    },
    [onTimeRangeChange]
  );

  function downloadCSV() {
    const csv = [
      "Date,Closing Price (USD)",
      ...data.map((d) => `${d.date},${d.value.toFixed(2)}`),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset}-${timeRange}-prices.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section
      /* a11y: aria-label provides full chart description for screen readers */
      aria-label={accessibleName}
      className="rounded-xl border border-border-default bg-surface-raised p-4"
    >
      {/* Chart title — states the financial takeaway per § 7.1 */}
      <h3 className="text-base font-semibold text-primary mb-1">{title}</h3>

      {/* Text summary — ALWAYS visible and readable per § 7.1 */}
      <p
        className="text-sm text-secondary mb-3"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {textSummary}
      </p>

      {/* Tri-modal segmented control per § 7.2 — 44px min touch targets */}
      <div
        /* a11y: tablist role for mode switching */
        role="tablist"
        aria-label="Chart display mode"
        className="flex gap-1 mb-3"
      >
        {(["visual", "audio", "text"] as ChartMode[]).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            /* a11y: aria-selected communicates which mode is active */
            aria-selected={mode === m}
            /* a11y: aria-controls links to the panel content */
            aria-controls={`chart-panel-${m}`}
            tabIndex={mode === m ? 0 : -1}
            onClick={() => {
              setMode(m);
              announce(`${m.charAt(0).toUpperCase() + m.slice(1)} mode selected`, "polite");
            }}
            onKeyDown={(e) => {
              /* a11y: Arrow key navigation within tablist per WAI-ARIA */
              const modes: ChartMode[] = ["visual", "audio", "text"];
              const idx = modes.indexOf(m);
              if (e.key === "ArrowRight") {
                e.preventDefault();
                const next = modes[(idx + 1) % 3];
                setMode(next);
                announce(`${next} mode selected`, "polite");
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                const prev = modes[(idx + 2) % 3];
                setMode(prev);
                announce(`${prev} mode selected`, "polite");
              }
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
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
      <div className="flex flex-wrap gap-1 mb-4" role="group" aria-label="Time range selector">
        {availableRanges.map((range) => (
          <button
            key={range}
            type="button"
            onClick={() => handleRangeChange(range)}
            /* a11y: aria-pressed communicates selected time range */
            aria-pressed={timeRange === range}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              timeRange === range
                ? "bg-surface-overlay text-primary border border-border-strong"
                : "text-muted hover:text-secondary hover:bg-surface-overlay"
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* ══════════════ VISUAL MODE ══════════════ */}
      {mode === "visual" && (
        <div id="chart-panel-visual" role="tabpanel" aria-label="Visual chart">
          {/* SVG chart — decorative, the data table provides the accessible data */}
          <div className="w-full h-48 relative mb-2" aria-hidden="true">
            <svg
              viewBox={`0 0 300 200`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`grad-${asset}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"} stopOpacity="0" />
                </linearGradient>
              </defs>
              {data.length > 1 && (
                <>
                  <path
                    d={`M0,200 ${data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 300;
                      const y = 200 - ((d.value - minPrice) / (maxPrice - minPrice || 1)) * 180;
                      return `L${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(" ")} L300,200 Z`}
                    fill={`url(#grad-${asset})`}
                  />
                  <polyline
                    points={data.map((d, i) => {
                      const x = (i / (data.length - 1)) * 300;
                      const y = 200 - ((d.value - minPrice) / (maxPrice - minPrice || 1)) * 180;
                      return `${x.toFixed(1)},${y.toFixed(1)}`;
                    }).join(" ")}
                    fill="none"
                    stroke={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"}
                    strokeWidth="2"
                  />
                  {/* Scrub indicator dot */}
                  {(() => {
                    const x = (scrubIndex / (data.length - 1)) * 300;
                    const y = 200 - ((data[scrubIndex].value - minPrice) / (maxPrice - minPrice || 1)) * 180;
                    return <circle cx={x} cy={y} r="5" fill={change >= 0 ? "var(--color-gain)" : "var(--color-loss)"} />;
                  })()}
                </>
              )}
            </svg>
          </div>

          {/* Keyboard scrub control — THIS is the accessible chart interaction per § 7.2 */}
          <div
            ref={scrubRef}
            /* a11y: slider role allows keyboard users to scrub through chart data points */
            role="slider"
            tabIndex={0}
            aria-label={`Chart data scrubber for ${asset}. Use left and right arrow keys to step through ${data.length} data points. Home for first, End for last.`}
            aria-valuenow={scrubIndex}
            aria-valuemin={0}
            aria-valuemax={data.length - 1}
            aria-valuetext={currentPoint ? `${currentPoint.date}, ${formatCurrency(currentPoint.value)}${prevPoint ? `, ${pointChange >= 0 ? "up" : "down"} ${pointChangePct}% from previous` : ""}` : ""}
            onKeyDown={handleScrubKeyDown}
            className="rounded-lg border border-border-default bg-surface-sunken p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring cursor-pointer"
          >
            <p className="text-sm font-medium text-primary">
              <span className="font-mono tabular-nums">{currentPoint?.date}</span>
              {" — "}
              <span className="font-mono tabular-nums">{formatCurrency(currentPoint?.value ?? 0)}</span>
              {prevPoint && (
                <span className={pointChange >= 0 ? "text-gain" : "text-loss"}>
                  {" "}
                  <span aria-label={pointChange >= 0 ? "up" : "down"}>{pointChange >= 0 ? "↑" : "↓"}</span>
                  {" "}{pointChange >= 0 ? "+" : ""}{pointChangePct}% from previous
                </span>
              )}
            </p>
            <p className="text-xs text-muted mt-1">
              Point {scrubIndex + 1} of {data.length}. Use ← → arrow keys to navigate.
            </p>
          </div>
        </div>
      )}

      {/* ══════════════ AUDIO MODE ══════════════ */}
      {mode === "audio" && (
        <div id="chart-panel-audio" role="tabpanel" aria-label="Audio chart mode">
          <div className="rounded-lg border border-border-default bg-surface-sunken p-4">
            <h4 className="text-sm font-semibold text-primary mb-2">Chart Listening Mode</h4>
            <p className="text-sm text-secondary mb-3">
              Step through each data point using the controls below. Each point announces its date, price, and change from previous.
            </p>

            {/* Audio scrub — same keyboard interaction as visual */}
            <div
              role="slider"
              tabIndex={0}
              aria-label={`Audio chart scrubber for ${asset}. Use arrow keys to step through ${data.length} data points.`}
              aria-valuenow={scrubIndex}
              aria-valuemin={0}
              aria-valuemax={data.length - 1}
              aria-valuetext={currentPoint ? `${currentPoint.date}, ${formatCurrency(currentPoint.value)}` : ""}
              onKeyDown={handleScrubKeyDown}
              className="rounded-lg bg-surface-base p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            >
              <p className="text-sm font-medium text-primary font-mono tabular-nums">
                {currentPoint?.date} — {formatCurrency(currentPoint?.value ?? 0)}
                {prevPoint && (
                  <span className={pointChange >= 0 ? "text-gain" : "text-loss"}>
                    {" "}{pointChange >= 0 ? "↑" : "↓"} {pointChange >= 0 ? "+" : ""}{pointChangePct}%
                  </span>
                )}
              </p>
              <p className="text-xs text-muted mt-1">Point {scrubIndex + 1} of {data.length}. ← → to navigate, Home/End for first/last.</p>
            </div>

            {/* Step buttons for mouse users */}
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => { setScrubIndex(Math.max(0, scrubIndex - 1)); }}
                disabled={scrubIndex === 0}
                aria-label="Previous data point"
                className="px-4 py-2 rounded-lg border border-border-default text-sm text-secondary hover:bg-surface-overlay disabled:opacity-50 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                ← Previous
              </button>
              <button
                type="button"
                onClick={() => { setScrubIndex(Math.min(data.length - 1, scrubIndex + 1)); }}
                disabled={scrubIndex === data.length - 1}
                aria-label="Next data point"
                className="px-4 py-2 rounded-lg border border-border-default text-sm text-secondary hover:bg-surface-overlay disabled:opacity-50 min-h-[44px] min-w-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TEXT MODE ══════════════ */}
      {mode === "text" && (
        <div id="chart-panel-text" role="tabpanel" aria-label="Text chart narration">
          <div className="rounded-lg border border-border-default bg-surface-sunken p-4">
            <h4 className="text-sm font-semibold text-primary mb-2">Chart Narration</h4>
            <p className="text-sm leading-relaxed text-primary" style={{ fontFamily: "var(--font-serif)" }}>
              {textSummary}
            </p>

            {/* Key statistics */}
            <dl className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <dt className="text-xs text-muted">Period Start</dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary">
                  {data[0]?.date}: {formatCurrency(firstPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Period End</dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary">
                  {data[data.length - 1]?.date}: {formatCurrency(lastPrice)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Lowest Price</dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary">{formatCurrency(minPrice)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Highest Price</dt>
                <dd className="text-sm font-mono tabular-nums font-medium text-primary">{formatCurrency(maxPrice)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Period Change</dt>
                <dd className={`text-sm font-mono tabular-nums font-medium ${change >= 0 ? "text-gain" : "text-loss"}`}>
                  <span aria-label={change >= 0 ? "up" : "down"}>{change >= 0 ? "↑" : "↓"}</span>{" "}
                  {change >= 0 ? "+" : ""}{changePct}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Data Points</dt>
                <dd className="text-sm font-medium text-primary">{data.length}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* ══════════════ DATA TABLE ══════════════ */}
      {/* Always available — Chartability "Compromising" heuristic. The data table
          is the PRIMARY way screen reader users access chart data per § 7.1 */}
      <details className="mt-4">
        <summary className="text-sm font-medium text-action-primary cursor-pointer hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded min-h-[44px] flex items-center px-1">
          View data table ({data.length} data points)
        </summary>
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border-default">
          <table className="w-full text-sm">
            <caption className="sr-only">
              {asset} closing prices for the {timeRange} period. {data.length} data points showing date and price.
            </caption>
            <thead className="bg-surface-sunken sticky top-0">
              <tr>
                <th scope="col" className="text-left px-3 py-2 text-xs font-medium text-secondary uppercase">
                  Date
                </th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-secondary uppercase">
                  Closing Price (USD)
                </th>
                <th scope="col" className="text-right px-3 py-2 text-xs font-medium text-secondary uppercase">
                  Change from Previous
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const prev = i > 0 ? data[i - 1] : null;
                const chg = prev ? d.value - prev.value : 0;
                const chgPct = prev && prev.value > 0 ? ((chg / prev.value) * 100).toFixed(2) : null;
                return (
                  <tr key={i} className="border-t border-border-default hover:bg-surface-sunken">
                    <td className="px-3 py-2 text-primary">{d.date}</td>
                    <td className="px-3 py-2 text-right font-mono tabular-nums text-primary">
                      {formatCurrency(d.value)}
                    </td>
                    <td className={`px-3 py-2 text-right font-mono tabular-nums ${chg >= 0 ? "text-gain" : "text-loss"}`}>
                      {chgPct !== null ? (
                        <>
                          <span aria-label={chg >= 0 ? "up" : "down"}>{chg >= 0 ? "↑" : "↓"}</span>{" "}
                          {chg >= 0 ? "+" : ""}{chgPct}%
                        </>
                      ) : (
                        <span className="text-muted">—</span>
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
          onClick={downloadCSV}
          className="mt-2 text-sm text-action-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded min-h-[44px] px-2 py-2"
        >
          Download as CSV
        </button>
      </details>

      {/* Live region for announcements */}
      <div role="status" aria-live="polite" className="sr-only" id={`chart-announcer-${asset}`} />
    </section>
  );
}
