/**
 * Financial glossary -- single source of truth for all term definitions.
 * The AI copilot must use these definitions verbatim (CLAUDE.md A3.5).
 */

export interface GlossaryEntry {
  term: string;
  definition: string;
}

export const glossary: GlossaryEntry[] = [
  {
    term: "Market cap",
    definition:
      "The total value of a company's outstanding shares. Calculated by multiplying the current stock price by the number of shares. Large-cap companies are generally considered more stable.",
  },
  {
    term: "P/E ratio",
    definition:
      "Price-to-Earnings ratio. Compares a company's stock price to its earnings per share. A high P/E may mean the stock is overvalued or that investors expect high future growth.",
  },
  {
    term: "P/S ratio",
    definition:
      "Price-to-Sales ratio. Compares a company's stock price to its revenue per share. Useful for evaluating companies that are not yet profitable.",
  },
  {
    term: "Dividend yield",
    definition:
      "The annual dividend payment divided by the stock price, expressed as a percentage. Shows how much cash flow you get for each dollar invested in a stock.",
  },
  {
    term: "EPS",
    definition:
      "Earnings Per Share. The portion of a company's profit allocated to each outstanding share of common stock. Higher EPS generally indicates greater profitability.",
  },
  {
    term: "Revenue growth",
    definition:
      "The percentage increase in a company's sales over a specific period, usually year-over-year. Positive revenue growth indicates a company is expanding.",
  },
  {
    term: "52-week range",
    definition:
      "The lowest and highest prices at which a stock has traded during the past year. Helps you understand the stock's price volatility over time.",
  },
  {
    term: "Beta",
    definition:
      "A measure of a stock's volatility relative to the overall market. A beta of 1 means the stock moves with the market. Greater than 1 means more volatile, less than 1 means less volatile.",
  },
  {
    term: "Diversification",
    definition:
      "Spreading your investments across different assets, sectors, or geographies to reduce risk. The idea is that losses in one area may be offset by gains in another.",
  },
  {
    term: "Concentration risk",
    definition:
      "The risk of loss from having too much of your portfolio invested in a single stock, sector, or asset type. The opposite of diversification.",
  },
  {
    term: "Asset allocation",
    definition:
      "How your portfolio is divided among different asset categories like stocks, bonds, and cash. Your allocation should reflect your goals, risk tolerance, and time horizon.",
  },
  {
    term: "Sector",
    definition:
      "A group of companies that operate in the same segment of the economy, such as technology, healthcare, or energy. Sector diversification helps manage risk.",
  },
  {
    term: "Market order",
    definition:
      "An order to buy or sell a stock immediately at the best available price. You get speed but not price certainty.",
  },
  {
    term: "Limit order",
    definition:
      "An order to buy or sell a stock at a specific price or better. Gives you price control but the order may not be filled if the price is never reached.",
  },
  {
    term: "Stop order",
    definition:
      "An order that becomes a market order when a stock reaches a specified price (the stop price). Often used to limit losses or protect profits.",
  },
  {
    term: "Bid",
    definition:
      "The highest price a buyer is willing to pay for a stock at a given moment. Part of the bid-ask spread.",
  },
  {
    term: "Ask",
    definition:
      "The lowest price a seller is willing to accept for a stock at a given moment. Also called the offer price.",
  },
  {
    term: "Spread",
    definition:
      "The difference between the bid and ask prices. A narrow spread usually indicates high liquidity and active trading.",
  },
  {
    term: "ETF",
    definition:
      "Exchange-Traded Fund. A basket of securities (stocks, bonds, etc.) that trades on an exchange like a single stock. ETFs offer diversification at a low cost.",
  },
  {
    term: "Index fund",
    definition:
      "A type of mutual fund or ETF designed to match the performance of a specific market index, like the S&P 500. Known for low fees and broad diversification.",
  },
  {
    term: "Bull market",
    definition:
      "A market condition where prices are rising or expected to rise, typically defined as a 20% increase from recent lows. Associated with investor optimism.",
  },
  {
    term: "Bear market",
    definition:
      "A market condition where prices are falling or expected to fall, typically defined as a 20% decline from recent highs. Associated with investor pessimism.",
  },
  {
    term: "Volatility",
    definition:
      "A measure of how much a stock's price fluctuates over time. High volatility means the price can change dramatically in a short period, in either direction.",
  },
  {
    term: "Portfolio",
    definition:
      "The collection of all your investments, including stocks, bonds, ETFs, cash, and other assets. A well-managed portfolio aligns with your financial goals.",
  },
  {
    term: "Holdings",
    definition:
      "The individual investments within your portfolio. Each stock, bond, or fund you own is a holding.",
  },
  {
    term: "Risk tolerance",
    definition:
      "Your ability and willingness to endure declines in the value of your investments. Affected by your financial situation, goals, and emotional comfort with loss.",
  },
  {
    term: "Time horizon",
    definition:
      "The length of time you plan to hold an investment before you need the money. Longer time horizons generally allow for more aggressive investing.",
  },
  {
    term: "Dollar-cost averaging",
    definition:
      "Investing a fixed amount of money at regular intervals regardless of the stock price. This strategy reduces the impact of volatility on your overall purchase price.",
  },
  {
    term: "Expense ratio",
    definition:
      "The annual fee that a fund charges its shareholders, expressed as a percentage of assets. Lower expense ratios mean more of your money stays invested.",
  },
  {
    term: "Short-term capital gains",
    definition:
      "Profits from selling an investment held for one year or less. These are taxed at your ordinary income tax rate, which is usually higher than long-term rates.",
  },
  {
    term: "Long-term capital gains",
    definition:
      "Profits from selling an investment held for more than one year. These are taxed at preferential rates (0%, 15%, or 20%) depending on your income level.",
  },
  {
    term: "PFOF",
    definition:
      "Payment for Order Flow. A practice where a broker receives compensation for directing orders to a particular market maker. This can create conflicts of interest as the broker may not get you the best price.",
  },
  {
    term: "Cost basis",
    definition:
      "The original value or purchase price of an asset, adjusted for stock splits, dividends, and return of capital distributions. Used to calculate capital gains or losses.",
  },
  {
    term: "Total return",
    definition:
      "The actual rate of return of an investment over a given period, including capital gains, dividends, and interest, expressed as a percentage of the initial investment.",
  },
  {
    term: "Compound interest",
    definition:
      "Interest calculated on both the initial principal and the accumulated interest from previous periods. Often called 'interest on interest,' it accelerates wealth building over time.",
  },
];

/**
 * Slug-keyed Record for backward-compatible indexed access.
 * Keys are lowercase, hyphenated versions of the term (e.g., "pe-ratio", "market-cap").
 */
function toSlug(term: string): string {
  return term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const glossaryByKey: Record<string, GlossaryEntry> = Object.fromEntries(
  glossary.map((entry) => [toSlug(entry.term), entry])
);

/**
 * @deprecated Use `glossary` (array) or `glossaryByKey` (Record).
 * This alias maintains backward compatibility with code that imports
 * `glossary` and accesses it by slug key.
 */
export { glossaryByKey as glossaryMap };

/**
 * Look up a glossary entry by term (case-insensitive).
 */
export function findGlossaryEntry(
  searchTerm: string
): GlossaryEntry | undefined {
  const lower = searchTerm.toLowerCase();
  return glossary.find((entry) => entry.term.toLowerCase() === lower);
}

/**
 * Search glossary entries that contain the query in term or definition.
 */
export function searchGlossary(query: string): GlossaryEntry[] {
  const lower = query.toLowerCase();
  return glossary.filter(
    (entry) =>
      entry.term.toLowerCase().includes(lower) ||
      entry.definition.toLowerCase().includes(lower)
  );
}
