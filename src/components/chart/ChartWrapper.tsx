"use client";

import React, { useState, useRef, useCallback, useEffect, useId } from "react";
import type { DataPoint } from "@/data/mockPortfolio";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Types ─── */

type TimeRange = "1W" | "1M" | "3M" | "1Y" | "All";
type ViewMode = "visual" | "audio" | "text";

interface ChartWrapperProps {
  /** Title for the chart (used in captions and labels) */
  title: string;
  /** Data keyed by time range */
  data: Record<TimeRange, DataPoint[]>;
  /** Format a numeric value for display (e.g., currency formatter) */
  formatValue?: (value: number) => string;
}

/* ─── Helpers ─── */

function defaultFormat(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function computeChange(current: number, previous: number): { abs: number; pct: number; direction: "up" | "down" | "flat" } {
  const abs = current - previous;
  const pct = previous !== 0 ? (abs / previous) * 100 : 0;
  const direction = abs > 0 ? "up" : abs < 0 ? "down" : "flat";
  return { abs: Math.round(abs * 100) / 100, pct: Math.round(pct * 100) / 100, direction };
}

/**
 * ChartWrapper — the fully accessible tri-modal chart component.
 *
 * Accessibility contract (CLAUDE.md A1.9, design-system section 2.13):
 * - Tri-modal access: Visual, Audio, Text via role="tablist" with arrow key navigation
 * - SVG chart is decorative (aria-hidden="true"), data conveyed via slider + live region
 * - Keyboard-operable slider: Arrow keys step through data points, Home/End jump to bounds
 * - Live region announces each point: date, value, change direction + amount
 * - Time range buttons: aria-pressed for selected, announcements on change
 * - Data table always available via <details>/<summary>, never hidden with aria-hidden
 * - CSV download button available
 * - All interactive elements: min 44x44px, visible focus ring
 */
export default function ChartWrapper({
  title,
  data,
  formatValue = defaultFormat,
}: ChartWrapperProps) {
  const [activeRange, setActiveRange] = useState<TimeRange>("1M");
  const [activeMode, setActiveMode] = useState<ViewMode>("visual");
  const [activePointIndex, setActivePointIndex] = useState(0);

  const sliderRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const modeTabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const uniqueId = useId();

  const points = data[activeRange] || [];
  const activePoint = points[activePointIndex];

  const timeRanges: TimeRange[] = ["1W", "1M", "3M", "1Y", "All"];
  const modes: { key: ViewMode; label: string }[] = [
    { key: "visual", label: "Visual" },
    { key: "audio", label: "Audio" },
    { key: "text", label: "Text" },
  ];

  /* Reset active point when range changes */
  useEffect(() => {
    setActivePointIndex(0);
  }, [activeRange]);

  /* ─── Announce active point ─── */
  const announcePoint = useCallback(
    (index: number) => {
      const pt = points[index];
      if (!pt) return;
      const prev = index > 0 ? points[index - 1] : null;
      let changeText = "";
      if (prev) {
        const change = computeChange(pt.value, prev.value);
        const dirWord = change.direction === "up" ? "Up" : change.direction === "down" ? "Down" : "Unchanged";
        changeText = `. ${dirWord} ${Math.abs(change.pct).toFixed(2)}% from previous`;
      }
      const message = `${formatDate(pt.date)}. ${formatValue(pt.value)}${changeText}.`;
      announce(message, "polite");
    },
    [points, formatValue]
  );

  /* ─── Slider keyboard handler ─── */
  const handleSliderKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = activePointIndex;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.min(activePointIndex + 1, points.length - 1);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.max(activePointIndex - 1, 0);
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = points.length - 1;
          break;
        default:
          return;
      }
      setActivePointIndex(newIndex);
      announcePoint(newIndex);
    },
    [activePointIndex, points.length, announcePoint]
  );

  /* ─── Mode tab keyboard handler (arrow key navigation) ─── */
  const handleModeTabKeyDown = useCallback(
    (e: React.KeyboardEvent, modeIndex: number) => {
      let nextIndex = modeIndex;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (modeIndex + 1) % modes.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (modeIndex - 1 + modes.length) % modes.length;
      } else {
        return;
      }
      setActiveMode(modes[nextIndex].key);
      modeTabRefs.current[nextIndex]?.focus();
    },
    [modes]
  );

  /* ─── SVG chart rendering ─── */
  function renderSVGChart() {
    if (points.length === 0) return null;
    const width = 600;
    const height = 200;
    const padding = { top: 10, right: 10, bottom: 10, left: 10 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = points.map((p) => p.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const range = maxVal - minVal || 1;

    const pathPoints = points.map((pt, i) => {
      const x = padding.left + (i / (points.length - 1)) * chartW;
      const y = padding.top + chartH - ((pt.value - minVal) / range) * chartH;
      return `${x},${y}`;
    });
    const pathD = `M ${pathPoints.join(" L ")}`;

    // Active point position
    const activeX = padding.left + (activePointIndex / (points.length - 1)) * chartW;
    const activeY = padding.top + chartH - ((activePoint?.value ?? minVal - minVal) / range) * chartH;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        /* a11y: aria-hidden="true" because the SVG is decorative; data is conveyed via the slider and live region */
        aria-hidden="true"
        focusable="false"
      >
        <path d={pathD} fill="none" stroke="var(--color-action-primary)" strokeWidth="2" />
        {activePoint && (
          <circle cx={activeX} cy={activeY} r="5" fill="var(--color-action-primary)" stroke="var(--color-surface-raised)" strokeWidth="2" />
        )}
      </svg>
    );
  }

  /* ─── Text mode content ─── */
  function renderTextMode() {
    if (points.length === 0) return <p className="text-sm text-muted">No data available for this range.</p>;
    const first = points[0];
    const last = points[points.length - 1];
    const values = points.map((p) => p.value);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const overall = computeChange(last.value, first.value);
    const directionWord = overall.direction === "up" ? "increased" : overall.direction === "down" ? "decreased" : "remained unchanged";

    return (
      <div className="space-y-4">
        <p className="text-sm text-primary leading-relaxed">
          Over the selected period from {formatDate(first.date)} to {formatDate(last.date)},{" "}
          the value {directionWord} from {formatValue(first.value)} to {formatValue(last.value)},{" "}
          a change of {overall.pct >= 0 ? "+" : ""}{overall.pct.toFixed(2)}%.
          The lowest point was {formatValue(low)} and the highest was {formatValue(high)}.
          This period contains {points.length} data points.
        </p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted font-medium">Period Start</dt>
          <dd className="text-primary tabular-nums">{formatDate(first.date)} — {formatValue(first.value)}</dd>

          <dt className="text-muted font-medium">Period End</dt>
          <dd className="text-primary tabular-nums">{formatDate(last.date)} — {formatValue(last.value)}</dd>

          <dt className="text-muted font-medium">Low</dt>
          <dd className="text-primary tabular-nums">{formatValue(low)}</dd>

          <dt className="text-muted font-medium">High</dt>
          <dd className="text-primary tabular-nums">{formatValue(high)}</dd>

          <dt className="text-muted font-medium">Change</dt>
          <dd className="text-primary tabular-nums">
            {overall.pct >= 0 ? "+" : ""}{overall.pct.toFixed(2)}% ({overall.abs >= 0 ? "+" : ""}{formatValue(overall.abs)})
          </dd>

          <dt className="text-muted font-medium">Data Points</dt>
          <dd className="text-primary tabular-nums">{points.length}</dd>
        </dl>
      </div>
    );
  }

  /* ─── Data table for CSV and screen readers ─── */
  function renderDataTable() {
    if (points.length === 0) return null;
    return (
      <table className="w-full text-sm border-collapse">
        <caption className="sr-only">
          {/* a11y: sr-only caption provides table context for screen readers without visual clutter */}
          {title} data table for {activeRange} range. {points.length} data points.
        </caption>
        <thead>
          <tr className="border-b border-border-default">
            {/* a11y: scope="col" identifies each header as a column header for screen readers */}
            <th scope="col" className="text-left py-2 px-3 font-semibold text-secondary">Date</th>
            <th scope="col" className="text-right py-2 px-3 font-semibold text-secondary">Closing Price</th>
            <th scope="col" className="text-right py-2 px-3 font-semibold text-secondary">Change</th>
          </tr>
        </thead>
        <tbody>
          {points.map((pt, i) => {
            const prev = i > 0 ? points[i - 1] : null;
            const change = prev ? computeChange(pt.value, prev.value) : null;
            return (
              <tr key={pt.date} className="border-b border-border-default last:border-b-0">
                <td className="py-2 px-3 text-primary">{formatDate(pt.date)}</td>
                <td className="py-2 px-3 text-right text-primary tabular-nums">{formatValue(pt.value)}</td>
                <td className="py-2 px-3 text-right tabular-nums">
                  {change ? (
                    <span className={change.direction === "up" ? "text-gain" : change.direction === "down" ? "text-loss" : "text-secondary"}>
                      {change.direction === "up" ? "+" : ""}{change.pct.toFixed(2)}%
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
    );
  }

  /* ─── CSV download ─── */
  function handleCSVDownload() {
    const header = "Date,Closing Price,Change %\n";
    const rows = points.map((pt, i) => {
      const prev = i > 0 ? points[i - 1] : null;
      const change = prev ? computeChange(pt.value, prev.value) : null;
      return `${pt.date},${pt.value},${change ? change.pct.toFixed(2) : ""}`;
    });
    const csv = header + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_${activeRange}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    announce("CSV file downloaded.", "polite");
  }

  /* ─── Current point info display ─── */
  function renderPointInfo() {
    if (!activePoint) return null;
    const prev = activePointIndex > 0 ? points[activePointIndex - 1] : null;
    const change = prev ? computeChange(activePoint.value, prev.value) : null;
    return (
      <div className="flex items-baseline gap-3 text-sm">
        <span className="font-medium text-primary">{formatDate(activePoint.date)}</span>
        <span className="text-primary tabular-nums font-semibold">{formatValue(activePoint.value)}</span>
        {change && (
          <span className={change.direction === "up" ? "text-gain" : change.direction === "down" ? "text-loss" : "text-secondary"}>
            <span
              /* a11y: aria-hidden="true" because the text already conveys direction with +/- sign */
              aria-hidden="true"
            >
              {change.direction === "up" ? "\u2191" : change.direction === "down" ? "\u2193" : ""}
            </span>
            {" "}
            {change.direction === "up" ? "+" : ""}{change.pct.toFixed(2)}%
          </span>
        )}
      </div>
    );
  }

  const liveLabelId = `chart-live-${uniqueId}`;
  const tablistId = `chart-modes-${uniqueId}`;

  return (
    <div className="space-y-4">
      {/* ─── Mode tabs: Visual / Audio / Text ─── */}
      <div
        /* a11y: role="tablist" identifies this as a set of tabs for mode switching */
        role="tablist"
        /* a11y: aria-label provides context for the tablist group */
        aria-label={`${title} view modes`}
        id={tablistId}
        className="flex gap-1 rounded-lg bg-surface-sunken p-1 w-fit"
      >
        {modes.map((mode, index) => {
          const isActive = activeMode === mode.key;
          return (
            <button
              key={mode.key}
              ref={(el) => { modeTabRefs.current[index] = el; }}
              type="button"
              /* a11y: role="tab" identifies each button as a tab within the tablist */
              role="tab"
              /* a11y: aria-selected indicates which tab is currently active */
              aria-selected={isActive}
              /* a11y: aria-controls references the panel this tab controls */
              aria-controls={`chart-panel-${mode.key}-${uniqueId}`}
              /* a11y: tabIndex management - only active tab is in tab order; others reachable via arrow keys */
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveMode(mode.key)}
              onKeyDown={(e) => handleModeTabKeyDown(e, index)}
              className={[
                "min-h-[44px] min-w-[44px] px-4 py-2",
                "rounded-md text-sm font-medium",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                isActive
                  ? "bg-surface-raised text-primary shadow-sm"
                  : "text-muted hover:text-secondary",
              ].join(" ")}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      {/* ─── Time range controls ─── */}
      <div
        className="flex gap-1"
        /* a11y: role="tablist" with role="tab" children and aria-selected — per CHANGE 5, never plain buttons for timeframe switching */
        role="tablist"
        /* a11y: aria-label provides context for the time range tablist */
        aria-label="Chart time range"
      >
        {timeRanges.map((range, index) => {
          const isActive = activeRange === range;
          return (
            <button
              key={range}
              type="button"
              /* a11y: role="tab" identifies each control as a tab within the tablist */
              role="tab"
              /* a11y: aria-selected indicates which time range tab is currently active */
              aria-selected={isActive}
              /* a11y: tabIndex management — only active tab in tab order; others via arrow keys */
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setActiveRange(range);
                announce(`${range === "All" ? "All time" : range} selected. Chart updated.`, "polite");
              }}
              onKeyDown={(e) => {
                let nextIndex = index;
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  nextIndex = (index + 1) % timeRanges.length;
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  nextIndex = (index - 1 + timeRanges.length) % timeRanges.length;
                } else {
                  return;
                }
                setActiveRange(timeRanges[nextIndex]);
                announce(`${timeRanges[nextIndex] === "All" ? "All time" : timeRanges[nextIndex]} selected. Chart updated.`, "polite");
                /* Move focus to the newly active tab */
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  const buttons = parent.querySelectorAll<HTMLButtonElement>('[role="tab"]');
                  buttons[nextIndex]?.focus();
                }
              }}
              className={[
                "min-h-[44px] min-w-[44px] px-3 py-2",
                "rounded-md text-sm font-medium",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                isActive
                  ? "bg-action-primary text-inverse"
                  : "text-secondary hover:bg-surface-sunken",
              ].join(" ")}
            >
              {range}
            </button>
          );
        })}
      </div>

      {/* ─── Live region for announcements ─── */}
      <div
        ref={liveRegionRef}
        id={liveLabelId}
        /* a11y: aria-live="polite" announces data point changes when the user navigates the chart */
        aria-live="polite"
        /* a11y: aria-atomic="true" ensures the entire content is announced, not just changed portions */
        aria-atomic="true"
        className="sr-only"
        /* a11y: role="status" provides semantic meaning for the live region */
        role="status"
      />

      {/* ─── Tab panels ─── */}

      {/* Visual mode panel */}
      <div
        id={`chart-panel-visual-${uniqueId}`}
        /* a11y: role="tabpanel" identifies this as the content panel for the Visual tab */
        role="tabpanel"
        /* a11y: aria-labelledby references the tab that controls this panel */
        aria-labelledby={tablistId}
        hidden={activeMode !== "visual"}
      >
        {activeMode === "visual" && (
          <div className="space-y-3">
            {renderSVGChart()}
            {renderPointInfo()}
            {/* Keyboard slider */}
            <div
              ref={sliderRef}
              /* a11y: role="slider" provides semantic slider behavior for keyboard navigation */
              role="slider"
              /* a11y: tabIndex={0} makes the slider focusable via keyboard */
              tabIndex={0}
              /* a11y: aria-label provides context for what the slider controls */
              aria-label={`${title} data point navigator. Use arrow keys to step through data points.`}
              /* a11y: aria-valuemin defines the minimum slider value */
              aria-valuemin={0}
              /* a11y: aria-valuemax defines the maximum slider value */
              aria-valuemax={points.length - 1}
              /* a11y: aria-valuenow communicates the current position to screen readers */
              aria-valuenow={activePointIndex}
              /* a11y: aria-valuetext provides human-readable description of current value */
              aria-valuetext={activePoint ? `${formatDate(activePoint.date)}, ${formatValue(activePoint.value)}` : undefined}
              onKeyDown={handleSliderKeyDown}
              className={[
                "w-full min-h-[44px] px-3 py-2",
                "rounded-lg border border-border-default",
                "bg-surface-sunken text-sm text-muted text-center",
                "cursor-pointer",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
              ].join(" ")}
            >
              Use arrow keys to navigate data points ({activePointIndex + 1} of {points.length})
            </div>
          </div>
        )}
      </div>

      {/* Audio mode panel */}
      <div
        id={`chart-panel-audio-${uniqueId}`}
        /* a11y: role="tabpanel" identifies this as the content panel for the Audio tab */
        role="tabpanel"
        /* a11y: aria-labelledby references the tab that controls this panel */
        aria-labelledby={tablistId}
        hidden={activeMode !== "audio"}
      >
        {activeMode === "audio" && (
          <div className="space-y-3">
            {renderPointInfo()}
            {/* Slider for audio mode too */}
            <div
              /* a11y: role="slider" provides semantic slider behavior for keyboard navigation */
              role="slider"
              /* a11y: tabIndex={0} makes the slider keyboard-focusable */
              tabIndex={0}
              /* a11y: aria-label provides context for the audio scrub slider */
              aria-label={`${title} audio scrub. Use arrow keys to step through data points.`}
              /* a11y: aria-valuemin defines minimum slider value */
              aria-valuemin={0}
              /* a11y: aria-valuemax defines maximum slider value */
              aria-valuemax={points.length - 1}
              /* a11y: aria-valuenow communicates current position */
              aria-valuenow={activePointIndex}
              /* a11y: aria-valuetext provides human-readable current value */
              aria-valuetext={activePoint ? `${formatDate(activePoint.date)}, ${formatValue(activePoint.value)}` : undefined}
              onKeyDown={handleSliderKeyDown}
              className={[
                "w-full min-h-[44px] px-3 py-2",
                "rounded-lg border border-border-default",
                "bg-surface-sunken text-sm text-muted text-center",
                "cursor-pointer",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
              ].join(" ")}
            >
              Audio scrub: point {activePointIndex + 1} of {points.length}
            </div>
            {/* Previous / Next buttons for mouse users */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const newIdx = Math.max(activePointIndex - 1, 0);
                  setActivePointIndex(newIdx);
                  announcePoint(newIdx);
                }}
                disabled={activePointIndex === 0}
                /* a11y: aria-label provides accessible name for the previous button */
                aria-label="Previous data point"
                className={[
                  "min-h-[44px] min-w-[44px] px-4 py-2",
                  "rounded-lg border border-border-default",
                  "text-sm font-medium text-secondary",
                  "hover:bg-surface-sunken",
                  "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                {"\u2190"} Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const newIdx = Math.min(activePointIndex + 1, points.length - 1);
                  setActivePointIndex(newIdx);
                  announcePoint(newIdx);
                }}
                disabled={activePointIndex === points.length - 1}
                /* a11y: aria-label provides accessible name for the next button */
                aria-label="Next data point"
                className={[
                  "min-h-[44px] min-w-[44px] px-4 py-2",
                  "rounded-lg border border-border-default",
                  "text-sm font-medium text-secondary",
                  "hover:bg-surface-sunken",
                  "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                ].join(" ")}
              >
                Next {"\u2192"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Text mode panel */}
      <div
        id={`chart-panel-text-${uniqueId}`}
        /* a11y: role="tabpanel" identifies this as the content panel for the Text tab */
        role="tabpanel"
        /* a11y: aria-labelledby references the tab that controls this panel */
        aria-labelledby={tablistId}
        hidden={activeMode !== "text"}
      >
        {activeMode === "text" && renderTextMode()}
      </div>

      {/* ─── Data table (always available) ─── */}
      <details className="rounded-lg border border-border-default">
        <summary
          className={[
            "min-h-[44px] px-4 py-3",
            "cursor-pointer text-sm font-medium text-action-primary",
            "hover:bg-surface-sunken",
            "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
            "list-none",
          ].join(" ")}
        >
          View data table ({points.length} points)
        </summary>
        <div className="p-4 pt-0 overflow-x-auto">
          {renderDataTable()}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleCSVDownload}
              /* a11y: aria-label provides full description of the download action */
              aria-label={`Download ${title} data for ${activeRange} range as CSV`}
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
        </div>
      </details>
    </div>
  );
}
