"use client";

import { useEffect, useState, useCallback } from "react";

interface ToastProps {
  message: string;
  tone: "success" | "error" | "info";
  persistent?: boolean;
  onDismiss: () => void;
}

/**
 * Toast notification per spec.
 * - role="alert" for errors (assertive), role="status" for others (polite)
 * - Persistent option for errors — never auto-dismiss errors
 * - Escape dismisses
 * - Min 5 second display for non-persistent
 */
export function Toast({ message, tone, persistent = false, onDismiss }: ToastProps) {
  const [paused, setPaused] = useState(false);

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Auto-dismiss after 5s unless persistent or paused
  useEffect(() => {
    if (persistent || paused) return;
    const timer = setTimeout(dismiss, 5000);
    return () => clearTimeout(timer);
  }, [persistent, paused, dismiss]);

  // Escape to dismiss
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") dismiss();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dismiss]);

  const toneStyles = {
    success: "border-gain bg-gain/10 text-primary",
    error: "border-loss bg-loss/10 text-primary",
    info: "border-feedback-info bg-feedback-info/10 text-primary",
  };

  return (
    <div
      /* a11y: role="alert" for errors ensures immediate announcement; role="status" for polite */
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-xl border-l-4 shadow-lg ${toneStyles[tone]}`}
    >
      <div className="flex items-start gap-3">
        <p className="text-sm flex-1">{message}</p>
        <button
          onClick={dismiss}
          aria-label="Dismiss notification"
          className="text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
  );
}
