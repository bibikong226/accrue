/**
 * mockPortfolio.ts — Single source of truth for all financial data.
 *
 * Per CLAUDE.md rule A5.1: "Every financial figure comes from this module."
 * No component may render a number that doesn't exist as a field here.
 */

// ─── Trade & Journal Types ───────────────────────────────────────────────────

export type TradeType = "Buy" | "Sell";
export type OrderType = "Market" | "Limit" | "Stop" | "Stop-Limit";

export type CalibrationOutcome =
  | "right"     // Right thesis, right outcome
  | "wrong"     // Wrong thesis, wrong outcome
  | "unlucky"   // Right thesis, wrong outcome
  | "lucky"     // Wrong thesis, right outcome
  | null;       // Not yet calibrated

export interface Transaction {
  id: string;
  date: string;
  symbol: string;
  companyName: string;
  tradeType: TradeType;
  quantity: number;
  pricePerShare: number;
  total: number;
  fees: number;
  orderType: OrderType;
  journalEntryId: string | null;
}

export interface JournalEntry {
  id: string;
  date: string;
  symbol: string;
  companyName: string;
  action: TradeType;
  quantity: number;
  pricePerShare: number;
  rationale: string;
  regretRehearsal: string | null;
  calibrationOutcome: CalibrationOutcome;
  reflection: string | null;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Holding {
  /** Ticker symbol, e.g. "AAPL" */
  symbol: string;
  /** Full company name */
  name: string;
  /** Number of shares owned */
  shares: number;
  /** Average cost basis per share */
  avgCost: number;
  /** Current market price per share */
  currentPrice: number;
  /** Current market value (shares * currentPrice) */
  marketValue: number;
  /** Total gain/loss in dollars */
  gainLossDollars: number;
  /** Total gain/loss as percentage */
  gainLossPercent: number;
  /** Today's price change in dollars */
  todayChangeDollars: number;
  /** Today's price change as percentage */
  todayChangePercent: number;
  /** Sector classification */
  sector: string;
  /** Percentage of total portfolio */
  portfolioWeight: number;
}

export interface GoalProgress {
  /** Target dollar amount */
  targetAmount: number;
  /** Current portfolio value */
  currentAmount: number;
  /** Target date as ISO string */
  targetDate: string;
  /** Display-friendly target date */
  targetDateDisplay: string;
  /** Progress as percentage (0-100) */
  progressPercent: number;
  /** Confidence level (0-100) */
  confidencePercent: number;
  /** Status: "on-track" | "behind" | "needs-attention" */
  status: "on-track" | "behind" | "needs-attention";
  /** Status display label */
  statusLabel: string;
  /** Lever: additional monthly contribution to get on track */
  leverMonthly: number;
  /** Lever: months to extend timeline */
  leverExtendMonths: number;
  /** Lever: one-time deposit to get on track */
  leverOneTime: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  publisher: string;
  timestamp: string;
  /** Relative time display, e.g. "2h ago" */
  timeAgo: string;
  /** AI-generated one-line summary */
  aiSummary: string;
  /** Which tab this news belongs to */
  category: "holdings" | "watchlist" | "market" | "education";
  /** Related ticker symbols, if any */
  relatedTickers: string[];
}

export interface PortfolioData {
  /** Total portfolio market value */
  totalValue: number;
  /** Today's change in dollars */
  todayChangeDollars: number;
  /** Today's change as percentage */
  todayChangePercent: number;
  /** Time-weighted return (all-time) as percentage */
  timeWeightedReturn: number;
  /** Money-weighted return (personal) as percentage */
  moneyWeightedReturn: number;
  /** Total cost basis */
  totalCostBasis: number;
  /** Total gain/loss in dollars */
  totalGainLossDollars: number;
  /** Total gain/loss as percentage */
  totalGainLossPercent: number;
  /** Number of distinct sectors */
  sectorCount: number;
  /** Individual holdings */
  holdings: Holding[];
  /** Goal tracking data */
  goal: GoalProgress;
  /** News feed items */
  news: NewsItem[];
  /** Last login date for "what changed" card */
  lastLoginDate: string;
  /** Biggest mover ticker since last login */
  biggestMoverSymbol: string;
  /** Biggest mover change percent since last login */
  biggestMoverChangePercent: number;
  /** Annual goal return target */
  annualGoalReturn: number;
  /** Benchmark name */
  benchmarkName: string;
  /** Benchmark return for same period */
  benchmarkReturn: number;
  /** Copilot proactive insight */
  copilotInsight: {
    title: string;
    body: string;
    confidence: "high" | "moderate" | "low";
    sources: { title: string; publisher: string; timestamp: string }[];
  };
  /** Sector allocations for donut chart */
  sectorAllocations: { sector: string; value: number; percent: number; color: string }[];
  /** Transaction history */
  transactions: Transaction[];
  /** Decision journal entries */
  journalEntries: JournalEntry[];
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const holdings: Holding[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    shares: 50,
    avgCost: 142.5,
    currentPrice: 178.72,
    marketValue: 8936.0,
    gainLossDollars: 1811.0,
    gainLossPercent: 25.4,
    todayChangeDollars: 125.0,
    todayChangePercent: 1.42,
    sector: "Technology",
    portfolioWeight: 8.97,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    shares: 30,
    avgCost: 220.0,
    currentPrice: 875.28,
    marketValue: 26258.4,
    gainLossDollars: 19658.4,
    gainLossPercent: 297.85,
    todayChangeDollars: 1703.4,
    todayChangePercent: 6.49,
    sector: "Technology",
    portfolioWeight: 26.35,
  },
  {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    shares: 100,
    avgCost: 195.0,
    currentPrice: 242.15,
    marketValue: 24215.0,
    gainLossDollars: 4715.0,
    gainLossPercent: 24.18,
    todayChangeDollars: 605.38,
    todayChangePercent: 2.5,
    sector: "Diversified",
    portfolioWeight: 24.3,
  },
  {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    shares: 150,
    avgCost: 76.8,
    currentPrice: 72.45,
    marketValue: 10867.5,
    gainLossDollars: -652.5,
    gainLossPercent: -5.67,
    todayChangeDollars: -21.75,
    todayChangePercent: -0.2,
    sector: "Fixed Income",
    portfolioWeight: 10.9,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    shares: 25,
    avgCost: 280.0,
    currentPrice: 415.56,
    marketValue: 10389.0,
    gainLossDollars: 3389.0,
    gainLossPercent: 48.41,
    todayChangeDollars: 259.75,
    todayChangePercent: 2.56,
    sector: "Technology",
    portfolioWeight: 10.43,
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    shares: 40,
    avgCost: 162.0,
    currentPrice: 156.89,
    marketValue: 6275.6,
    gainLossDollars: -204.4,
    gainLossPercent: -3.16,
    todayChangeDollars: 50.28,
    todayChangePercent: 0.81,
    sector: "Healthcare",
    portfolioWeight: 6.3,
  },
  {
    symbol: "VXUS",
    name: "Vanguard Total International Stock ETF",
    shares: 120,
    avgCost: 55.0,
    currentPrice: 59.61,
    marketValue: 7153.2,
    gainLossDollars: 553.2,
    gainLossPercent: 8.38,
    todayChangeDollars: 214.32,
    todayChangePercent: 3.0,
    sector: "International",
    portfolioWeight: 7.18,
  },
  {
    symbol: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    shares: 70,
    avgCost: 72.0,
    currentPrice: 80.82,
    marketValue: 5657.4,
    gainLossDollars: 617.4,
    gainLossPercent: 12.24,
    todayChangeDollars: 484.72,
    todayChangePercent: 8.57,
    sector: "Diversified",
    portfolioWeight: 5.68,
  },
];

const sectorAllocations = [
  { sector: "Technology", value: 45583.4, percent: 45.75, color: "var(--color-action-primary)" },
  { sector: "Diversified", value: 29872.4, percent: 29.98, color: "var(--color-feedback-info)" },
  { sector: "Fixed Income", value: 10867.5, percent: 10.9, color: "var(--color-feedback-warning)" },
  { sector: "International", value: 7153.2, percent: 7.18, color: "var(--color-feedback-success)" },
  { sector: "Healthcare", value: 6275.6, percent: 6.3, color: "var(--color-action-destructive)" },
];

/* ------------------------------------------------------------------ */
/*  Stock universe (searchable in order entry)                        */
/* ------------------------------------------------------------------ */

export interface StockQuote {
  symbol: string;
  name: string;
  sector: string;
  currentPrice: number;
  todayChangeDollars: number;
  todayChangePercent: number;
}

export const stockUniverse: StockQuote[] = [
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", currentPrice: 178.72, todayChangeDollars: 2.50, todayChangePercent: 1.42 },
  { symbol: "NVDA", name: "NVIDIA Corporation", sector: "Technology", currentPrice: 875.28, todayChangeDollars: 56.78, todayChangePercent: 6.49 },
  { symbol: "MSFT", name: "Microsoft Corporation", sector: "Technology", currentPrice: 415.56, todayChangeDollars: 10.39, todayChangePercent: 2.56 },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", currentPrice: 175.98, todayChangeDollars: 0.88, todayChangePercent: 0.50 },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", currentPrice: 186.50, todayChangeDollars: -0.45, todayChangePercent: -0.24 },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Technology", currentPrice: 505.75, todayChangeDollars: 3.60, todayChangePercent: 0.72 },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", currentPrice: 245.20, todayChangeDollars: -4.80, todayChangePercent: -1.92 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", currentPrice: 198.30, todayChangeDollars: 1.15, todayChangePercent: 0.58 },
  { symbol: "V", name: "Visa Inc.", sector: "Financials", currentPrice: 280.45, todayChangeDollars: 0.90, todayChangePercent: 0.32 },
  { symbol: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", currentPrice: 156.89, todayChangeDollars: -0.22, todayChangePercent: -0.14 },
  { symbol: "XOM", name: "Exxon Mobil Corporation", sector: "Energy", currentPrice: 104.60, todayChangeDollars: 0.55, todayChangePercent: 0.53 },
  { symbol: "PG", name: "Procter & Gamble Co.", sector: "Consumer Staples", currentPrice: 162.30, todayChangeDollars: 0.30, todayChangePercent: 0.18 },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", sector: "Healthcare", currentPrice: 520.15, todayChangeDollars: -3.40, todayChangePercent: -0.65 },
  { symbol: "VTI", name: "Vanguard Total Stock Market ETF", sector: "Diversified", currentPrice: 242.15, todayChangeDollars: 6.05, todayChangePercent: 2.50 },
  { symbol: "BND", name: "Vanguard Total Bond Market ETF", sector: "Fixed Income", currentPrice: 72.45, todayChangeDollars: 0.10, todayChangePercent: 0.14 },
  { symbol: "VXUS", name: "Vanguard Total International Stock ETF", sector: "International", currentPrice: 59.61, todayChangeDollars: 1.79, todayChangePercent: 3.00 },
  { symbol: "SCHD", name: "Schwab U.S. Dividend Equity ETF", sector: "Diversified", currentPrice: 80.82, todayChangeDollars: 6.92, todayChangePercent: 8.57 },
];

/**
 * Search stocks by ticker or name (case-insensitive prefix/substring match).
 * Returns at most `limit` results.
 */
export function searchStocks(query: string, limit = 8): StockQuote[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return stockUniverse
    .filter((s) => s.symbol.toLowerCase().startsWith(q) || s.name.toLowerCase().includes(q))
    .slice(0, limit);
}

export function getStockBySymbol(symbol: string): StockQuote | undefined {
  return stockUniverse.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
}

export function getHoldingBySymbol(symbol: string): Holding | undefined {
  return holdings.find((h) => h.symbol.toUpperCase() === symbol.toUpperCase());
}

/* ------------------------------------------------------------------ */
/*  Fee schedule                                                      */
/* ------------------------------------------------------------------ */

export interface FeeSchedule {
  /** Commission per stock trade */
  stockCommission: number;
  /** Estimated spread cost as a fraction of order value (e.g. 0.001 = 0.1%) */
  estimatedSpreadFraction: number;
  /** SEC fee per dollar of sell orders */
  secFeePerDollar: number;
  /** TAF fee per share sold */
  tafFeePerShare: number;
}

export const feeSchedule: FeeSchedule = {
  stockCommission: 0.00,
  estimatedSpreadFraction: 0.001,
  secFeePerDollar: 0.0000278,
  tafFeePerShare: 0.000166,
};

/**
 * Calculate estimated fees for a trade.
 */
export function calculateFees(
  action: "buy" | "sell",
  quantity: number,
  price: number,
): { spread: number; commission: number; secFee: number; tafFee: number; total: number } {
  const orderValue = quantity * price;
  const spread = +(orderValue * feeSchedule.estimatedSpreadFraction).toFixed(4);
  const commission = feeSchedule.stockCommission;
  const secFee = action === "sell" ? +(orderValue * feeSchedule.secFeePerDollar).toFixed(4) : 0;
  const tafFee = action === "sell" ? +(quantity * feeSchedule.tafFeePerShare).toFixed(4) : 0;
  const total = +(spread + commission + secFee + tafFee).toFixed(4);
  return { spread, commission, secFee, tafFee, total };
}

/* ------------------------------------------------------------------ */
/*  Tax info                                                          */
/* ------------------------------------------------------------------ */

export interface TaxInfo {
  shortTermRate: number;
  longTermRate: number;
  realizedShortTermGains: number;
  realizedLongTermGains: number;
}

export const taxInfo: TaxInfo = {
  shortTermRate: 0.22,
  longTermRate: 0.15,
  realizedShortTermGains: 120.50,
  realizedLongTermGains: 450.00,
};

/* ------------------------------------------------------------------ */
/*  Account info for review page                                      */
/* ------------------------------------------------------------------ */

export const accountInfo = {
  name: "Individual Brokerage",
  type: "Taxable" as const,
  cashBalance: 5000.00,
};

/* ------------------------------------------------------------------ */
/*  Sector targets for concentration warnings                         */
/* ------------------------------------------------------------------ */

export const sectorTargets: Record<string, number> = {
  Technology: 40,
  Diversified: 25,
  "Fixed Income": 10,
  Healthcare: 10,
  International: 10,
  "Consumer Discretionary": 5,
  Financials: 5,
  "Consumer Staples": 5,
  Energy: 5,
};

/* ------------------------------------------------------------------ */
/*  Assembled portfolio                                               */
/* ------------------------------------------------------------------ */

export const mockPortfolio: PortfolioData = {
  totalValue: 99656.95,
  todayChangeDollars: 3421.1,
  todayChangePercent: 3.56,
  timeWeightedReturn: 18.42,
  moneyWeightedReturn: 21.07,
  totalCostBasis: 82174.0,
  totalGainLossDollars: 17482.95,
  totalGainLossPercent: 21.27,
  sectorCount: 5,
  holdings,
  goal: {
    targetAmount: 120000,
    currentAmount: 99656.95,
    targetDate: "2027-08-01",
    targetDateDisplay: "August 2027",
    progressPercent: 83,
    confidencePercent: 83,
    status: "behind",
    statusLabel: "A little behind",
    leverMonthly: 350,
    leverExtendMonths: 4,
    leverOneTime: 4200,
  },
  news: [
    {
      id: "n1",
      headline: "NVIDIA Q4 Earnings Beat Expectations, Data Center Revenue Surges",
      publisher: "Reuters",
      timestamp: "2026-04-16T10:30:00Z",
      timeAgo: "2h ago",
      aiSummary:
        "NVIDIA reported record data center revenue, driven by AI chip demand. Analysts raised price targets.",
      category: "holdings",
      relatedTickers: ["NVDA"],
    },
    {
      id: "n2",
      headline: "Apple Announces New AI-Powered Features for iPhone",
      publisher: "Bloomberg",
      timestamp: "2026-04-16T09:15:00Z",
      timeAgo: "3h ago",
      aiSummary:
        "Apple unveiled on-device AI features at a spring event, aiming to compete with Google and Samsung.",
      category: "holdings",
      relatedTickers: ["AAPL"],
    },
    {
      id: "n3",
      headline: "Bond Market Sees Renewed Interest as Rate Cuts Expected",
      publisher: "Financial Times",
      timestamp: "2026-04-16T08:00:00Z",
      timeAgo: "4h ago",
      aiSummary:
        "Treasury yields fell as investors priced in rate cuts, boosting bond ETFs like BND.",
      category: "holdings",
      relatedTickers: ["BND"],
    },
    {
      id: "n4",
      headline: "Tesla Reports First Quarter Delivery Numbers",
      publisher: "CNBC",
      timestamp: "2026-04-16T07:45:00Z",
      timeAgo: "5h ago",
      aiSummary:
        "Tesla deliveries came in below analyst estimates, raising questions about demand.",
      category: "watchlist",
      relatedTickers: ["TSLA"],
    },
    {
      id: "n5",
      headline: "S&P 500 Hits New All-Time High on Tech Rally",
      publisher: "AP",
      timestamp: "2026-04-16T06:30:00Z",
      timeAgo: "6h ago",
      aiSummary:
        "The S&P 500 reached a record level, led by semiconductor and cloud computing stocks.",
      category: "market",
      relatedTickers: [],
    },
    {
      id: "n6",
      headline: "What Is Dollar-Cost Averaging and Why Does It Work?",
      publisher: "Accrue Learn",
      timestamp: "2026-04-15T12:00:00Z",
      timeAgo: "1d ago",
      aiSummary:
        "Dollar-cost averaging spreads purchases over time, reducing the impact of volatility on your portfolio.",
      category: "education",
      relatedTickers: [],
    },
  ],
  lastLoginDate: "2026-04-15",
  biggestMoverSymbol: "NVDA",
  biggestMoverChangePercent: 6.49,
  annualGoalReturn: 8,
  benchmarkName: "S&P 500",
  benchmarkReturn: 16.3,
  copilotInsight: {
    title: "Concentration Risk: Technology at 45.75%",
    body: "Technology stocks make up 45.75% of your portfolio, which is above the 30% threshold for a single sector. If the tech sector declines, your portfolio could be significantly impacted. Consider whether this level of concentration aligns with your risk tolerance and goals.",
    confidence: "high",
    sources: [
      {
        title: "Portfolio Diversification Guidelines",
        publisher: "Accrue Research",
        timestamp: "2026-04-16T08:00:00Z",
      },
      {
        title: "Sector Concentration Risk Analysis",
        publisher: "Morningstar",
        timestamp: "2026-04-15T14:00:00Z",
      },
    ],
  },
  sectorAllocations,

  transactions: [
    {
      id: "txn-001",
      date: "2026-04-14T10:32:00Z",
      symbol: "AAPL",
      companyName: "Apple Inc.",
      tradeType: "Buy",
      quantity: 10,
      pricePerShare: 176.50,
      total: 1765.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: "journal-001",
    },
    {
      id: "txn-002",
      date: "2026-04-10T14:15:00Z",
      symbol: "BND",
      companyName: "Vanguard Total Bond Market ETF",
      tradeType: "Buy",
      quantity: 20,
      pricePerShare: 73.80,
      total: 1476.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: "journal-002",
    },
    {
      id: "txn-003",
      date: "2026-04-07T09:45:00Z",
      symbol: "MSFT",
      companyName: "Microsoft Corporation",
      tradeType: "Buy",
      quantity: 5,
      pricePerShare: 332.10,
      total: 1660.50,
      fees: 0.00,
      orderType: "Limit",
      journalEntryId: "journal-003",
    },
    {
      id: "txn-004",
      date: "2026-03-28T11:20:00Z",
      symbol: "VTI",
      companyName: "Vanguard Total Stock Market ETF",
      tradeType: "Buy",
      quantity: 15,
      pricePerShare: 218.40,
      total: 3276.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: "journal-004",
    },
    {
      id: "txn-005",
      date: "2026-03-20T15:05:00Z",
      symbol: "NVDA",
      companyName: "NVIDIA Corporation",
      tradeType: "Buy",
      quantity: 10,
      pricePerShare: 820.00,
      total: 8200.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: "journal-005",
    },
    {
      id: "txn-006",
      date: "2026-03-15T10:00:00Z",
      symbol: "AAPL",
      companyName: "Apple Inc.",
      tradeType: "Sell",
      quantity: 5,
      pricePerShare: 170.25,
      total: 851.25,
      fees: 0.00,
      orderType: "Stop",
      journalEntryId: "journal-006",
    },
    {
      id: "txn-007",
      date: "2026-03-05T13:30:00Z",
      symbol: "VTI",
      companyName: "Vanguard Total Stock Market ETF",
      tradeType: "Buy",
      quantity: 25,
      pricePerShare: 205.80,
      total: 5145.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: null,
    },
    {
      id: "txn-008",
      date: "2026-02-20T09:15:00Z",
      symbol: "AAPL",
      companyName: "Apple Inc.",
      tradeType: "Buy",
      quantity: 20,
      pricePerShare: 155.30,
      total: 3106.00,
      fees: 0.00,
      orderType: "Limit",
      journalEntryId: null,
    },
    {
      id: "txn-009",
      date: "2026-02-10T11:45:00Z",
      symbol: "BND",
      companyName: "Vanguard Total Bond Market ETF",
      tradeType: "Sell",
      quantity: 10,
      pricePerShare: 74.40,
      total: 744.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: null,
    },
    {
      id: "txn-010",
      date: "2026-01-15T10:30:00Z",
      symbol: "MSFT",
      companyName: "Microsoft Corporation",
      tradeType: "Buy",
      quantity: 10,
      pricePerShare: 298.50,
      total: 2985.00,
      fees: 0.00,
      orderType: "Market",
      journalEntryId: null,
    },
  ],

  journalEntries: [
    {
      id: "journal-001",
      date: "2026-04-14T10:32:00Z",
      symbol: "AAPL",
      companyName: "Apple Inc.",
      action: "Buy",
      quantity: 10,
      pricePerShare: 176.50,
      rationale:
        "Apple's services revenue continues to grow at 15% year-over-year. The iPhone 17 cycle is expected to drive hardware upgrades. Adding to my existing position at what I believe is a reasonable valuation relative to earnings growth.",
      regretRehearsal:
        "If the price drops 15% in the next quarter, I would still hold because my thesis is about long-term services growth, not short-term price movement.",
      calibrationOutcome: null,
      reflection: null,
    },
    {
      id: "journal-002",
      date: "2026-04-10T14:15:00Z",
      symbol: "BND",
      companyName: "Vanguard Total Bond Market ETF",
      action: "Buy",
      quantity: 20,
      pricePerShare: 73.80,
      rationale:
        "Rebalancing my portfolio toward a 70/30 stock-bond allocation. Interest rates appear to have peaked, which should benefit bond prices. This purchase brings my bond allocation from 22% to 27%.",
      regretRehearsal:
        "If bonds continue to decline, I am comfortable holding because the income from coupon payments supports my overall portfolio stability.",
      calibrationOutcome: "unlucky",
      reflection:
        "My thesis about rates peaking was correct based on Fed commentary, but unexpected inflation data pushed bond prices lower. The rebalancing rationale was sound even though short-term returns were negative.",
    },
    {
      id: "journal-003",
      date: "2026-04-07T09:45:00Z",
      symbol: "MSFT",
      companyName: "Microsoft Corporation",
      action: "Buy",
      quantity: 5,
      pricePerShare: 332.10,
      rationale:
        "Microsoft's Azure cloud revenue is growing at 29% and AI integration with Copilot is showing strong enterprise adoption. Set a limit order at $332 because I believe the stock is fairly valued below $340.",
      regretRehearsal: null,
      calibrationOutcome: "right",
      reflection:
        "Azure growth came in at 31% and the stock moved to $338. My limit order filled at a good entry point. The AI thesis is playing out as expected with enterprise Copilot subscriptions exceeding guidance.",
    },
    {
      id: "journal-004",
      date: "2026-03-28T11:20:00Z",
      symbol: "VTI",
      companyName: "Vanguard Total Stock Market ETF",
      action: "Buy",
      quantity: 15,
      pricePerShare: 218.40,
      rationale:
        "Dollar-cost averaging into my core index position. I invest in VTI on the last trading day of each month regardless of price, as part of my systematic investment plan.",
      regretRehearsal:
        "This is a systematic purchase. Even if the market drops significantly, I will continue monthly purchases because decades of data show DCA into broad index funds produces strong long-term results.",
      calibrationOutcome: "right",
      reflection:
        "Systematic investing removes emotional decision-making. The market was up 3% since this purchase, validating the approach, though any single month's result is irrelevant to the long-term thesis.",
    },
    {
      id: "journal-005",
      date: "2026-03-20T15:05:00Z",
      symbol: "NVDA",
      companyName: "NVIDIA Corporation",
      action: "Buy",
      quantity: 10,
      pricePerShare: 820.00,
      rationale:
        "NVIDIA is the clear leader in AI training chips. Data center revenue is growing at 200%+ year-over-year. Despite the high valuation, I believe the AI infrastructure build-out will sustain growth for several more quarters.",
      regretRehearsal:
        "If antitrust or export restrictions impact NVIDIA, the stock could drop 20-30%. I would reassess my thesis but likely hold a reduced position given the long-term structural AI demand.",
      calibrationOutcome: "lucky",
      reflection:
        "The stock rose 7% but primarily due to a broad market rally in semiconductors, not specifically the AI thesis I outlined. Actual AI revenue beat expectations, but the price move was correlated with sector rotation rather than fundamentals.",
    },
    {
      id: "journal-006",
      date: "2026-03-15T10:00:00Z",
      symbol: "AAPL",
      companyName: "Apple Inc.",
      action: "Sell",
      quantity: 5,
      pricePerShare: 170.25,
      rationale:
        "Taking partial profits to rebalance. Apple had grown to 12% of my portfolio, above my 10% single-stock limit. Selling 5 shares brings it back within my risk parameters.",
      regretRehearsal:
        "If Apple continues to rise after I sell, that is acceptable because risk management is more important than maximizing any single position. My rule is firm: no single stock above 10%.",
      calibrationOutcome: "wrong",
      reflection:
        "Apple rose 5% after I sold, which means my rebalancing cost me some upside. However, I maintain that the process was correct even if the short-term outcome was suboptimal. Position sizing discipline matters more than one trade.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  Research page data                                                 */
/*  Per CLAUDE.md A5: all financial figures for the research pages     */
/*  must be defined here before building components.                   */
/* ------------------------------------------------------------------ */

export interface AnalystRatings {
  buy: number;
  hold: number;
  sell: number;
  total: number;
  priceTarget: {
    low: number;
    mean: number;
    high: number;
  };
}

export interface EarningsQuarter {
  quarter: string;
  actual: number;
  estimate: number;
  /** Surprise as a percentage, positive = beat */
  surprisePercent: number;
}

export interface ResearchNewsItem {
  headline: string;
  publisher: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** One-line AI summary */
  aiSummary: string;
}

export interface ResearchData {
  symbol: string;
  name: string;
  currentPrice: number;
  todayChangeDollars: number;
  todayChangePercent: number;

  /* Fundamentals */
  marketCap: number;
  /** Price-to-earnings ratio (trailing twelve months); null for ETFs */
  peRatio: number | null;
  /** Price-to-sales ratio */
  psRatio: number | null;
  /** Annual dividend yield as a decimal (0.0052 = 0.52%) */
  dividendYield: number;
  /** Earnings per share — trailing twelve months */
  epsTTM: number | null;
  /** Year-over-year revenue growth as a decimal (0.054 = 5.4%) */
  revenueGrowthYoY: number | null;
  /** 52-week low */
  fiftyTwoWeekLow: number;
  /** 52-week high */
  fiftyTwoWeekHigh: number;
  /** Beta relative to S&P 500 */
  beta: number;

  /* Analyst ratings */
  analystRatings: AnalystRatings;

  /* Earnings history */
  earningsHistory: EarningsQuarter[];
  /** Expected next earnings date, ISO 8601 or empty string */
  nextEarningsDate: string;

  /* News */
  news: ResearchNewsItem[];

  /* Chart — daily closing prices for past 30 trading days */
  chartData30d: number[];
}

export const researchData: ResearchData[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    currentPrice: 178.72,
    todayChangeDollars: 2.50,
    todayChangePercent: 1.42,
    marketCap: 2_780_000_000_000,
    peRatio: 29.6,
    psRatio: 7.3,
    dividendYield: 0.0055,
    epsTTM: 6.04,
    revenueGrowthYoY: 0.054,
    fiftyTwoWeekLow: 152.08,
    fiftyTwoWeekHigh: 199.62,
    beta: 1.21,
    analystRatings: {
      buy: 28, hold: 9, sell: 3, total: 40,
      priceTarget: { low: 160.00, mean: 210.00, high: 250.00 },
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 1.65, estimate: 1.60, surprisePercent: 3.13 },
      { quarter: "Q4 2025", actual: 2.18, estimate: 2.10, surprisePercent: 3.81 },
      { quarter: "Q3 2025", actual: 1.46, estimate: 1.39, surprisePercent: 5.04 },
      { quarter: "Q2 2025", actual: 1.40, estimate: 1.35, surprisePercent: 3.70 },
    ],
    nextEarningsDate: "2026-07-31",
    news: [
      {
        headline: "Apple Announces New AI-Powered Features for iPhone",
        publisher: "Bloomberg",
        timestamp: "2026-04-16T09:15:00Z",
        aiSummary: "Apple unveiled on-device AI features at a spring event, aiming to compete with Google and Samsung.",
      },
      {
        headline: "Services Revenue Hits Record High in Q1",
        publisher: "Reuters",
        timestamp: "2026-04-15T14:20:00Z",
        aiSummary: "Apple's services segment grew 18% year-over-year, driven by App Store and Apple TV+ subscriptions.",
      },
      {
        headline: "Supply Chain Diversification Continues in Southeast Asia",
        publisher: "Wall Street Journal",
        timestamp: "2026-04-14T11:00:00Z",
        aiSummary: "Apple is shifting more production to Vietnam and India as part of its ongoing supply chain strategy.",
      },
    ],
    chartData30d: [
      170.50, 171.20, 172.00, 171.50, 173.00, 174.20, 173.80, 174.50,
      175.00, 174.30, 173.80, 174.60, 175.20, 175.80, 175.00, 174.50,
      175.30, 176.00, 175.50, 174.80, 175.60, 176.20, 175.90, 176.50,
      176.00, 175.50, 175.80, 176.10, 176.22, 178.72,
    ],
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    currentPrice: 875.28,
    todayChangeDollars: 56.78,
    todayChangePercent: 6.49,
    marketCap: 2_150_000_000_000,
    peRatio: 72.5,
    psRatio: 35.1,
    dividendYield: 0.0002,
    epsTTM: 12.07,
    revenueGrowthYoY: 1.22,
    fiftyTwoWeekLow: 410.00,
    fiftyTwoWeekHigh: 920.00,
    beta: 1.65,
    analystRatings: {
      buy: 38, hold: 4, sell: 1, total: 43,
      priceTarget: { low: 650.00, mean: 950.00, high: 1200.00 },
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 5.98, estimate: 5.60, surprisePercent: 6.79 },
      { quarter: "Q4 2025", actual: 5.16, estimate: 4.64, surprisePercent: 11.21 },
      { quarter: "Q3 2025", actual: 4.02, estimate: 3.37, surprisePercent: 19.29 },
      { quarter: "Q2 2025", actual: 2.70, estimate: 2.09, surprisePercent: 29.19 },
    ],
    nextEarningsDate: "2026-05-28",
    news: [
      {
        headline: "NVIDIA Q4 Earnings Beat Expectations, Data Center Revenue Surges",
        publisher: "Reuters",
        timestamp: "2026-04-16T10:30:00Z",
        aiSummary: "NVIDIA reported record data center revenue, driven by AI chip demand. Analysts raised price targets.",
      },
      {
        headline: "New Blackwell GPU Architecture Enters Mass Production",
        publisher: "The Verge",
        timestamp: "2026-04-15T08:00:00Z",
        aiSummary: "NVIDIA's next-generation Blackwell chips begin shipping to hyperscale cloud providers.",
      },
      {
        headline: "China Export Restrictions Tighten Further",
        publisher: "Financial Times",
        timestamp: "2026-04-13T11:00:00Z",
        aiSummary: "New US export controls could reduce NVIDIA's addressable market in China by an estimated $5B annually.",
      },
    ],
    chartData30d: [
      780.00, 790.10, 785.50, 795.80, 810.00, 805.30, 815.00, 820.20,
      810.50, 825.00, 830.40, 828.00, 835.60, 840.00, 832.50, 838.00,
      842.30, 848.00, 845.50, 850.20, 855.00, 860.30, 852.80, 858.00,
      862.40, 855.00, 860.50, 865.00, 818.50, 875.28,
    ],
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    currentPrice: 415.56,
    todayChangeDollars: 10.39,
    todayChangePercent: 2.56,
    marketCap: 3_090_000_000_000,
    peRatio: 34.6,
    psRatio: 12.8,
    dividendYield: 0.0074,
    epsTTM: 12.02,
    revenueGrowthYoY: 0.138,
    fiftyTwoWeekLow: 340.22,
    fiftyTwoWeekHigh: 432.00,
    beta: 0.89,
    analystRatings: {
      buy: 35, hold: 5, sell: 2, total: 42,
      priceTarget: { low: 380.00, mean: 460.00, high: 520.00 },
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 3.22, estimate: 3.10, surprisePercent: 3.87 },
      { quarter: "Q4 2025", actual: 3.10, estimate: 2.95, surprisePercent: 5.08 },
      { quarter: "Q3 2025", actual: 2.95, estimate: 2.82, surprisePercent: 4.61 },
      { quarter: "Q2 2025", actual: 2.69, estimate: 2.55, surprisePercent: 5.49 },
    ],
    nextEarningsDate: "2026-07-22",
    news: [
      {
        headline: "Azure Cloud Revenue Surges on Enterprise AI Demand",
        publisher: "CNBC",
        timestamp: "2026-04-16T10:15:00Z",
        aiSummary: "Microsoft reported Azure revenue growth of 29%, fueled by enterprise adoption of AI workloads.",
      },
      {
        headline: "Microsoft Copilot Reaches 100 Million Users",
        publisher: "The Verge",
        timestamp: "2026-04-15T08:45:00Z",
        aiSummary: "Microsoft's AI assistant crossed a major adoption milestone, with strong traction in enterprise Office suites.",
      },
      {
        headline: "Gaming Division Reports Mixed Results",
        publisher: "Bloomberg",
        timestamp: "2026-04-13T16:30:00Z",
        aiSummary: "Xbox hardware sales declined but Game Pass subscriptions grew 22%, reflecting the industry shift to services.",
      },
    ],
    chartData30d: [
      395.00, 398.50, 397.20, 400.00, 403.30, 405.80, 402.10, 400.70,
      399.00, 397.50, 400.80, 403.20, 405.50, 403.90, 402.30, 400.00,
      401.80, 404.50, 406.20, 408.00, 405.80, 403.50, 404.90, 407.80,
      409.50, 410.20, 408.00, 406.20, 405.17, 415.56,
    ],
  },
  {
    symbol: "VTI",
    name: "Vanguard Total Stock Market ETF",
    currentPrice: 242.15,
    todayChangeDollars: 6.05,
    todayChangePercent: 2.50,
    marketCap: 380_000_000_000,
    peRatio: null,
    psRatio: null,
    dividendYield: 0.0135,
    epsTTM: null,
    revenueGrowthYoY: null,
    fiftyTwoWeekLow: 198.00,
    fiftyTwoWeekHigh: 248.00,
    beta: 1.0,
    analystRatings: {
      buy: 0, hold: 0, sell: 0, total: 0,
      priceTarget: { low: 0, mean: 0, high: 0 },
    },
    earningsHistory: [],
    nextEarningsDate: "",
    news: [
      {
        headline: "S&P 500 Hits New All-Time High on Tech Rally",
        publisher: "AP",
        timestamp: "2026-04-16T06:30:00Z",
        aiSummary: "The S&P 500 reached a record level, led by semiconductor and cloud computing stocks.",
      },
      {
        headline: "Passive Investing Continues to Dominate Fund Flows",
        publisher: "Financial Times",
        timestamp: "2026-04-14T09:30:00Z",
        aiSummary: "Index funds attracted $85 billion in Q1, while active managers saw $12 billion in outflows.",
      },
    ],
    chartData30d: [
      228.00, 229.20, 230.10, 229.50, 231.00, 232.30, 231.80, 233.00,
      234.20, 233.50, 232.80, 233.60, 234.40, 235.00, 234.50, 233.80,
      234.90, 235.50, 236.00, 235.40, 234.80, 235.20, 235.80, 236.50,
      235.90, 235.00, 234.50, 236.10, 236.10, 242.15,
    ],
  },
  {
    symbol: "BND",
    name: "Vanguard Total Bond Market ETF",
    currentPrice: 72.45,
    todayChangeDollars: 0.10,
    todayChangePercent: 0.14,
    marketCap: 110_000_000_000,
    peRatio: null,
    psRatio: null,
    dividendYield: 0.0340,
    epsTTM: null,
    revenueGrowthYoY: null,
    fiftyTwoWeekLow: 68.50,
    fiftyTwoWeekHigh: 75.20,
    beta: 0.05,
    analystRatings: {
      buy: 0, hold: 0, sell: 0, total: 0,
      priceTarget: { low: 0, mean: 0, high: 0 },
    },
    earningsHistory: [],
    nextEarningsDate: "",
    news: [
      {
        headline: "Bond Market Sees Renewed Interest as Rate Cuts Expected",
        publisher: "Financial Times",
        timestamp: "2026-04-16T08:00:00Z",
        aiSummary: "Treasury yields fell as investors priced in rate cuts, boosting bond ETFs like BND.",
      },
      {
        headline: "Fed Holds Rates Steady, Signals Patience",
        publisher: "Reuters",
        timestamp: "2026-04-14T15:30:00Z",
        aiSummary: "The Federal Reserve kept rates unchanged and reiterated a data-dependent approach to future cuts.",
      },
    ],
    chartData30d: [
      72.10, 72.00, 71.90, 72.05, 72.20, 72.15, 72.00, 71.95,
      72.10, 72.25, 72.30, 72.20, 72.15, 72.10, 72.00, 71.95,
      72.05, 72.15, 72.20, 72.30, 72.25, 72.10, 72.15, 72.20,
      72.30, 72.25, 72.35, 72.40, 72.35, 72.45,
    ],
  },
  {
    symbol: "JNJ",
    name: "Johnson & Johnson",
    currentPrice: 156.89,
    todayChangeDollars: -0.22,
    todayChangePercent: -0.14,
    marketCap: 378_000_000_000,
    peRatio: 15.7,
    psRatio: 4.1,
    dividendYield: 0.0318,
    epsTTM: 9.99,
    revenueGrowthYoY: 0.031,
    fiftyTwoWeekLow: 140.50,
    fiftyTwoWeekHigh: 168.85,
    beta: 0.55,
    analystRatings: {
      buy: 10, hold: 12, sell: 3, total: 25,
      priceTarget: { low: 148.00, mean: 172.00, high: 190.00 },
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 2.77, estimate: 2.68, surprisePercent: 3.36 },
      { quarter: "Q4 2025", actual: 2.54, estimate: 2.52, surprisePercent: 0.79 },
      { quarter: "Q3 2025", actual: 2.42, estimate: 2.48, surprisePercent: -2.42 },
      { quarter: "Q2 2025", actual: 2.82, estimate: 2.71, surprisePercent: 4.06 },
    ],
    nextEarningsDate: "2026-07-15",
    news: [
      {
        headline: "J&J Oncology Pipeline Shows Promising Trial Results",
        publisher: "Reuters",
        timestamp: "2026-04-15T07:30:00Z",
        aiSummary: "Phase 3 trials for J&J's new cancer treatment showed significant improvement in progression-free survival.",
      },
      {
        headline: "MedTech Division Drives Steady Growth",
        publisher: "Barron's",
        timestamp: "2026-04-13T14:00:00Z",
        aiSummary: "J&J's medical devices segment grew 6.2% in Q1, led by robotic surgery platform adoption.",
      },
    ],
    chartData30d: [
      158.00, 157.50, 157.80, 158.20, 157.00, 156.50, 157.20, 157.80,
      158.50, 158.00, 157.30, 156.80, 157.50, 158.00, 157.70, 157.20,
      156.80, 157.40, 157.00, 156.50, 157.10, 157.60, 157.00, 156.70,
      156.30, 156.80, 157.20, 156.90, 157.11, 156.89,
    ],
  },
  {
    symbol: "VXUS",
    name: "Vanguard Total International Stock ETF",
    currentPrice: 59.61,
    todayChangeDollars: 1.79,
    todayChangePercent: 3.00,
    marketCap: 75_000_000_000,
    peRatio: null,
    psRatio: null,
    dividendYield: 0.0310,
    epsTTM: null,
    revenueGrowthYoY: null,
    fiftyTwoWeekLow: 48.50,
    fiftyTwoWeekHigh: 62.00,
    beta: 0.85,
    analystRatings: {
      buy: 0, hold: 0, sell: 0, total: 0,
      priceTarget: { low: 0, mean: 0, high: 0 },
    },
    earningsHistory: [],
    nextEarningsDate: "",
    news: [
      {
        headline: "International Markets Rally on Weak Dollar",
        publisher: "Reuters",
        timestamp: "2026-04-16T07:00:00Z",
        aiSummary: "Emerging market equities surged as the US dollar weakened, boosting returns for international stock ETFs.",
      },
    ],
    chartData30d: [
      55.00, 55.40, 55.80, 55.60, 56.10, 56.50, 56.30, 56.80,
      57.20, 56.90, 56.60, 57.00, 57.40, 57.80, 57.50, 57.20,
      57.60, 58.00, 57.80, 57.50, 57.90, 58.20, 58.00, 58.40,
      58.10, 57.80, 58.20, 58.50, 57.82, 59.61,
    ],
  },
  {
    symbol: "SCHD",
    name: "Schwab U.S. Dividend Equity ETF",
    currentPrice: 80.82,
    todayChangeDollars: 6.92,
    todayChangePercent: 8.57,
    marketCap: 55_000_000_000,
    peRatio: null,
    psRatio: null,
    dividendYield: 0.0352,
    epsTTM: null,
    revenueGrowthYoY: null,
    fiftyTwoWeekLow: 68.00,
    fiftyTwoWeekHigh: 82.50,
    beta: 0.78,
    analystRatings: {
      buy: 0, hold: 0, sell: 0, total: 0,
      priceTarget: { low: 0, mean: 0, high: 0 },
    },
    earningsHistory: [],
    nextEarningsDate: "",
    news: [
      {
        headline: "Dividend Stocks Outperform as Investors Seek Income",
        publisher: "MarketWatch",
        timestamp: "2026-04-16T09:00:00Z",
        aiSummary: "Dividend-focused ETFs saw record inflows as investors rotated away from growth stocks into income-generating assets.",
      },
    ],
    chartData30d: [
      72.00, 72.50, 73.00, 72.80, 73.50, 74.00, 73.60, 74.20,
      74.80, 74.50, 74.00, 74.50, 75.00, 75.40, 75.00, 74.60,
      75.20, 75.80, 75.50, 75.00, 75.60, 76.00, 75.80, 76.20,
      75.80, 75.40, 75.80, 76.10, 73.90, 80.82,
    ],
  },
  {
    symbol: "GOOGL",
    name: "Alphabet Inc.",
    currentPrice: 175.98,
    todayChangeDollars: 0.88,
    todayChangePercent: 0.50,
    marketCap: 2_170_000_000_000,
    peRatio: 25.0,
    psRatio: 6.7,
    dividendYield: 0.0045,
    epsTTM: 7.04,
    revenueGrowthYoY: 0.112,
    fiftyTwoWeekLow: 132.00,
    fiftyTwoWeekHigh: 191.75,
    beta: 1.06,
    analystRatings: {
      buy: 32, hold: 8, sell: 2, total: 42,
      priceTarget: { low: 155.00, mean: 200.00, high: 230.00 },
    },
    earningsHistory: [
      { quarter: "Q1 2026", actual: 2.01, estimate: 1.89, surprisePercent: 6.35 },
      { quarter: "Q4 2025", actual: 2.12, estimate: 1.98, surprisePercent: 7.07 },
      { quarter: "Q3 2025", actual: 1.85, estimate: 1.84, surprisePercent: 0.54 },
      { quarter: "Q2 2025", actual: 1.89, estimate: 1.85, surprisePercent: 2.16 },
    ],
    nextEarningsDate: "2026-07-29",
    news: [
      {
        headline: "Google Cloud Posts Strong Growth Amid AI Race",
        publisher: "Reuters",
        timestamp: "2026-04-16T08:00:00Z",
        aiSummary: "Google Cloud revenue grew 26% as enterprises adopted Gemini-powered analytics and infrastructure.",
      },
      {
        headline: "YouTube Ad Revenue Tops Expectations",
        publisher: "Bloomberg",
        timestamp: "2026-04-15T13:00:00Z",
        aiSummary: "YouTube generated $9.8B in ad revenue for Q1, driven by connected TV and Shorts monetization.",
      },
      {
        headline: "DOJ Antitrust Trial Enters Final Phase",
        publisher: "Wall Street Journal",
        timestamp: "2026-04-12T10:00:00Z",
        aiSummary: "The Department of Justice's search monopoly case against Google is nearing a verdict after months of testimony.",
      },
    ],
    chartData30d: [
      168.50, 169.20, 170.00, 169.50, 171.00, 172.20, 171.80, 172.50,
      173.00, 172.30, 171.80, 172.60, 173.20, 173.80, 173.00, 172.50,
      173.30, 174.00, 173.50, 172.80, 173.60, 174.20, 173.90, 174.50,
      174.00, 173.50, 173.80, 174.10, 175.10, 175.98,
    ],
  },
];

/** Find research data by ticker symbol (case-insensitive). */
export function getResearchBySymbol(symbol: string): ResearchData | undefined {
  return researchData.find(
    (r) => r.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

/** Format a number as compact USD (e.g. $2.78T, $378B). */
export function formatCompactCurrency(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(0)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  }
  return `$${value.toLocaleString("en-US")}`;
}

/** Format a number as USD currency. */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format a decimal as a percentage string (e.g. 0.054 -> "5.40%"). */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
