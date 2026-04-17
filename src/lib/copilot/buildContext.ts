/**
 * Context builder for the AI Copilot (CLAUDE.md A5.3).
 *
 * Assembles CopilotContext from mockPortfolio.ts data.
 * This is the bridge between the data layer and the copilot --
 * every number the AI can reference must flow through here.
 */

import type { CopilotContext, PageType } from "./types";
import {
  user,
  portfolio,
  holdings,
  goalProgress,
} from "@/data/mockPortfolio";
import { glossary } from "@/data/glossary";

/**
 * Build the full copilot context for a given page.
 * The context is injected into every copilot call so the AI
 * has access to verified data without generating its own numbers.
 *
 * @param page - The current page type
 * @param ticker - Optional ticker symbol when on a research page
 */
export function buildCopilotContext(
  page: PageType,
  ticker?: string
): CopilotContext {
  return {
    page,
    ticker,

    portfolioSummary: {
      totalValue: portfolio.totalValue,
      totalGainLoss: portfolio.totalGainLoss,
      totalGainLossPercent: portfolio.totalGainLossPercent,
      cashBalance: portfolio.cashBalance,
      diversificationRating: portfolio.diversificationRating,
      timeWeightedReturn: portfolio.timeWeightedReturn,
      allocationBySector: portfolio.allocationBySector,
    },

    userProfile: {
      name: user.name,
      riskTolerance: user.riskTolerance,
      experienceLevel: user.experienceLevel,
      timeHorizon: user.timeHorizon,
      goalType: user.goal.type,
      goalTarget: user.goal.target,
      goalDate: user.goal.byDate,
    },

    holdingSummaries: holdings.map((h) => ({
      symbol: h.symbol,
      name: h.name,
      allocation: h.allocation,
      gainLossPercent: h.gainLossPercent,
      sector: h.sector,
    })),

    goalProgress: {
      percentComplete: goalProgress.percentComplete,
      onTrack: goalProgress.onTrack,
      confidencePercent: goalProgress.confidencePercent,
    },

    glossaryTerms: glossary.map((entry) => entry.term),
  };
}

/**
 * Build a serialized context string for injection into AI prompts.
 * Used by the AnthropicCopilotAdapter to include data in the system message.
 */
export function serializeCopilotContext(context: CopilotContext): string {
  const lines: string[] = [
    "=== USER PROFILE ===",
    `Name: ${context.userProfile.name}`,
    `Risk Tolerance: ${context.userProfile.riskTolerance}`,
    `Experience Level: ${context.userProfile.experienceLevel}`,
    `Time Horizon: ${context.userProfile.timeHorizon}`,
    `Goal: ${context.userProfile.goalType} to $${context.userProfile.goalTarget.toLocaleString()} by ${context.userProfile.goalDate}`,
    "",
    "=== PORTFOLIO SUMMARY ===",
    `Total Value: $${context.portfolioSummary.totalValue.toLocaleString()}`,
    `Total Gain/Loss: $${context.portfolioSummary.totalGainLoss.toLocaleString()} (${context.portfolioSummary.totalGainLossPercent}%)`,
    `Cash Balance: $${context.portfolioSummary.cashBalance.toLocaleString()}`,
    `Diversification Rating: ${context.portfolioSummary.diversificationRating}`,
    `Time-Weighted Return: ${context.portfolioSummary.timeWeightedReturn}%`,
    "",
    "=== SECTOR ALLOCATION ===",
    ...Object.entries(context.portfolioSummary.allocationBySector).map(
      ([sector, pct]) => `  ${sector}: ${pct}%`
    ),
    "",
    "=== HOLDINGS ===",
    ...context.holdingSummaries.map(
      (h) =>
        `  ${h.symbol} (${h.name}): ${h.allocation}% of portfolio, ${h.gainLossPercent > 0 ? "+" : ""}${h.gainLossPercent}% gain/loss, Sector: ${h.sector}`
    ),
    "",
    "=== GOAL PROGRESS ===",
    `Progress: ${context.goalProgress.percentComplete}% complete`,
    `On Track: ${context.goalProgress.onTrack ? "Yes" : "No"}`,
    `Confidence: ${context.goalProgress.confidencePercent}%`,
    "",
    "=== AVAILABLE GLOSSARY TERMS ===",
    context.glossaryTerms.join(", "),
  ];

  if (context.page) {
    lines.unshift(`Current Page: ${context.page}`);
  }
  if (context.ticker) {
    lines.unshift(`Focused Ticker: ${context.ticker}`);
  }

  return lines.join("\n");
}
