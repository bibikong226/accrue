"use client";

import React, { useState, useEffect, useRef, useCallback, useId } from "react";
import { MockCopilotAdapter } from "@/lib/copilot/mockAdapter";
import type { CopilotMessage, CopilotResponse, CopilotContext } from "@/lib/copilot/types";
import { portfolio, holdings, user, goalProgress } from "@/data/mockPortfolio";
import { glossary } from "@/data/glossary";
import AIResponse from "./AIResponse";
import { announce } from "@/lib/a11y/useAnnouncer";

const adapter = new MockCopilotAdapter();

const STARTER_PROMPTS = [
  "How diversified is my portfolio?",
  "What is my risk level?",
  "Explain my portfolio performance",
];

/**
 * CopilotPanel — the AI Copilot chat panel.
 *
 * Accessibility contract:
 * - <aside aria-label="AI Copilot"> landmark
 * - Ctrl+/ toggles open/close
 * - Escape closes panel and returns focus to invoker
 * - Focus moves to input on open
 * - Message log uses role="log" aria-live="polite"
 * - All interactive elements min 44x44px
 * - Visible focus indicators on all controls
 */
interface CopilotPanelProps {
  /** When set, the panel opens and auto-sends this query */
  initialQuery?: string | null;
  /** Called when the panel consumes the initial query, so parent can clear it */
  onInitialQueryConsumed?: () => void;
}

