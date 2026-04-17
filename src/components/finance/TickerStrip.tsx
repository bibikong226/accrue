"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { holdings, marketIndices } from "@/data/mockPortfolio";

/* ─── Types ─── */
interface TickerEntry {
  symbol: string;
  displayName: string;
  price: number;
  dayChange: number;
  dayChangePercent: number;
  isHolding: boolean;
  href: string;
}

/* ─── Build combined ticker list: user holdings + market indices ─── */
function buildTickerEntries(): TickerEntry[] {
  const holdingEntries: TickerEntry[] = holdings.map((h) => ({
    symbol: h.symbol,
    displayName: h.symbol,
    price: h.currentPrice,
    dayChange: h.currentPrice - h.previousClose,
    dayChangePercent:
      ((h.currentPrice - h.previousClose) / h.previousClose) * 100,
    isHolding: true,
    href: `/research/${h.symbol}`,
  }));

  const indexEntries: TickerEntry[] = marketIndices.map((idx) => ({
    symbol: idx.symbol,
    displayName: idx.name,
    price: idx.value,
    dayChange: idx.dayChange,
    dayChangePercent: idx.dayChangePercent,
    isHolding: false,
    href: `/research/${idx.symbol}`,
  }));

  return [...holdingEntries, ...indexEntries];
}

/* ─── Format helpers ─── */
function formatTickerPrice(price: number): string {
  if (price >= 10000) {
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  return price.toFixed(2);
}

function formatChange(change: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)}`;
}

function formatChangePercent(pct: number): string {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(2)}%`;
}

/* ─── TickerStrip Component ─── */
export default function TickerStrip() {
  const entries = buildTickerEntries();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  /* Detect prefers-reduced-motion */
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mql.matches);
    const handler = (e: MediaQueryListEvent) =>
      setPrefersReducedMotion(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const shouldAnimate = !prefersReducedMotion && !isPaused;

  return (
    <div
      className="bg-[#111827] overflow-hidden"
      style={{ height: "32px" }}
      role="region"
      aria-label="Live market ticker strip showing your holdings and major indices"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        /* Only unpause if focus leaves the strip entirely */
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setIsPaused(false);
        }
      }}
    >
      <div
        ref={scrollRef}
        className="flex items-center h-full whitespace-nowrap"
        style={{
          animation: shouldAnimate
            ? "tickerScroll 40s linear infinite"
            : "none",
        }}
      >
        {/* Primary entries — accessible to screen readers */}
        {entries.map((entry, i) => {
          const isUp = entry.dayChange >= 0;
          const arrow = isUp ? "\u25B2" : "\u25BC";
          const changeColor = isUp ? "text-green-400" : "text-red-400";
          const ariaDirection = isUp ? "up" : "down";

          const ariaLabel = `${entry.displayName}: ${formatTickerPrice(entry.price)}, ${ariaDirection} ${formatChange(Math.abs(entry.dayChange))} (${formatChangePercent(entry.dayChangePercent)})${entry.isHolding ? ", you own this stock" : ""}`;

          return (
            <Link
              key={`${entry.symbol}-${i}`}
              href={entry.href}
              tabIndex={0}
              aria-label={ariaLabel}
              className={`inline-flex items-center gap-1.5 px-3 h-full text-[11px] text-gray-200 hover:bg-gray-800 focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-[-2px] transition-colors ${
                entry.isHolding ? "border-l-2 border-l-cyan-400" : ""
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              <span className="font-medium text-white">
                {entry.displayName}
              </span>
              <span>{formatTickerPrice(entry.price)}</span>
              <span className={changeColor} aria-hidden="true">
                {arrow} {formatChange(entry.dayChange)} ({formatChangePercent(entry.dayChangePercent)})
              </span>
            </Link>
          );
        })}
        {/* a11y: Duplicate set for seamless CSS loop animation — aria-hidden to prevent duplicate screen reader announcements */}
        <span aria-hidden="true" className="contents">
          {entries.map((entry, i) => {
            const isUp = entry.dayChange >= 0;
            const arrow = isUp ? "\u25B2" : "\u25BC";
            const changeColor = isUp ? "text-green-400" : "text-red-400";

            return (
              <Link
                key={`${entry.symbol}-dup-${i}`}
                href={entry.href}
                tabIndex={-1}
                className={`inline-flex items-center gap-1.5 px-3 h-full text-[11px] text-gray-200 hover:bg-gray-800 transition-colors ${
                  entry.isHolding ? "border-l-2 border-l-cyan-400" : ""
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                <span className="font-medium text-white">
                  {entry.displayName}
                </span>
                <span>{formatTickerPrice(entry.price)}</span>
                <span className={changeColor}>
                  {arrow} {formatChange(entry.dayChange)} ({formatChangePercent(entry.dayChangePercent)})
                </span>
              </Link>
            );
          })}
        </span>
      </div>

      {/* CSS animation keyframes injected via style tag */}
      <style jsx>{`
        @keyframes tickerScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
