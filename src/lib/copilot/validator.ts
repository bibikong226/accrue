import type { CopilotResponse, CopilotContext, ValidationResult } from "./types";

/**
 * Response validation pipeline per § 10.4.
 * Runs on EVERY completion before rendering — MockAdapter and AnthropicAdapter both.
 */

const FORBIDDEN_PATTERNS = [
  // Price predictions
  /will reach/i,
  /expect(?:ed)? to hit/i,
  /target price of/i,
  /price will/i,
  /going to \$\d/i,
  /predicted to/i,

  // Trade directives
  /you should buy/i,
  /you should sell/i,
  /I recommend buying/i,
  /I recommend selling/i,
  /sell now/i,
  /buy now/i,
  /hold your/i,
  /I suggest (?:buying|selling|holding)/i,

  // Guarantee language
  /guaranteed return/i,
  /risk[- ]free/i,
  /certain to/i,
  /will definitely/i,
  /no risk/i,
];

export function validateResponse(
  response: CopilotResponse,
  _context: CopilotContext
): ValidationResult {
  const violations: string[] = [];

  // 1. Schema check
  if (!response.content || typeof response.content !== "string") {
    return { valid: false, severity: "critical", violations: ["Malformed response: missing content"] };
  }
  if (!response.confidence || !["low", "moderate", "high"].includes(response.confidence)) {
    return { valid: false, severity: "critical", violations: ["Malformed response: invalid confidence level"] };
  }
  if (!Array.isArray(response.sources)) {
    return { valid: false, severity: "critical", violations: ["Malformed response: sources must be an array"] };
  }

  // 2. Forbidden-pattern regex
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(response.content)) {
      return {
        valid: false,
        severity: "critical",
        violations: [`Forbidden pattern detected: ${pattern.source}`],
      };
    }
  }

  // 3. Source existence check
  for (const source of response.sources) {
    if (!source.id || !source.title || !source.publisher) {
      violations.push(`Incomplete source: ${JSON.stringify(source)}`);
    }
  }

  // If we have violations but none are critical, downgrade
  if (violations.length > 0) {
    return { valid: true, severity: "downgrade", violations };
  }

  return { valid: true, severity: "ok", violations: [] };
}

/** Refusal template for critical failures */
export const REFUSAL_RESPONSE: CopilotResponse = {
  id: "refusal",
  content:
    "I can't provide that information right now. Please check the Research section for verified data, or consult a qualified financial professional.",
  confidence: "low",
  sources: [],
  type: "reactive",
};
