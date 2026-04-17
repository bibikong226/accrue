"use client";

import React, { useEffect, useRef } from "react";

export interface FieldError {
  /** The id of the form field this error belongs to */
  fieldId: string;
  /** Human-readable error message */
  message: string;
}

interface ErrorSummaryProps {
  /** List of field-specific errors */
  errors: FieldError[];
  /** Heading text for the error summary */
  heading?: string;
}

/**
 * ErrorSummary — renders a grouped error summary that auto-focuses on mount.
 *
 * Accessibility contract:
 * - role="alert" triggers immediate screen reader announcement
 * - Auto-focuses the summary container on mount so SR users hear errors
 * - Each error is a link that calls .focus() on the associated form field
 * - Minimum 44px touch targets for error links
 * - Visible focus indicators on all interactive elements
 * - Uses aria-describedby pattern: field errors also appear inline (not handled here)
 */
export default function ErrorSummary({
  errors,
  heading = "There are errors in this form",
}: ErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  /* Auto-focus the summary on mount so screen readers announce it immediately */
  useEffect(() => {
    if (errors.length > 0 && summaryRef.current) {
      summaryRef.current.focus();
    }
  }, [errors]);

  if (errors.length === 0) return null;

  /**
   * Focus the field associated with the error.
   * Uses document.getElementById to find the field and calls .focus().
   */
  function handleErrorClick(
    e: React.MouseEvent | React.KeyboardEvent,
    fieldId: string
  ) {
    e.preventDefault();
    const field = document.getElementById(fieldId);
    if (field) {
      field.focus();
      field.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div
      ref={summaryRef}
      /* a11y: role="alert" causes screen readers to immediately announce the content when it appears */
      role="alert"
      /* a11y: tabIndex="-1" allows programmatic focus without adding to tab order */
      tabIndex={-1}
      /* a11y: aria-labelledby points to the heading for the alert landmark */
      aria-labelledby="error-summary-heading"
      className={[
        "rounded-lg border-2 border-feedback-error",
        "bg-feedback-error/5 p-4 mb-6",
        "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
      ].join(" ")}
    >
      <h2
        id="error-summary-heading"
        className="text-base font-semibold text-feedback-error mb-2"
      >
        {heading}
      </h2>

      <p className="text-sm text-secondary mb-3">
        {errors.length === 1
          ? "Please correct the following error:"
          : `Please correct the following ${errors.length} errors:`}
      </p>

      <ul className="list-none p-0 m-0 space-y-1">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(e) => handleErrorClick(e, error.fieldId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleErrorClick(e, error.fieldId);
                }
              }}
              className={[
                "inline-flex items-center min-h-[44px] px-2",
                "text-sm text-feedback-error underline underline-offset-2",
                "hover:text-action-destructive-hover",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                "rounded",
              ].join(" ")}
            >
              <span
                /* a11y: aria-hidden="true" prevents decorative bullet from being read */
                aria-hidden="true"
                className="mr-2 text-feedback-error"
              >
                {"\u2022"}
              </span>
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
