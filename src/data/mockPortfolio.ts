/**
 * Mock portfolio data -- single source of truth for ALL financial figures.
 * No component may render a number that doesn't exist here (CLAUDE.md A5.1).
 */

// ─── Type definitions ───

export interface DataPoint {
  date: string;
  value: number;
}

export interface PriceHistory {
  "1D": DataPoint[];
  "1W": DataPoint[];
  "1M": DataPoint[];
  "3M": DataPoint[];
  "1Y": DataPoint[];
  All: DataPoint[];
}

export interface Fundamentals {
  marketCap: number;
  peRatio: number | null;
  psRatio: number | null;
  dividendYield: number | null;
  epsTTM: number | null;
  revenueGrowthYoY: number | null;
  week52Low: number;
  week52High: number;
  beta: number;
}

export interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
  priceTargetLow: number;
  priceTargetMean: number;
  priceTargetHigh: number;
  analystCount: number;
}

export interface EarningsRecord {
  quarter: string;
  actual: number;
  estimate: number;
  surprise: number;
}

export interface RelatedNews {
  id: string;
  title: string;
  publisher: string;
  ts: string;
  summary: string;
}

export interface Holding {
  symbol: string;
  name: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
  direction: "up" | "down" | "flat";
  sector: string;
  allocation: number;
  priceHistory: PriceHistory;
  fundamentals: Fundamentals;
  analystRatings: AnalystRatings;
  earningsHistory: EarningsRecord[];
  relatedNews: RelatedNews[];
  /** Backward-compatible aliases for existing page components */
  averageCost: number;
  previousClose: number;
  gainLossDollar: number;
  costBasis: number;
  totalReturn: number;
  totalReturnPercent: number;
  peRatio: number | null;
  dividendYield: number | null;
  analystTargetPrice: number | null;
}

export interface Transaction {
  id: string;
  date: string;
  type: "buy" | "sell";
  symbol: string;
  shares: number;
  price: number;
  total: number;
  status: "completed" | "pending" | "cancelled";
}

export interface GoalProgress {
  target: number;
  current: number;
  projectedDate: string;
  onTrack: boolean;
  confidencePercent: number;
  percentComplete: number;
}

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  action: "buy" | "sell" | "hold" | "research";
  quantity: number;
  price: number;
  rationale: string;
  regretRehearsal: string;
  calibration: string;
  reflection: string;
}

export interface TradeEntry {
  id: string;
  tradeId: string;
  action: "Buy" | "Sell";
  symbol: string;
  timestamp: string;
  thesis: string;
  catalyst?: string;
  preMortem?: string;
  outcomeNotes?: string;
  linkedBuyEntryId?: string;
  aiAnalysis?: {
    thesisOutcome: "played_out" | "failed" | "mixed" | "too_early";
    luckVsSkill: "mostly_skill" | "mostly_luck" | "mixed";
    summary: string;
    lesson: string;
    confidence: "low" | "moderate" | "high";
  };
}

export interface ResearchableTicker {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  marketCap: number;
  peRatio: number | null;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  value: number;
  dayChange: number;
  dayChangePercent: number;
}

export interface UserGoal {
  label: string;
  target: number;
  current: number;
  projectedDate: string;
  onTrack: boolean;
  confidencePercent: number;
}

export interface UserProfile {
  name: string;
  riskTolerance: "conservative" | "moderate" | "aggressive";
  experienceLevel: "beginner" | "intermediate" | "advanced";
  timeHorizon: string;
  goal: {
    type: "growth" | "income" | "preservation";
    target: number;
    byDate: string;
  };
  goals: UserGoal[];
}

export interface Portfolio {
  totalValue: number;
  cashBalance: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  diversificationRating: "Low" | "Moderate" | "High";
  timeWeightedReturn: number;
  moneyWeightedReturn: number;
  allocationBySector: Record<string, number>;
}

// ─── Helper: generate deterministic price history ───

