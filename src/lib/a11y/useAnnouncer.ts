"use client";

/**
 * Announce a message to screen readers via global ARIA live regions.
 *
 * Uses the live region elements rendered in the root layout:
 *   - #announcer-polite  (aria-live="polite", role="status")
 *   - #announcer-assertive (aria-live="assertive", role="alert")
 *
 * @param message - The text to announce
 * @param priority - "polite" waits for the user to be idle; "assertive" interrupts immediately
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite"
): void {
  if (typeof document === "undefined") return;

  const id =
    priority === "assertive" ? "announcer-assertive" : "announcer-polite";
  const el = document.getElementById(id);

  if (!el) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[useAnnouncer] Live region #${id} not found in the DOM. ` +
          `Ensure the root layout renders the announcer elements.`
      );
    }
    return;
  }

  // Clear then set after a microtask so the browser detects the change
  // even if the same message is announced twice in a row.
  el.textContent = "";

  requestAnimationFrame(() => {
    el.textContent = message;
  });
}

/**
 * Announce a financial value change to screen readers.
 * Provides additional context for gain/loss announcements.
 *
 * @param label - What changed, e.g. "AAPL stock price"
 * @param value - The formatted value string
 * @param direction - Optional gain/loss direction
 */
export function announceFinancialUpdate(
  label: string,
  value: string,
  direction?: "gain" | "loss" | "unchanged"
): void {
  let directionText = "";
  if (direction === "gain") directionText = ", gain";
  if (direction === "loss") directionText = ", loss";

  announce(`${label}: ${value}${directionText}`, "polite");
}

/**
 * Announce a navigation event to screen readers.
 *
 * @param destination - The page or section the user navigated to
 */
export function announceNavigation(destination: string): void {
  announce(`Navigated to ${destination}`, "polite");
}

/**
 * Announce an error to screen readers immediately.
 *
 * @param errorMessage - The error text to announce
 */
export function announceError(errorMessage: string): void {
  announce(errorMessage, "assertive");
}
