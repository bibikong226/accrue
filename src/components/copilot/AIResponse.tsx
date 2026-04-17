"use client";

import React, { useId } from "react";
import type { CopilotResponse, ConfidenceLevel } from "@/lib/copilot/types";

interface AIResponseProps {
  response: CopilotResponse;
}

const confidenceConfig: Record<
  ConfidenceLevel,
  {
    icon: string;
    label: string;
    srPrefix: string;
    borderClass: string;
    colorClass: string;
    bgClass: string;
  }
> = {
  high: {
    icon: "\u2713",
    label: "High confidence",
    srPrefix: "High confidence response.",
    borderClass: "border-2 border-solid border-ai-confidence-high",
    colorClass: "text-ai-confidence-high",
    bgClass: "bg-ai-confidence-high/10",
  },
  moderate: {
    icon: "\u24D8",
    label: "Moderate confidence",
    srPrefix: "Moderate confidence response.",
    borderClass: "border-2 border-dashed border-ai-confidence-medium",
    colorClass: "text-ai-confidence-medium",
    bgClass: "bg-ai-confidence-medium/10",
  },
  low: {
    icon: "\u26A0",
    label: "Low confidence",
    srPrefix: "Low confidence response. Consider verifying this information.",
    borderClass: "border-2 border-dotted border-ai-confidence-low",
    colorClass: "text-ai-confidence-low",
    bgClass: "bg-ai-confidence-low/10",
  },
};

/**
 * AIResponse — renders a single AI copilot response with three trust signals.
 *
 * Trust signals (per CLAUDE.md A3.3 / design-system section 2.8):
 * 1. AI provenance badge — always visible, tabIndex={0}, role="note"
 * 2. Confidence indicator — icon + word + color + border style, SR announces confidence FIRST
 * 3. Sources list — academic citations with title, publisher, date
 *
 * Low-confidence responses include a mandatory "Verify in Research" link (A3.4).
 */
export default function AIResponse({ response }: AIResponseProps) {
  const uniqueId = useId();
  const config = confidenceConfig[response.confidence];
  const contentId = `ai-response-content-${uniqueId}`;

  /* a11y: Use useId() for both IDs to avoid dots in response.id breaking aria references */
  const labelId = `ai-label-${uniqueId}`;
  const bodyId = `ai-body-${uniqueId}`;

  return (
    <article
      /* a11y: tabIndex={0} so Tab can reach this AI response card */
      tabIndex={0}
      /* a11y: aria-labelledby points to sr-only div that announces confidence first */
      aria-labelledby={labelId}
      /* a11y: aria-describedby points to the body paragraph for additional context */
      aria-describedby={bodyId}
      className={[
        "rounded-lg p-4",
        config.borderClass,
        /* Colored left border by confidence level for quick visual scanning */
        response.confidence === "high"
          ? "border-l-4 border-l-ai-confidence-high"
          : response.confidence === "moderate"
            ? "border-l-4 border-l-ai-confidence-medium"
            : "border-l-4 border-l-ai-confidence-low",
        "bg-surface-raised",
        "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
      ].join(" ")}
    >
      {/* a11y: sr-only label announced FIRST on Tab — includes confidence level AND
          a preview of the content so screen reader users hear something meaningful */}
      <div id={labelId} className="sr-only">
        AI insight, {config.label.toLowerCase()}. {response.content.substring(0, 150)}{response.content.length > 150 ? "..." : ""}
      </div>
      {/* Trust Signal 1: AI Provenance Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          /* a11y: role="note" identifies this as supplementary information about the content source */
          role="note"
          /* a11y: aria-label provides full accessible description of the provenance badge */
          aria-label="AI-generated"
          /* a11y: tabIndex={0} makes the badge focusable so keyboard users can discover it */
          tabIndex={0}
          className={[
            "inline-flex items-center gap-1.5 px-2.5 py-1",
            "rounded-full text-xs font-semibold",
            "bg-surface-sunken text-secondary",
            "min-h-[44px] min-w-[44px]",
            "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
          ].join(" ")}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            /* a11y: aria-hidden="true" because the badge text already conveys meaning */
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M5 9.5L7 4.5L9 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="5.5" y1="8" x2="8.5" y2="8" stroke="currentColor" strokeWidth="1" />
          </svg>
          AI Generated
        </span>

        {/* Trust Signal 2: Confidence Indicator */}
        <span
          className={[
            "inline-flex items-center gap-1.5 px-2.5 py-1",
            "rounded-full text-xs font-semibold",
            config.bgClass,
            config.colorClass,
            "min-h-[44px]",
          ].join(" ")}
        >
          {/* a11y: sr-only prefix ensures screen readers announce confidence FIRST before the visual label */}
          <span className="sr-only">{config.srPrefix}</span>
          <span
            /* a11y: aria-hidden="true" because the sr-only span above already conveys this information */
            aria-hidden="true"
          >
            {config.icon}
          </span>
          <span
            /* a11y: aria-hidden="true" to prevent double-reading since sr-only prefix covers it */
            aria-hidden="true"
          >
            {config.label}
          </span>
        </span>
      </div>

      {/* Response Content */}
      <p id={bodyId} className="text-sm text-primary leading-relaxed mb-4">
        {response.content}
      </p>

      {/* Low-confidence mandatory verification link (A3.4) */}
      {response.confidence === "low" && (
        <a
          href="/research"
          className={[
            "inline-flex items-center gap-1 mb-4",
            "min-h-[44px] px-3 py-2 rounded-lg",
            "text-sm font-semibold",
            "text-ai-confidence-low bg-ai-confidence-low/10",
            "hover:bg-ai-confidence-low/20",
            "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
          ].join(" ")}
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

      {/* Trust Signal 3: Sources List — wrapped in <footer> for semantic structure */}
      {response.sources.length > 0 && (
        <footer className="border-t border-border-default pt-3">
          <h4 className="text-xs font-semibold text-muted uppercase tracking-wide mb-2">
            Sources
          </h4>
          <ul
            className="list-none p-0 m-0 space-y-1"
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
                    className={[
                      "underline underline-offset-2",
                      "hover:text-action-primary",
                      "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                      "min-h-[44px] inline-flex items-center",
                    ].join(" ")}
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
        </footer>
      )}
    </article>
  );
}
