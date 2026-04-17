"use client";

import React, { useState, useMemo } from "react";
import { glossary, type GlossaryEntry } from "@/data/glossary";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Life events ─── */
interface LearnCard {
  title: string;
  description: string;
}

interface LifeEvent {
  event: string;
  description: string;
  cards: LearnCard[];
}

const lifeEvents: LifeEvent[] = [
  {
    event: "Starting your first job",
    description:
      "You have a steady income and want to start building wealth. Here is what to know.",
    cards: [
      {
        title: "Set up an emergency fund first",
        description:
          "Before investing, save 3-6 months of expenses in a high-yield savings account. This protects you from needing to sell investments at a loss during emergencies.",
      },
      {
        title: "Understand your employer benefits",
        description:
          "If your employer offers a 401(k) match, contribute at least enough to get the full match. It is essentially free money and the best return you can get.",
      },
      {
        title: "Start with index funds",
        description:
          "Broad market index funds like VTI give you exposure to thousands of companies with very low fees. They are a great starting point for new investors.",
      },
    ],
  },
  {
    event: "Getting married",
    description:
      "Combining finances or planning together? Here is how to align your investment strategy.",
    cards: [
      {
        title: "Align on financial goals",
        description:
          "Discuss your risk tolerance, time horizons, and goals together. Partners often have different comfort levels with market volatility.",
      },
      {
        title: "Review beneficiaries",
        description:
          "Update beneficiaries on all accounts (retirement, brokerage, insurance) after marriage. This is often overlooked but critically important.",
      },
      {
        title: "Consider tax implications",
        description:
          "Marriage changes your tax bracket. Consider whether Roth or Traditional retirement accounts make more sense for your combined income.",
      },
    ],
  },
  {
    event: "Buying a home",
    description:
      "A home is likely your largest purchase. Here is how it affects your investment strategy.",
    cards: [
      {
        title: "Keep your down payment safe",
        description:
          "Money you need within 1-2 years should not be in the stock market. Use a high-yield savings account or short-term bonds for your down payment fund.",
      },
      {
        title: "Do not drain your retirement",
        description:
          "While you can borrow from a 401(k) for a home purchase, this comes with opportunity costs. The money loses years of compound growth.",
      },
      {
        title: "Factor in total housing costs",
        description:
          "Property taxes, insurance, maintenance, and HOA fees add up. Budget for these before reducing investment contributions.",
      },
    ],
  },
  {
    event: "Planning for retirement",
    description:
      "Whether retirement is 5 years or 30 years away, here is how to prepare.",
    cards: [
      {
        title: "Calculate your number",
        description:
          "A common rule of thumb is to save 25 times your annual expenses. If you spend $50,000 per year, aim for $1.25 million. Adjust based on expected Social Security and other income.",
      },
      {
        title: "Shift to income-producing assets",
        description:
          "As retirement approaches, gradually increase allocation to bonds and dividend-paying stocks to generate income and reduce volatility.",
      },
      {
        title: "Plan for healthcare costs",
        description:
          "Healthcare is often the largest expense in retirement. Consider an HSA (Health Savings Account) for its triple tax advantage if you are eligible.",
      },
    ],
  },
];

