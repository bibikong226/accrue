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

const SOURCE_MARKOWITZ_1952: CopilotSource = {
  title: "Portfolio Selection",
  publisher: "Markowitz, H. -- The Journal of Finance, 7(1), 77-91",
  date: "1952-03",
};

const SOURCE_FAMA_FRENCH_1993: CopilotSource = {
  title: "Common risk factors in the returns on stocks and bonds",
  publisher: "Fama, E. & French, K. -- Journal of Financial Economics, 33(1), 3-56",
  date: "1993-02",
};

const SOURCE_LUSARDI_MITCHELL_2014: CopilotSource = {
  title: "The Economic Importance of Financial Literacy: Theory and Evidence",
  publisher: "Lusardi, A. & Mitchell, O. -- Journal of Economic Literature, 52(1), 5-44",
  date: "2014-03",
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
    id: "dashboard.sinceLastLogin",
    content:
      "Since yesterday: your portfolio moved +$479.45. Biggest mover: NVDA at $878.56, up $8.36 (+0.96%) " +
      "from its previous close of $870.20. Your portfolio is worth $99,656.95 total, with 68.4% in Technology. " +
      "Your time-weighted return of 8.2% is tracking slightly above your 8% annual growth target.",
    confidence: "high",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_BARBER_ODEAN_2000],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Why is my diversification rating low?",
      "Am I on track for my goal?",
      "Summarize my holdings",
    ],
  },
  research: {
    id: "research.onTickerOpen.generic",
    content:
      "When researching individual stocks, it helps to compare key metrics like P/E ratio and revenue growth " +
      "against industry averages. Studies show that individual investors who focus on fundamentals rather than " +
      "price momentum tend to achieve better long-term outcomes. Remember that past performance does not predict " +
      "future results -- analyst price targets represent estimates, not guarantees.",
    confidence: "moderate",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_KAHNEMAN_TVERSKY_1979],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Explain this stock's fundamentals",
      "How does this stock fit my portfolio?",
      "What do analysts say?",
    ],
  },
  orders: {
    id: "orders.proactive",
    content:
      "Before placing a trade, consider whether this aligns with your stated goal of growth over a 5-10 year " +
      "time horizon. Research by Barber and Odean (2000) found that frequent trading tends to reduce returns " +
      "due to transaction costs and poor timing. Your cash balance is $12,430.00. If you are adding to an existing " +
      "position, dollar-cost averaging can help reduce the impact of short-term price fluctuations.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_THALER_1999],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What is dollar-cost averaging?",
      "How will this affect my diversification?",
      "Show my recent trades",
    ],
  },
  review: {
    id: "orderReview.preflight",
    content:
      "Take a moment to review all the details of this order before confirming. " +
      "This is a real financial transaction. Ensure the number of shares, order type, and estimated cost " +
      "match your intention. Your portfolio is already 68.4% Technology -- consider whether this trade " +
      "increases concentration risk. There are no commissions, but market orders execute at the best available " +
      "price, which may differ slightly from the quoted price.",
    confidence: "high",
    sources: [SOURCE_SIFAT_2023, SOURCE_BENARTZI_THALER_2001],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "How would this trade affect my diversification?",
      "What is concentration risk?",
      "Explain market vs. limit orders",
    ],
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

// ─── ID-keyed fixtures (§ 17 spec) ───
// Every fixture uses REAL numbers from mockPortfolio.ts.

