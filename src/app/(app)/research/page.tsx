import Link from "next/link";
import { holdings } from "@/data/mockPortfolio";
import { formatCurrency, formatSignedPercent } from "@/lib/format";

export default function ResearchPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">Research</h1>

      <section aria-labelledby="holdings-research-heading">
        <h2
          id="holdings-research-heading"
          className="text-lg font-semibold text-primary mb-4"
        >
          Your Holdings
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
    </>
  );
}