/* ─── FAQ data ─── */
interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "Is my money really at risk?",
    answer:
      "Accrue is a research prototype. No real money is involved. All data is simulated for evaluation purposes. In real investing, yes, all investments carry risk of loss. The value of your investments can go down as well as up.",
  },
  {
    question: "What is the AI Copilot?",
    answer:
      "The AI Copilot is an educational assistant powered by AI. It can explain financial concepts, summarize your portfolio, and flag potential concerns. It never recommends specific trades or tells you what to buy or sell.",
  },
  {
    question: "Why does Accrue not have confetti or rewards?",
    answer:
      "Research shows that gamification features (confetti, streaks, badges) can encourage more frequent trading, which typically hurts long-term returns. Accrue treats investing as a serious financial decision, not a game.",
  },
  {
    question: "How is the AI Copilot different from other AI assistants?",
    answer:
      "The Accrue AI Copilot has three key constraints: it never generates numbers (all data comes from your portfolio), it never recommends trades, and every response includes a confidence indicator and sources. These safeguards help prevent over-reliance on AI for financial decisions.",
  },
  {
    question: "What is the Decision Journal?",
    answer:
      "The Decision Journal records your reasoning every time you place a trade. Over time, it helps you identify patterns in your decision-making, learn from mistakes, and become a more deliberate investor.",
  },
  {
    question: "How do I use keyboard shortcuts?",
    answer:
      "Press Ctrl+/ to toggle the AI Copilot. Use Tab to navigate between interactive elements. Press Enter or Space to activate buttons and expand rows. Arrow keys navigate within tab lists and dropdowns.",
  },
  {
    question: "Why are some metrics shown together?",
    answer:
      "Accrue always shows performance in context. Your return is shown alongside your personal goal and a market benchmark. This helps you evaluate whether your investments are performing well relative to what you are trying to achieve, not just whether they went up.",
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");

  /* Sorted glossary entries */
  const sortedGlossary = useMemo(() => {
    return [...glossary].sort((a, b) => a.term.localeCompare(b.term));
  }, []);

  /* Search filtering */
  const filteredFAQ = useMemo(() => {
    if (!searchQuery.trim()) return faqItems;
    const q = searchQuery.toLowerCase();
    return faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const filteredGlossary = useMemo(() => {
    if (!searchQuery.trim()) return sortedGlossary;
    const q = searchQuery.toLowerCase();
    return sortedGlossary.filter(
      (entry) =>
        entry.term.toLowerCase().includes(q) ||
        entry.definition.toLowerCase().includes(q)
    );
  }, [searchQuery, sortedGlossary]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return lifeEvents;
    const q = searchQuery.toLowerCase();
    return lifeEvents.filter(
      (ev) =>
        ev.event.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.cards.some(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.description.toLowerCase().includes(q)
        )
    );
  }, [searchQuery]);

  const totalResults =
    filteredFAQ.length + filteredGlossary.length + filteredEvents.length;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      const count =
        faqItems.filter(
          (i) =>
            i.question.toLowerCase().includes(value.toLowerCase()) ||
            i.answer.toLowerCase().includes(value.toLowerCase())
        ).length +
        sortedGlossary.filter(
          (e) =>
            e.term.toLowerCase().includes(value.toLowerCase()) ||
            e.definition.toLowerCase().includes(value.toLowerCase())
        ).length +
        lifeEvents.filter(
          (ev) =>
            ev.event.toLowerCase().includes(value.toLowerCase()) ||
            ev.description.toLowerCase().includes(value.toLowerCase()) ||
            ev.cards.some(
              (c) =>
                c.title.toLowerCase().includes(value.toLowerCase()) ||
                c.description.toLowerCase().includes(value.toLowerCase())
            )
        ).length;
      announce(`${count} results found`, "polite");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">Help Center</h1>

      {/* ─── Search ─── */}
      <section aria-labelledby="help-search-heading" className="mb-8">
        <h2 id="help-search-heading" className="sr-only">
          Search Help
        </h2>
        <div className="max-w-xl">
          <label
            htmlFor="help-search"
            className="block text-sm font-semibold text-primary mb-1"
          >
            Search Help
          </label>
          <input
            id="help-search"
            type="search"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search FAQs, glossary, and learning topics..."
            className="w-full min-h-[44px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          />
          <div aria-live="polite" className="sr-only">
            {searchQuery.trim()
              ? `${totalResults} results found for "${searchQuery}"`
              : ""}
          </div>
        </div>
      </section>

      {/* ─── Learn by Life Event ─── */}
      <section aria-labelledby="life-events-heading" className="mb-8">
        <h2
          id="life-events-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          Learn by Life Event
        </h2>
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <details
              key={event.event}
              className="bg-surface-raised border border-border-default rounded-lg group"
            >
              <summary className="p-4 min-h-[44px] flex items-center cursor-pointer font-semibold text-primary hover:bg-surface-sunken rounded-lg focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2">
                <span
                  className="mr-2 text-muted group-open:rotate-90 transition-transform inline-block"
                  aria-hidden="true"
                >
                  &#9654;
                </span>
                {event.event}
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sm text-secondary mb-4">
                  {event.description}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {event.cards.map((card) => (
                    <div
                      key={card.title}
                      className="border border-border-default rounded-md p-3"
                    >
                      <h3 className="text-sm font-semibold text-primary mb-1">
                        {card.title}
                      </h3>
                      <p className="text-xs text-secondary">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          ))}
          {filteredEvents.length === 0 && (
            <p className="text-sm text-muted p-4">
              No life events match your search.
            </p>
          )}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section aria-labelledby="faq-heading" className="mb-8">
        <h2
          id="faq-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          Frequently Asked Questions
        </h2>
        <div className="space-y-2">
          {filteredFAQ.map((item) => (
            <details
              key={item.question}
              className="bg-surface-raised border border-border-default rounded-lg group"
            >
              <summary className="p-4 min-h-[44px] flex items-center cursor-pointer font-medium text-primary hover:bg-surface-sunken rounded-lg focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2">
                <span
                  className="mr-2 text-muted group-open:rotate-90 transition-transform inline-block"
                  aria-hidden="true"
                >
                  &#9654;
                </span>
                {item.question}
              </summary>
              <div className="px-4 pb-4">
                <p className="text-sm text-secondary">{item.answer}</p>
              </div>
            </details>
          ))}
          {filteredFAQ.length === 0 && (
            <p className="text-sm text-muted p-4">
              No FAQs match your search.
            </p>
          )}
        </div>
      </section>

      {/* ─── Glossary ─── */}
      <section aria-labelledby="glossary-heading">
        <h2
          id="glossary-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          Glossary
        </h2>
        {filteredGlossary.length === 0 ? (
          <p className="text-sm text-muted p-4">
            No glossary terms match your search.
          </p>
        ) : (
          <div className="bg-surface-raised border border-border-default rounded-lg p-6">
            <dl className="space-y-4">
              {filteredGlossary.map((entry) => (
                <div
                  key={entry.term}
                  className="border-b border-border-default last:border-0 pb-3 last:pb-0"
                >
                  <dt className="text-sm font-bold text-primary">
                    {entry.term}
                  </dt>
                  <dd className="text-sm text-secondary mt-0.5">
                    {entry.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </>
  );
}
