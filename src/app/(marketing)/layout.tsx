"use client";

import { useRef } from "react";
import Link from "next/link";

/**
 * Marketing layout — used for public pages (onboarding, landing).
 * Minimal chrome: brand only, no navigation (user is not authenticated).
 * Includes skip link and main landmark per § 12 / CLAUDE.md A1.8.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mainRef = useRef<HTMLElement>(null);

  return (
    <>
      {/* a11y: Skip link — first focusable element per § 12.1 */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-action-primary focus:px-4 focus:py-2 focus:text-inverse focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-focus-ring"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to main content
      </a>

      <header className="border-b border-border-default bg-surface-raised">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center">
            {/* Brand — links to root since user is unauthenticated */}
            <Link
              href="/"
              className="text-xl font-semibold text-action-primary tracking-tight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring rounded"
            >
              Accrue
            </Link>
          </div>
        </div>
      </header>

      {/* a11y: main landmark with tabindex="-1" for programmatic focus from skip link */}
      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 outline-none"
      >
        {children}
      </main>

      <footer className="border-t border-border-default mt-auto py-6">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-muted">
            Accrue is a research prototype. No real money is involved.
          </p>
        </div>
      </footer>
    </>
  );
}
