/**
 * Source attribution helper for honest data labeling (section 3.3).
 *
 * Every data source in the Accrue prototype is explicitly labeled
 * with kind ("real" | "prototype") so users and evaluators know
 * the provenance of every data point.
 */

export interface Source {
  id: string;
  label: string;
  provider: string;
  updatedISO: string;
  kind: "real" | "prototype";
  url?: string;
}

export const SOURCES = {
  portfolio: (): Source => ({
    id: "accrue-portfolio",
    label: "Your sample portfolio",
    provider: "Accrue prototype data",
    updatedISO: new Date().toISOString(),
    kind: "prototype",
  }),

  prices: (): Source => ({
    id: "price-data",
    label: "Historical price data",
    provider: "Accrue prototype data (generated prices)",
    updatedISO: "2026-04-16T00:00:00Z",
    kind: "prototype",
  }),

  fundamentals: (ticker: string): Source => ({
    id: `fundamentals-${ticker}`,
    label: `${ticker} fundamentals`,
    provider: "Accrue prototype data (mocked)",
    updatedISO: "2026-04-16T00:00:00Z",
    kind: "prototype",
  }),

  analystRatings: (ticker: string): Source => ({
    id: `analyst-ratings-${ticker}`,
    label: `${ticker} analyst ratings`,
    provider: "Accrue prototype data (mocked analyst consensus)",
    updatedISO: "2026-04-16T00:00:00Z",
    kind: "prototype",
  }),

  earnings: (ticker: string): Source => ({
    id: `earnings-${ticker}`,
    label: `${ticker} earnings history`,
    provider: "Accrue prototype data (mocked EPS)",
    updatedISO: "2026-04-16T00:00:00Z",
    kind: "prototype",
  }),

  news: (ticker?: string): Source => ({
    id: ticker ? `news-${ticker}` : "news-market",
    label: ticker ? `${ticker} news` : "Market news",
    provider: "Accrue prototype data (curated headlines)",
    updatedISO: "2026-04-16T00:00:00Z",
    kind: "prototype",
  }),

  benchmarks: (): Source => ({
    id: "benchmarks",
    label: "Benchmark indices",
    provider: "Accrue prototype data (S&P 500 mock)",
    updatedISO: "2026-04-16T00:00:00Z",
    kind: "prototype",
  }),
};
