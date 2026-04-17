"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { holdings } from "@/data/mockPortfolio";
import { formatCurrency, formatSignedPercent } from "@/lib/format";
import { announce } from "@/lib/a11y/useAnnouncer";

/* ─── Suggested tickers (not already in holdings) ─── */
const suggestedTickers = [
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology" },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary" },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services" },
  { symbol: "KO", name: "The Coca-Cola Co.", sector: "Consumer Staples" },
];

/* ─── Theme cards ─── */
const themes = [
  {
    name: "AI & Semiconductors",
    description: "Companies driving artificial intelligence and chip innovation",
    tickers: ["NVDA", "AMD", "AVGO", "INTC"],
  },
  {
    name: "Dividend Aristocrats",
    description: "Companies with 25+ years of consecutive dividend increases",
    tickers: ["KO", "JNJ", "PG", "MMM"],
  },
  {
    name: "Clean Energy",
    description: "Renewable energy and sustainability-focused companies",
    tickers: ["ENPH", "FSLR", "NEE", "ICLN"],
  },
  {
    name: "Index ETFs",
    description: "Low-cost diversified index funds tracking broad markets",
    tickers: ["VTI", "VOO", "VXUS", "BND"],
  },
];

/* ─── All searchable tickers for the combobox ─── */
const allTickers = [
  ...holdings.map((h) => ({ symbol: h.symbol, name: h.name })),
  ...suggestedTickers.map((t) => ({ symbol: t.symbol, name: t.name })),
  ...themes.flatMap((t) =>
    t.tickers.map((ticker) => ({ symbol: ticker, name: ticker }))
  ),
];
/* Deduplicate by symbol */
const uniqueTickers = Array.from(
  new Map(allTickers.map((t) => [t.symbol, t])).values()
);

