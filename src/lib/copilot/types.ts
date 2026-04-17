export type ConfidenceLevel = "low" | "moderate" | "high";

export type PageType =
  | "dashboard"
  | "research"
  | "orders"
  | "order_review"
  | "history"
  | "journal"
  | "help";

export interface CopilotSource {
  id: string;
  title: string;
  publisher: string;
  lastUpdated: string;
}

export interface CopilotResponse {
  id: string;
  content: string;
  confidence: ConfidenceLevel;
  sources: CopilotSource[];
  type: "proactive" | "reactive";
  triggerPage?: string;
  triggerQuery?: string;
}

export interface CopilotContext {
  portfolioTotalValue: number;
  holdings: Array<{
    symbol: string;
    name: string;
    shares: number;
    currentPrice: number;
    marketValue: number;
    gainLossPercent: number;
    sector: string;
    allocation: number;
  }>;
  goalTarget: number;
  goalCurrent: number;
  goalOnTrack: boolean;
  riskTolerance: string;
  currentPage: PageType;
  query?: string;
}

export interface ValidationResult {
  valid: boolean;
  severity: "ok" | "downgrade" | "critical";
  violations: string[];
}

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
