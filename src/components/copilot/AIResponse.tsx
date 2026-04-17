"use client";

import React, { useId } from "react";
import type { CopilotResponse, ConfidenceLevel } from "@/lib/copilot/types";

interface AIResponseProps {
  response: CopilotResponse;
}

const confidenceConfig: Record<
  ConfidenceLevel,
  {
    label: string;
    cardClass: string;
    chipClass: string;
  }
> = {
  high: {
    label: "High confidence",
    cardClass: "ai-card ai-card--high",
    chipClass: "confidence-chip confidence-chip--high",
  },
  moderate: {
    label: "Moderate confidence",
    cardClass: "ai-card ai-card--moderate",
    chipClass: "confidence-chip confidence-chip--moderate",
  },
  low: {
    label: "Low confidence",
    cardClass: "ai-card ai-card--low",
    chipClass: "confidence-chip confidence-chip--low",
  },
};

/**
 * AIResponse -- renders a single AI copilot response per section 2.4.
 *
 * Structure:
 * - <article> with aria-labelledby + aria-describedby + tabIndex={0}
 * - sr-only <span> with id for label (includes confidence + sources list)
 * - Confidence chip with aria-hidden="true" (already announced via label)
 * - Body in <p> with id for describedby
 * - <footer> wrapping sources <details>/<summary> + Verify CTA + feedback buttons
 * - Colored left border + gradient background by confidence level
 * - AI badge in JetBrains Mono 10px
 * - Confidence dot (8px circle) in the chip
 */
export default function AIResponse({ response }: AIResponseProps) {
  const uniqueId = useId();
  const config = confidenceConfig[response.confidence];

  const labelId = `ai-label-${uniqueId}`;
  const bodyId = `ai-body-${uniqueId}`;

  /* Build sources text for sr-only label */
  const sourcesText =
    response.sources.length > 0
      ? ` Sources: ${response.sources.map((s) => s.title).join(", ")}.`
      : "";

  return (
    <article
      /* a11y: tabIndex={0} so Tab can reach this AI response card */
      tabIndex={0}
      /* a11y: aria-labelledby points to sr-only span that announces confidence + sources first */
      aria-labelledby={labelId}
      /* a11y: aria-describedby points to the body paragraph for additional context */
      aria-describedby={bodyId}
      className={`${config.cardClass} focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
    >
      {/* a11y: sr-only label announced FIRST on Tab -- includes confidence level AND sources list */}
      <span id={labelId} className="sr-only">
        AI insight, {config.label.toLowerCase()}.{sourcesText}
      </span>

      {/* Header: AI badge + confidence chip */}
      <div className="flex items-center justify-between mb-3">
        {/* Trust Signal 1: AI Provenance Badge -- JetBrains Mono 10px per section 2.4 */}
        <span className="ai-badge" aria-label="AI-generated">
          AI
        </span>

        {/* Trust Signal 2: Confidence Chip -- aria-hidden because sr-only label already announces */}
        <span className={config.chipClass} aria-hidden="true">
          <span className="confidence-dot" />
          {config.label}
        </span>
      </div>

      {/* Response Content */}
      <p id={bodyId} className="text-sm text-primary leading-relaxed mb-4">
        {response.content}
      </p>

      {/* Footer: sources, verify CTA, feedback */}
      <footer className="border-t border-border-default pt-3">
        {/* Trust Signal 3: Sources List -- collapsible details/summary */}
        {response.sources.length > 0 && (
          <details className="mb-3">
            <summary className="text-xs font-semibold text-muted uppercase tracking-wide cursor-pointer min-h-[44px] flex items-center focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 rounded">
              Sources ({response.sources.length})
            </summary>
            <ul
              className="list-none p-0 m-0 space-y-1 mt-2"
              /* a11y: aria-label identifies this list for screen reader users navigating by list landmark */
              aria-label="Citation sources for this AI response"
            >
              {response.sources.map((source, index) => (
                <li
                  key={index}
                  className="text-xs text-secondary leading-relaxed"
                >
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-action-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px] inline-flex items-center"
                    >
                      {source.title}
                      <span className="sr-only">
                        {/* a11y: sr-only text warns screen reader users that this link opens in a new tab */}
                        {" "}(opens in new tab)
                      </span>
                    </a>
                  ) : (
                    <span className="font-medium">{source.title}</span>
                  )}
                  {" \u2014 "}
                  <span>{source.publisher}</span>
                  {", "}
                  <time dateTime={source.date}>
                    {new Date(source.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          </details>
        )}

        {/* Low-confidence mandatory verification link (A3.4) */}
        {response.confidence === "low" && (
          <a
            href="/research"
            className="inline-flex items-center gap-1 mb-3 min-h-[44px] px-3 py-2 rounded-lg text-sm font-semibold text-ai-low bg-ai-low-bg hover:opacity-80 focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Verify in Research
            <span
              /* a11y: aria-hidden="true" because it is a decorative arrow icon */
              aria-hidden="true"
            >
              {" \u2192"}
            </span>
          </a>
        )}

        {/* Feedback buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] px-2 py-1 rounded text-xs text-muted hover:text-primary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            aria-label="This response was helpful"
          >
            <span aria-hidden="true">{"\u{1F44D}"}</span> Helpful
          </button>
          <button
            type="button"
            className="min-h-[44px] min-w-[44px] px-2 py-1 rounded text-xs text-muted hover:text-primary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            aria-label="This response was not helpful"
          >
            <span aria-hidden="true">{"\u{1F44E}"}</span> Not helpful
          </button>
        </div>
      </footer>
    </article>
  );
}