export function generatePriceHistory(
  currentPrice: number,
  volatility: number = 0.02
): PriceHistory {
  const generate = (points: number, daysBack: number): DataPoint[] => {
    const data: DataPoint[] = [];
    const now = new Date("2026-04-16");
    const startPrice = currentPrice * (1 - volatility * (daysBack / 30));

    for (let i = 0; i < points; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - daysBack + Math.floor((daysBack * i) / points));
      const progress = i / points;
      // Deterministic noise using sin/cos for reproducibility
      const noise =
        Math.sin(i * 3.7 + currentPrice) * currentPrice * volatility * 0.3 +
        Math.cos(i * 2.3 + currentPrice) * currentPrice * volatility * 0.2;
      const value =
        startPrice + (currentPrice - startPrice) * progress + noise;
      data.push({
        date: date.toISOString().split("T")[0],
        value: Math.round(Math.max(value, startPrice * 0.8) * 100) / 100,
      });
    }

    return data;
  };

  return {
    "1D": generate(78, 1),
    "1W": generate(35, 7),
    "1M": generate(22, 30),
    "3M": generate(63, 90),
    "1Y": generate(252, 365),
    All: generate(504, 1095),
  };
}

// ─── User profile ───

export const user: UserProfile = {
  name: "Alex",
  riskTolerance: "moderate",
  experienceLevel: "beginner",
  timeHorizon: "5-10 years",
  goal: {
    type: "growth",
    target: 120000,
    byDate: "2028-12-31",
  },
  goals: [
    {
      label: "House down payment — 2028",
      target: 120000,
      current: 99656.95,
      projectedDate: "2028-06-15",
      onTrack: true,
      confidencePercent: 72,
    },
    {
      label: "Emergency fund",
      target: 25000,
      current: 12430,
      projectedDate: "2027-03-01",
      onTrack: false,
      confidencePercent: 48,
    },
  ],
};

// ─── Portfolio summary ───

export const portfolio: Portfolio = {
  totalValue: 99656.95,
  cashBalance: 12430,
  totalGainLoss: 3421.1,
  totalGainLossPercent: 3.56,
  diversificationRating: "Low",
  timeWeightedReturn: 8.2,
  moneyWeightedReturn: 7.1,
  allocationBySector: {
    Technology: 50.57,
    "Consumer Discretionary": 14.26,
    "Financial Services": 4.64,
    Healthcare: 6.13,
    "Consumer Staples": 4.90,
    Energy: 7.03,
    Cash: 12.47,
  },
};

// ─── Holdings ───

