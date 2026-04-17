import type {
  CopilotAdapter,
  CopilotContext,
  CopilotResponse,
  PageType,
  ValidationResult,
} from "./types";
import { validateResponse, REFUSAL_RESPONSE } from "./validator";
import {
  proactiveFixtures,
  reactiveFixtures,
} from "@/data/copilotFixtures";

/**
 * MockCopilotAdapter per § A4.
 * Returns hand-authored fixtures from copilotFixtures.ts.
 * All responses pass through the validator — exercised in dev.
 * Simulates 200ms latency for realistic UX.
 */
export class MockCopilotAdapter implements CopilotAdapter {
  async generateResponse(
    query: string,
    context: CopilotContext
  ): Promise<CopilotResponse> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 200));

    const normalizedQuery = query.toLowerCase().trim();

    // Find best matching fixture
    const fixture = reactiveFixtures.find(
      (f) =>
        f.triggerQuery &&
        normalizedQuery.includes(f.triggerQuery.toLowerCase())
    );

    const response = fixture ?? {
      id: `mock-${Date.now()}`,
      content:
        "I can help explain your portfolio, define financial terms, or flag potential concerns about trades. What would you like to know?",
      confidence: "high" as const,
      sources: [],
      type: "reactive" as const,
    };

    // Validate even mock responses per spec
    const validation = this.validateResponse(response, context);
    if (validation.severity === "critical") {
      return REFUSAL_RESPONSE;
    }

    // Downgrade if needed
    if (validation.severity === "downgrade") {
      return { ...response, confidence: "low" };
    }

    return response;
  }

  async generateProactiveCard(
    page: PageType,
    _context: CopilotContext
  ): Promise<CopilotResponse> {
    await new Promise((resolve) => setTimeout(resolve, 200));

    const fixture = proactiveFixtures.find((f) => f.triggerPage === page);

    return (
      fixture ?? {
        id: `proactive-${Date.now()}`,
        content: "Welcome to Accrue. I can help explain anything you see on this page.",
        confidence: "high" as const,
        sources: [],
        type: "proactive" as const,
        triggerPage: page,
      }
    );
  }

  validateResponse(
    response: CopilotResponse,
    context: CopilotContext
  ): ValidationResult {
    return validateResponse(response, context);
  }
}