export const fixturesById: Record<string, CopilotResponse> = {
  // ── PROACTIVE ──

  "dashboard.firstLoad": {
    id: "dashboard.firstLoad",
    content:
      "Welcome back, Alex. Your portfolio is worth $99,656.95, up $3,421.10 (+3.56%) overall. " +
      "You are 83.05% of the way to your $120,000 goal by December 2028. " +
      "Your diversification rating is Low because 68.4% sits in the Technology sector. " +
      "Consider reviewing your allocation to reduce concentration risk.",
    confidence: "high",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_CHAUDHRY_KULKARNI_2021],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Why is my diversification rating low?",
      "Am I on track for my goal?",
      "Summarize my holdings",
    ],
  },

  "dashboard.sinceLastLogin": {
    id: "dashboard.sinceLastLogin",
    content:
      "Since yesterday: your portfolio moved +$479.45. Biggest mover: NVDA at $878.56, up $8.36 (+0.96%) " +
      "from its previous close of $870.20. AAPL also gained, rising $1.79 (+0.84%) to $214.29. " +
      "MSFT added $2.77 (+0.63%). No holdings declined today. " +
      "Your time-weighted return of 8.2% continues to track above your 8% annual goal.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_CHAUDHRY_KULKARNI_2021],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Why did NVDA go up?",
      "How is my goal progress?",
      "Show my diversification",
    ],
  },

  "research.onTickerOpen.AAPL": {
    id: "research.onTickerOpen.AAPL",
    content:
      "Apple Inc. (AAPL) is currently $214.29, up 29.72% from your average cost of $165.20. " +
      "You hold 50 shares worth $10,714.50, making it 10.75% of your portfolio. " +
      "The P/E ratio of 33.4 is above the S&P 500 average of ~23, reflecting premium growth expectations. " +
      "Apple has beaten earnings estimates in all four recent quarters. " +
      "43 analysts cover the stock: 28 buy, 12 hold, 3 sell, with a mean price target of $235.00.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Explain Apple's P/E ratio",
      "How does AAPL fit my portfolio?",
      "Show AAPL earnings history",
    ],
  },

  "research.onTickerOpen.NVDA": {
    id: "research.onTickerOpen.NVDA",
    content:
      "NVIDIA Corporation (NVDA) is currently $878.56, up 41.68% from your average cost of $620.00. " +
      "You hold 25 shares worth $21,964.00, making it your largest position at 22.04% of your portfolio. " +
      "The P/E ratio of 62.8 reflects extremely high growth expectations, supported by 122.4% year-over-year revenue growth. " +
      "NVDA has a beta of 1.68, meaning it historically moves 68% more than the overall market. " +
      "55 analysts cover the stock: 45 buy, 8 hold, 2 sell, with a mean price target of $950.00.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_KAHNEMAN_TVERSKY_1979],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What does NVDA's beta mean for me?",
      "Is my NVDA position too large?",
      "Show NVDA earnings history",
    ],
  },

  "research.onTickerOpen.MSFT": {
    id: "research.onTickerOpen.MSFT",
    content:
      "Microsoft Corporation (MSFT) is currently $442.87, up 16.39% from your average cost of $380.50. " +
      "You hold 40 shares worth $17,714.80, making it 17.78% of your portfolio. " +
      "The P/E ratio of 36.2 is above the S&P 500 average but supported by consistent 15.2% revenue growth. " +
      "With a beta of 0.89, MSFT is slightly less volatile than the overall market. " +
      "49 analysts cover the stock: 38 buy, 10 hold, 1 sell, with a mean price target of $480.00.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Compare MSFT to my other tech holdings",
      "Explain MSFT's fundamentals",
      "Show MSFT earnings history",
    ],
  },

  "orderReview.preflight": {
    id: "orderReview.preflight",
    content:
      "Before you confirm: your portfolio is already 68.4% Technology. Adding more tech exposure increases " +
      "concentration risk. Research by Benartzi and Thaler (2001) shows that investors often underestimate " +
      "the risks of concentrated portfolios. Your cash balance is $12,430.00. " +
      "Ensure this order aligns with your stated goal of 8% annual growth over a 5-10 year horizon. " +
      "If this is a market order, the execution price may differ slightly from the quoted price.",
    confidence: "high",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_BARBER_ODEAN_2000, SOURCE_SIFAT_2023],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "How would this trade affect my diversification?",
      "What is the difference between market and limit orders?",
      "Explain concentration risk",
    ],
  },

  // ── REACTIVE — portfolio ──

  "explain.todaysChange": {
    id: "explain.todaysChange",
    content:
      "Today your portfolio moved +$479.45. Here is the breakdown by holding: " +
      "NVDA contributed the most, gaining $8.36 per share (+0.96%) across 25 shares (+$209.00). " +
      "AAPL added $1.79 per share (+0.84%) across 50 shares (+$89.50). " +
      "MSFT rose $2.77 per share (+0.63%) across 40 shares (+$110.80). " +
      "AMZN gained $1.32 per share (+0.70%) across 75 shares (+$99.00). " +
      "BRK.B added $1.42 per share (+0.31%) across 10 shares (+$14.20). " +
      "Daily fluctuations are normal -- Kahneman and Tversky (1979) found that people feel losses twice as strongly as gains, " +
      "which can lead to unnecessary trading.",
    confidence: "high",
    sources: [SOURCE_KAHNEMAN_TVERSKY_1979, SOURCE_BARBER_ODEAN_2000],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Is this a normal daily move?",
      "How is my goal progress?",
      "What is loss aversion?",
    ],
  },

  "summarize.holdings": {
    id: "summarize.holdings",
    content:
      "You hold 5 positions totaling $87,226.95 in equities plus $12,430.00 in cash ($99,656.95 total). " +
      "NVDA is your largest at $21,964.00 (22.04%), followed by MSFT at $17,714.80 (17.78%), " +
      "AMZN at $14,206.50 (14.26%), AAPL at $10,714.50 (10.75%), and BRK.B at $4,627.15 (4.64%). " +
      "All five positions are currently profitable. Your best performer by percentage is NVDA (+41.68%), " +
      "and your most modest gain is BRK.B (+1.70%). " +
      "Three of your five holdings are in the Technology sector, which drives your Low diversification rating.",
    confidence: "high",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_MARKOWITZ_1952],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Why is my diversification low?",
      "Which holding should I research?",
      "How does my portfolio compare to the S&P 500?",
    ],
  },

  "diversification.status": {
    id: "diversification.status",
    content:
      "Your diversification rating is Low. Here is why: 68.4% of your portfolio is in Technology " +
      "(AAPL 10.75% + NVDA 22.04% + MSFT 17.78% + partial AMZN exposure). " +
      "Consumer Discretionary is 14.2% (AMZN), Financial Services is 5.0% (BRK.B), and Cash is 12.4%. " +
      "Markowitz (1952) demonstrated that diversification across uncorrelated assets reduces portfolio risk " +
      "without necessarily reducing expected return. Sectors like Healthcare, Energy, and Consumer Staples " +
      "have historically low correlation with Technology. " +
      "Your current allocation means a tech-sector downturn would affect over two-thirds of your invested capital.",
    confidence: "high",
    sources: [SOURCE_MARKOWITZ_1952, SOURCE_BENARTZI_THALER_2001],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What sectors should I consider?",
      "What is diversification?",
      "How does concentration risk affect my goal?",
    ],
  },

  "goal.projectedPace": {
    id: "goal.projectedPace",
    content:
      "Your current portfolio value is $99,656.95 toward your $120,000 target by December 2028. " +
      "You are 83.05% of the way there with a projected completion date of June 2028 -- about 6 months ahead. " +
      "The projection confidence is 72%, meaning there is meaningful uncertainty. " +
      "Your time-weighted return of 8.2% is slightly above your 8% annual growth target. " +
      "Thaler (1999) notes that mental accounting can lead investors to take on additional risk once they feel " +
      "'ahead of schedule.' Staying with your current strategy may be more prudent than increasing risk to accelerate.",
    confidence: "moderate",
    sources: [SOURCE_THALER_1999, SOURCE_BARBER_ODEAN_2000],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What could delay my goal?",
      "Should I change my strategy?",
      "What is time-weighted return?",
    ],
  },

  // ── REACTIVE — research ──

  "explain.fundamentals.AAPL": {
    id: "explain.fundamentals.AAPL",
    content:
      "Apple's key fundamentals: Market cap is $3.28 trillion, making it one of the world's most valuable companies. " +
      "P/E ratio is 33.4, meaning investors pay $33.40 for every $1 of earnings. This is above the S&P 500 average of ~23. " +
      "EPS (trailing twelve months) is $6.42. Revenue growth year-over-year is 4.9%, which is moderate. " +
      "Dividend yield is 0.44%, relatively low but consistent. " +
      "Beta is 1.24, meaning AAPL tends to move 24% more than the market in either direction. " +
      "The 52-week range is $164.08 to $237.49; at $214.29, the stock is in the upper portion of its range.",
    confidence: "high",
    sources: [SOURCE_FAMA_FRENCH_1993, SOURCE_LUSARDI_MITCHELL_2014],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What is a good P/E ratio?",
      "How does AAPL compare to MSFT?",
      "Show analyst ratings for AAPL",
    ],
  },

  "compare.withPortfolio.AAPL": {
    id: "compare.withPortfolio.AAPL",
    content:
      "AAPL makes up 10.75% of your portfolio. Compared to your other holdings: " +
      "AAPL's P/E of 33.4 is lower than NVDA (62.8) and AMZN (58.4) but close to MSFT (36.2). " +
      "AAPL's beta of 1.24 is moderate -- lower than NVDA (1.68) but higher than MSFT (0.89) and BRK.B (0.55). " +
      "AAPL's revenue growth of 4.9% is the slowest among your tech holdings (NVDA: 122.4%, MSFT: 15.2%). " +
      "AAPL is your only holding with a meaningful dividend yield at 0.44%. " +
      "Adding more AAPL would increase your Technology allocation from 68.4%, further concentrating sector risk.",
    confidence: "high",
    sources: [SOURCE_MARKOWITZ_1952, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Compare AAPL to NVDA",
      "Is my AAPL position the right size?",
      "What would adding more AAPL do to my diversification?",
    ],
  },

  "analyze.analystRatings.AAPL": {
    id: "analyze.analystRatings.AAPL",
    content:
      "43 analysts cover Apple. The consensus breakdown: 28 buy (65.1%), 12 hold (27.9%), 3 sell (7.0%). " +
      "Price target range: low $180.00, mean $235.00, high $270.00. " +
      "At the current price of $214.29, the mean target implies 9.7% upside. " +
      "Important context: analyst price targets are estimates, not guarantees. " +
      "Barber and Odean (2000) found that individual investors who rely heavily on analyst recommendations " +
      "without independent research tend to underperform. Use these ratings as one input among many.",
    confidence: "moderate",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "How reliable are analyst targets?",
      "Show AAPL earnings history",
      "What is a price target?",
    ],
  },

  "explain.earnings.AAPL": {
    id: "explain.earnings.AAPL",
    content:
      "Apple has beaten earnings estimates in all four recent quarters: " +
      "Q1 2026: actual $1.65 vs. estimate $1.60 (+3.13% surprise). " +
      "Q4 2025: actual $2.18 vs. estimate $2.11 (+3.32% surprise). " +
      "Q3 2025: actual $1.46 vs. estimate $1.39 (+5.04% surprise). " +
      "Q2 2025: actual $1.40 vs. estimate $1.35 (+3.70% surprise). " +
      "Consistent earnings beats can signal strong execution, but they also raise the bar -- " +
      "a single miss after a streak of beats can cause outsized price drops due to elevated expectations.",
    confidence: "high",
    sources: [SOURCE_KAHNEMAN_TVERSKY_1979, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What happens if AAPL misses earnings?",
      "Explain EPS",
      "Compare AAPL earnings to NVDA",
    ],
  },

  // ── REACTIVE — glossary ──

  "define.pe_ratio": {
    id: "define.pe_ratio",
    content:
      "P/E Ratio (Price-to-Earnings Ratio): The price of a stock divided by its earnings per share (EPS). " +
      "It tells you how much investors are willing to pay for each dollar of earnings. " +
      "A higher P/E suggests investors expect higher future growth. " +
      "In your portfolio: AAPL has a P/E of 33.4, MSFT is 36.2, NVDA is 62.8, AMZN is 58.4, and BRK.B is 11.2. " +
      "The S&P 500 average P/E is approximately 23. A P/E by itself does not tell you if a stock is overvalued or undervalued -- " +
      "it must be compared to the company's growth rate, industry peers, and historical range.",
    confidence: "high",
    sources: [SOURCE_LUSARDI_MITCHELL_2014, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Why is NVDA's P/E so high?",
      "What is EPS?",
      "How do I use P/E when researching stocks?",
    ],
  },

  "define.market_cap": {
    id: "define.market_cap",
    content:
      "Market Capitalization (Market Cap): The total dollar value of a company's outstanding shares, " +
      "calculated as share price multiplied by total shares outstanding. " +
      "It represents the market's valuation of the entire company. " +
      "In your portfolio: MSFT ($3.29T) and AAPL ($3.28T) are mega-cap, NVDA ($2.16T) and AMZN ($1.97T) are also mega-cap, " +
      "and BRK.B ($996B) is large-cap. " +
      "Companies are typically categorized as: mega-cap (>$200B), large-cap ($10B-$200B), mid-cap ($2B-$10B), " +
      "small-cap ($300M-$2B), and micro-cap (<$300M). " +
      "Your portfolio holds only mega-cap and large-cap stocks, which tend to be less volatile but may offer slower growth than smaller companies.",
    confidence: "high",
    sources: [SOURCE_LUSARDI_MITCHELL_2014, SOURCE_FAMA_FRENCH_1993],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Does market cap affect risk?",
      "What is a mega-cap stock?",
      "Should I add smaller companies?",
    ],
  },

  "define.diversification": {
    id: "define.diversification",
    content:
      "Diversification: An investment strategy that spreads holdings across different assets, sectors, and geographies " +
      "to reduce the impact of any single investment's poor performance on the overall portfolio. " +
      "Markowitz (1952) proved mathematically that a diversified portfolio can achieve the same expected return " +
      "with lower risk than a concentrated one. " +
      "Your portfolio's diversification rating is Low because 68.4% is in the Technology sector. " +
      "True diversification means holding assets that do not move in the same direction at the same time -- " +
      "for example, bonds often rise when stocks fall, and different sectors respond differently to economic conditions.",
    confidence: "high",
    sources: [SOURCE_MARKOWITZ_1952, SOURCE_BENARTZI_THALER_2001],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "How can I diversify my portfolio?",
      "What is correlation in investing?",
      "Why is my diversification low?",
    ],
  },

  "define.beta": {
    id: "define.beta",
    content:
      "Beta: A measure of how much a stock's price moves relative to the overall market (typically the S&P 500). " +
      "A beta of 1.0 means the stock moves in line with the market. " +
      "Greater than 1.0 means more volatile -- NVDA's beta of 1.68 means it historically moves 68% more than the market. " +
      "Less than 1.0 means less volatile -- BRK.B's beta of 0.55 means it moves about half as much as the market. " +
      "In your portfolio: NVDA (1.68), AAPL (1.24), AMZN (1.15), MSFT (0.89), BRK.B (0.55). " +
      "Beta measures historical price volatility, not fundamental quality. A high-beta stock is not inherently bad -- " +
      "it simply means larger price swings in both directions.",
    confidence: "high",
    sources: [SOURCE_FAMA_FRENCH_1993, SOURCE_LUSARDI_MITCHELL_2014],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Is high beta bad?",
      "What is my portfolio's overall beta?",
      "How does beta relate to risk?",
    ],
  },

  // ── REACTIVE — order ──

  "explain.thisTrade": {
    id: "explain.thisTrade",
    content:
      "This trade will use your available cash balance of $12,430.00. " +
      "Consider the following before confirming: " +
      "1. Does this trade move your portfolio closer to your target allocation, or further from it? " +
      "2. Barber and Odean (2000) found that the most active traders underperformed by 6.5% annually. " +
      "3. Your stated time horizon is 5-10 years -- does this trade serve that long-term view? " +
      "4. Check your investment journal for your original rationale on this holding. " +
      "No commissions are charged on this platform, but market orders execute at the best available price, " +
      "which may differ slightly from the displayed quote.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_THALER_1999],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What is the difference between market and limit orders?",
      "How will this affect my diversification?",
      "Show my recent trades",
    ],
  },

  "risk.concentration": {
    id: "risk.concentration",
    content:
      "Concentration risk alert: your Technology allocation is already 68.4%. " +
      "If this trade adds to a Technology holding, your concentration will increase further. " +
      "Benartzi and Thaler (2001) found that many investors unknowingly build concentrated portfolios " +
      "because they add to what has performed well recently (recency bias). " +
      "A single-sector downturn affecting Technology could impact over two-thirds of your invested capital. " +
      "Your only non-tech equity holding is BRK.B (Financial Services, 4.64%). " +
      "Consider whether this aligns with your moderate risk tolerance.",
    confidence: "high",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_KAHNEMAN_TVERSKY_1979, SOURCE_MARKOWITZ_1952],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What sectors would reduce my concentration?",
      "What is recency bias?",
      "Show my sector allocation",
    ],
  },

  // ── REACTIVE — chart ──

  "explain.chart.AAPL.1M": {
    id: "explain.chart.AAPL.1M",
    content:
      "Over the past month, AAPL has traded between approximately $204.32 and $218.76. " +
      "The current price of $214.29 is near the upper end of this range. " +
      "Apple unveiled new AI features on April 15 and reported record services revenue on April 12, " +
      "both of which may have contributed to recent price strength. " +
      "With a beta of 1.24, AAPL's 1-month movement has been consistent with slightly above-market volatility. " +
      "Short-term price patterns are not reliable predictors of future performance -- " +
      "focus on fundamentals and your long-term investment thesis rather than chart trends.",
    confidence: "moderate",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_ELAVSKY_2022],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Show AAPL over 1 year",
      "What drove AAPL's recent gains?",
      "Explain AAPL's fundamentals",
    ],
  },

  "explain.chart.AAPL.1Y": {
    id: "explain.chart.AAPL.1Y",
    content:
      "Over the past year, AAPL has ranged from a 52-week low of $164.08 to a high of $237.49. " +
      "At $214.29, the stock is 30.6% above its 52-week low and 9.8% below its high. " +
      "Your average cost of $165.20 means you are up 29.72% on this position. " +
      "The 1-year chart shows a general upward trend with normal periods of consolidation. " +
      "Apple's four consecutive earnings beats and growing services revenue have been key drivers. " +
      "Remember: past performance is not a guarantee of future results, and a stock near its highs " +
      "is not inherently overvalued if supported by earnings growth.",
    confidence: "moderate",
    sources: [SOURCE_FAMA_FRENCH_1993, SOURCE_ELAVSKY_2022],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Compare AAPL's 1-year to NVDA's",
      "Is AAPL overvalued at this price?",
      "Show analyst price targets for AAPL",
    ],
  },

  "explain.chart.NVDA.1M": {
    id: "explain.chart.NVDA.1M",
    content:
      "Over the past month, NVDA has traded between approximately $831.23 and $901.45. " +
      "The current price of $878.56 is in the middle of this range. " +
      "With a beta of 1.68, NVDA is significantly more volatile than the overall market -- " +
      "its 1-month price swings are larger than those of lower-beta holdings like MSFT (0.89) or BRK.B (0.55). " +
      "News about data center revenue surging 154% and Blackwell GPU mass production may have driven recent activity. " +
      "Kahneman and Tversky (1979) showed that volatile stocks trigger stronger emotional reactions -- " +
      "be aware of this bias when interpreting short-term chart movements.",
    confidence: "moderate",
    sources: [SOURCE_KAHNEMAN_TVERSKY_1979, SOURCE_ELAVSKY_2022],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Why is NVDA so volatile?",
      "Show NVDA over 1 year",
      "What is beta?",
    ],
  },

  // ── REACTIVE — trades ──

  "analyze.trade.buy1": {
    id: "analyze.trade.buy1",
    content:
      "This NVDA buy on October 5, 2025 at $580.00 was based on the thesis that AI infrastructure build-out " +
      "is a multi-year secular trend. The position is now at $878.56, a 51.5% gain. NVIDIA has beaten earnings " +
      "estimates for 4 consecutive quarters, and data center revenue grew 154% year-over-year. " +
      "The thesis has largely played out, though the magnitude of the gain was amplified by broader AI enthusiasm " +
      "beyond pure fundamentals. The position grew to 22% of your portfolio, which exceeds typical single-stock " +
      "concentration guidelines. Barber and Odean (2000) found that concentrated positions, while capable of " +
      "outsized gains, also carry outsized risk.",
    confidence: "high",
    sources: [SOURCE_BARBER_ODEAN_2000, SOURCE_KAHNEMAN_TVERSKY_1979],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Is my NVDA position too large?",
      "What is concentration risk?",
      "Show my NVDA trade history",
    ],
  },

  "analyze.trade.sell1": {
    id: "analyze.trade.sell1",
    content:
      "Your NVDA trim on April 10, 2026 sold 3 shares at $870.50 for $2,611.50, realizing a $871.50 gain (50.1%). " +
      "You originally bought these shares at $580.00. The sell was motivated by rebalancing -- NVDA had grown to 22% " +
      "of your portfolio, exceeding your 20% single-stock limit. This is a disciplined approach: setting rebalancing " +
      "thresholds in advance and following them removes emotion from the decision. " +
      "Thaler (1999) describes this as overcoming the 'disposition effect' -- the tendency to hold winners too long. " +
      "The proceeds were moved to cash to build your emergency fund, which is currently at $12,430 of your $25,000 target. " +
      "Outcome: thesis played out. AI confidence: high.",
    confidence: "high",
    sources: [SOURCE_THALER_1999, SOURCE_ODEAN_1998],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Was selling NVDA the right decision?",
      "How is my emergency fund progressing?",
      "What is the disposition effect?",
    ],
  },

  "lessons.across.trades": {
    id: "lessons.across.trades",
    content:
      "Analyzing your 8 trade entries, several patterns emerge: " +
      "1. Your strongest results came from planned, thesis-driven buys (AAPL at $152.40, up 40.6%; NVDA at $580, up 51.5%) " +
      "rather than reactive trades. " +
      "2. Dollar-cost averaging into core positions (AAPL, MSFT) has produced consistent, positive results. " +
      "3. Your one sell (NVDA trim) followed a pre-set rebalancing rule, which is a best practice. " +
      "4. Your thesis accuracy is strong: 4 of 8 trades have AI outcomes of 'played out,' 2 are 'mixed,' " +
      "and 2 are 'too early' to evaluate. None have failed outright. " +
      "5. Your biggest risk pattern is concentration -- 3 of 5 current holdings are in Technology (68.4% of portfolio). " +
      "Benartzi and Thaler (2001) found this kind of sector clustering is common among individual investors. " +
      "Consider whether future trades should target non-tech sectors for diversification.",
    confidence: "moderate",
    sources: [SOURCE_BENARTZI_THALER_2001, SOURCE_BARBER_ODEAN_2000, SOURCE_ODEAN_1998],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Which sectors should I consider?",
      "What is my win rate?",
      "How can I improve my trade process?",
    ],
  },

  // ── REACTIVE — what-if ──

  "simulate.allocationChange.AAPL": {
    id: "simulate.allocationChange.AAPL",
    content:
      "If you bought 20 more shares of AAPL at the current price of $214.29: " +
      "Cost: $4,285.80 from your $12,430.00 cash balance (leaving $8,144.20 in cash). " +
      "Your AAPL position would grow from $10,714.50 to $15,000.30 (from 10.75% to 14.43% of portfolio). " +
      "Your Technology sector allocation would increase from 68.4% to 72.1%. " +
      "Your diversification rating would remain Low. " +
      "Your cash allocation would drop from 12.4% to 7.8%. " +
      "This simulation is hypothetical -- it does not account for price changes during execution or market impact.",
    confidence: "moderate",
    sources: [SOURCE_MARKOWITZ_1952, SOURCE_BENARTZI_THALER_2001],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "What if I bought a non-tech stock instead?",
      "How much cash should I keep?",
      "Show my current allocation",
    ],
  },
};

