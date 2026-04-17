"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CopilotPanel from "@/components/copilot/CopilotPanel";

/* ─── Navigation items ─── */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/orders", label: "Trade" },
  { href: "/history", label: "History" },
  { href: "/journal", label: "Journal" },
  { href: "/help", label: "Help" },
] as const;

/* ─── App Shell Layout ─── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  const previousPathname = useRef(pathname);

  /* Focus main on route change */
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      if (mainRef.current) {
        mainRef.current.focus();
      }
    }
  }, [pathname]);

  /* Listen for copilot query events from dashboard chips and other sources */
  useEffect(() => {
    function handleCopilotQuery(e: Event) {
      const query = (e as CustomEvent).detail;
      setCopilotInitialQuery(query);
    }
    window.addEventListener("accrue-copilot-query", handleCopilotQuery);
    return () => window.removeEventListener("accrue-copilot-query", handleCopilotQuery);
  }, []);

  return (
    <>
      {/* Skip links -- FIRST focusable elements */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <a href="#primary-nav" className="skip-link">
        Skip to navigation
      </a>

      <div className="min-h-screen flex flex-col">
        <header className="bg-surface-raised border-b border-border-default px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Brand */}
            <Link
              href="/dashboard"
              className="text-xl font-bold text-action-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px] flex items-center"
              aria-label="Accrue, go to dashboard"
            >
              Accrue
            </Link>

            {/* Primary Navigation */}
            <nav id="primary-nav" aria-label="Primary">
              <ul className="flex items-center gap-1">
                {NAV_ITEMS.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={`inline-flex items-center min-h-[44px] min-w-[44px] px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
                          isActive
                            ? "bg-action-primary text-inverse"
                            : "text-secondary hover:bg-surface-sunken hover:text-primary"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Spacer — the CopilotPanel component renders its own toggle button */}
            <div />
          </div>
        </header>

        <main
          id="main"
          ref={mainRef}
          tabIndex={-1}
          className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 focus:outline-none"
        >
          {children}
        </main>

        <CopilotPanel
          initialQuery={copilotInitialQuery}
          onInitialQueryConsumed={() => setCopilotInitialQuery(null)}
        />

        <footer className="bg-surface-raised border-t border-border-default px-4 py-4 mt-auto">
          <div className="max-w-7xl mx-auto text-center text-xs text-muted">
            <p>
              Accrue is a research prototype for an HCI thesis. No real money is
              involved. All data is simulated.
            </p>
            <p className="mt-1">
              Past performance does not guarantee future results. This is not
              financial advice.
            </p>
          </div>
        </footer>
      </div>

      {/* Global live regions (rendered by root layout, referenced here for completeness) */}
      <div id="app-status" role="status" aria-live="polite" className="sr-only" />
      <div id="app-alert" role="alert" aria-live="assertive" className="sr-only" />
    </>
  );
}
