import { mockPortfolio } from "@/data/mockPortfolio";
import type { CopilotContext, PageType } from "./types";

/**
 * Builds CopilotContext from mockPortfolio data per § 10.4.
 * The application data layer is the single source of truth for every factual claim.
 */
export function buildCopilotContext(
  page: PageType,
  query?: string
): CopilotContext {
  return {
    portfolioTotalValue: mockPortfolio.totalValue,
    holdings: mockPortfolio.holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      shares: h.shares,
      currentPrice: h.currentPrice,
      marketValue: h.marketValue,
      gainLossPercent: h.gainLossPercent,
      sector: h.sector,
      allocation: h.portfolioWeight,
    })),
    goalTarget: mockPortfolio.goal.targetAmount,
    goalCurrent: mockPortfolio.goal.currentAmount,
    goalOnTrack: mockPortfolio.goal.progressPercent >= 75,
    riskTolerance: "moderate",
    currentPage: page,
    query,
  };
}
