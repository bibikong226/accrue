"use client";

import { forwardRef } from "react";
import { Spinner } from "./Spinner";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  /** Required for icon-only buttons */
  "aria-label"?: string;
}

/**
 * Accessible button per § 11.6.
 *
 * Variants:
 * - primary: Verdant fill, white text, pill-shaped 48px. For Buy actions. Sentence case.
 * - secondary: Ghost-styled, Vermillion border. For Sell actions. Equal prominence to primary.
 * - tertiary: Text-only, smaller. For "Proceed anyway" type actions.
 * - destructive: Vermillion fill for delete/cancel.
 * - icon: Icon-only with required aria-label.
 *
 * All buttons: min 44×44px, visible focus ring, loading/disabled states.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", loading = false, disabled, children, className = "", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]";

    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        "bg-gain text-inverse px-6 py-3 rounded-full text-[15px] font-semibold hover:bg-[#267040]",
      secondary:
        "border-[1.5px] border-loss text-loss bg-surface-base px-6 py-3 rounded-full text-[15px] font-semibold hover:bg-loss/10",
      tertiary:
        "text-secondary text-[13px] px-3 py-2 rounded-lg hover:text-primary hover:bg-surface-overlay",
      destructive:
        "bg-loss text-inverse px-6 py-3 rounded-full text-[15px] font-semibold hover:bg-action-destructive-hover",
      icon: "p-2 rounded-lg text-secondary hover:text-primary hover:bg-surface-overlay",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        /* a11y: aria-busy communicates loading state to screen readers */
        aria-busy={loading || undefined}
        /* a11y: aria-disabled for styling while keeping focusability */
        aria-disabled={disabled || loading || undefined}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading && <Spinner />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
export type { ButtonProps };