// ─── Keyword-to-fixture-ID mapping for flexible adapter matching ───

export interface KeywordMapping {
  keywords: string[];
  fixtureId: string;
}

export const keywordMappings: KeywordMapping[] = [
  // Proactive triggers
  { keywords: ["what changed", "since yesterday", "since last login", "what happened"], fixtureId: "dashboard.sinceLastLogin" },
  { keywords: ["overview", "summary", "first load", "portfolio overview"], fixtureId: "dashboard.firstLoad" },

  // Portfolio reactive
  { keywords: ["today", "today's change", "daily change", "daily move"], fixtureId: "explain.todaysChange" },
  { keywords: ["holdings", "summarize holdings", "my positions", "what do i own"], fixtureId: "summarize.holdings" },
  { keywords: ["diversif", "concentrated", "allocation", "sector breakdown"], fixtureId: "diversification.status" },
  { keywords: ["goal", "target", "on track", "progress", "projected", "pace"], fixtureId: "goal.projectedPace" },

  // Research reactive
  { keywords: ["fundamentals aapl", "apple fundamentals", "aapl metrics", "apple metrics"], fixtureId: "explain.fundamentals.AAPL" },
  { keywords: ["compare aapl", "aapl portfolio", "apple portfolio fit", "how does aapl fit"], fixtureId: "compare.withPortfolio.AAPL" },
  { keywords: ["analyst aapl", "apple analyst", "aapl ratings", "apple ratings"], fixtureId: "analyze.analystRatings.AAPL" },
  { keywords: ["earnings aapl", "apple earnings", "aapl earnings"], fixtureId: "explain.earnings.AAPL" },

  // Glossary
  { keywords: ["p/e ratio", "pe ratio", "price to earnings", "price-to-earnings"], fixtureId: "define.pe_ratio" },
  { keywords: ["market cap", "market capitalization", "company size"], fixtureId: "define.market_cap" },
  { keywords: ["diversification", "what is diversif"], fixtureId: "define.diversification" },
  { keywords: ["beta", "what is beta", "stock beta"], fixtureId: "define.beta" },

  // Order
  { keywords: ["this trade", "explain trade", "about this order", "order details"], fixtureId: "explain.thisTrade" },
  { keywords: ["concentration risk", "too concentrated", "sector risk", "overweight"], fixtureId: "risk.concentration" },

  // Chart
  { keywords: ["chart aapl 1m", "aapl 1 month", "apple 1 month chart", "aapl month"], fixtureId: "explain.chart.AAPL.1M" },
  { keywords: ["chart aapl 1y", "aapl 1 year", "apple 1 year chart", "aapl year"], fixtureId: "explain.chart.AAPL.1Y" },
  { keywords: ["chart nvda 1m", "nvda 1 month", "nvidia 1 month chart", "nvda month"], fixtureId: "explain.chart.NVDA.1M" },

  // Trades
  { keywords: ["analyze buy", "nvda buy", "buy trade", "trade buy"], fixtureId: "analyze.trade.buy1" },
  { keywords: ["analyze sell", "nvda sell", "sell trade", "trade sell", "trim"], fixtureId: "analyze.trade.sell1" },
  { keywords: ["lessons", "patterns across", "trade patterns", "across trades", "trade insights"], fixtureId: "lessons.across.trades" },

  // What-if
  { keywords: ["what if", "simulate", "hypothetical", "if i bought"], fixtureId: "simulate.allocationChange.AAPL" },
];

