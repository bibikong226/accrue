/**
 * Source attribution helper for honest data labeling.
 *
 * Every data source in the Accrue prototype is explicitly labeled
 * as "prototype" kind so users and evaluators know no live market
 * data is being displayed.
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
    provider: "Accrue prototype (mock prices)",
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
};
