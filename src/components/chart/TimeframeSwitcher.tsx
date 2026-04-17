"use client";

import React, { useRef, useCallback } from "react";

export type Timeframe = "1D" | "1W" | "1M" | "3M" | "1Y" | "All";

interface TimeframeSwitcherProps {
  active: Timeframe;
  onChange: (tf: Timeframe) => void;
  label?: string;
}

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M", "3M", "1Y", "All"];

/**
 * TimeframeSwitcher -- APG Tabs pattern (role="tablist" + arrow key roving).
 * § 12 of the Chart Rebuild Spec.
 */
export default function TimeframeSwitcher({
  active,
  onChange,
  label = "Chart time range",
}: TimeframeSwitcherProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (index + 1) % TIMEFRAMES.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (index - 1 + TIMEFRAMES.length) % TIMEFRAMES.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = TIMEFRAMES.length - 1;
      } else {
        return;
      }
      onChange(TIMEFRAMES[nextIndex]);
      tabRefs.current[nextIndex]?.focus();
    },
    [onChange]
  );

  return (
    <div
      /* a11y: role="tablist" with arrow-key roving focus per APG Tabs pattern */
      role="tablist"
      /* a11y: aria-label identifies the purpose of this tablist for screen readers */
      aria-label={label}
      className="flex gap-1"
    >
      {TIMEFRAMES.map((tf, index) => {
        const isActive = active === tf;
        return (
          <button
            key={tf}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            /* a11y: role="tab" identifies each button as a tab */
            role="tab"
            /* a11y: aria-selected indicates the active timeframe */
            aria-selected={isActive}
            /* a11y: only active tab is in the tab order; others reachable via arrow keys */
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(tf)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={[
              "min-h-[44px] min-w-[44px] px-3 py-2",
              "rounded-md text-sm font-medium",
              "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
              isActive
                ? "bg-action-primary text-inverse"
                : "text-secondary hover:bg-surface-sunken",
            ].join(" ")}
          >
            {tf}
          </button>
        );
      })}
    </div>
  );
}