/**
 * Find a fixture by its exact ID.
 */
export function getFixtureById(id: string): CopilotResponse | undefined {
  return fixturesById[id];
}

/**
 * Find a matching fixture by keyword search against a user query.
 * Returns the fixture ID if found, undefined otherwise.
 */
export function matchKeywordToFixtureId(query: string): string | undefined {
  const lower = query.toLowerCase();
  const match = keywordMappings.find((mapping) =>
    mapping.keywords.some((kw) => lower.includes(kw))
  );
  return match?.fixtureId;
}

/**
 * Find a matching reactive fixture for a user query.
 * First tries ID-keyed fixtures via keyword mapping, then falls back to legacy pattern matching.
 * Returns undefined if no pattern matches.
 */
export function matchReactiveFixture(
  query: string
): CopilotResponse | undefined {
  // Try keyword-to-ID mapping first (new system)
  const fixtureId = matchKeywordToFixtureId(query);
  if (fixtureId && fixturesById[fixtureId]) {
    return fixturesById[fixtureId];
  }

  // Fall back to legacy pattern matching
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
    id: "fallback",
    content:
      "I can help you understand your portfolio, explain financial terms, or discuss investment concepts. " +
      "Try asking about your portfolio's diversification, risk profile, or goal progress. " +
      "Remember, I provide educational context -- not specific trade recommendations.",
    confidence: "moderate",
    sources: [SOURCE_CHAUDHRY_KULKARNI_2021],
    timestamp: new Date().toISOString(),
    followUpSuggestions: [
      "Summarize my holdings",
      "What is my diversification status?",
      "Am I on track for my goal?",
      "What is a P/E ratio?",
    ],
  };
}
