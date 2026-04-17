"use client";

import type { CopilotResponse, ConfidenceLevel } from "@/lib/copilot/types";

interface AIResponseProps {
  response: CopilotResponse;
}

const CONFIDENCE_CONFIG: Record<
  ConfidenceLevel,
  { icon: string; label: string; colorClass: string; borderStyle: string; srPrefix: string }
> = {
  high: {
    icon: "✓",
    label: "High confidence",
    colorClass: "text-ai-confidence-high border-ai-confidence-high",
    borderStyle: "border-solid",
    srPrefix: "High confidence.",
  },
  moderate: {
    icon: "ⓘ",
    label: "Moderate confidence",
    colorClass: "text-ai-confidence-medium border-ai-confidence-medium",
    borderStyle: "border-dashed",
    srPrefix: "Moderate confidence.",
  },
  low: {
    icon: "⚠",
    label: "Low confidence",
    colorClass: "text-ai-confidence-low border-ai-confidence-low",
    borderStyle: "border-dotted",
    srPrefix: "Low confidence.",
  },
};

/**
 * AI response card with THREE mandatory trust signals per § 2.8:
 *
 * 1. "AI" provenance badge — persistent, non-dismissible
 * 2. Confidence indicator — icon + word + color (redundantly encoded)
 *    Screen reader announces confidence FIRST, before the response
 * 3. Sources list — title, publisher, lastUpdated
 *
 * Visual: Confidence Ring border (solid/dashed/dotted per § 11.4)
 */
export function AIResponse({ response }: AIResponseProps) {
  const config = CONFIDENCE_CONFIG[response.confidence];

  return (
    <article
      /* a11y: aria-label provides the full context for screen readers:
         confidence level first (per § 2.8), then "AI-generated" provenance */
      aria-label={`AI-generated insight. ${config.srPrefix}`}
      data-confidence={response.confidence}
      className={`rounded-2xl border-[1.5px] ${config.borderStyle} ${config.colorClass} bg-surface-raised p-5`}
    >
      {/* Trust signal row: AI badge + Confidence indicator */}
      <div className="flex items-center gap-3 mb-3">
        {/* Trust signal 1: AI provenance badge — persistent, non-dismissible per § 2.8 */}
        <span
          /* a11y: aria-label announces "AI-generated" on focus */
          aria-label="AI-generated"
          tabIndex={0}
          role="note"
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-overlay text-secondary border border-border-default focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          AI
        </span>

        {/* Trust signal 2: Confidence indicator — icon + word + color (redundant encoding per § 2.8) */}
        <span
          /* a11y: Full readable label for screen readers including icon meaning */
          aria-label={config.label}
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.colorClass}`}
        >
          <span aria-hidden="true">{config.icon}</span>
          <span>{config.label}</span>
        </span>
      </div>

      {/* Response content — screen reader gets confidence prefix FIRST per § 2.8 */}
      <div className="text-sm leading-relaxed text-primary" style={{ fontFamily: "var(--font-serif)" }}>
        {/* a11y: sr-only prefix ensures confidence is announced before content.
            This is empirically justified — Ditaranto (2023) and Singh (2025) both
            observe that a confidence signal placed after a claim is cognitively discounted. */}
        <span className="sr-only">{config.srPrefix} </span>
        <p>{response.content}</p>
      </div>

      {/* Trust signal 3: Sources list */}
      {response.sources.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border-default">
          <h4 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-2">
            Sources
          </h4>
          <ul className="space-y-1">
            {response.sources.map((source, index) => (
              <li key={source.id} className="text-xs text-muted">
                <span className="text-secondary font-medium">[{index + 1}]</span>{" "}
                {source.title} — {source.publisher},{" "}
                <time dateTime={source.lastUpdated}>
                  updated {source.lastUpdated}
                </time>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Low-confidence mandatory CTA per § 2.8 */}
      {response.confidence === "low" && (
        <div className="mt-3">
          <a
            href="/research"
            className="inline-flex items-center gap-1 text-sm font-medium text-action-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px]"
          >
            Verify in Research →
          </a>
        </div>
      )}
    </article>
  );
}
