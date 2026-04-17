import React from "react";
import Link from "next/link";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Skip link */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      <div className="min-h-screen flex flex-col">
        <header className="bg-surface-raised border-b border-border-default px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center">
            <Link
              href="/"
              className="text-xl font-bold text-action-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px] flex items-center"
              aria-label="Accrue, go to home"
            >
              Accrue
            </Link>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 focus:outline-none"
        >
          {children}
        </main>

        <footer className="bg-surface-raised border-t border-border-default px-4 py-4 mt-auto">
          <div className="max-w-3xl mx-auto text-center text-xs text-muted">
            <p>
              Accrue is a research prototype for an HCI thesis. No real money is
              involved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
