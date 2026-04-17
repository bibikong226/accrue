"use client";

/**
 * Shared announcer utility per spec.
 * Uses the global live regions mounted in the app layout.
 * polite: tab changes, sort changes, range selections, timer milestones.
 * assertive: trade confirmations, order errors, login failures, code expiry.
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const regionId =
    priority === "assertive" ? "assertive-announcer" : "polite-announcer";
  const region = document.getElementById(regionId);
  if (!region) return;

  // Clear then set via rAF to force re-announcement even if message is the same
  region.textContent = "";
  requestAnimationFrame(() => {
    region.textContent = message;
  });
}