export const holdings: Holding[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    shares: 50,
    avgCost: 165.2,
    currentPrice: 214.29,
    marketValue: 10714.5,
    gainLoss: 2454.5,
    gainLossPercent: 29.72,
    direction: "up",
    sector: "Technology",
    allocation: 10.75,
    priceHistory: generatePriceHistory(214.29, 0.018),
    fundamentals: {
      marketCap: 3280000000000,
      peRatio: 33.4,
      psRatio: 8.7,
      dividendYield: 0.44,
      epsTTM: 6.42,
      revenueGrowthYoY: 4.9,
      week52Low: 164.08,
      week52High: 237.49,
      beta: 1.24,
    },
    analystRatings: {
      buy: 28,
      hold: 12,
      sell: 3,
      priceTargetLow: 180.0,
      priceTargetMean: 235.0,
      priceTargetHigh: 270.0,
      analystCount: 43,
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 1.65, estimate: 1.6, surprise: 3.13 },
      { quarter: "Q4 2025", actual: 2.18, estimate: 2.11, surprise: 3.32 },
      { quarter: "Q3 2025", actual: 1.46, estimate: 1.39, surprise: 5.04 },
      { quarter: "Q2 2025", actual: 1.4, estimate: 1.35, surprise: 3.7 },
    ],
    // Backward-compatible aliases
    averageCost: 165.2,
    previousClose: 212.5,
    gainLossDollar: 2454.5,
    costBasis: 8260.0,
    totalReturn: 2454.5,
    totalReturnPercent: 29.72,
    peRatio: 33.4,
    dividendYield: 0.44,
    analystTargetPrice: 235.0,
    relatedNews: [
      {
        id: "aapl-1",
        title: "Apple Unveils New AI Features Across Product Line",
        publisher: "Reuters",
        ts: "2026-04-15T14:30:00Z",
        summary:
          "Apple announced a suite of AI-powered features coming to iPhone, Mac, and iPad, deepening its integration of machine learning across its ecosystem.",
      },
      {
        id: "aapl-2",
        title: "Apple Services Revenue Hits Record Quarter",
        publisher: "Bloomberg",
        ts: "2026-04-12T09:15:00Z",
        summary:
          "Apple's services segment, including App Store, iCloud, and Apple TV+, posted record quarterly revenue of $24.2 billion.",
      },
    ],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    shares: 25,
    avgCost: 620.0,
    currentPrice: 878.56,
    marketValue: 21964.0,
    gainLoss: 6464.0,
    gainLossPercent: 41.68,
    direction: "up",
    sector: "Technology",
    allocation: 22.04,
    priceHistory: generatePriceHistory(878.56, 0.035),
    fundamentals: {
      marketCap: 2160000000000,
      peRatio: 62.8,
      psRatio: 35.2,
      dividendYield: 0.02,
      epsTTM: 13.99,
      revenueGrowthYoY: 122.4,
      week52Low: 473.2,
      week52High: 974.94,
      beta: 1.68,
    },
    analystRatings: {
      buy: 45,
      hold: 8,
      sell: 2,
      priceTargetLow: 650.0,
      priceTargetMean: 950.0,
      priceTargetHigh: 1200.0,
      analystCount: 55,
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 5.98, estimate: 5.59, surprise: 6.98 },
      { quarter: "Q4 2025", actual: 5.16, estimate: 4.64, surprise: 11.21 },
      { quarter: "Q3 2025", actual: 4.02, estimate: 3.37, surprise: 19.29 },
      { quarter: "Q2 2025", actual: 2.7, estimate: 2.09, surprise: 29.19 },
    ],
    // Backward-compatible aliases
    averageCost: 620.0,
    previousClose: 870.2,
    gainLossDollar: 6464.0,
    costBasis: 15500.0,
    totalReturn: 6464.0,
    totalReturnPercent: 41.68,
    peRatio: 62.8,
    dividendYield: 0.02,
    analystTargetPrice: 950.0,
    relatedNews: [
      {
        id: "nvda-1",
        title: "NVIDIA Data Center Revenue Surges on AI Demand",
        publisher: "CNBC",
        ts: "2026-04-14T16:00:00Z",
        summary:
          "NVIDIA reported data center revenue growth of 154% year-over-year, driven by surging demand for AI training and inference chips.",
      },
      {
        id: "nvda-2",
        title: "New Blackwell GPUs Enter Mass Production",
        publisher: "The Verge",
        ts: "2026-04-10T11:00:00Z",
        summary:
          "NVIDIA confirmed its next-generation Blackwell GPU architecture has entered full mass production, with major cloud providers placing large orders.",
      },
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    shares: 40,
    avgCost: 380.5,
    currentPrice: 442.87,
    marketValue: 17714.8,
    gainLoss: 2494.8,
    gainLossPercent: 16.39,
    direction: "up",
    sector: "Technology",
    allocation: 17.78,
    priceHistory: generatePriceHistory(442.87, 0.015),
    fundamentals: {
      marketCap: 3290000000000,
      peRatio: 36.2,
      psRatio: 13.8,
      dividendYield: 0.72,
      epsTTM: 12.23,
      revenueGrowthYoY: 15.2,
      week52Low: 362.9,
      week52High: 468.35,
      beta: 0.89,
    },
    analystRatings: {
      buy: 38,
      hold: 10,
      sell: 1,
      priceTargetLow: 400.0,
      priceTargetMean: 480.0,
      priceTargetHigh: 540.0,
      analystCount: 49,
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 3.12, estimate: 2.98, surprise: 4.7 },
      { quarter: "Q4 2025", actual: 3.0, estimate: 2.78, surprise: 7.91 },
      { quarter: "Q3 2025", actual: 2.95, estimate: 2.81, surprise: 4.98 },
      { quarter: "Q2 2025", actual: 2.69, estimate: 2.55, surprise: 5.49 },
    ],
    // Backward-compatible aliases
    averageCost: 380.5,
    previousClose: 440.1,
    gainLossDollar: 2494.8,
    costBasis: 15220.0,
    totalReturn: 2494.8,
    totalReturnPercent: 16.39,
    peRatio: 36.2,
    dividendYield: 0.72,
    analystTargetPrice: 480.0,
    relatedNews: [
      {
        id: "msft-1",
        title: "Microsoft Azure Revenue Grows 29% as AI Workloads Expand",
        publisher: "Financial Times",
        ts: "2026-04-13T08:45:00Z",
        summary:
          "Microsoft's cloud division reported strong growth driven by enterprise adoption of AI services through Azure OpenAI.",
      },
    ],
  },
  {
    symbol: "AMZN",
    name: "Amazon.com Inc.",
    shares: 75,
    avgCost: 178.3,
    currentPrice: 189.42,
    marketValue: 14206.5,
    gainLoss: 834.0,
    gainLossPercent: 6.24,
    direction: "up",
    sector: "Consumer Discretionary",
    allocation: 14.26,
    priceHistory: generatePriceHistory(189.42, 0.022),
    fundamentals: {
      marketCap: 1970000000000,
      peRatio: 58.4,
      psRatio: 3.3,
      dividendYield: null,
      epsTTM: 3.24,
      revenueGrowthYoY: 12.5,
      week52Low: 151.61,
      week52High: 201.2,
      beta: 1.15,
    },
    analystRatings: {
      buy: 52,
      hold: 6,
      sell: 1,
      priceTargetLow: 165.0,
      priceTargetMean: 220.0,
      priceTargetHigh: 260.0,
      analystCount: 59,
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 0.98, estimate: 0.85, surprise: 15.29 },
      { quarter: "Q4 2025", actual: 1.29, estimate: 1.15, surprise: 12.17 },
      { quarter: "Q3 2025", actual: 0.94, estimate: 0.91, surprise: 3.3 },
      { quarter: "Q2 2025", actual: 1.26, estimate: 1.03, surprise: 22.33 },
    ],
    // Backward-compatible aliases
    averageCost: 178.3,
    previousClose: 188.1,
    gainLossDollar: 834.0,
    costBasis: 13372.5,
    totalReturn: 834.0,
    totalReturnPercent: 6.24,
    peRatio: 58.4,
    dividendYield: null,
    analystTargetPrice: 220.0,
    relatedNews: [
      {
        id: "amzn-1",
        title: "Amazon AWS Launches New AI Infrastructure Tier",
        publisher: "TechCrunch",
        ts: "2026-04-11T13:20:00Z",
        summary:
          "Amazon Web Services unveiled a new AI-optimized infrastructure tier with custom chips designed to reduce inference costs for enterprise customers.",
      },
    ],
  },
  {
    symbol: "BRK.B",
    name: "Berkshire Hathaway Inc. Class B",
    shares: 10,
    avgCost: 455.0,
    currentPrice: 462.72,
    marketValue: 4627.15,
    gainLoss: 77.2,
    gainLossPercent: 1.7,
    direction: "up",
    sector: "Financial Services",
    allocation: 4.64,
    priceHistory: generatePriceHistory(462.72, 0.01),
    fundamentals: {
      marketCap: 996000000000,
      peRatio: 11.2,
      psRatio: 2.8,
      dividendYield: null,
      epsTTM: 41.31,
      revenueGrowthYoY: 6.8,
      week52Low: 398.5,
      week52High: 478.9,
      beta: 0.55,
    },
    analystRatings: {
      buy: 6,
      hold: 4,
      sell: 0,
      priceTargetLow: 430.0,
      priceTargetMean: 490.0,
      priceTargetHigh: 530.0,
      analystCount: 10,
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 10.42, estimate: 9.8, surprise: 6.33 },
      { quarter: "Q4 2025", actual: 11.85, estimate: 10.5, surprise: 12.86 },
      { quarter: "Q3 2025", actual: 8.97, estimate: 8.2, surprise: 9.39 },
      { quarter: "Q2 2025", actual: 9.15, estimate: 8.95, surprise: 2.23 },
    ],
    // Backward-compatible aliases
    averageCost: 455.0,
    previousClose: 461.3,
    gainLossDollar: 77.2,
    costBasis: 4550.0,
    totalReturn: 77.2,
    totalReturnPercent: 1.7,
    peRatio: 11.2,
    dividendYield: null,
    analystTargetPrice: 490.0,
    relatedNews: [
      {
        id: "brk-1",
        title: "Berkshire Hathaway Cash Reserves Hit $190 Billion",
        publisher: "Wall Street Journal",
        ts: "2026-04-09T07:30:00Z",
        summary:
          "Warren Buffett's Berkshire Hathaway reported record cash holdings, sparking debate about whether the conglomerate sees limited value in current market conditions.",
      },
    ],
  },
];

