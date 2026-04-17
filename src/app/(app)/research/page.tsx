import Link from "next/link";
import { researchData } from "@/data/mockPortfolio";
import { formatCurrency, formatSignedCurrency, formatSignedPercent } from "@/lib/format";

export const metadata = { title: "Research — Accrue" };

/**
 * Research index page per § 5.2.
 * Lists all stocks with research data as navigable cards.
 */
export default function ResearchPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold text-primary mb-2">Research</h1>
      <p className="text-sm text-secondary mb-6">
        Explore company fundamentals, analyst ratings, and earnings.
        Tap a stock to see the full research page.
      </p>

      {/* a11y: Semantic list for stock cards */}
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {researchData.map((stock) => {
          const isUp = stock.todayChangeDollars >= 0;
          return (
            <li key={stock.symbol}>
              <Link
                href={`/research/${stock.symbol}`}
                /* a11y: Accessible label for the card link */
                aria-label={`${stock.name} (${stock.symbol}), ${formatCurrency(stock.currentPrice)}, ${isUp ? "up" : "down"} ${Math.abs(stock.todayChangePercent).toFixed(2)}%`}
                className="block rounded-2xl border border-border-default bg-surface-raised p-5 hover:border-action-primary hover:shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                    {stock.symbol}
                  </span>
                </div>
                <p className="text-sm font-medium text-primary mb-2">
                  {stock.name}
                </p>
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-mono tabular-nums text-primary">
                    {formatCurrency(stock.currentPrice)}
                  </span>
                  <span
                    data-signal={isUp ? "gain" : "loss"}
                    className={`text-sm font-mono tabular-nums ${isUp ? "text-gain" : "text-loss"}`}
                  >
                    {/* a11y: Arrow with aria-label for direction */}
                    <span aria-label={isUp ? "up" : "down"}>
                      {isUp ? "↑" : "↓"}
                    </span>{" "}
                    {formatSignedCurrency(stock.todayChangeDollars)} ({formatSignedPercent(stock.todayChangePercent)})
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
