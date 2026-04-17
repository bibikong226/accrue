"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Navigation items ─── */
const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/research", label: "Research" },
  { href: "/orders", label: "Trade" },
  { href: "/history", label: "History" },
  { href: "/journal", label: "Journal" },
  { href: "/help", label: "Help" },
] as const;

/* ─── Copilot Panel (inline) ─── */
function CopilotPanel({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <aside
      id="copilot-panel"
      ref={panelRef}
      aria-label="AI Copilot"
      className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface-raised border-l border-border-default shadow-lg z-40 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border-default">
        <h2 className="text-lg font-semibold text-primary">Ask Accrue</h2>
        <button
          onClick={onClose}
          aria-label="Close AI Copilot"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md border border-border-default hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          <span aria-hidden="true">&#10005;</span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-lg bg-surface-sunken p-4 mb-4">
          <p className="text-sm text-secondary">
            <span
              className="inline-block px-1.5 py-0.5 text-xs font-medium bg-feedback-info text-inverse rounded mr-2"
              aria-label="AI generated content"
            >
              AI
            </span>
            Hi! I am the Accrue AI Copilot. I can help explain financial
            concepts, summarize your portfolio, or answer questions about
            investing. I will never recommend specific trades.
          </p>
          <p className="text-xs text-muted mt-2">
            Confidence: High | Source: Accrue platform
          </p>
        </div>
      </div>
      <form
        className="p-4 border-t border-border-default"
        onSubmit={(e) => {
          e.preventDefault();
          announce("AI Copilot responses are currently using mock data.", "polite");
        }}
      >
        <label htmlFor="copilot-input" className="sr-only">
          Ask the AI Copilot a question
        </label>
        <div className="flex gap-2">
          <input
            id="copilot-input"
            ref={inputRef}
            type="text"
            placeholder="Ask a question..."
            className="flex-1 min-h-[44px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          />
          <button
            type="submit"
            className="min-w-[44px] min-h-[44px] px-4 rounded-md bg-action-primary text-inverse font-medium hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}

/* ─── App Shell Layout ─── */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [copilotOpen, setCopilotOpen] = useState(false);
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

  /* Ctrl+/ keyboard shortcut for copilot */
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setCopilotOpen((prev) => {
          const next = !prev;
          announce(
            next ? "AI Copilot opened" : "AI Copilot closed",
            "polite"
          );
          return next;
        });
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  const toggleCopilot = () => {
    setCopilotOpen((prev) => {
      const next = !prev;
      announce(next ? "AI Copilot opened" : "AI Copilot closed", "polite");
      return next;
    });
  };

  return (
    <>
      {/* Skip links — FIRST focusable elements */}
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

            {/* Ask Accrue Copilot Toggle */}
            <button
              onClick={toggleCopilot}
              aria-expanded={copilotOpen}
              aria-controls="copilot-panel"
              className="min-w-[44px] min-h-[44px] px-4 py-2 rounded-md border border-border-default text-sm font-medium text-secondary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Ask Accrue
              <span className="sr-only"> (Ctrl + /)</span>
            </button>
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
          isOpen={copilotOpen}
          onClose={() => {
            setCopilotOpen(false);
            announce("AI Copilot closed", "polite");
          }}
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