// ─── Transactions ───

export const transactions: Transaction[] = [
  {
    id: "txn-001",
    date: "2026-03-15",
    type: "buy",
    symbol: "NVDA",
    shares: 5,
    price: 845.2,
    total: 4226.0,
    status: "completed",
  },
  {
    id: "txn-002",
    date: "2026-03-01",
    type: "buy",
    symbol: "AAPL",
    shares: 10,
    price: 208.5,
    total: 2085.0,
    status: "completed",
  },
  {
    id: "txn-003",
    date: "2026-02-14",
    type: "buy",
    symbol: "MSFT",
    shares: 15,
    price: 415.3,
    total: 6229.5,
    status: "completed",
  },
  {
    id: "txn-004",
    date: "2026-01-22",
    type: "buy",
    symbol: "AMZN",
    shares: 25,
    price: 176.8,
    total: 4420.0,
    status: "completed",
  },
  {
    id: "txn-005",
    date: "2025-12-10",
    type: "buy",
    symbol: "BRK.B",
    shares: 10,
    price: 455.0,
    total: 4550.0,
    status: "completed",
  },
  {
    id: "txn-006",
    date: "2025-11-28",
    type: "buy",
    symbol: "AAPL",
    shares: 20,
    price: 152.4,
    total: 3048.0,
    status: "completed",
  },
  {
    id: "txn-007",
    date: "2025-10-05",
    type: "buy",
    symbol: "NVDA",
    shares: 20,
    price: 580.0,
    total: 11600.0,
    status: "completed",
  },
];

