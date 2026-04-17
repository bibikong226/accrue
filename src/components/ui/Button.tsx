"use client";

import React from "react";
import { cn } from "@/lib/utils";

/* ─── Variant types ─── */

type ButtonVariant = "primary" | "secondary" | "tertiary" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  /** Required for icon variant — provides accessible name */
  "aria-label"?: string;
  /** Shows a loading spinner and disables interaction */
  loading?: boolean;
  children: React.ReactNode;
}

/**
 * Button — the core interactive primitive.
 *
 * Accessibility contract:
 * - Minimum 44x44px touch/click target (WCAG 2.5.8)
 * - Visible focus indicator: 3px solid #2563EB, 2px offset
 * - Loading state communicated via aria-busy + disabled
 * - Icon variant requires aria-label (enforced at runtime)
 */
export default function Button({
  variant = "primary",
  loading = false,
  disabled = false,
  className,
  children,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Runtime guard: icon variant must have aria-label
  if (variant === "icon" && !props["aria-label"]) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[Button] Icon variant requires an aria-label prop for accessibility."
      );
    }
  }

  const baseStyles = [
    "inline-flex items-center justify-center gap-2",
    "min-h-[44px] min-w-[44px]",
    "font-medium text-sm leading-tight",
    "transition-colors duration-150",
    "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
    "disabled:cursor-not-allowed disabled:opacity-50",
  ];

  const variantStyles: Record<ButtonVariant, string> = {
    primary: cn(
      "bg-feedback-success text-inverse",
      "rounded-full px-6 h-[48px]",
      "hover:bg-action-primary-hover",
      "active:bg-action-primary"
    ),
    secondary: cn(
      "border-[1.5px] border-action-destructive text-action-destructive",
      "bg-transparent rounded-lg px-5",
      "hover:bg-action-destructive/10",
      "active:bg-action-destructive/20"
    ),
    tertiary: cn(
      "text-action-primary bg-transparent",
      "px-3 text-sm underline-offset-2",
      "hover:underline",
      "active:text-action-primary-hover"
    ),
    icon: cn(
      "rounded-lg p-2",
      "text-secondary bg-transparent",
      "hover:bg-surface-sunken",
      "active:bg-border-default"
    ),
  };

  return (
    <button
      type="button"
      disabled={isDisabled}
      /* a11y: aria-busy tells assistive tech that the button action is in progress */
      aria-busy={loading || undefined}
      /* a11y: aria-disabled provides semantic disabled state for screen readers */
      aria-disabled={isDisabled || undefined}
      className={cn(...baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {loading && (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          /* a11y: aria-hidden prevents spinner SVG from being announced; aria-busy on parent conveys state */
          aria-hidden="true"
        />
      )}
      {loading && (
        <span
          className="sr-only"
          /* a11y: sr-only text announces loading state to screen readers */
        >
          Loading, please wait.
        </span>
      )}
      {children}
    </button>
  );
}
