"use client";

import { useEffect, useRef } from "react";

interface FieldError {
  fieldId: string;
  fieldLabel: string;
  message: string;
}

interface ErrorSummaryProps {
  errors: FieldError[];
}

/**
 * Form error summary per § 1.1.
 * - role="alert" so VoiceOver announces immediately
 * - Auto-focuses on render
 * - Each error links to the failing field
 * - Names the specific field: "Email is required" not "Form error"
 * - Errors stay on screen until corrected — never auto-dismiss
 */
export function ErrorSummary({ errors }: ErrorSummaryProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Auto-focus on mount so screen reader announces immediately
  useEffect(() => {
    ref.current?.focus();
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div
      ref={ref}
      /* a11y: role="alert" forces immediate announcement by screen readers */
      role="alert"
      /* a11y: tabindex="-1" allows programmatic focus */
      tabIndex={-1}
      className="rounded-xl border border-loss bg-loss/5 p-4 mb-6 outline-none focus-visible:outline-2 focus-visible:outline-focus-ring"
    >
      <h2 className="text-base font-semibold text-loss mb-2">
        {errors.length === 1
          ? "There is 1 error in this form"
          : `There are ${errors.length} errors in this form`}
      </h2>
      <ul className="space-y-1">
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(e) => {
                e.preventDefault();
                const field = document.getElementById(error.fieldId);
                field?.focus();
              }}
              className="text-sm text-loss underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded"
            >
              {error.fieldLabel}: {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