// ─── Goal progress ───

export const goalProgress: GoalProgress = {
  target: 120000,
  current: 99656.95,
  projectedDate: "2028-06-15",
  onTrack: true,
  confidencePercent: 72,
  percentComplete: 83.05,
};

// ─── Backward-compatible portfolioSummary export ───

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  annualGoal: number;
  goalLabel: string;
  benchmarkReturn: number;
  benchmarkLabel: string;
}

export const portfolioSummary: PortfolioSummary = {
  totalValue: portfolio.totalValue,
  totalCostBasis: portfolio.totalValue - portfolio.totalGainLoss,
  totalGainLoss: portfolio.totalGainLoss,
  totalGainLossPercent: portfolio.totalGainLossPercent,
  annualGoal: 8.0,
  goalLabel: "8% annual growth",
  benchmarkReturn: 11.2,
  benchmarkLabel: "S&P 500 YTD",
};

// ─── Backward-compatible formatting re-exports ───

export { formatCurrency, formatPercent, formatSignedCurrency } from "@/lib/format";

// ─── Backward-compatible chart data ───

export interface ChartDataPoint {
  date: string;
  close: number;
  change: number;
  changePercent: number;
}

export function getChartData(range: "1W" | "1M" | "3M" | "6M" | "1Y" | "ALL"): ChartDataPoint[] {
  const pointCounts: Record<string, number> = {
    "1W": 7,
    "1M": 22,
    "3M": 63,
    "6M": 126,
    "1Y": 252,
    ALL: 504,
  };
  const count = pointCounts[range];
  const baseValue = portfolioSummary.totalCostBasis;
  const endValue = portfolioSummary.totalValue;
  const step = (endValue - baseValue) / count;

  const data: ChartDataPoint[] = [];
  const startDate = new Date("2026-04-16");

  for (let i = 0; i < count; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() - (count - i));
    const noise = Math.sin(i * 3.7) * 120 + Math.cos(i * 2.3) * 80;
    const value = baseValue + step * i + noise;
    const roundedValue = Math.round(value * 100) / 100;
    const prevValue = i > 0 ? data[i - 1].close : roundedValue;
    const change = Math.round((roundedValue - prevValue) * 100) / 100;
    const changePercent =
      prevValue !== 0 ? Math.round((change / prevValue) * 10000) / 100 : 0;
    data.push({ date: date.toISOString().split("T")[0], close: roundedValue, change, changePercent });
  }

  return data;
}

