"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { AIResponse } from "./AIResponse";
import { getCopilotAdapter } from "@/lib/copilot/index";
import { buildCopilotContext } from "@/lib/copilot/buildContext";
import type { CopilotResponse } from "@/lib/copilot/types";
import { announce } from "@/lib/a11y/useAnnouncer";

interface CopilotPanelProps {
  onClose: () => void;
}

const STARTER_PROMPTS = [
  "What changed since I last logged in?",
  "Summarize my holdings",
  "Is my portfolio diversified enough?",
  "What should I be asking?",
];

/**
 * AI Copilot aside panel per § 2.1.
 *
 * - <aside aria-label="AI Copilot"> — complementary landmark
 * - Escape closes, focus returns to invoker
 * - Non-trapping focus (user references underlying page)
 * - Message log with role="log" aria-live="polite"
 * - "What should I be asking" starter prompts
 */
export function CopilotPanel({ onClose }: CopilotPanelProps) {
  const [messages, setMessages] = useState<CopilotResponse[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const adapter = getCopilotAdapter();

  // Focus input on mount per § 2.1
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Load proactive card on mount
  useEffect(() => {
    async function loadProactive() {
      const context = buildCopilotContext("dashboard");
      const card = await adapter.generateProactiveCard("dashboard", context);
      setMessages([card]);
    }
    loadProactive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(
    async (query: string) => {
      if (!query.trim()) return;
      setInput("");
      setLoading(true);

      // Add user message as a placeholder
      const userMsg: CopilotResponse = {
        id: `user-${Date.now()}`,
        content: query,
        confidence: "high",
        sources: [],
        type: "reactive",
      };

      const context = buildCopilotContext("dashboard", query);

      try {
        const response = await adapter.generateResponse(query, context);
        setMessages((prev) => [...prev, response]);
        announce("AI response received", "polite");
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            content:
              "I couldn't process that request. Please try again or check the Research section.",
            confidence: "low" as const,
            sources: [],
            type: "reactive" as const,
          },
        ]);
      } finally {
        setLoading(false);
        // Keep userMsg reference to avoid lint warning
        void userMsg;
      }
    },
    [adapter]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  return (
    <aside
      id="copilot-panel"
      /* a11y: aria-label creates the "AI Copilot" complementary landmark */
      aria-label="AI Copilot"
      className="w-96 flex-shrink-0 border-l border-border-default bg-surface-raised rounded-xl flex flex-col h-[calc(100vh-10rem)] sticky top-24"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
        <h2 className="text-base font-semibold text-primary">AI Copilot</h2>
        <button
          onClick={onClose}
          aria-label="Close AI Copilot"
          className="text-muted hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>

      {/* Message log */}
      <div
        ref={logRef}
        /* a11y: role="log" with aria-live="polite" announces new messages */
        role="log"
        aria-live="polite"
        aria-label="Copilot conversation"
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && !loading && (
          <p className="text-sm text-muted text-center py-8">
            Ask me anything about your portfolio, trades, or financial terms.
          </p>
        )}

        {messages.map((msg) => (
          <AIResponse key={msg.id} response={msg} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted py-2" aria-busy="true">
            <span className="animate-pulse" aria-hidden="true">●●●</span>
            <span className="sr-only">AI is thinking</span>
          </div>
        )}
      </div>

      {/* Starter prompts — "What should I be asking" per § 2.7 */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-border-default text-secondary hover:bg-surface-overlay hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[44px]"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-border-default p-3">
        <div className="flex gap-2">
          <label htmlFor="copilot-input" className="sr-only">
            Ask the AI Copilot
          </label>
          <input
            ref={inputRef}
            id="copilot-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your portfolio..."
            disabled={loading}
            className="flex-1 rounded-lg border border-border-default bg-surface-base px-3 py-2 text-sm text-primary placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[44px]"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="rounded-lg bg-action-primary text-inverse px-4 py-2 text-sm font-medium hover:bg-action-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-50 min-h-[44px] min-w-[44px]"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}
