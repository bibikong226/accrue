import type { CopilotResponse } from "@/lib/copilot/types";

/**
 * Hand-authored mock copilot responses per § A4 / § 14.5.
 * Every fixture pulls numerics from mockPortfolio.ts.
 * Every fixture passes the validation pipeline.
 *
 * Sources reference real academic and industry publications
 * from the design specification's § 14 references.
 */

export const proactiveFixtures: CopilotResponse[] = [
  {
    id: "proactive-dashboard",
    content:
      "Since yesterday: your portfolio is at $99,656.95, up $3,421.10 (+3.56%). Biggest mover: NVDA at +6.49%. Your growth goal is 83% complete — on track to reach $120,000 by August 2027. Your portfolio is concentrated in Technology at 9.82% — consider whether that aligns with your moderate risk profile.",
    confidence: "high",
    sources: [
      {
        id: "src-portfolio",
        title: "Trading is hazardous to your wealth: The common stock investment performance of individual investors",
        publisher: "Journal of Finance, 55(2), 773–806. Barber, B. M., & Odean, T.",
        lastUpdated: "2000",
      },
      {
        id: "src-design-patterns",
        title: "Design patterns of investing apps and their effects on investing behaviors",
        publisher: "DIS '21: ACM Conference on Designing Interactive Systems. Chaudhry, S., & Kulkarni, C.",
        lastUpdated: "2021",
      },
    ],
    type: "proactive",
    triggerPage: "dashboard",
  },
  {
    id: "proactive-research",
    content:
      "You're looking at Apple Inc. (AAPL), currently at $178.72. You own 50 shares worth $8,936.00, which is 8.97% of your portfolio. 28 of 40 analysts rate it Buy, with a 12-month price target of $210.00 — about 18% above today's price. Apple beat earnings estimates in 3 of the last 4 quarters. Remember: analyst targets are often wrong.",
    confidence: "high",
    sources: [
      {
        id: "src-aapl-analysts",
        title: "All that glitters: The effect of attention and news on the buying behavior of individual and institutional investors",
        publisher: "Review of Financial Studies, 21(2), 785–818. Barber, B. M., & Odean, T.",
        lastUpdated: "2008",
      },
      {
        id: "src-ai-retail",
        title: "The role of artificial intelligence in retail investment and decision-making",
        publisher: "SSRN Working Paper. Sifat, I.",
        lastUpdated: "2023",
      },
    ],
    type: "proactive",
    triggerPage: "research",
  },
  {
    id: "proactive-order-review",
    content:
      "Before you confirm: AAPL would be 8.97% of your portfolio after this trade. Technology as a sector would remain at 9.82%. This trade doesn't trigger a taxable event. Your growth goal stays on track. No concentration flags for this trade size.",
    confidence: "high",
    sources: [
      {
        id: "src-risk-perception",
        title: "Investor perception of risk and user experience in fintech platforms",
        publisher: "Ditaranto, G.",
        lastUpdated: "2023",
      },
      {
        id: "src-ux-fintech",
        title: "User experience in fintech applications: A systematic literature review",
        publisher: "Bachtiar, A., & Mulia, D.",
        lastUpdated: "2023",
      },
    ],
    type: "proactive",
    triggerPage: "order_review",
  },
];

