/**
 * Copilot adapter entry point (CLAUDE.md A4).
 *
 * Consuming UI code imports through this module, never directly from
 * mockAdapter or anthropicAdapter. The adapter is selected by the
 * NEXT_PUBLIC_COPILOT_ADAPTER environment variable:
 *   - "mock" (default) -> MockCopilotAdapter
 *   - "anthropic"       -> AnthropicCopilotAdapter (post-prototype)
 */

import type { CopilotAdapter } from "./types";
import { MockCopilotAdapter } from "./mockAdapter";

/**
 * Get the configured copilot adapter instance.
 * Returns MockCopilotAdapter by default.
 * When NEXT_PUBLIC_COPILOT_ADAPTER is set to "anthropic",
 * dynamically imports and returns the Anthropic adapter.
 */
export function getCopilotAdapter(): CopilotAdapter {
  const adapterType =
    process.env.NEXT_PUBLIC_COPILOT_ADAPTER ?? "mock";

  if (adapterType === "anthropic") {
    // The Anthropic adapter will be implemented post-prototype.
    // For now, fall back to mock with a development warning.
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[Copilot] AnthropicCopilotAdapter is not yet implemented. " +
        "Falling back to MockCopilotAdapter. " +
        "Set NEXT_PUBLIC_COPILOT_ADAPTER=mock to suppress this warning."
      );
    }
    return new MockCopilotAdapter();
  }

  return new MockCopilotAdapter();
}

// Re-export types for convenience
export type {
  CopilotAdapter,
  CopilotResponse,
  CopilotContext,
  CopilotMessage,
  CopilotSource,
  ConfidenceLevel,
  PageType,
  ValidationResult,
} from "./types";

export { buildCopilotContext, serializeCopilotContext } from "./buildContext";
export { validateCopilotResponse, getRefusalResponse } from "./validator";
export { COPILOT_SYSTEM_PROMPT, COPILOT_SYSTEM_PROMPT_VERSION } from "./systemPrompt";
