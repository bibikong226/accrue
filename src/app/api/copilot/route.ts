import { NextRequest, NextResponse } from "next/server";

/**
 * API route for the Anthropic copilot adapter.
 * In the prototype, this is not used — MockCopilotAdapter handles everything client-side.
 * This route exists as the integration point for the real Anthropic API when
 * NEXT_PUBLIC_COPILOT_ADAPTER is set to "anthropic".
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, context } = body;

    if (!query || !context) {
      return NextResponse.json(
        { error: "Missing required fields: query, context" },
        { status: 400 }
      );
    }

    // In the prototype, return a refusal — the mock adapter handles all responses
    return NextResponse.json({
      id: `api-${Date.now()}`,
      content:
        "The AI copilot API is not configured for this prototype. All responses are served from the mock adapter.",
      confidence: "low" as const,
      sources: [],
      type: "reactive" as const,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