export default function CopilotPanel({ initialQuery, onInitialQueryConsumed }: CopilotPanelProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const inputId = `copilot-input-${uniqueId}`;

  /* Ctrl+/ global toggle */
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.key === "/") {
        e.preventDefault();
        setIsOpen((prev) => {
          if (!prev) {
            invokerRef.current = document.activeElement as HTMLElement;
          }
          return !prev;
        });
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  /* Handle initialQuery from parent (e.g., "What Changed" chips) */
  useEffect(() => {
    if (initialQuery) {
      setIsOpen(true);
      // Small delay to allow panel to render before sending
      const timer = setTimeout(() => {
        handleSend(initialQuery);
        onInitialQueryConsumed?.();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  /* Focus input when panel opens */
  useEffect(() => {
    if (isOpen) {
      // Small delay to allow panel to render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
      announce("AI Copilot panel opened. Type your question.", "polite");
    }
  }, [isOpen]);

  /* Close panel handler: returns focus to invoker */
  const closePanel = useCallback(() => {
    setIsOpen(false);
    announce("AI Copilot panel closed.", "polite");
    requestAnimationFrame(() => {
      invokerRef.current?.focus();
    });
  }, []);

  /* Escape to close */
  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        closePanel();
      }
    },
    [closePanel]
  );

  /* Scroll to bottom on new messages */
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  /* Build context from mock data for every copilot call */
  function buildContext(): CopilotContext {
    return {
      page: "dashboard",
      portfolioSummary: {
        totalValue: portfolio.totalValue,
        totalGainLoss: portfolio.totalGainLoss,
        totalGainLossPercent: portfolio.totalGainLossPercent,
        cashBalance: portfolio.cashBalance,
        diversificationRating: portfolio.diversificationRating,
        timeWeightedReturn: portfolio.timeWeightedReturn,
        allocationBySector: portfolio.allocationBySector,
      },
      userProfile: {
        name: user.name,
        riskTolerance: user.riskTolerance,
        experienceLevel: user.experienceLevel,
        timeHorizon: user.timeHorizon,
        goalType: user.goal.type,
        goalTarget: user.goal.target,
        goalDate: user.goal.byDate,
      },
      holdingSummaries: holdings.map((h) => ({
        symbol: h.symbol,
        name: h.name,
        allocation: h.allocation,
        gainLossPercent: h.gainLossPercent,
        sector: h.sector,
      })),
      goalProgress: {
        percentComplete: goalProgress.percentComplete,
        onTrack: goalProgress.onTrack,
        confidencePercent: goalProgress.confidencePercent,
      },
      glossaryTerms: glossary.map((g) => g.term),
    };
  }

  /* Send message */
  async function handleSend(query: string) {
    if (!query.trim() || isLoading) return;

    const userMessage: CopilotMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: query.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    const context = buildContext();

    try {
      const response: CopilotResponse = await adapter.generateResponse(
        query,
        context
      );

      const validation = adapter.validateResponse(response, context);

      if (!validation.valid) {
        const errorMessage: CopilotMessage = {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "I was unable to generate a reliable response. Please try rephrasing your question or consult the Research section for verified information.",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        announce(
          "AI Copilot could not generate a reliable response.",
          "polite"
        );
        return;
      }

      const assistantMessage: CopilotMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.content,
        response,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      announce("AI Copilot has responded.", "polite");
    } catch {
      const errorMessage: CopilotMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          "Something went wrong while generating a response. Please try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      announce("AI Copilot encountered an error.", "assertive");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(inputValue);
  }

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        type="button"
        onClick={() => {
          if (!isOpen) {
            invokerRef.current = document.activeElement as HTMLElement;
          }
          setIsOpen(!isOpen);
        }}
        /* a11y: aria-expanded tells screen readers whether the copilot panel is currently open */
        aria-expanded={isOpen}
        /* a11y: aria-controls references the panel element this button controls */
        aria-controls="copilot-panel"
        /* a11y: aria-label provides full accessible name including keyboard shortcut */
        aria-label="Toggle AI Copilot panel. Keyboard shortcut: Control plus slash"
        className={[
          "fixed bottom-6 right-6 z-40",
          "min-h-[44px] min-w-[44px] h-12 w-12",
          "rounded-full shadow-lg",
          "bg-action-primary text-inverse",
          "hover:bg-action-primary-hover",
          "inline-flex items-center justify-center",
          "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
        ].join(" ")}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          /* a11y: aria-hidden="true" because button has aria-label */
          aria-hidden="true"
        >
          <path
            d="M12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.07L2 22l4.93-1.38A9.96 9.96 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <circle cx="8" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="16" cy="12" r="1.5" fill="currentColor" />
        </svg>
      </button>

      {/* Panel */}
      {isOpen && (
        <aside
          id="copilot-panel"
          /* a11y: aria-label identifies this landmark for screen reader navigation */
          aria-label="AI Copilot"
          onKeyDown={handlePanelKeyDown}
          className={[
            "fixed bottom-0 right-0 z-50",
            "w-full sm:w-[400px] h-[600px] sm:h-[520px]",
            "sm:bottom-6 sm:right-6 sm:rounded-xl",
            "bg-surface-raised shadow-2xl border border-border-default",
            "flex flex-col",
          ].join(" ")}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <h2 className="text-base font-semibold text-primary">
              AI Copilot
            </h2>
            <button
              type="button"
              onClick={closePanel}
              /* a11y: aria-label provides accessible name for the close action */
              aria-label="Close AI Copilot panel"
              className={[
                "min-h-[44px] min-w-[44px]",
                "inline-flex items-center justify-center rounded-lg",
                "text-secondary hover:bg-surface-sunken",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
              ].join(" ")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                /* a11y: aria-hidden="true" because the button already has aria-label */
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

          {/* Message log */}
          <div
            ref={logRef}
            /* a11y: role="log" tells screen readers this is a log of sequential messages */
            role="log"
            /* a11y: aria-live="polite" announces new messages when the user is idle */
            aria-live="polite"
            /* a11y: aria-label provides context for the log region */
            aria-label="Copilot conversation history"
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-sm text-muted text-center mb-4">
                  Ask the AI Copilot a question about your portfolio.
                </p>
                {/* Starter prompts */}
                <div
                  className="space-y-2"
                  /* a11y: aria-label identifies the starter prompts group */
                  aria-label="Suggested questions"
                >
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className={[
                        "w-full text-left px-3 py-2",
                        "min-h-[44px] rounded-lg",
                        "text-sm text-action-primary",
                        "border border-border-default",
                        "hover:bg-surface-sunken",
                        "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                      ].join(" ")}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={[
                  "rounded-lg p-3",
                  message.role === "user"
                    ? "bg-surface-sunken ml-8 text-sm text-primary"
                    : "",
                ].join(" ")}
              >
                {message.role === "user" ? (
                  <p>{message.content}</p>
                ) : message.response ? (
                  <AIResponse response={message.response} />
                ) : (
                  /* Error/fallback message without full response metadata */
                  <div className="text-sm text-secondary italic">
                    {message.content}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div
                className="flex items-center gap-2 p-3"
                /* a11y: role="status" announces the loading state */
                role="status"
              >
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-action-primary border-t-transparent"
                  /* a11y: aria-hidden="true" because the status text below conveys the state */
                  aria-hidden="true"
                />
                <span className="text-sm text-muted">
                  AI Copilot is thinking...
                </span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="border-t border-border-default p-3 flex gap-2"
          >
            <label htmlFor={inputId} className="sr-only">
              {/* a11y: sr-only label provides accessible name for the input without visual clutter */}
              Ask the AI Copilot a question
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
              autoComplete="off"
              className={[
                "flex-1 min-h-[44px] px-3",
                "rounded-lg border border-border-default",
                "text-sm text-primary bg-surface-base",
                "placeholder:text-muted",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              /* a11y: aria-label provides accessible name for the send button */
              aria-label="Send message"
              className={[
                "min-h-[44px] min-w-[44px]",
                "inline-flex items-center justify-center rounded-lg",
                "bg-action-primary text-inverse",
                "hover:bg-action-primary-hover",
                "focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                /* a11y: aria-hidden="true" because button has aria-label */
                aria-hidden="true"
              >
                <path
                  d="M3 10l7-7m0 0l7 7m-7-7v14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  transform="rotate(90 10 10)"
                />
              </svg>
            </button>
          </form>
        </aside>
      )}
    </>
  );
}