// ─── Journal entries ───

export const journalEntries: JournalEntry[] = [
  {
    id: "journal-001",
    date: "2026-03-15",
    symbol: "NVDA",
    action: "buy",
    quantity: 5,
    price: 845.2,
    rationale:
      "Strong data center revenue growth and expanding AI market. Added to existing position after reviewing Q4 earnings beat.",
    regretRehearsal:
      "If NVDA drops 20%, my total loss on this purchase would be about $845. I can absorb this given my 5-10 year horizon and the position is 22% of my portfolio which is already high.",
    calibration:
      "I am 65% confident NVDA will be above $900 within 6 months. The AI spending cycle could slow, but enterprise demand appears durable.",
    reflection:
      "I noticed I felt excited about the earnings beat, which made me want to buy more. I paused and reviewed my allocation limits before proceeding.",
  },
  {
    id: "journal-002",
    date: "2026-03-01",
    symbol: "AAPL",
    action: "buy",
    quantity: 10,
    price: 208.5,
    rationale:
      "Dollar-cost averaging into a core holding. Apple's services revenue continues to grow and provides recurring income.",
    regretRehearsal:
      "If AAPL drops 15%, I would lose about $313 on this batch. Apple has recovered from every major drawdown historically, and services revenue provides a floor.",
    calibration:
      "I am 70% confident AAPL will be above $220 within 12 months. The iPhone upgrade cycle and services growth support this.",
    reflection:
      "This was a planned purchase, not reactive. I feel comfortable with the position size at about 11% of portfolio.",
  },
  {
    id: "journal-003",
    date: "2026-02-14",
    symbol: "MSFT",
    action: "buy",
    quantity: 15,
    price: 415.3,
    rationale:
      "Azure cloud growth and Copilot AI integration provide strong tailwinds. Adding to position while below consensus price target.",
    regretRehearsal:
      "If MSFT drops 10%, I would lose about $623 on these shares. Microsoft's diversified revenue streams and enterprise relationships reduce single-product risk.",
    calibration:
      "I am 75% confident MSFT will be above $450 within 6 months. Cloud spending trends and AI integration support this view.",
    reflection:
      "I researched multiple sources before buying. The P/E ratio of 36 is high but justified by growth rate. I should monitor if growth decelerates.",
  },
];

// ─── Trade entries (§ 14 / § 17.4) ───

