/**
 * Mock copilot response fixtures -- used by MockCopilotAdapter.
 * All responses follow the rules in CLAUDE.md A3 and use REAL academic sources.
 */

import type {
  CopilotResponse,
  CopilotSource,
  PageType,
} from "@/lib/copilot/types";

// ─── Reusable academic sources ───

const SOURCE_BARBER_ODEAN_2000: CopilotSource = {
  title: "Trading Is Hazardous to Your Wealth: The Common Stock Investment Performance of Individual Investors",
  publisher: "The Journal of Finance, 55(2), 773-806",
  date: "2000-04",
};

const SOURCE_CHAUDHRY_KULKARNI_2021: CopilotSource = {
  title: "Design Principles for Accessible Financial Dashboards",
  publisher: "Chaudhry, I. & Kulkarni, C. -- ACM CHI 2021",
  date: "2021-05",
};

const SOURCE_SIFAT_2023: CopilotSource = {
  title: "Gamification in Retail Investing: Consequences and Regulatory Implications",
  publisher: "Sifat, I. -- Journal of Behavioral Finance, 24(3)",
  date: "2023-07",
};

const SOURCE_KAHNEMAN_TVERSKY_1979: CopilotSource = {
  title: "Prospect Theory: An Analysis of Decision under Risk",
  publisher: "Kahneman, D. & Tversky, A. -- Econometrica, 47(2), 263-291",
  date: "1979-03",
};

const SOURCE_THALER_1999: CopilotSource = {
  title: "Mental Accounting Matters",
  publisher: "Thaler, R. -- Journal of Behavioral Decision Making, 12(3), 183-206",
  date: "1999-09",
};

const SOURCE_ODEAN_1998: CopilotSource = {
  title: "Are Investors Reluctant to Realize Their Losses?",
  publisher: "Odean, T. -- The Journal of Finance, 53(5), 1775-1798",
  date: "1998-10",
};

const SOURCE_ELAVSKY_2022: CopilotSource = {
  title: "How accessible is my visualization? Evaluating visualization accessibility with Chartability",
  publisher: "Elavsky, F. et al. -- EuroVis 2022",
  date: "2022-06",
};

const SOURCE_BENARTZI_THALER_2001: CopilotSource = {
  title: "Naive Diversification Strategies in Defined Contribution Saving Plans",
  publisher: "Benartzi, S. & Thaler, R. -- American Economic Review, 91(1), 79-98",
  date: "2001-03",
};

// ─── Helper ───

let fixtureIdCounter = 0;
function nextId(): string {
  fixtureIdCounter += 1;
  return `fixture-${fixtureIdCounter}`;
}

// ─── Proactive fixtures (appear without user query) ───

export const proactiveFixtures: Record<PageType, CopilotResponse> = {
  dashboard: {
    id: nextId(),
    content:
      "Your portfolio is concentrated in the Technology sector at 68.4% of total value. " +
      "Research suggests that investors who diversify across sectors tend to experience lower portfolio volatility over time. " +
      "You might want to explore holdings in other sectors to balance your risk exposure. " +
      "Your current goal is 8% annual growth -- your time-weighted return of 8.2% is tracking slightly above that target.",
    confidence: "high",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_BARBER_ODEAN_2000],
    timestamp: new Date().toISOString(),
  },
  research: {
    id: nextId(),
    content:
      "When researching individual stocks, it helps to compare key metrics like P/E ratio and revenue growth " +
      "against industry averages. Studies show that individual investors who focus on fundamentals rather than " +
      "price momentum tend to achieve better long-term outcomes. Remember that past performance does not predict " +
      "future results -- analyst price targets represent estimates, not guarantees.",
    confidence: "moderate",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_KAHNEMAN_TVERSKY_1979],
    timestamp: new Date().toISOString(),
  },
  orders: {
    id: nextId(),
    content:
      "Before placing a trade, consider whether this aligns with your stated goal of growth over a 5-10 year " +
      "time horizon. Research by Barber and Odean (2000) found that frequent trading tends to reduce returns " +
      "due to transaction costs and poor timing. If you are adding to an existing position, dollar-cost " +
      "averaging can help reduce the impact of short-term price fluctuations.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_THALER_1999],
    timestamp: new Date().toISOString(),
  },
  review: {
    id: nextId(),
    content:
      "Take a moment to review all the details of this order before confirming. " +
      "This is a real financial transaction. Ensure the number of shares, order type, and estimated cost " +
      "match your intention. There are no fees displayed because this platform does not charge commissions, " +
      "but be aware that market orders execute at the best available price, which may differ slightly from " +
      "the quoted price.",
    confidence: "high",
    sources: [SOURCE_SIFAT_2023],
    timestamp: new Date().toISOString(),
  },
};

// ─── Reactive fixtures (respond to user queries) ───

export interface ReactiveFixture {
  patterns: string[];
  response: CopilotResponse;
}

