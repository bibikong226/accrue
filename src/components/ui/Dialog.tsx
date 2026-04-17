"use client";

import React, { useEffect, useRef, useCallback, useId } from "react";

interface DialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when the dialog should close (Escape, overlay click, close button) */
  onClose: () => void;
  /** Accessible title displayed in the dialog header */
  title: string;
  /** Optional description text */
  description?: string;
  children: React.ReactNode;
}

/**
 * Dialog — accessible modal dialog with focus trap.
 *
 * Accessibility contract:
 * - aria-modal="true" prevents screen readers from reading behind the dialog
 * - aria-labelledby points to the dialog title
 * - aria-describedby points to optional description
 * - Focus is trapped within the dialog while open
 * - Escape key closes the dialog
 * - Focus returns to the element that opened the dialog on close
 * - Overlay click closes the dialog
 * - Close button has min 44x44px target
 */
export default function Dialog({
  open,
  onClose,
  title,
  description,
  children,
}: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const uniqueId = useId();
  const titleId = `dialog-title-${uniqueId}`;
  const descriptionId = `dialog-desc-${uniqueId}`;

  /* Store the element that had focus when dialog opened */
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [open]);

  /* Focus the dialog container when opened; restore focus when closed */
  useEffect(() => {
    if (open && dialogRef.current) {
      dialogRef.current.focus();
    }

    return () => {
      if (!open && previousFocusRef.current) {
        previousFocusRef.current.focus();
        previousFocusRef.current = null;
      }
    };
  }, [open]);

  /* Prevent body scroll while dialog is open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  /* Focus trap: Tab and Shift+Tab cycle within the dialog */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableSelectors = [
          'a[href]',
          'button:not([disabled])',
          'input:not([disabled])',
          'select:not([disabled])',
          'textarea:not([disabled])',
          '[tabindex]:not([tabindex="-1"])',
        ].join(", ");

        const focusableElements =
          dialogRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        if (!firstFocusable) return;

        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-primary/50"
        /* a11y: aria-hidden prevents the decorative overlay from being announced */
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        ref={dialogRef}
        /* a11y: role="dialog" identifies this as a dialog landmark for assistive technology */
        role="dialog"
        /* a11y: aria-modal="true" tells screen readers content behind the dialog is inert */
        aria-modal="true"
        /* a11y: aria-labelledby references the title element so screen readers announce the dialog purpose */
        aria-labelledby={titleId}
        /* a11y: aria-describedby references optional description for additional context */
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={[
          "relative z-10 w-full max-w-lg mx-4",
          "bg-surface-raised rounded-xl shadow-xl",
          "p-6",
          "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 id={titleId} className="text-lg font-semibold text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            /* a11y: aria-label provides accessible name since the button only contains an icon */
            aria-label="Close dialog"
            className={[
              "min-h-[44px] min-w-[44px]",
              "inline-flex items-center justify-center",
              "rounded-lg text-secondary",
              "hover:bg-surface-sunken",
              "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
            ].join(" ")}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              /* a11y: aria-hidden="true" since the button already has an aria-label */
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Description */}
        {description && (
          <p id={descriptionId} className="text-sm text-secondary mb-4">
            {description}
          </p>
        )}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