export const tradeEntries: TradeEntry[] = [
  {
    id: "trade-entry-001",
    tradeId: "txn-007",
    action: "Buy",
    symbol: "NVDA",
    timestamp: "2025-10-05T10:32:00Z",
    thesis:
      "AI infrastructure spending is accelerating across hyperscalers. NVIDIA's data-center revenue grew 154% YoY and Blackwell GPU demand exceeds supply. I expect continued revenue beats for at least the next 2-3 quarters.",
    catalyst:
      "Q3 2025 earnings beat (19.29% surprise) confirmed sustained demand. Multiple cloud providers announced expanded capex budgets for 2026.",
    preMortem:
      "If AI spending slows or a viable competitor emerges (AMD MI300X gains share), NVDA could correct 30-40%. My cost basis would be underwater at $580 if it fell below that level. I am willing to hold through a 25% drawdown given my 5-10 year horizon.",
  },
  {
    id: "trade-entry-002",
    tradeId: "txn-002",
    action: "Buy",
    symbol: "AAPL",
    timestamp: "2026-03-01T14:15:00Z",
    thesis:
      "Dollar-cost averaging into a core holding. Apple's services revenue hit a record $24.2B quarterly, providing growing recurring income. The iPhone installed base exceeds 1.2B devices, creating a durable moat for services monetization.",
    catalyst:
      "Services revenue record in Q1 2026. New AI features announced across product line should drive upgrade cycle and increased services attach rate.",
    preMortem:
      "If iPhone sales decline or services growth stalls, AAPL could trade down to $180-190. At $208.50 cost on this lot, I would lose about $185-285 on these 10 shares. Manageable given overall position sizing at ~11% of portfolio.",
  },
  {
    id: "trade-entry-003",
    tradeId: "sell-001",
    action: "Sell",
    symbol: "NVDA",
    timestamp: "2026-04-10T11:45:00Z",
    thesis:
      "Trimming position after 41% gain to rebalance. NVDA allocation grew to 22% of portfolio, exceeding my 20% single-stock limit. Taking partial profits to fund emergency fund goal.",
    outcomeNotes:
      "Sold 3 shares at $870.50 for $2,611.50. Original cost basis on these shares was $580 each ($1,740 total). Realized gain of $871.50 (50.1%). Proceeds moved to cash to build emergency fund.",
    linkedBuyEntryId: "trade-entry-001",
    aiAnalysis: {
      thesisOutcome: "played_out",
      luckVsSkill: "mixed",
      summary:
        "Your thesis that AI infrastructure spending would drive sustained revenue growth was correct. NVDA beat earnings estimates for 4 consecutive quarters after your purchase. However, the magnitude of the gain (41%) was partly driven by broader market enthusiasm for AI stocks, which amplified the move beyond fundamentals alone.",
      lesson:
        "Setting a rebalancing threshold (20% single-stock limit) and following it helped you take profits systematically rather than emotionally. Consider documenting rebalancing rules in advance for future positions.",
      confidence: "high",
    },
  },
  {
    id: "trade-entry-004",
    tradeId: "txn-003",
    action: "Buy",
    symbol: "MSFT",
    timestamp: "2026-02-14T09:50:00Z",
    thesis:
      "Azure cloud growth (29% YoY) and Copilot AI integration provide durable tailwinds. Microsoft's enterprise relationships make it the default choice for AI adoption in large organizations. Adding 15 shares while trading below consensus price target of $480.",
    catalyst:
      "Q4 2025 earnings beat (7.91% surprise) driven by Azure and Copilot seat expansion. Enterprise AI adoption is still early innings.",
    preMortem:
      "If cloud spending decelerates or Copilot adoption disappoints, MSFT could drop 10-15% to $350-375 range. At $415.30 cost, I would be down $600-975 on this lot. The P/E of 36x requires sustained growth to justify; any deceleration would compress the multiple.",
    aiAnalysis: {
      thesisOutcome: "too_early",
      luckVsSkill: "mixed",
      summary:
        "Position is 2 months old with a 6.6% gain. Azure growth and Copilot adoption metrics from the most recent quarter support the thesis, but it is too early to evaluate whether the enterprise AI spending cycle will sustain the growth rate you projected.",
      lesson:
        "Check back after the next earnings report (expected late April 2026) for a more meaningful assessment of whether Azure growth is accelerating or decelerating.",
      confidence: "moderate",
    },
  },
];

