/**
 * MockCopilotAdapter -- returns hard-coded responses from copilotFixtures.ts.
 * Used during prototype development (CLAUDE.md A4).
 *
 * The mock adapter still runs the validation pipeline against every response
 * so the validator is exercised in development.
 */

import type {
  CopilotAdapter,
  CopilotResponse,
  CopilotContext,
  PageType,
  ValidationResult,
} from "./types";
import {
  proactiveFixtures,
  matchReactiveFixture,
  getFallbackResponse,
  getFixtureById,
  fixturesById,
} from "@/data/copilotFixtures";
import { validateCopilotResponse, getRefusalResponse } from "./validator";

/**
 * Simulated network latency in milliseconds.
 */
const MOCK_LATENCY_MS = 200;

/**
 * Wait for the simulated latency period.
 */
function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

export class MockCopilotAdapter implements CopilotAdapter {
  /**
   * Generate a response to a user query.
   * Matching priority:
   *   1. Exact fixture ID match (if query looks like an ID)
   *   2. Keyword-to-fixture mapping (normalized to lowercase)
   *   3. Context-aware page-based defaults
   *   4. Legacy pattern matching
   *   5. Fallback response
   * Every response passes through the validation pipeline.
   */
  async generateResponse(
    query: string,
    context: CopilotContext
  ): Promise<CopilotResponse> {
    await simulateLatency();

    let response: CopilotResponse | undefined;

    const normalizedQuery = query.toLowerCase().trim();

    // 1. Try exact fixture ID match (for programmatic triggers like "dashboard.sinceLastLogin")
    response = getFixtureById(normalizedQuery) ?? getFixtureById(query);

    // 2. Try keyword-to-fixture mapping
    if (!response) {
      response = matchReactiveFixture(query);
    }

    // 3. Context-aware page-based defaults when no keyword matches
    if (!response) {
      response = this.resolveByContext(normalizedQuery, context);
    }

    // 4. Fall back to generic response
    if (!response) {
      response = getFallbackResponse();
    }

    // Run validation pipeline even on mock data (CLAUDE.md A4)
    const validationResult = this.validateResponse(response, context);

    if (validationResult.isCriticalFailure) {
      return getRefusalResponse();
    }

    return response;
  }

  /**
   * Attempt to resolve a fixture based on the current page context and query hints.
   * Returns undefined if no contextual match is found.
   */
  private resolveByContext(
    query: string,
    context: CopilotContext
  ): CopilotResponse | undefined {
    const page = context.page;
    const ticker = context.ticker;

    // Research page: try ticker-specific fixtures
    if (page === "research" && ticker) {
      const tickerUpper = ticker.toUpperCase();

      if (query.includes("fundamental") || query.includes("metric")) {
        return fixturesById[`explain.fundamentals.${tickerUpper}`];
      }
      if (query.includes("analyst") || query.includes("rating")) {
        return fixturesById[`analyze.analystRatings.${tickerUpper}`];
      }
      if (query.includes("earning")) {
        return fixturesById[`explain.earnings.${tickerUpper}`];
      }
      if (query.includes("compare") || query.includes("fit") || query.includes("portfolio")) {
        return fixturesById[`compare.withPortfolio.${tickerUpper}`];
      }
      if (query.includes("chart") || query.includes("price history")) {
        return fixturesById[`explain.chart.${tickerUpper}.1M`];
      }
      // Default for research page: ticker overview
      return fixturesById[`research.onTickerOpen.${tickerUpper}`];
    }

    // Orders / review page: trade-related defaults
    if (page === "orders" || page === "review") {
      if (query.includes("risk") || query.includes("concentrat")) {
        return fixturesById["risk.concentration"];
      }
      return fixturesById["explain.thisTrade"];
    }

    // Dashboard page: portfolio-related defaults
    if (page === "dashboard") {
      if (query.includes("changed") || query.includes("today") || query.includes("move")) {
        return fixturesById["explain.todaysChange"];
      }
      if (query.includes("holding") || query.includes("position") || query.includes("own")) {
        return fixturesById["summarize.holdings"];
      }
      if (query.includes("goal") || query.includes("track") || query.includes("target")) {
        return fixturesById["goal.projectedPace"];
      }
    }

    return undefined;
  }

  /**
   * Generate a proactive insight card for the current page.
   * Returns a pre-authored fixture based on the page type.
   * For the research page, attempts to return a ticker-specific fixture.
   */
  async generateProactiveCard(
    page: PageType,
    context: CopilotContext
  ): Promise<CopilotResponse> {
    await simulateLatency();

    let response: CopilotResponse;

    // For research page, prefer ticker-specific proactive fixture
    if (page === "research" && context.ticker) {
      const tickerFixture = fixturesById[`research.onTickerOpen.${context.ticker.toUpperCase()}`];
      response = tickerFixture ?? proactiveFixtures.research;
    } else if (page === "review") {
      // For review page, prefer the detailed preflight fixture
      response = fixturesById["orderReview.preflight"] ?? proactiveFixtures.review;
    } else {
      response = proactiveFixtures[page] ?? proactiveFixtures.dashboard;
    }

    // Mark as proactive
    const proactiveResponse: CopilotResponse = {
      ...response,
      isProactive: true,
    };

    // Validate even proactive cards
    const validationResult = this.validateResponse(proactiveResponse, context);

    if (validationResult.isCriticalFailure) {
      return {
        ...getRefusalResponse(),
        isProactive: true,
      };
    }

    return proactiveResponse;
  }

  /**
   * Run the validation pipeline on a response.
   */
  validateResponse(
    response: CopilotResponse,
    context: CopilotContext
  ): ValidationResult {
    return validateCopilotResponse(response, context);
  }
}
