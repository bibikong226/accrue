"use client";

import React, { useRef, useCallback } from "react";

export type Modality = "chart" | "table" | "listen";

interface ModalitySwitcherProps {
  active: Modality;
  onChange: (mode: Modality) => void;
  label?: string;
}

const MODES: { key: Modality; label: string }[] = [
  { key: "chart", label: "Chart" },
  { key: "table", label: "Table" },
  { key: "listen", label: "Listen" },
];

/**
 * ModalitySwitcher -- APG Tabs pattern for Chart | Table | Listen.
 * Same roving tabindex as TimeframeSwitcher.
 */
export default function ModalitySwitcher({
  active,
  onChange,
  label = "Chart view mode",
}: ModalitySwitcherProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let nextIndex = index;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        nextIndex = (index + 1) % MODES.length;
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        nextIndex = (index - 1 + MODES.length) % MODES.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = MODES.length - 1;
      } else {
        return;
      }
      onChange(MODES[nextIndex].key);
      tabRefs.current[nextIndex]?.focus();
    },
    [onChange]
  );

  return (
    <div
      /* a11y: role="tablist" with arrow-key roving focus per APG Tabs pattern */
      role="tablist"
      /* a11y: aria-label identifies this as the view-mode selector */
      aria-label={label}
      className="flex gap-1 rounded-lg bg-surface-sunken p-1 w-fit"
    >
      {MODES.map((mode, index) => {
        const isActive = active === mode.key;
        return (
          <button
            key={mode.key}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            type="button"
            /* a11y: role="tab" identifies each button as a tab */
            role="tab"
            /* a11y: aria-selected indicates which modality is active */
            aria-selected={isActive}
            /* a11y: only active tab in tab order */
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(mode.key)}
            onKeyDown={(e) => handleKeyDown(e, index)}
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
  );
}
