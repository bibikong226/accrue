"use client";

import React, { useState, useEffect, useMemo, useId } from "react";
import type { DataPoint, PriceHistory } from "@/data/mockPortfolio";
import ChartCanvas from "@/components/chart/ChartCanvas";
import ChartTable from "@/components/chart/ChartTable";
import ChartListen from "@/components/chart/ChartListen";
import TimeframeSwitcher, {
  type Timeframe,
} from "@/components/chart/TimeframeSwitcher";
import ModalitySwitcher, {
  type Modality,
} from "@/components/chart/ModalitySwitcher";
import { buildChartNarration } from "@/lib/chart/narration";
import { fixturesById } from "@/data/copilotFixtures";
import AIResponse from "@/components/copilot/AIResponse";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Types ─── */

interface ChartWrapperProps {
  /** Title for the chart (used in captions and labels) */
  title: string;
  /** Ticker symbol for narration and AI fixtures (e.g., "AAPL") */
  ticker?: string;
  /** Data keyed by timeframe. Accepts PriceHistory or a generic record. */
  data: PriceHistory | Record<string, DataPoint[]>;
  /** Format a numeric value for display (e.g., currency formatter) */
  formatValue?: (value: number) => string;
  /** Initial timeframe selection */
  defaultTimeframe?: Timeframe;
  /** Chart size preset */
  size?: "sm" | "md" | "lg";
  /** Whether to show benchmark overlay (reserved for future) */
  showBenchmark?: boolean;
  /** Whether to show the AI analysis card */
  showAICard?: boolean;
}

/* ─── Helpers ─── */

function defaultFormat(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(value);
}

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  "1D": "day",
  "1W": "week",
  "1M": "month",
  "3M": "3 months",
  "1Y": "year",
  All: "all time",
};

const SIZE_MAP: Record<string, { width: number; height: number }> = {
  sm: { width: 480, height: 240 },
  md: { width: 720, height: 320 },
  lg: { width: 960, height: 400 },
};

/**
 * ChartWrapper -- the tri-modal accessible chart orchestrator.
 *
 * Imports and composes: ChartCanvas, ChartTable, ChartListen,
 * TimeframeSwitcher, ModalitySwitcher, buildChartNarration, AIResponse.
 *
 * CRITICAL: The narration paragraph is ALWAYS VISIBLE below the chart
 * in a <figcaption>. The AI card always renders below it.
 *
 * § 2 of the Chart Rebuild Spec.
 */
export default function ChartWrapper({
  title,
  ticker,
  data,
  formatValue = defaultFormat,
  defaultTimeframe = "1M",
  size = "md",
  showBenchmark: _showBenchmark = false,
  showAICard = true,
}: ChartWrapperProps) {
  const uid = useId();

  /* ─── State ─── */
  const [activeTimeframe, setActiveTimeframe] =
    useState<Timeframe>(defaultTimeframe);
  const [activeModality, setActiveModality] = useState<Modality>("chart");
  const [activePointIndex, setActivePointIndex] = useState(0);

  /* ─── Derived ─── */
  const points: DataPoint[] = data[activeTimeframe] || [];
  const { width, height } = SIZE_MAP[size] || SIZE_MAP.md;

  /* Reset active point when timeframe changes */
  useEffect(() => {
    setActivePointIndex(0);
  }, [activeTimeframe]);

  /* ─── Chart narration (always visible below chart) ─── */
  const narration = useMemo(() => {
    const tickerName = ticker || title;
    return buildChartNarration({
      ticker: tickerName,
      timeframe: TIMEFRAME_LABELS[activeTimeframe],
      points: points.map((p) => ({ date: p.date, value: p.value })),
    });
  }, [ticker, title, activeTimeframe, points]);

  /* ─── AI fixture for chart explanation ─── */
  const chartFixtureId = ticker
    ? `explain.chart.${ticker}.${activeTimeframe}`
    : null;
  const chartAIResponse = chartFixtureId
    ? fixturesById[chartFixtureId]
    : undefined;

  /* ─── Timeframe change handler ─── */
  const handleTimeframeChange = (tf: Timeframe) => {
    setActiveTimeframe(tf);
    announce(
      `${tf === "All" ? "All time" : tf} selected. Chart updated.`,
      "polite"
    );
  };

  /* ─── Modality change handler ─── */
  const handleModalityChange = (mode: Modality) => {
    setActiveModality(mode);
    announce(`${mode === "chart" ? "Chart" : mode === "table" ? "Table" : "Listen"} view selected.`, "polite");
  };

  /* ─── Panel IDs ─── */
  const chartPanelId = `chart-panel-chart-${uid}`;
  const tablePanelId = `chart-panel-table-${uid}`;
  const listenPanelId = `chart-panel-listen-${uid}`;

  return (
    <div className="space-y-4">
      {/* ─── Modality Switcher: Chart | Table | Listen ─── */}
      <ModalitySwitcher
        active={activeModality}
        onChange={handleModalityChange}
        label={`${title} view modes`}
      />

      {/* ─── Timeframe Switcher ─── */}
      <TimeframeSwitcher
        active={activeTimeframe}
        onChange={handleTimeframeChange}
      />

      {/* ─── Live region for announcements ─── */}
      <div
        /* a11y: aria-live="polite" announces data changes to screen readers */
        aria-live="polite"
        /* a11y: aria-atomic="true" ensures full content is announced */
        aria-atomic="true"
        className="sr-only"
        /* a11y: role="status" provides semantic meaning */
        role="status"
      />

      {/* ─── Tab Panels ─── */}

      {/* Chart mode panel */}
      <div
        id={chartPanelId}
        /* a11y: role="tabpanel" identifies this as the Chart tab's content */
        role="tabpanel"
        aria-label="Chart view"
        hidden={activeModality !== "chart"}
      >
        {activeModality === "chart" && (
          <ChartCanvas
            points={points}
            width={width}
            height={height}
            formatValue={formatValue}
            activeIndex={activePointIndex}
            onActiveIndexChange={setActivePointIndex}
          />
        )}
      </div>

      {/* Table mode panel */}
      <div
        id={tablePanelId}
        /* a11y: role="tabpanel" identifies this as the Table tab's content */
        role="tabpanel"
        aria-label="Table view"
        hidden={activeModality !== "table"}
      >
        {activeModality === "table" && (
          <ChartTable
            points={points}
            title={title}
            timeframe={activeTimeframe}
            formatValue={formatValue}
          />
        )}
      </div>

      {/* Listen mode panel */}
      <div
        id={listenPanelId}
        /* a11y: role="tabpanel" identifies this as the Listen tab's content */
        role="tabpanel"
        aria-label="Listen view"
        hidden={activeModality !== "listen"}
      >
        {activeModality === "listen" && (
          <ChartListen
            points={points}
            title={title}
            ticker={ticker}
            activeIndex={activePointIndex}
            onActiveIndexChange={setActivePointIndex}
            formatValue={formatValue}
          />
        )}
      </div>

      {/* ─── Chart narration -- ALWAYS VISIBLE in all modes ─── */}
      <figure className="m-0">
        <figcaption className="text-sm text-secondary bg-surface-sunken rounded-lg p-4 leading-relaxed">
          {narration}
        </figcaption>
      </figure>

      {/* ─── AI analysis card from fixtures ─── */}
      {showAICard && chartAIResponse && (
        <div className="mt-4">
          <AIResponse response={chartAIResponse} />
        </div>
      )}
    </div>
  );
}
