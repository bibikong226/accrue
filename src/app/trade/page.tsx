"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mockPortfolio } from "@/data/mockPortfolio";

export default function TradeSearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const allTickers = [
    ...(mockPortfolio.holdings ?? []),
    ...((mockPortfolio as any).watchlist ?? []),
  ];
  const unique = Array.from(new Map(allTickers.map(t => [t.symbol, t])).values());

  const matches = query
    ? unique.filter(t =>
        t.symbol.toLowerCase().includes(query.toLowerCase()) ||
        t.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : unique.slice(0, 8);

  return (
    <main className="trade-page">
      <div className="trade-page__container">
        <h1 className="trade-page__title">What do you want to trade?</h1>
        <p className="trade-page__subtitle">Search for any stock by symbol or name.</p>

        <label className="trade-search-label" htmlFor="trade-search-input">
          <span className="sr-only">Ticker or company name</span>
          <input
            id="trade-search-input"
            type="search"
            placeholder="Search AAPL, Apple, Tesla..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="trade-search-input"
            autoFocus
            aria-describedby="trade-search-help"
          />
        </label>
        <p id="trade-search-help" className="trade-search-help">
          {matches.length > 0 ? `${matches.length} ${matches.length === 1 ? "match" : "matches"}` : "No matches — try a different search"}
        </p>

        {matches.length > 0 && (
          <ul className="trade-search-results" role="listbox" aria-label="Ticker search results">
            {matches.map(t => (
              <li key={t.symbol} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => router.push(`/trade/${t.symbol}`)}
                  className="trade-search-result"
                  aria-label={`Trade ${t.symbol}, ${t.name}, current price $${(t.currentPrice ?? 0).toFixed(2)}`}
                >
                  <span className="trade-search-result__symbol">{t.symbol}</span>
                  <span className="trade-search-result__name">{t.name}</span>
                  <span className="trade-search-result__price">${(t.currentPrice ?? 0).toFixed(2)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
