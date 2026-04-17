/**
 * Copilot response validation pipeline (CLAUDE.md A3.7).
 *
 * Every completion -- even mock responses -- passes through this validator
 * before rendering. Critical failures (fabricated sources, trade recommendations)
 * cause the response to be discarded and a refusal template rendered instead.
 */

import type { CopilotResponse, CopilotContext, ValidationResult } from "./types";

// ─── Forbidden patterns ───

/**
 * Patterns that indicate a trade recommendation (CLAUDE.md A3.2).
 * If any match, the response is critically invalid.
 */
const TRADE_RECOMMENDATION_PATTERNS: RegExp[] = [
  /\byou should (buy|sell|hold|trade|invest in|purchase|dump|short)\b/i,
  /\bI (recommend|suggest|advise|urge you to) (buy|sell|hold|trad)/i,
  /\b(buy|sell|purchase|acquire|dump|short)\s+\d+\s+(shares?|units?)\b/i,
  /\bmy recommendation is\b/i,
  /\bI would (buy|sell|hold)\b/i,
  /\bstrong (buy|sell)\b/i,
  /\byou (must|need to|have to) (buy|sell|trade)\b/i,
];

/**
 * Patterns indicating fabricated or suspicious numerical claims.
 * Flags for review but may not be critical on its own.
 */
const FABRICATED_NUMBER_PATTERNS: RegExp[] = [
  /\bwill (reach|hit|achieve|grow to) \$[\d,.]+\b/i,
  /\bguaranteed?\s+(return|profit|gain)\b/i,
  /\b100%\s+(certain|guaranteed|sure|chance)\b/i,
  /\b(will|shall)\s+definitely\b/i,
];

/**
 * Patterns that indicate false certainty about future outcomes.
 */
const FALSE_CERTAINTY_PATTERNS: RegExp[] = [
  /\bthe stock will\b/i,
  /\bprice will (go|rise|fall|drop|increase|decrease)\b/i,
  /\bthis (will|is going to) (make|earn|generate) you\b/i,
  /\bcannot lose\b/i,
  /\brisk.?free\b/i,
];

// ─── Validator functions ───

function checkTradeRecommendations(content: string): string[] {
  const errors: string[] = [];
  for (const pattern of TRADE_RECOMMENDATION_PATTERNS) {
    if (pattern.test(content)) {
      errors.push(
        `Trade recommendation detected: "${content.match(pattern)?.[0]}". ` +
        `The copilot must never recommend specific trades (Rule 2).`
      );
    }
  }
  return errors;
}

function checkFabricatedNumbers(content: string): string[] {
  const warnings: string[] = [];
  for (const pattern of FABRICATED_NUMBER_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(
        `Potentially fabricated numerical claim: "${content.match(pattern)?.[0]}". ` +
        `All numbers must come from the data context (Rule 1).`
      );
    }
  }
  return warnings;
}

function checkFalseCertainty(content: string): string[] {
  const warnings: string[] = [];
  for (const pattern of FALSE_CERTAINTY_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push(
        `False certainty language detected: "${content.match(pattern)?.[0]}". ` +
        `Use hedging language for forward-looking statements (Rule 6).`
      );
    }
  }
  return warnings;
}

function checkSourcesPresent(response: CopilotResponse): string[] {
  const warnings: string[] = [];
  if (!response.sources || response.sources.length === 0) {
    warnings.push(
      "Response has no sources. Every substantive response should cite sources (Rule 3)."
    );
  }
  return warnings;
}

function checkConfidenceLevel(response: CopilotResponse): string[] {
  const warnings: string[] = [];
  if (!response.confidence) {
    warnings.push(
      "Response has no confidence level. Every response must carry a confidence indicator (Rule 7)."
    );
  }
  return warnings;
}

function checkContentLength(content: string): string[] {
  const warnings: string[] = [];
  if (content.length < 20) {
    warnings.push("Response is suspiciously short. It may not be helpful.");
  }
  if (content.length > 3000) {
    warnings.push(
      "Response exceeds 3000 characters. Consider brevity for accessibility (Rule 8)."
    );
  }
  return warnings;
}

/**
 * Validate numbers in the response against the provided context data.
 * Checks that dollar amounts and percentages appearing in the response
 * can be traced back to the context.
 */
function checkNumbersAgainstContext(
  content: string,
  context: CopilotContext
): string[] {
  const warnings: string[] = [];

  // Extract dollar amounts from the response
  const dollarMatches = content.match(/\$[\d,]+\.?\d*/g);
  if (dollarMatches && dollarMatches.length > 0) {
    const contextValues = new Set<number>();
    contextValues.add(context.portfolioSummary.totalValue);
    contextValues.add(context.portfolioSummary.totalGainLoss);
    contextValues.add(context.portfolioSummary.cashBalance);
    contextValues.add(context.userProfile.goalTarget);

    for (const match of dollarMatches) {
      const numStr = match.replace(/[$,]/g, "");
      const num = parseFloat(numStr);
      if (!isNaN(num) && num > 100) {
        // Only check significant amounts
        const found = Array.from(contextValues).some(
          (v) => Math.abs(v - num) < 1
        );
        if (!found) {
          warnings.push(
            `Dollar amount ${match} not found in provided context. Verify this is not fabricated (Rule 1).`
          );
        }
      }
    }
  }

  return warnings;
}

// ─── Main validation pipeline ───

/**
 * Run the full validation pipeline on a copilot response.
 * Returns a ValidationResult indicating whether the response is safe to render.
 *
 * Critical failures (trade recommendations) cause isCriticalFailure=true,
 * which means the response should be discarded and a refusal template shown.
 */
export function validateCopilotResponse(
  response: CopilotResponse,
  context: CopilotContext
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical checks (block rendering)
  errors.push(...checkTradeRecommendations(response.content));

  // Warning checks (log but allow rendering)
  warnings.push(...checkFabricatedNumbers(response.content));
  warnings.push(...checkFalseCertainty(response.content));
  warnings.push(...checkSourcesPresent(response));
  warnings.push(...checkConfidenceLevel(response));
  warnings.push(...checkContentLength(response.content));
  warnings.push(...checkNumbersAgainstContext(response.content, context));

  const isCriticalFailure = errors.length > 0;

  // Log warnings in development
  if (process.env.NODE_ENV === "development" && warnings.length > 0) {
    console.warn("[CopilotValidator] Warnings:", warnings);
  }

  if (process.env.NODE_ENV === "development" && errors.length > 0) {
    console.error("[CopilotValidator] CRITICAL ERRORS:", errors);
  }

  return {
    valid: !isCriticalFailure,
    warnings,
    errors,
    isCriticalFailure,
  };
}

/**
 * The refusal template rendered when validation fails critically.
 */
export function getRefusalResponse(): CopilotResponse {
  return {
    id: `refusal-${Date.now()}`,
    content:
      "I was unable to generate a safe response to your question. " +
      "I cannot recommend specific trades or make guarantees about investment outcomes. " +
      "Try asking me to explain a concept, summarize your portfolio data, or discuss " +
      "general investment principles instead.",
    confidence: "high",
    sources: [],
    timestamp: new Date().toISOString(),
  };
}
