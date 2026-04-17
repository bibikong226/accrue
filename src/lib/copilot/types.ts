/**
 * Copilot type definitions -- shared by mock and Anthropic adapters.
 * See CLAUDE.md A4 for the adapter architecture contract.
 */

export type ConfidenceLevel = "high" | "moderate" | "low";

export type PageType = "dashboard" | "research" | "orders" | "review";

/**
 * A verifiable source attached to every AI response (CLAUDE.md A3.3).
 */
export interface CopilotSource {
  title: string;
  publisher: string;
  url?: string;
  date: string;
}

/**
 * The structured AI response. Every response carries trust signals:
 * - confidence level (icon + text + color, redundantly)
 * - sources list with titles, publishers, and timestamps
 */
export interface CopilotResponse {
  id: string;
  content: string;
  confidence: ConfidenceLevel;
  sources: CopilotSource[];
  timestamp: string;
  /** Optional: if true, this was a proactive card, not a user-initiated query */
  isProactive?: boolean;
  /** Suggested follow-up questions the user can tap/click to continue the conversation */
  followUpSuggestions?: string[];
}

/**
 * A single message in the copilot conversation history.
 */
export interface CopilotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: CopilotResponse;
  timestamp: string;
}

/**
 * Context injected into every copilot call.
 * Built by buildContext.ts from mockPortfolio.ts data.
 */
export interface CopilotContext {
  page: PageType;
  ticker?: string;
  portfolioSummary: {
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPercent: number;
    cashBalance: number;
    diversificationRating: string;
    timeWeightedReturn: number;
    allocationBySector: Record<string, number>;
  };
  userProfile: {
    name: string;
    riskTolerance: string;
    experienceLevel: string;
    timeHorizon: string;
    goalType: string;
    goalTarget: number;
    goalDate: string;
  };
  holdingSummaries: Array<{
    symbol: string;
    name: string;
    allocation: number;
    gainLossPercent: number;
    sector: string;
  }>;
  goalProgress: {
    percentComplete: number;
    onTrack: boolean;
    confidencePercent: number;
  };
  glossaryTerms: string[];
}

/**
 * Result of the validation pipeline (CLAUDE.md A3.7).
 */
export interface ValidationResult {
  valid: boolean;
  /** Non-critical issues that should be logged but don't block rendering */
  warnings: string[];
  /** Critical issues that block rendering and trigger a refusal template */
  errors: string[];
  /** Whether validation failed critically (fabricated source, trade recommendation) */
  isCriticalFailure: boolean;
}

/**
 * The adapter interface both Mock and Anthropic implementations must satisfy.
 * Consuming UI code imports through /src/lib/copilot/index.ts, never directly.
 */
export interface CopilotAdapter {
  generateResponse(
    query: string,
    context: CopilotContext
  ): Promise<CopilotResponse>;

  generateProactiveCard(
    page: PageType,
    context: CopilotContext
  ): Promise<CopilotResponse>;

  validateResponse(
    response: CopilotResponse,
    context: CopilotContext
  ): ValidationResult;
}
