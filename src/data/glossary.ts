/**
 * glossary.ts — Predefined financial term definitions.
 *
 * Per CLAUDE.md rule A3.5: "The AI uses glossary definitions verbatim."
 * These definitions are injected into the copilot prompt context and
 * displayed in the Help & Learn glossary section.
 *
 * Terms are kept in alphabetical order for deterministic rendering.
 */

export interface GlossaryTerm {
  term: string;
  definition: string;
}

export const glossary: GlossaryTerm[] = [
  {
    term: "Ask Price",
    definition:
      "The lowest price a seller is willing to accept for a security. When you buy a stock, you typically pay the ask price.",
  },
  {
    term: "Asset Allocation",
    definition:
      "The strategy of dividing your investments among different asset categories, such as stocks, bonds, and cash, to balance risk and reward based on your goals and risk tolerance.",
  },
  {
    term: "Bid Price",
    definition:
      "The highest price a buyer is willing to pay for a security. When you sell a stock, you typically receive the bid price.",
  },
  {
    term: "Bond",
    definition:
      "A fixed-income investment where you lend money to a government or company in exchange for periodic interest payments and the return of the bond's face value at maturity.",
  },
  {
    term: "Capital Gains",
    definition:
      "The profit you earn when you sell an investment for more than you paid for it. Short-term capital gains (held less than a year) are taxed at your ordinary income rate; long-term gains (held more than a year) are taxed at a lower rate.",
  },
  {
    term: "Capital Loss",
    definition:
      "The loss you incur when you sell an investment for less than you paid for it. Capital losses can be used to offset capital gains for tax purposes.",
  },
  {
    term: "Cost Basis",
    definition:
      "The original price you paid for an investment, including any fees or commissions. Your cost basis is used to calculate capital gains or losses when you sell.",
  },
  {
    term: "Diversification",
    definition:
      "The practice of spreading your investments across different asset classes, sectors, and geographies to reduce risk. Diversification does not eliminate risk but helps ensure that a loss in one area does not devastate your entire portfolio.",
  },
  {
    term: "Dividend",
    definition:
      "A portion of a company's earnings paid to shareholders, usually as cash or additional shares. Dividends are typically paid quarterly and represent a way to earn income from your investments.",
  },
  {
    term: "Dollar-Cost Averaging (DCA)",
    definition:
      "An investment strategy where you invest a fixed amount of money at regular intervals, regardless of the price. This approach reduces the impact of volatility by buying more shares when prices are low and fewer shares when prices are high.",
  },
  {
    term: "ETF (Exchange-Traded Fund)",
    definition:
      "A type of investment fund that trades on stock exchanges like a regular stock. ETFs typically track an index, sector, commodity, or other asset, and offer diversification at a low cost.",
  },
  {
    term: "Expense Ratio",
    definition:
      "The annual fee charged by a fund (mutual fund or ETF) to cover its operating expenses, expressed as a percentage of your investment. A lower expense ratio means more of your returns stay in your pocket.",
  },
  {
    term: "Gain/Loss",
    definition:
      "The difference between what you paid for an investment (cost basis) and its current value or sale price. A positive difference is a gain; a negative difference is a loss.",
  },
  {
    term: "Index Fund",
    definition:
      "A type of mutual fund or ETF designed to match the performance of a specific market index, such as the S&P 500. Index funds offer broad market exposure with low fees.",
  },
  {
    term: "Limit Order",
    definition:
      "An order to buy or sell a security at a specific price or better. A buy limit order executes at the limit price or lower; a sell limit order executes at the limit price or higher. The order may not fill if the price is not reached.",
  },
  {
    term: "Market Capitalization",
    definition:
      "The total market value of a company's outstanding shares, calculated by multiplying the stock price by the number of shares. Companies are often categorized as large-cap, mid-cap, or small-cap.",
  },
  {
    term: "Market Order",
    definition:
      "An order to buy or sell a security immediately at the best available current price. Market orders guarantee execution but not the price.",
  },
  {
    term: "Portfolio",
    definition:
      "The collection of all your investments, including stocks, bonds, ETFs, and cash. Your portfolio's composition reflects your investment strategy and risk tolerance.",
  },
  {
    term: "Price-to-Earnings Ratio (P/E)",
    definition:
      "A valuation metric calculated by dividing a stock's price by its earnings per share. A higher P/E may indicate that investors expect higher growth, while a lower P/E may suggest the stock is undervalued or the company has slower growth prospects.",
  },
  {
    term: "Rebalancing",
    definition:
      "The process of realigning your portfolio's asset allocation back to your target mix by buying or selling assets. Rebalancing helps maintain your desired level of risk over time.",
  },
  {
    term: "Risk Tolerance",
    definition:
      "Your ability and willingness to endure declines in the value of your investments. Risk tolerance depends on your financial goals, time horizon, and personal comfort with uncertainty.",
  },
  {
    term: "S&P 500",
    definition:
      "A stock market index that tracks the performance of 500 large U.S. companies. It is widely regarded as one of the best measures of overall U.S. stock market performance.",
  },
  {
    term: "Sector",
    definition:
      "A group of companies that operate in the same area of the economy, such as Technology, Healthcare, or Financials. Investing across multiple sectors helps with diversification.",
  },
  {
    term: "Share",
    definition:
      "A unit of ownership in a company or fund. When you buy shares of a stock, you become a partial owner of that company.",
  },
  {
    term: "Stop Order",
    definition:
      "An order to buy or sell a security once it reaches a specified price (the stop price). Once triggered, a stop order becomes a market order and executes at the next available price.",
  },
  {
    term: "Stop-Limit Order",
    definition:
      "An order that combines a stop order with a limit order. Once the stop price is reached, the order becomes a limit order that will only execute at the specified limit price or better.",
  },
  {
    term: "Tax-Loss Harvesting",
    definition:
      "A strategy of selling investments at a loss to offset capital gains taxes. The proceeds are typically reinvested in a similar (but not identical) investment to maintain your portfolio's overall allocation.",
  },
  {
    term: "Ticker Symbol",
    definition:
      "A unique abbreviation used to identify a publicly traded company on a stock exchange. For example, AAPL represents Apple Inc.",
  },
  {
    term: "Time Horizon",
    definition:
      "The length of time you expect to hold an investment before you need the money. A longer time horizon generally allows you to take on more risk because you have more time to recover from market downturns.",
  },
  {
    term: "Volatility",
    definition:
      "A measure of how much the price of an investment fluctuates over time. Higher volatility means the price can change dramatically in a short period, which represents both opportunity and risk.",
  },
  {
    term: "Yield",
    definition:
      "The income return on an investment, expressed as a percentage of the investment's cost or current value. For stocks, yield usually refers to the dividend yield; for bonds, it refers to the interest yield.",
  },
];
