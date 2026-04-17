"use client";

import React, { useState, useCallback, useMemo } from "react";
import type { DataPoint } from "@/data/mockPortfolio";
import { playOverviewEarcon } from "@/lib/chart/audio";
import { speakPoint, speakZone } from "@/lib/chart/speech";
import {
  narrateTrend,
  narrateExtrema,
  narrateVolatility,
  narrateEvents,
} from "@/lib/chart/zones";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Types ─── */

interface ChartListenProps {
  points: DataPoint[];
  title: string;
  ticker?: string;
  /** Current focused point index (lifted state) */
  activeIndex: number;
  onActiveIndexChange: (index: number) => void;
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

function fmtDateLong(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

const ZONE_KEYS = ["Trend", "Extrema", "Volatility", "Events"] as const;
type ZoneKey = (typeof ZONE_KEYS)[number];

/**
 * ChartListen -- Listen mode for chart data.
 * Play Overview earcon, Scrub slider with speech, 4 zone buttons.
 *
 * § 9 of the Chart Rebuild Spec.
 */
export default function ChartListen({
  points,
  title,
  ticker,
  activeIndex,
  onActiveIndexChange,
  formatValue = defaultFormat,
}: ChartListenProps) {
  const [activeZone, setActiveZone] = useState<ZoneKey | null>(null);

  const activePoint = points[activeIndex];

  /* ─── Zone narrations ─── */
  const zoneDescriptions = useMemo((): Record<ZoneKey, string> | null => {
    if (points.length < 2) return null;
    const zonePoints = points.map((p) => ({ date: p.date, value: p.value }));
    return {
      Trend: narrateTrend(zonePoints),
      Extrema: narrateExtrema(zonePoints),
      Volatility: narrateVolatility(zonePoints),
      Events: narrateEvents(zonePoints, ticker),
    };
  }, [points, ticker]);

  /* ─── Announce active point ─── */
  const announcePoint = useCallback(
    (index: number) => {
      const pt = points[index];
      if (!pt) return;
      const prev = index > 0 ? points[index - 1] : null;
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
    },
    [points, formatValue]
  );

  /* ─── Point info ─── */
  const renderPointInfo = () => {
    if (!activePoint) return null;
    const prev = activeIndex > 0 ? points[activeIndex - 1] : null;
    const change = prev ? activePoint.value - prev.value : null;
    const changePct =
      prev && change !== null ? (change / prev.value) * 100 : null;
    return (
      <div className="flex items-baseline gap-3 text-sm">
        <span className="font-medium text-primary">
          {fmtDateLong(activePoint.date)}
        </span>
        <span className="text-primary tabular-nums font-semibold">
          {formatValue(activePoint.value)}
        </span>
        {change !== null && changePct !== null && (
          <span
            className={
              change >= 0 ? "text-gain" : "text-loss"
            }
          >
            <span aria-hidden="true">
              {change > 0 ? "\u2191" : change < 0 ? "\u2193" : ""}
            </span>{" "}
            {change >= 0 ? "+" : ""}
            {changePct.toFixed(2)}%
          </span>
        )}
      </div>
    );
  };

  if (points.length === 0) {
    return <p className="text-sm text-muted p-4">No data available.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Play overview earcon button */}
      <button
        type="button"
        onClick={() => {
          playOverviewEarcon(
            points.map((p) => ({ date: p.date, value: p.value }))
          );
          announce("Playing audio overview of chart data.", "polite");
        }}
        /* a11y: aria-label provides accessible name for the play overview action */
        aria-label={`Play audio overview of ${title} chart`}
        className={[
          "min-h-[44px] min-w-[44px] px-4 py-2",
          "rounded-lg bg-action-primary text-inverse",
          "text-sm font-medium",
          "hover:bg-action-primary-hover",
          "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
        ].join(" ")}
      >
        Play overview
      </button>

      {renderPointInfo()}

      {/* Scrub slider that speaks each point */}
      <div>
        <label
          htmlFor="audio-scrub-listen"
          className="block text-xs text-muted mb-1"
        >
          Scrub through data points
        </label>
        <input
          id="audio-scrub-listen"
          type="range"
          min={0}
          max={points.length - 1}
          value={activeIndex}
          onChange={(e) => {
            const idx = parseInt(e.target.value, 10);
            onActiveIndexChange(idx);
            announcePoint(idx);
            if (points[idx]) {
              speakPoint(
                { date: points[idx].date, value: points[idx].value },
                idx,
                points.length
              );
            }
          }}
          /* a11y: aria-label provides context for the audio scrub slider */
          aria-label={`${title} audio scrub. Drag to step through data points.`}
          /* a11y: aria-valuetext provides human-readable current value */
          aria-valuetext={
            activePoint
              ? `${fmtDateLong(activePoint.date)}, ${formatValue(activePoint.value)}`
              : undefined
          }
          className={[
            "w-full min-h-[44px]",
            "cursor-pointer",
            "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
          ].join(" ")}
        />
        <p className="text-xs text-muted text-center mt-1">
          Point {activeIndex + 1} of {points.length}
        </p>
      </div>

      {/* Previous / Next buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            const newIdx = Math.max(activeIndex - 1, 0);
            onActiveIndexChange(newIdx);
            announcePoint(newIdx);
            if (points[newIdx]) {
              speakPoint(
                { date: points[newIdx].date, value: points[newIdx].value },
                newIdx,
                points.length
              );
            }
          }}
          disabled={activeIndex === 0}
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
            const newIdx = Math.min(activeIndex + 1, points.length - 1);
            onActiveIndexChange(newIdx);
            announcePoint(newIdx);
            if (points[newIdx]) {
              speakPoint(
                { date: points[newIdx].date, value: points[newIdx].value },
                newIdx,
                points.length
              );
            }
          }}
          disabled={activeIndex === points.length - 1}
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

      {/* ─── Semantic Zone Buttons ─── */}
      {zoneDescriptions && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted uppercase tracking-wide">
            Explore by zone
          </p>
          <div className="flex flex-wrap gap-2">
            {ZONE_KEYS.map((zone) => {
              const isActive = activeZone === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  /* a11y: aria-pressed indicates toggle state */
                  aria-pressed={isActive}
                  onClick={() => {
                    setActiveZone(isActive ? null : zone);
                    const desc = zoneDescriptions[zone];
                    announce(desc, "polite");
                    speakZone(desc);
                  }}
                  className={[
                    "min-h-[44px] min-w-[44px] px-4 py-2",
                    "rounded-lg text-sm font-medium",
                    "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                    isActive
                      ? "bg-action-primary text-inverse"
                      : "border border-border-default text-secondary hover:bg-surface-sunken",
                  ].join(" ")}
                >
                  {zone}
                </button>
              );
            })}
          </div>
          {/* Visible zone caption */}
          {activeZone && zoneDescriptions[activeZone] && (
            <p
              className="text-sm text-secondary bg-surface-sunken rounded-lg p-3"
              /* a11y: role="status" ensures screen readers pick up zone description changes */
              role="status"
            >
              {zoneDescriptions[activeZone]}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
