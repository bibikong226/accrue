"use client";

import { useEffect, useRef, useCallback } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  preventClose?: boolean;
}

/**
 * Modal dialog with focus management per § 12.
 * - Saves invoking element and restores focus on close
 * - Traps focus inside while open
 * - Escape closes (unless preventClose)
 * - aria-modal="true", aria-labelledby points to heading
 */
export function Dialog({ open, onClose, title, children, preventClose = false }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const invokerRef = useRef<Element | null>(null);
  const titleId = `dialog-title-${title.replace(/\s+/g, "-").toLowerCase()}`;

  // Save invoker on open
  useEffect(() => {
    if (open) {
      invokerRef.current = document.activeElement;
      // Focus first focusable element inside dialog
      requestAnimationFrame(() => {
        const focusable = dialogRef.current?.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable?.focus();
      });
    }
  }, [open]);

  // Restore focus on close
  useEffect(() => {
    if (!open && invokerRef.current instanceof HTMLElement) {
      invokerRef.current.focus();
    }
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open || preventClose) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, preventClose, onClose]);

  // Focus trap
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Tab" || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    },
    []
  );

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={preventClose ? undefined : onClose}
        aria-hidden="true"
      />
      {/* Dialog */}
      <div
        ref={dialogRef}
        /* a11y: role="dialog" identifies this as a modal dialog */
        role="dialog"
        /* a11y: aria-modal="true" tells screen readers this traps focus */
        aria-modal="true"
        /* a11y: aria-labelledby points to the dialog heading */
        aria-labelledby={titleId}
        onKeyDown={handleKeyDown}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="bg-surface-raised rounded-2xl shadow-lg max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
          <h2 id={titleId} className="text-xl font-semibold text-primary mb-4">
            {title}
          </h2>
          {children}
          {!preventClose && (
            <button
              onClick={onClose}
              className="mt-4 text-sm text-secondary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded min-h-[44px] min-w-[44px] px-3 py-2"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
}
