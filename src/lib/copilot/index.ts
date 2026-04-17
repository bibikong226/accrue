import { MockCopilotAdapter } from "./mockAdapter";
import type { CopilotAdapter } from "./types";

/**
 * Adapter selector per § A4.
 * UI imports only from this file. Never import adapters directly.
 * Switched via NEXT_PUBLIC_COPILOT_ADAPTER env var.
 * Default is "mock" for the prototype.
 */
export function getCopilotAdapter(): CopilotAdapter {
  // In the prototype, always use MockCopilotAdapter
  return new MockCopilotAdapter();
}

export { type CopilotAdapter, type CopilotResponse, type CopilotContext, type PageType, type ConfidenceLevel } from "./types";