// ─── Researchable tickers catalog ───

export const researchableTickers: ResearchableTicker[] = [
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", currentPrice: 176.82, dayChange: 2.14, dayChangePercent: 1.22, marketCap: 2180000000000, peRatio: 24.6 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", currentPrice: 512.30, dayChange: -3.85, dayChangePercent: -0.75, marketCap: 1310000000000, peRatio: 28.1 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", currentPrice: 248.50, dayChange: 5.72, dayChangePercent: 2.35, marketCap: 792000000000, peRatio: 68.3 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financial Services", currentPrice: 218.45, dayChange: 1.30, dayChangePercent: 0.60, marketCap: 628000000000, peRatio: 12.4 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", currentPrice: 162.18, dayChange: -0.42, dayChangePercent: -0.26, marketCap: 391000000000, peRatio: 15.8 },
  { symbol: "KO", name: "The Coca-Cola Company", sector: "Consumer Staples", currentPrice: 63.47, dayChange: 0.18, dayChangePercent: 0.28, marketCap: 274000000000, peRatio: 25.2 },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", currentPrice: 118.92, dayChange: -1.05, dayChangePercent: -0.88, marketCap: 497000000000, peRatio: 14.1 },
  { symbol: "V", name: "Visa Inc.", sector: "Financial Services", currentPrice: 298.60, dayChange: 1.92, dayChangePercent: 0.65, marketCap: 612000000000, peRatio: 31.5 },
  { symbol: "PG", name: "Procter & Gamble Co.", sector: "Consumer Staples", currentPrice: 168.35, dayChange: 0.55, dayChangePercent: 0.33, marketCap: 396000000000, peRatio: 26.8 },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare", currentPrice: 528.14, dayChange: -4.20, dayChangePercent: -0.79, marketCap: 487000000000, peRatio: 21.3 },
  { symbol: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "ETF — Broad Market", currentPrice: 538.72, dayChange: 3.15, dayChangePercent: 0.59, marketCap: 530000000000, peRatio: null },
  { symbol: "QQQ", name: "Invesco QQQ Trust", sector: "ETF — Technology", currentPrice: 462.85, dayChange: 4.28, dayChangePercent: 0.93, marketCap: 260000000000, peRatio: null },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", sector: "ETF — Broad Market", currentPrice: 272.40, dayChange: 1.58, dayChangePercent: 0.58, marketCap: 410000000000, peRatio: null },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", sector: "ETF — Fixed Income", currentPrice: 72.58, dayChange: 0.08, dayChangePercent: 0.11, marketCap: 108000000000, peRatio: null },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", sector: "ETF — International", currentPrice: 59.14, dayChange: 0.32, dayChangePercent: 0.54, marketCap: 68000000000, peRatio: null },
];

// ─── Market indices for ticker strip ───

export const marketIndices: MarketIndex[] = [
  { symbol: "SPX", name: "S&P 500", value: 5412.35, dayChange: 32.18, dayChangePercent: 0.60 },
  { symbol: "IXIC", name: "NASDAQ", value: 16928.74, dayChange: 148.52, dayChangePercent: 0.89 },
  { symbol: "DJI", name: "DOW", value: 40215.80, dayChange: 125.65, dayChangePercent: 0.31 },
  { symbol: "VIX", name: "VIX", value: 14.82, dayChange: -0.65, dayChangePercent: -4.20 },
  { symbol: "BTC", name: "BTC", value: 72450.00, dayChange: 1285.00, dayChangePercent: 1.81 },
];