export default function ResearchPage() {
  const [searchValue, setSearchValue] = useState("");
  const [isListOpen, setIsListOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = searchValue.trim()
    ? uniqueTickers.filter(
        (t) =>
          t.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
          t.name.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  useEffect(() => {
    setActiveIndex(-1);
  }, [searchValue]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isListOpen || filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = filtered[activeIndex];
      if (selected) {
        window.location.href = `/research/${selected.symbol}`;
      }
    } else if (e.key === "Escape") {
      setIsListOpen(false);
      announce("Search suggestions closed", "polite");
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">Research</h1>

      {/* ─── Global Search Bar (combobox pattern) ─── */}
      <section aria-labelledby="research-search-heading" className="mb-8">
        <h2 id="research-search-heading" className="sr-only">
          Search stocks and ETFs
        </h2>
        <div className="relative">
          <label htmlFor="research-search" className="sr-only">
            Search by ticker symbol or company name
          </label>
          <input
            id="research-search"
            ref={inputRef}
            type="text"
            role="combobox"
            aria-expanded={isListOpen && filtered.length > 0}
            aria-controls="research-search-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `search-option-${activeIndex}` : undefined
            }
            value={searchValue}
            onChange={(e) => {
              setSearchValue(e.target.value);
              setIsListOpen(e.target.value.trim().length > 0);
            }}
            onFocus={() => {
              if (searchValue.trim()) setIsListOpen(true);
            }}
            onBlur={() => {
              /* Delay to allow click on listbox item */
              setTimeout(() => setIsListOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search by ticker or company name..."
            className="w-full min-h-[48px] px-4 py-3 rounded-lg border border-border-default bg-surface-base text-primary text-sm focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          />
          {isListOpen && filtered.length > 0 && (
            <ul
              id="research-search-listbox"
              ref={listRef}
              role="listbox"
              aria-label="Search results"
              className="absolute z-20 w-full mt-1 bg-surface-raised border border-border-default rounded-lg shadow-lg max-h-60 overflow-y-auto"
            >
              {filtered.slice(0, 8).map((t, i) => (
                <li
                  key={t.symbol}
                  id={`search-option-${i}`}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={`px-4 py-3 min-h-[44px] cursor-pointer text-sm ${
                    i === activeIndex
                      ? "bg-surface-sunken text-primary"
                      : "text-primary hover:bg-surface-sunken"
                  }`}
                  onMouseDown={() => {
                    window.location.href = `/research/${t.symbol}`;
                  }}
                >
                  <span className="font-bold">{t.symbol}</span>
                  <span className="text-muted ml-2">{t.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ─── What You Already Own ─── */}
      <section aria-labelledby="holdings-research-heading" className="mb-8">
        <h2
          id="holdings-research-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          What You Already Own
        </h2>
        <p className="text-sm text-secondary mb-4">
          Select a holding to view detailed research including fundamentals,
          analyst ratings, earnings history, and news.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {holdings.map((h) => {
            const isPositive = h.totalReturnPercent >= 0;
            return (
              <Link
                key={h.symbol}
                href={`/research/${h.symbol}`}
                className="block bg-surface-raised border border-border-default rounded-lg p-4 hover:border-action-primary transition-colors focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px]"
                aria-label={`Research ${h.symbol}, ${h.name}. Current price ${formatCurrency(h.currentPrice)}, total return ${formatSignedPercent(h.totalReturnPercent)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-lg font-bold text-primary">
                      {h.symbol}
                    </span>
                    <p className="text-xs text-muted mt-0.5">{h.name}</p>
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {formatCurrency(h.currentPrice)}
                  </span>
                </div>
                <dl className="mt-3 flex items-center gap-4">
                  <div>
                    <dt className="text-xs text-muted">Return</dt>
                    <dd
                      className={`text-sm font-semibold tabular-nums ${
                        isPositive
                          ? "text-gain gain-text"
                          : "text-loss loss-text"
                      }`}
                    >
                      <span aria-label={isPositive ? "gain" : "loss"} role="img">
                        {isPositive ? "\u25B2" : "\u25BC"}
                      </span>{" "}
                      {formatSignedPercent(h.totalReturnPercent)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Sector</dt>
                    <dd className="text-sm text-primary">{h.sector}</dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── Suggested For You ─── */}
      <section aria-labelledby="suggested-heading" className="mb-8">
        <h2
          id="suggested-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          Suggested For You
        </h2>
        <p className="text-sm text-secondary mb-4">
          Stocks you do not currently hold that may complement your portfolio.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {suggestedTickers.map((t) => (
            <Link
              key={t.symbol}
              href={`/research/${t.symbol}`}
              className="block bg-surface-raised border border-border-default rounded-lg p-4 hover:border-action-primary transition-colors focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 min-h-[44px]"
              aria-label={`Research ${t.symbol}, ${t.name}. Sector: ${t.sector}`}
            >
              <div>
                <span className="text-lg font-bold text-primary">
                  {t.symbol}
                </span>
                <p className="text-xs text-muted mt-0.5">{t.name}</p>
              </div>
              <p className="text-xs text-secondary mt-2">{t.sector}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Themes ─── */}
      <section aria-labelledby="themes-heading" className="mb-8">
        <h2
          id="themes-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          Themes
        </h2>
        <p className="text-sm text-secondary mb-4">
          Explore investment themes and the tickers associated with each.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((theme) => (
            <div
              key={theme.name}
              className="bg-surface-raised border border-border-default rounded-lg p-4"
            >
              <h3 className="text-base font-semibold text-primary mb-1">
                {theme.name}
              </h3>
              <p className="text-xs text-secondary mb-3">
                {theme.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {theme.tickers.map((ticker) => (
                  <Link
                    key={ticker}
                    href={`/research/${ticker}`}
                    className="inline-flex items-center min-h-[44px] min-w-[44px] px-3 py-1.5 text-sm font-medium rounded-full border border-border-default text-action-primary hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                    aria-label={`Research ${ticker}`}
                  >
                    {ticker}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
