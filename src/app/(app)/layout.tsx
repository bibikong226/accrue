"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";

/**
 * App shell layout with all required landmarks per § 12:
 * - Skip links as first focusable elements
 * - <header> with brand + primary nav
 * - <main id="main" tabindex="-1"> for skip-link target
 * - <aside aria-label="AI Copilot"> via CopilotPanel
 * - <footer>
 */

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/orders", label: "Trade" },
  { href: "/history", label: "History" },
  { href: "/journal", label: "Journal" },
  { href: "/help", label: "Help" },
] as const;

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [copilotOpen, setCopilotOpen] = useState(false);
  const copilotToggleRef = useRef<HTMLButtonElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  /* a11y: Announce page changes to screen readers by focusing main on route change */
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [pathname]);

  const toggleCopilot = useCallback(() => {
    setCopilotOpen((prev) => !prev);
  }, []);

  const closeCopilot = useCallback(() => {
    setCopilotOpen(false);
    /* a11y: Return focus to the toggle button that invoked the panel */
    copilotToggleRef.current?.focus();
  }, []);

  /* a11y: Global keyboard shortcut Ctrl+/ to toggle copilot per § 2.1 */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        toggleCopilot();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleCopilot]);

  return (
    <>
      {/* a11y: Skip link stack — first focusable elements on every page per § 12.1 */}
      <div className="skip-links">
        <a
          href="#main"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            mainRef.current?.focus();
          }}
        >
          Skip to main content
        </a>
        <a href="#primary-nav" className="skip-link">
          Skip to navigation
        </a>
        {copilotOpen && (
          <a href="#copilot-input" className="skip-link">
            Skip to AI Copilot
          </a>
        )}
      </div>

      <header className="border-b border-border-default bg-surface-raised sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Brand */}
            <Link
              href="/dashboard"
              className="text-xl font-semibold text-action-primary tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded"
            >
              Accrue
            </Link>

            {/* a11y: Primary navigation with aria-label and aria-current per § 12.1 */}
            <nav id="primary-nav" aria-label="Primary">
              <ul className="flex items-center gap-1" role="list">
                {NAV_ITEMS.map(({ href, label }) => {
                  const isActive =
                    pathname === href || pathname?.startsWith(href + "/");
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        /* a11y: aria-current="page" communicates the active page to screen readers */
                        aria-current={isActive ? "page" : undefined}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                          isActive
                            ? "bg-surface-overlay text-primary"
                            : "text-secondary hover:text-primary hover:bg-surface-overlay/50"
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Copilot toggle */}
            <button
              ref={copilotToggleRef}
              onClick={toggleCopilot}
              /* a11y: aria-expanded communicates the panel state to screen readers */
              aria-expanded={copilotOpen}
              /* a11y: aria-controls associates this button with the copilot panel */
              aria-controls="copilot-panel"
              className="inline-flex items-center gap-2 rounded-full bg-action-primary px-4 py-2 text-sm font-medium text-inverse hover:bg-action-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring min-h-[44px] min-w-[44px]"
            >
              <span aria-hidden="true">💬</span>
              Ask Accrue
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          {/* a11y: main landmark with tabindex="-1" for programmatic focus from skip link */}
          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className="flex-1 min-w-0 outline-none"
          >
            {children}
          </main>

          {/* Copilot panel — complementary landmark */}
          {copilotOpen && (
            <CopilotPanel onClose={closeCopilot} />
          )}
        </div>
      </div>

      <footer className="border-t border-border-default mt-12 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted">
            Accrue is a research prototype. No real money is involved. All data
            is simulated.
          </p>
          <p className="text-xs text-muted mt-2">
            Accrue is cash-only. We don&apos;t offer margin loans.
          </p>
        </div>
      </footer>

      {/* a11y: Global live regions for announcements */}
      <div
        /* a11y: Polite region for non-urgent updates (tab changes, sort changes, range selections) */
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="polite-announcer"
      />
      <div
        /* a11y: Assertive region for critical updates (trade confirmations, errors) */
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="assertive-announcer"
      />
    </>
  );
}