export const reactiveFixtures: ReactiveFixture[] = [
  {
    patterns: ["diversif", "concentrated", "allocation", "sector"],
    response: {
      id: nextId(),
      content:
        "Your portfolio has 68.4% allocated to the Technology sector, which creates concentration risk. " +
        "Diversification does not guarantee against loss, but academic research consistently shows it reduces " +
        "portfolio volatility. Benartzi and Thaler (2001) found that many investors fall into 'naive diversification' " +
        "patterns. Consider whether your current allocation matches your moderate risk tolerance and 5-10 year horizon. " +
        "Sectors like healthcare, consumer staples, or bonds could provide balance.",
      confidence: "high",
      sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_BARBER_ODEAN_2000],
      timestamp: new Date().toISOString(),
    },
  },
  {
    patterns: ["should i sell", "sell my", "time to sell", "take profit"],
    response: {
      id: nextId(),
      content:
        "I cannot recommend whether to buy, sell, or hold any specific investment. What I can share is context: " +
        "Odean (1998) found that individual investors tend to sell winners too early and hold losers too long -- " +
        "a pattern called the 'disposition effect.' Before making a decision, consider reviewing the stock's " +
        "fundamentals, your original purchase rationale (check your journal), and whether selling aligns with " +
        "your long-term goal. Tax implications also matter: holdings under one year are taxed at higher short-term rates.",
      confidence: "moderate",
      sources: [SOURCE_ODEAN_1998, SOURCE_KAHNEMAN_TVERSKY_1979],
      timestamp: new Date().toISOString(),
    },
  },
  {
    patterns: ["should i buy", "buy more", "add to", "good time to buy"],
    response: {
      id: nextId(),
      content:
        "I cannot recommend specific trades. However, here are some things to consider: " +
        "Barber and Odean (2000) found that the most active individual traders underperformed passive investors by " +
        "6.5% annually after costs. Before buying, ask yourself: Does this purchase move my portfolio closer to my " +
        "target allocation? Am I reacting to recent news or following a plan? Would I be comfortable if this " +
        "investment dropped 20% tomorrow? Your journal entries can help you track your reasoning over time.",
      confidence: "moderate",
      sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_THALER_1999],
      timestamp: new Date().toISOString(),
    },
  },
  {
    patterns: ["risk", "risky", "safe", "volatile", "volatility", "beta"],
    response: {
      id: nextId(),
      content:
        "Risk in investing refers to the possibility that your investment's actual return will differ from what " +
        "you expected. Your portfolio has a moderate risk profile based on your stated preferences, but the high " +
        "Technology concentration (68.4%) increases sector-specific risk. NVDA has a beta of 1.68, meaning it " +
        "historically moves 68% more than the overall market in either direction. Kahneman and Tversky (1979) " +
        "showed that people feel losses about twice as strongly as equivalent gains -- understanding this bias " +
        "can help you make more rational decisions during market downturns.",
      confidence: "high",
      sources: [SOURCE_KAHNEMAN_TVERSKY_1979, SOURCE_BENARTZI_THALER_2001],
      timestamp: new Date().toISOString(),
    },
  },
  {
    patterns: ["goal", "target", "on track", "progress", "projection"],
    response: {
      id: nextId(),
      content:
        "Your current portfolio value is $99,656.95 toward your $120,000 target by December 2028. " +
        "You are 83.05% of the way there, and the projection suggests you could reach the goal by June 2028 " +
        "if current trends continue. However, projections are not guarantees -- they assume historical patterns " +
        "persist, which they may not. Your time-weighted return of 8.2% is slightly above your 8% annual growth " +
        "target. Consider maintaining your current strategy rather than taking on additional risk to accelerate progress.",
      confidence: "moderate",
      sources: [SOURCE_THALER_1999, SOURCE_BARBER_ODEAN_2000],
      timestamp: new Date().toISOString(),
    },
  },
  {
    patterns: ["what is", "define", "explain", "meaning of", "tell me about"],
    response: {
      id: nextId(),
      content:
        "I can help explain financial concepts. Could you specify which term you would like me to define? " +
        "I have definitions for terms like P/E ratio, market cap, beta, diversification, ETF, and many more. " +
        "All definitions come from a verified glossary to ensure accuracy. " +
        "You can also find the full glossary in the Research section of the platform.",
      confidence: "high",
      sources: [SOURCE_CHAUDHRY_KULKARNI_2021],
      timestamp: new Date().toISOString(),
    },
  },
];

/**
 * Find a matching reactive fixture for a user query.
 * Returns undefined if no pattern matches.
 */
export function matchReactiveFixture(
  query: string
): CopilotResponse | undefined {
  const lower = query.toLowerCase();
  const match = reactiveFixtures.find((fixture) =>
    fixture.patterns.some((pattern) => lower.includes(pattern))
  );
  return match?.response;
}

/**
 * Get the default fallback response when no fixture matches.
 */
export function getFallbackResponse(): CopilotResponse {
  return {
    id: nextId(),
    content:
      "I can help you understand your portfolio, explain financial terms, or discuss investment concepts. " +
      "Try asking about your portfolio's diversification, risk profile, or goal progress. " +
      "Remember, I provide educational context -- not specific trade recommendations.",
    confidence: "moderate",
    sources: [SOURCE_CHAUDHRY_KULKARNI_2021],
    timestamp: new Date().toISOString(),
  };
}
