/**
 * format.ts — Formatting utilities for financial data display.
 *
 * All formatting functions produce strings suitable for both visual display
 * and screen reader consumption. Currency values include explicit +/- signs
 * for gain/loss context per CLAUDE.md rule A1.6.
 */

/**
 * Format a number as US currency.
 * @example formatCurrency(99656.95) => "$99,656.95"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a currency value with explicit +/- sign for gain/loss display.
 * @example formatSignedCurrency(3421.10) => "+$3,421.10"
 * @example formatSignedCurrency(-200) => "-$200.00"
 */
export function formatSignedCurrency(value: number): string {
  const formatted = formatCurrency(Math.abs(value));
  return value >= 0 ? `+${formatted}` : `-${formatted}`;
}

/**
 * Format a number as a percentage with explicit +/- sign.
 * @example formatSignedPercent(3.56) => "+3.56%"
 * @example formatSignedPercent(-1.2) => "-1.20%"
 */
export function formatSignedPercent(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/**
 * Format a number as a percentage without sign.
 * @example formatPercent(83) => "83%"
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

/**
 * Format a number with commas for thousands separators.
 * @example formatNumber(99656.95) => "99,656.95"
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format shares count — no decimal for whole numbers.
 * @example formatShares(50) => "50"
 * @example formatShares(2.5) => "2.50"
 */
export function formatShares(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

/**
 * Get gain/loss display components for a11y: sign, arrow, color signal.
 * Per spec § 3.4 — explicit sign as text character, labeled arrows, color supplementary.
 */
export function getGainLossDisplay(value: number, percent: number) {
  const isPositive = value >= 0;
  return {
    text: formatSignedCurrency(value),
    percentText: formatSignedPercent(percent),
    arrow: isPositive ? "↑" : "↓",
    arrowLabel: isPositive ? "up" : "down",
    isPositive,
    signal: isPositive ? "gain" : "loss",
  };
}

/**
 * Format a date string as "Apr 10, 2026".
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format a relative timestamp: "2 hours ago", "yesterday".
 */
export function formatRelativeTime(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date("2026-04-16T12:00:00Z");
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(isoStr.split("T")[0]);
}
