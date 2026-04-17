"use client";

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
  useMemo,
} from "react";
import { scaleLinear, scaleTime } from "d3-scale";
import type { DataPoint } from "@/data/mockPortfolio";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Types ─── */

interface ChartCanvasProps {
  points: DataPoint[];
  width?: number;
  height?: number;
  formatValue?: (v: number) => string;
  /** Current focused point index (lifted state) */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
}

/* ─── Helpers ─── */

function fmtDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function fmtDateLong(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function defaultFormat(v: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(v);
}

/* ─── Padding ─── */
const PAD = { top: 20, right: 70, bottom: 40, left: 16 };

/**
 * ChartCanvas -- SVG chart with:
 * - scaleLinear / scaleTime from d3-scale
 * - solid 1px grid lines
 * - Y-axis on right, X-axis on bottom
 * - gradient fill under the line
 * - current-price ribbon
 * - cyan crosshair on hover/focus
 * - keyboard arrow navigation
 * - tooltip
 *
 * § 3 of the Chart Rebuild Spec.
 */
export default function ChartCanvas({
  points,
  width = 720,
  height = 320,
  formatValue = defaultFormat,
  activeIndex,
  onActiveIndexChange,
}: ChartCanvasProps) {
  const uid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartW = width - PAD.left - PAD.right;
  const chartH = height - PAD.top - PAD.bottom;

  /* ─── Scales ─── */
  const dates = useMemo(
    () => points.map((p) => new Date(p.date + "T00:00:00")),
    [points]
  );
  const values = useMemo(() => points.map((p) => p.value), [points]);
  const minVal = useMemo(() => Math.min(...values), [values]);
  const maxVal = useMemo(() => Math.max(...values), [values]);

  const xScale = useMemo(() => {
    if (dates.length === 0) return scaleTime().domain([new Date(), new Date()]).range([0, chartW]);
    return scaleTime()
      .domain([dates[0], dates[dates.length - 1]])
      .range([0, chartW]);
  }, [dates, chartW]);

  const yScale = useMemo(() => {
    const padding = (maxVal - minVal) * 0.08 || 1;
    return scaleLinear()
      .domain([minVal - padding, maxVal + padding])
      .range([chartH, 0]);
  }, [minVal, maxVal, chartH]);

  /* ─── Path ─── */
  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points
      .map((pt, i) => {
        const x = xScale(dates[i]);
        const y = yScale(pt.value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  }, [points, dates, xScale, yScale]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const top = points
      .map((pt, i) => {
        const x = xScale(dates[i]);
        const y = yScale(pt.value);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
    const lastX = xScale(dates[dates.length - 1]);
    const firstX = xScale(dates[0]);
    return `${top} L ${lastX} ${chartH} L ${firstX} ${chartH} Z`;
  }, [points, dates, xScale, yScale, chartH]);

  /* ─── Grid lines ─── */
  const yTicks = useMemo(() => yScale.ticks(5), [yScale]);
  const xTicks = useMemo(() => xScale.ticks(6), [xScale]);

  /* ─── Active / hovered point ─── */
  const displayIndex = hoveredIndex ?? activeIndex;
  const activePoint = points[displayIndex];
  const activeX = activePoint ? xScale(dates[displayIndex]) : 0;
  const activeY = activePoint ? yScale(activePoint.value) : 0;

  /* ─── Current price ribbon ─── */
  const currentPrice = points.length > 0 ? points[points.length - 1].value : 0;
  const currentPriceY = yScale(currentPrice);

  /* ─── Keyboard ─── */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = activeIndex;
      switch (e.key) {
        case "ArrowRight":
        case "ArrowUp":
          e.preventDefault();
          newIndex = Math.min(activeIndex + 1, points.length - 1);
          break;
        case "ArrowLeft":
        case "ArrowDown":
          e.preventDefault();
          newIndex = Math.max(activeIndex - 1, 0);
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
      onActiveIndexChange(newIndex);
      /* Announce the point */
      const pt = points[newIndex];
      if (pt) {
        const prev = newIndex > 0 ? points[newIndex - 1] : null;
        let changeText = "";
        if (prev) {
          const chg = pt.value - prev.value;
          const chgPct = (chg / prev.value) * 100;
          const dir = chg > 0 ? "Up" : chg < 0 ? "Down" : "Unchanged";
          changeText = `. ${dir} ${Math.abs(chgPct).toFixed(2)}% from previous`;
        }
        announce(
          `${fmtDateLong(pt.date)}. ${formatValue(pt.value)}${changeText}.`,
          "polite"
        );
      }
    },
    [activeIndex, points, onActiveIndexChange, formatValue]
  );

  /* ─── Mouse hover ─── */
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current || points.length === 0) return;
      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - PAD.left;
      const ratio = mouseX / chartW;
      const idx = Math.round(ratio * (points.length - 1));
      const clamped = Math.max(0, Math.min(points.length - 1, idx));
      setHoveredIndex(clamped);
    },
    [points.length, chartW]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  /* ─── Tooltip info ─── */
  const tooltipPoint = activePoint;
  const tooltipPrev =
    displayIndex > 0 ? points[displayIndex - 1] : null;
  const tooltipChange = tooltipPrev
    ? tooltipPoint.value - tooltipPrev.value
    : null;
  const tooltipChangePct =
    tooltipPrev && tooltipChange !== null
      ? (tooltipChange / tooltipPrev.value) * 100
      : null;

  if (points.length === 0) {
    return (
      <p className="text-sm text-muted p-4">No chart data available.</p>
    );
  }

  const gradientId = `chart-gradient-${uid}`;

  return (
    <div className="chart-canvas-wrap relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto chart-svg"
        /* a11y: the SVG is decorative; data is conveyed via the slider / table / listen modes */
        aria-hidden="true"
        focusable="false"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-chart)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent-chart)" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        <g transform={`translate(${PAD.left}, ${PAD.top})`}>
          {/* ─── Grid lines (horizontal) ─── */}
          {yTicks.map((tick) => (
            <line
              key={`gy-${tick}`}
              x1={0}
              x2={chartW}
              y1={yScale(tick)}
              y2={yScale(tick)}
              stroke="var(--color-grid-line)"
              strokeWidth="1"
            />
          ))}

          {/* ─── Grid lines (vertical) ─── */}
          {xTicks.map((tick, i) => (
            <line
              key={`gx-${i}`}
              x1={xScale(tick)}
              x2={xScale(tick)}
              y1={0}
              y2={chartH}
              stroke="var(--color-grid-line)"
              strokeWidth="1"
            />
          ))}

          {/* ─── Gradient fill ─── */}
          <path
            d={areaPath}
            fill={`url(#${gradientId})`}
          />

          {/* ─── Line ─── */}
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-accent-chart)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* ─── Current price ribbon ─── */}
          <line
            x1={0}
            x2={chartW}
            y1={currentPriceY}
            y2={currentPriceY}
            stroke="var(--color-accent)"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.5"
          />

          {/* ─── Cyan crosshair on hover/focus ─── */}
          {activePoint && (
            <>
              {/* Vertical crosshair line */}
              <line
                x1={activeX}
                x2={activeX}
                y1={0}
                y2={chartH}
                stroke="var(--color-accent-live)"
                strokeWidth="1"
                opacity="0.6"
              />
              {/* Horizontal crosshair line */}
              <line
                x1={0}
                x2={chartW}
                y1={activeY}
                y2={activeY}
                stroke="var(--color-accent-live)"
                strokeWidth="1"
                opacity="0.4"
              />
              {/* Focus dot */}
              <circle
                cx={activeX}
                cy={activeY}
                r="5"
                fill="var(--color-accent-chart)"
                stroke="var(--color-surface-raised)"
                strokeWidth="2"
              />
            </>
          )}

          {/* ─── Y-axis labels (right side) ─── */}
          {yTicks.map((tick) => (
            <text
              key={`yl-${tick}`}
              x={chartW + 8}
              y={yScale(tick)}
              dy="0.35em"
              fill="var(--color-muted)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              ${tick.toFixed(0)}
            </text>
          ))}

          {/* ─── X-axis labels (bottom) ─── */}
          {xTicks.map((tick, i) => (
            <text
              key={`xl-${i}`}
              x={xScale(tick)}
              y={chartH + 24}
              textAnchor="middle"
              fill="var(--color-muted)"
              fontSize="11"
              fontFamily="var(--font-mono)"
            >
              {fmtDate(tick.toISOString().split("T")[0])}
            </text>
          ))}
        </g>
      </svg>

      {/* ─── Tooltip ─── */}
      {tooltipPoint && (
        <div
          className="chart-tooltip"
          style={{
            left: `${((activeX + PAD.left) / width) * 100}%`,
            top: `${((activeY + PAD.top) / height) * 100 - 12}%`,
          }}
        >
          <span className="chart-tooltip-date">{fmtDateLong(tooltipPoint.date)}</span>
          <span className="chart-tooltip-value">{formatValue(tooltipPoint.value)}</span>
          {tooltipChange !== null && tooltipChangePct !== null && (
            <span
              className={
                tooltipChange >= 0
                  ? "chart-tooltip-change chart-tooltip-gain"
                  : "chart-tooltip-change chart-tooltip-loss"
              }
            >
              {tooltipChange >= 0 ? "+" : ""}
              {formatValue(tooltipChange)} ({tooltipChangePct >= 0 ? "+" : ""}
              {tooltipChangePct.toFixed(2)}%)
            </span>
          )}
        </div>
      )}

      {/* ─── Keyboard slider ─── */}
      <div
        /* a11y: role="slider" provides semantic slider behavior for keyboard navigation */
        role="slider"
        /* a11y: tabIndex={0} makes the slider focusable via keyboard */
        tabIndex={0}
        /* a11y: aria-label provides context for what the slider controls */
        aria-label="Chart data point navigator. Use arrow keys to step through data points."
        /* a11y: aria-valuemin/max/now define slider bounds */
        aria-valuemin={0}
        aria-valuemax={points.length - 1}
        aria-valuenow={activeIndex}
        /* a11y: aria-valuetext provides human-readable description */
        aria-valuetext={
          activePoint
            ? `${fmtDateLong(activePoint.date)}, ${formatValue(activePoint.value)}`
            : undefined
        }
        onKeyDown={handleKeyDown}
        className={[
          "w-full min-h-[44px] px-3 py-2 mt-2",
          "rounded-lg border border-border-default",
          "bg-surface-sunken text-sm text-muted text-center",
          "cursor-pointer",
          "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
        ].join(" ")}
      >
        Use arrow keys to navigate data points ({activeIndex + 1} of{" "}
        {points.length})
      </div>
    </div>
  );
}
