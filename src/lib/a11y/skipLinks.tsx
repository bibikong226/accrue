"use client";

/**
 * Skip link stack — first focusable elements on every page per § 12.
 * sr-only by default, visible on focus with high contrast.
 */
export function SkipLinks({ copilotHasMessages = false }: { copilotHasMessages?: boolean }) {
  return (
    <div className="skip-links">
      {/* a11y: Skip to main content — allows keyboard users to bypass navigation */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      {/* a11y: Skip to navigation — allows keyboard users to reach nav directly */}
      <a href="#primary-nav" className="skip-link">
        Skip to navigation
      </a>
      {/* a11y: Dynamic skip link per § 2.1 — only appears when copilot has messages */}
      {copilotHasMessages && (
        <a href="#copilot-input" className="skip-link">
          Skip to AI Copilot
        </a>
      )}
    </div>
  );
}
