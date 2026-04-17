import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/copilot
 *
 * Stub API route for the Anthropic Copilot Adapter.
 * In the prototype, the MockCopilotAdapter is used instead of this endpoint.
 * This route exists as infrastructure for the production AnthropicCopilotAdapter.
 *
 * Expected request body:
 * {
 *   query: string;
 *   context: {
 *     page: string;
 *     holdings: Holding[];
 *     portfolioSummary: PortfolioSummary;
 *     glossary: Record<string, GlossaryEntry>;
 *   }
 * }
 *
 * Response shape matches CopilotResponse from /src/lib/copilot/types.ts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        {
          error:
            "Missing or invalid 'query' field. Expected a non-empty string.",
        },
        { status: 400 }
      );
    }

    /**
     * Stub response.
     * In production, this would:
     * 1. Build the system prompt from /src/lib/copilot/systemPrompt.ts
     * 2. Assemble context via /src/lib/copilot/buildContext.ts
     * 3. Call the Anthropic API
     * 4. Validate via /src/lib/copilot/validator.ts
     * 5. Return the validated CopilotResponse
     */
    const stubResponse = {
      id: `copilot-${Date.now()}`,
      content:
        "The AI Copilot is currently running in mock mode. In production, this endpoint would call the Anthropic API with your portfolio context and return a validated response. The copilot never recommends specific trades and always provides confidence levels and sources.",
      confidence: "high" as const,
      sources: [
        {
          title: "Accrue Platform Documentation",
          publisher: "Accrue",
          date: "2026-04-16",
        },
      ],
      type: "reactive" as const,
      metadata: {
        adapter: "stub",
        query: body.query,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(stubResponse, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        error:
          "Failed to process copilot request. Ensure the request body is valid JSON.",
      },
      { status: 500 }
    );
  }
}