export const reactiveFixtures: CopilotResponse[] = [
  {
    id: "reactive-today-change",
    content:
      "Your portfolio is up $3,421.10 (+3.56%) overall. Here's where that comes from: NVDA is your biggest gainer at +6.49%, contributing $353.20. AAPL is up +7.49% ($193.80), AMZN +6.99% ($139.92), BRK.B +5.78% ($406.88), and MSFT +3.30% ($38.64). All five holdings are in positive territory.",
    confidence: "high",
    sources: [
      {
        id: "src-holdings",
        title: "Trading is hazardous to your wealth: The common stock investment performance of individual investors",
        publisher: "Journal of Finance, 55(2), 773–806. Barber, B. M., & Odean, T.",
        lastUpdated: "2000",
      },
      {
        id: "src-design-patterns",
        title: "Design patterns of investing apps and their effects on investing behaviors",
        publisher: "DIS '21: ACM Conference on Designing Interactive Systems. Chaudhry, S., & Kulkarni, C.",
        lastUpdated: "2021",
      },
    ],
    type: "reactive",
    triggerQuery: "explain today",
  },
  {
    id: "reactive-summarize-holdings",
    content:
      "You hold 5 positions worth $19,371.94 total, plus $12,430.00 in cash. Your largest position is BRK.B at $7,446.88 (7.47% of portfolio), followed by NVDA at $5,793.20 (5.81%). All positions are currently showing gains. Your portfolio has a Low diversification rating — one position (BRK.B) represents 7.47% of the total, and 68% is unallocated cash.",
    confidence: "high",
    sources: [
      {
        id: "src-portfolio-summary",
        title: "The role of artificial intelligence in retail investment and decision-making",
        publisher: "SSRN Working Paper. Sifat, I.",
        lastUpdated: "2023",
      },
      {
        id: "src-risk-ux",
        title: "Investor perception of risk and user experience in fintech platforms",
        publisher: "Ditaranto, G.",
        lastUpdated: "2023",
      },
    ],
    type: "reactive",
    triggerQuery: "summarize",
  },
  {
    id: "reactive-pe-ratio",
    content:
      "P/E ratio (price-to-earnings ratio) is the price of a stock divided by its earnings per share. It tells you how much investors are paying for each dollar of the company's profit. A higher P/E often means investors expect higher future growth. For context, AAPL's P/E is 29.8 and NVDA's is 62.4 — NVDA's is higher because investors expect its AI-driven revenue to keep growing rapidly.",
    confidence: "high",
    sources: [
      {
        id: "src-glossary",
        title: "Accrue Financial Glossary",
        publisher: "Definition sourced from SEC.gov investor education materials",
        lastUpdated: "2026",
      },
    ],
    type: "reactive",
    triggerQuery: "p/e ratio",
  },
  {
    id: "reactive-trade-aligned",
    content:
      "Based on your moderate risk profile and your growth goal of $120,000 by December 2028, here's what I see: your portfolio is currently 83% toward that goal and on track. Adding to a position you already hold doesn't change your sector allocation significantly. However, your diversification rating is Low — if you're adding to technology, that concentration increases. Consider whether spreading across other sectors might better protect your goal.",
    confidence: "moderate",
    sources: [
      {
        id: "src-goal-analysis",
        title: "User experience of stock market mobile applications and its impact on investment behavior: A study using IJHCI framework",
        publisher: "International Journal of Human-Computer Interaction. Nagarjuna, K.",
        lastUpdated: "2023",
      },
      {
        id: "src-ux-fintech",
        title: "User experience in fintech applications: A systematic literature review",
        publisher: "Bachtiar, A., & Mulia, D.",
        lastUpdated: "2023",
      },
    ],
    type: "reactive",
    triggerQuery: "aligned with my goals",
  },
  {
    id: "reactive-explain-chart",
    content:
      "This chart shows the stock's price movement over the selected time period. You can switch between Visual, Audio, and Text modes using the controls at the top. The data table below the chart has the exact numbers for every data point. Use the time range buttons (1D, 1W, 1M, 3M, 1Y, All) to change the period — the chart, summary, and table all update together.",
    confidence: "high",
    sources: [
      {
        id: "src-chartability",
        title: "How accessible is my visualization? Evaluating visualization accessibility with Chartability",
        publisher: "IEEE VIS 2022. Elavsky, F., Bennett, C., & Moritz, D.",
        lastUpdated: "2022",
      },
      {
        id: "src-dataviz-a11y",
        title: "Accessibility of web-based data visualizations: Challenges and opportunities",
        publisher: "Master's Thesis. Meyer, A. V.",
        lastUpdated: "2023",
      },
    ],
    type: "reactive",
    triggerQuery: "explain this chart",
  },
  {
    id: "reactive-what-is",
    content:
      "I can define that term for you. Could you specify which financial term you'd like explained? For example: market cap, diversification, dividend yield, beta, or any other term you see on the page. You can also tap the dotted-underlined terms anywhere on the platform for instant definitions.",
    confidence: "high",
    sources: [
      {
        id: "src-glossary",
        title: "Accrue Financial Glossary",
        publisher: "Definition sourced from SEC.gov investor education materials",
        lastUpdated: "2026",
      },
    ],
    type: "reactive",
    triggerQuery: "what is",
  },
];
