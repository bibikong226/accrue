/**
 * Financial formatting utilities for the Accrue platform.
 * All formatters produce screen-reader-friendly output.
 */

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const sharesFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4,
});

/**
 * Format a number as USD currency.
 * Example: 1234.5 -> "$1,234.50"
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

/**
 * Format a compact currency value for large numbers.
 * Example: 2500000000 -> "$2.5B"
 */
export function formatCompactCurrency(value: number): string {
  return compactCurrencyFormatter.format(value);
}

/**
 * Format a signed currency value with explicit + or - prefix.
 * Example: 1234.5 -> "+$1,234.50", -500 -> "-$500.00"
 */
export function formatSignedCurrency(value: number): string {
  const formatted = currencyFormatter.format(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format a number as a percentage.
 * Example: 0.0356 -> "3.56%"
 */
export function formatPercent(value: number): string {
  return percentFormatter.format(value / 100);
}

/**
 * Format a signed percentage with explicit + or - prefix.
 * Input is already in percentage form (e.g., 3.56 means 3.56%).
 * Example: 3.56 -> "+3.56%", -2.1 -> "-2.10%"
 */
export function formatSignedPercent(value: number): string {
  const formatted = percentFormatter.format(Math.abs(value) / 100);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

/**
 * Format a plain number with commas.
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

/**
 * Format share quantities with up to 4 decimal places.
 * Example: 15.5 -> "15.5", 0.0034 -> "0.0034"
 */
export function formatShares(value: number): string {
  return sharesFormatter.format(value);
}

/**
 * Direction signal type for gain/loss display.
 */
export type GainLossDirection = "up" | "down" | "flat";

/**
 * Structured gain/loss display data for accessible rendering.
 */
export interface GainLossDisplay {
  /** Formatted text, e.g. "+$1,234.50 (+3.56%)" */
  text: string;
  /** Arrow character: "+" for up, "-" for down, "" for flat */
  arrow: string;
  /** Screen-reader label for the arrow direction */
  arrowLabel: string;
  /** Whether the value is positive */
  isPositive: boolean;
  /** Direction signal */
  signal: GainLossDirection;
}

/**
 * Build a complete gain/loss display object for accessible UI rendering.
 * Every financial value must be Tab-reachable and screen-reader readable.
 */
export function getGainLossDisplay(
  gainLoss: number,
  gainLossPercent: number
): GainLossDisplay {
  const isPositive = gainLoss > 0;
  const isNegative = gainLoss < 0;

  let signal: GainLossDirection = "flat";
  let arrow = "";
  let arrowLabel = "unchanged";

  if (isPositive) {
    signal = "up";
    arrow = "\u25B2"; // ▲
    arrowLabel = "gain";
  } else if (isNegative) {
    signal = "down";
    arrow = "\u25BC"; // ▼
    arrowLabel = "loss";
  }

  const currencyPart = formatSignedCurrency(gainLoss);
  const percentPart = formatSignedPercent(gainLossPercent);
  const text = `${currencyPart} (${percentPart})`;

  return { text, arrow, arrowLabel, isPositive, signal };
}

/**
 * Format a date string or Date object into a human-readable format.
 * Example: "2025-03-15" -> "Mar 15, 2025"
 */
export function formatDate(
  input: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };
  return date.toLocaleDateString("en-US", options ?? defaultOptions);
}

/**
 * Format a date as a relative time string for screen readers and UI.
 * Example: a date 2 hours ago -> "2 hours ago"
 */
export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60)
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  if (diffWeeks < 5)
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  if (diffMonths < 12)
    return `${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`;
  return `${diffYears} year${diffYears !== 1 ? "s" : ""} ago`;
}
