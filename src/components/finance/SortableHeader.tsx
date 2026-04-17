"use client";

import { useCallback } from "react";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDirection: "ascending" | "descending" | "none";
  onSort: (key: string) => void;
}

/**
 * Sortable table header per spec § 3.6.
 * Full-width <button> inside <th> with aria-sort on currently sorted header only.
 */
export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey;

  const handleClick = useCallback(() => {
    onSort(sortKey);
  }, [sortKey, onSort]);

  return (
    <th
      scope="col"
      /* a11y: aria-sort only applied to the currently sorted header, not all headers */
      aria-sort={isActive ? currentDirection : undefined}
      className="text-left text-xs font-medium text-secondary uppercase tracking-wider px-4 py-3"
    >
      <button
        type="button"
        onClick={handleClick}
        /* a11y: Accessible label communicates current sort state */
        aria-label={`Sort by ${label}${isActive ? `, currently sorted ${currentDirection}` : ""}`}
        className="inline-flex items-center gap-1 w-full text-left hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded min-h-[44px]"
      >
        {label}
        <span aria-hidden="true" className="text-muted">
          {isActive && currentDirection === "ascending" ? "↑" : ""}
          {isActive && currentDirection === "descending" ? "↓" : ""}
          {!isActive ? "↕" : ""}
        </span>
      </button>
    </th>
  );
}

/**
 * Companion component for announcing sort changes via live region.
 * Place once in the table parent and pass the current sort state.
 */
export function SortLive({
  sortKey,
  direction,
}: {
  sortKey: string | null;
  direction: "ascending" | "descending" | "none";
}) {
  if (!sortKey || direction === "none") return null;

  return (
    <div
      /* a11y: Polite live region announces sort changes per § 3.6 */
      role="status"
      aria-live="polite"
      className="sr-only"
    >
      Sorted by {sortKey}, {direction}.
    </div>
  );
}
