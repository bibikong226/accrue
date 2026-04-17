"use client";

import { useState, useMemo } from "react";
import { glossary } from "@/data/glossary";
import { announce } from "@/lib/a11y/useAnnouncer";

const LIFE_EVENT_CARDS = [
  {
    event: "New to investing",
    cards: [
      { title: "What is a stock?", content: "A stock represents a small piece of ownership in a company. When you buy a stock, you own a fraction of that company's assets and earnings." },
      { title: "How do I start?", content: "Start by understanding your goals and risk tolerance. Accrue's onboarding quiz helps with this. Then, begin with broad index funds or well-known companies you understand." },
      { title: "What are the risks?", content: "All investments carry risk. Stock prices go up and down. You could lose some or all of your investment. Diversification — spreading your money across many investments — helps reduce this risk." },
    ],
  },
  {
    event: "Just got a raise",
    cards: [
      { title: "Should I invest more?", content: "Consider increasing your emergency fund first (3-6 months of expenses). After that, investing extra income consistently — even small amounts — builds wealth over time through compounding." },
      { title: "What is dollar-cost averaging?", content: "Investing a fixed dollar amount on a regular schedule, regardless of the stock price. This means you buy more shares when prices are low and fewer when prices are high." },
      { title: "Automate your investments", content: "Set up a recurring investment in Accrue to invest automatically each paycheck. This removes the temptation to time the market and builds consistency." },
    ],
  },
  {
    event: "Thinking about a house",
    cards: [
      { title: "How much do I need?", content: "A typical down payment is 10-20% of the home price. For a $300,000 home, that's $30,000-$60,000. Don't forget closing costs (2-5% of the loan amount)." },
      { title: "Where should I save?", content: "For goals under 3 years, consider keeping the money in cash or low-risk investments. Stock market losses close to your goal date could delay your purchase." },
      { title: "Set a goal in Accrue", content: "Create a 'House down payment' goal in Accrue with your target amount and date. We'll track your progress and flag anything that puts you off track." },
    ],
  },
  {
    event: "Taxes are due",
    cards: [
      { title: "Capital gains basics", content: "When you sell a stock for more than you paid, the profit is a capital gain. Short-term gains (held <1 year) are taxed as regular income. Long-term gains (held >1 year) get lower tax rates." },
      { title: "What is tax-loss harvesting?", content: "Selling investments at a loss to offset gains from other investments. This can reduce your tax bill. Accrue's Tax-Sensitive lot method does this automatically." },
      { title: "Tax lot methods", content: "When you sell shares, the tax lot method determines which specific shares are sold. Tax-Sensitive (Accrue's default) automatically picks the most tax-efficient option." },
    ],
  },
];

const FAQ_ITEMS = [
  { q: "What is Accrue?", a: "Accrue is a research prototype — an accessible investment platform designed for blind and low-vision users and novice retail investors. No real money is involved. All data is simulated." },
  { q: "How does the AI copilot work?", a: "The AI copilot explains your portfolio, defines financial terms, and flags potential concerns about trades. It never recommends specific trades (buy/sell/hold), never generates financial numbers on its own, and always shows its confidence level and data sources." },
  { q: "Is my money safe?", a: "Accrue is a prototype — no real money is involved. In a real investment platform, your money would be protected by SIPC insurance up to $500,000." },
  { q: "How do I place a trade?", a: "Go to the Trade page from the navigation bar. Search for a stock, choose Buy or Sell, enter a quantity, and review your order. Every trade passes through a mandatory review screen before execution." },
  { q: "What are the fees?", a: "Accrue doesn't charge commissions on stock trades and doesn't accept payment for order flow. The only costs are the bid-ask spread (typically a few cents per share)." },
];

/**
 * Help & Learn page per § 9.
 * - Reachable from main nav by keyboard
 * - Clear heading hierarchy: H1 → H2 → H3
 * - Search with accessible results
 * - Life-event organized education
 */
export default function HelpPage() {
  const [search, setSearch] = useState("");

  const filteredGlossary = useMemo(() => {
    if (!search.trim()) return glossary;
    const q = search.toLowerCase();
    return glossary.filter(
      (g) =>
        g.term.toLowerCase().includes(q) ||
        g.definition.toLowerCase().includes(q)
    );
  }, [search]);

  function handleSearch(value: string) {
    setSearch(value);
    const count = glossary.filter(
      (g) =>
        g.term.toLowerCase().includes(value.toLowerCase()) ||
        g.definition.toLowerCase().includes(value.toLowerCase())
    ).length;
    if (value.trim()) {
      announce(`${count} results found`, "polite");
    }
  }

  return (
    <>
      <title>Help & Learn — Accrue</title>
      <h1 className="text-2xl font-semibold text-primary mb-2">Help & Learn</h1>
      <p className="text-sm text-secondary mb-8">
        Learn about investing, get answers to common questions, and look up financial terms.
      </p>

      {/* Search */}
      <div className="mb-8">
        <label htmlFor="help-search" className="block text-sm font-medium text-primary mb-1">
          Search help articles and glossary
        </label>
        <input
          id="help-search"
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Type a term or question..."
          className="w-full max-w-md rounded-lg border border-border-default bg-surface-base px-4 py-3 text-sm text-primary placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring min-h-[44px]"
        />
        {/* a11y: Results count announced via aria-live in announce() call above */}
      </div>

      {/* Learn by Life Event — § 9.2 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-primary mb-4">Learn</h2>
        <p className="text-sm text-secondary mb-6">
          Organized by what&apos;s happening in your life, not by asset class.
        </p>

        {LIFE_EVENT_CARDS.map((event) => (
          <div key={event.event} className="mb-8">
            <h3 className="text-base font-semibold text-primary mb-3">{event.event}</h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {event.cards.map((card) => (
                <details
                  key={card.title}
                  className="rounded-xl border border-border-default bg-surface-raised p-4"
                >
                  <summary className="text-sm font-medium text-primary cursor-pointer hover:text-action-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] flex items-center">
                    {card.title}
                  </summary>
                  <p className="text-sm text-secondary mt-3 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                    {card.content}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-primary mb-4">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ_ITEMS.map((faq) => (
            <details
              key={faq.q}
              className="rounded-xl border border-border-default bg-surface-raised p-4"
            >
              <summary className="text-sm font-medium text-primary cursor-pointer hover:text-action-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] flex items-center">
                {faq.q}
              </summary>
              <p className="text-sm text-secondary mt-3 leading-relaxed" style={{ fontFamily: "var(--font-serif)" }}>
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Glossary — § 9, § 2.2 */}
      <section>
        <h2 className="text-xl font-semibold text-primary mb-4">Financial Glossary</h2>
        <p className="text-sm text-secondary mb-4">
          Plain-language definitions for every financial term used on the platform.
          These exact definitions are what the AI copilot uses — it never paraphrases them.
        </p>
        <dl className="space-y-3">
          {filteredGlossary
            .sort((a, b) => a.term.localeCompare(b.term))
            .map((entry) => (
              <div
                key={entry.term}
                className="rounded-lg border border-border-default bg-surface-raised p-4"
              >
                <dt className="text-sm font-semibold text-primary">{entry.term}</dt>
                <dd className="text-sm text-secondary mt-1">{entry.definition}</dd>
              </div>
            ))}
        </dl>
        {filteredGlossary.length === 0 && (
          <p className="text-sm text-muted py-4">No terms match &quot;{search}&quot;.</p>
        )}
      </section>
    </>
  );
}
