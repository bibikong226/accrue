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
   * Matches against reactive fixture patterns, falls back to a generic response.
   * Every response passes through the validation pipeline.
   */
  async generateResponse(
    query: string,
    context: CopilotContext
  ): Promise<CopilotResponse> {
    await simulateLatency();

    // Try to match a reactive fixture
    let response = matchReactiveFixture(query);

    // Fall back to generic response
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
   * Generate a proactive insight card for the current page.
   * Returns a pre-authored fixture based on the page type.
   */
  async generateProactiveCard(
    page: PageType,
    context: CopilotContext
  ): Promise<CopilotResponse> {
    await simulateLatency();

    const response = proactiveFixtures[page] ?? proactiveFixtures.dashboard;

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
