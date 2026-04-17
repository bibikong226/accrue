"use client";

import React, { useRef, useCallback } from "react";

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  /** Array of tab definitions */
  tabs: TabItem[];
  /** Currently active tab id */
  value: string;
  /** Called when a tab is activated */
  onChange: (id: string) => void;
  /** Accessible label for the tablist */
  label: string;
}

/**
 * Shared Tabs component per section 2.5.
 *
 * Keyboard interaction (roving tabIndex, focus-only arrows):
 * - ArrowRight/ArrowLeft move focus ONLY (do not activate)
 * - Home/End jump to first/last tab
 * - Click/Enter/Space activates
 *
 * ARIA pattern:
 * - role="tablist" with aria-label
 * - Each tab: role="tab", aria-selected, aria-controls, roving tabIndex
 * - role="tabpanel" with aria-labelledby, hidden when inactive, tabIndex={0}
 */
export default function Tabs({ tabs, value, onChange, label }: TabsProps) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusTab = useCallback(
    (index: number) => {
      tabRefs.current[index]?.focus();
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const count = tabs.length;
      let nextIndex: number | null = null;

      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          /* Move focus only -- does not activate */
          nextIndex = (index + 1) % count;
          break;
        case "ArrowLeft":
          e.preventDefault();
          /* Move focus only -- does not activate */
          nextIndex = (index - 1 + count) % count;
          break;
        case "Home":
          e.preventDefault();
          nextIndex = 0;
          break;
        case "End":
          e.preventDefault();
          nextIndex = count - 1;
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          /* Activate on Enter/Space */
          onChange(tabs[index].id);
          return;
        default:
          return;
      }

      if (nextIndex !== null) {
        focusTab(nextIndex);
      }
    },
    [tabs, onChange, focusTab]
  );

  return (
    <>
      {/* Tablist */}
      <div
        role="tablist"
        aria-label={label}
        className="flex border-b border-border-default"
      >
        {tabs.map((tab, index) => {
          const isSelected = value === tab.id;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[index] = el;
              }}
              role="tab"
              id={`tab-${tab.id}`}
              /* a11y: aria-selected indicates which tab is currently active */
              aria-selected={isSelected}
              /* a11y: aria-controls links the tab to its panel */
              aria-controls={`tabpanel-${tab.id}`}
              /* a11y: roving tabIndex -- only selected tab is in tab order */
              tabIndex={isSelected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={[
                "min-h-[44px] min-w-[44px] px-4 py-2",
                "text-sm font-medium border-b-2 transition-colors",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                isSelected
                  ? "border-action-primary text-action-primary"
                  : "border-transparent text-muted hover:text-primary hover:border-border-strong",
              ].join(" ")}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => {
        const isSelected = value === tab.id;
        return (
          <div
            key={tab.id}
            role="tabpanel"
            id={`tabpanel-${tab.id}`}
            /* a11y: aria-labelledby links the panel back to its tab */
            aria-labelledby={`tab-${tab.id}`}
            /* a11y: hidden attribute hides inactive panels from all users */
            hidden={!isSelected}
            /* a11y: tabIndex={0} so the panel is focusable for keyboard navigation */
            tabIndex={0}
            className="focus:outline-none"
          >
            {tab.content}
          </div>
        );
      })}
    </>
  );
}
