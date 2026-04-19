"use client";

import { useTrade } from "@/components/trade/TradeContext";
import { mockPortfolio } from "@/data/mockPortfolio";

export function WatchlistWidget() {
  const { openTrade } = useTrade();
  const watchlist = (mockPortfolio as any).watchlist ?? [];
  const holdings = mockPortfolio.holdings ?? [];

  const ownedSymbols = new Set(holdings.map(h => h.symbol));

  if (watchlist.length === 0) {
    return (
      <section aria-labelledby="watchlist-heading" className="watchlist-widget">
        <header className="watchlist-widget__head">
          <h2 id="watchlist-heading">Watchlist</h2>
        </header>
        <p className="empty-state">
          Your watchlist is empty. Add stocks you want to follow from the Research page.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="watchlist-heading" className="watchlist-widget">
      <header className="watchlist-widget__head">
        <h2 id="watchlist-heading">Watchlist</h2>
        <p className="watchlist-widget__sub">
          {watchlist.length} {watchlist.length === 1 ? "stock" : "stocks"} you&apos;re following
        </p>
      </header>
      <div className="watchlist-widget__scroll">
        <table aria-label="Watchlist with trade actions" className="watchlist-table">
          <caption className="sr-only">
            {watchlist.length} watchlist items with symbol, price, day change, and Buy/Sell actions
          </caption>
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Name</th>
              <th scope="col" className="numeric">Price</th>
              <th scope="col" className="numeric">Day change</th>
              <th scope="col" className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((item: any) => {
              const owned = ownedSymbols.has(item.symbol);
              const dayDir = item.dayChange >= 0 ? "gain" : "loss";
              const arrow = item.dayChange >= 0 ? "↑" : "↓";
              const sign = item.dayChange >= 0 ? "+" : "";
              return (
                <tr key={item.symbol}>
                  <th scope="row">
                    <a href={`/research/${item.symbol}`} className="ticker-link">{item.symbol}</a>
                  </th>
                  <td className="name-cell">{item.name}</td>
                  <td className="numeric">${item.price.toFixed(2)}</td>
                  <td className={`numeric change-cell change-cell--${dayDir}`}>
                    <span aria-label={`${item.dayChange >= 0 ? "up" : "down"} ${Math.abs(item.dayChangePercent).toFixed(2)} percent`}>
                      {arrow} {sign}${Math.abs(item.dayChange).toFixed(2)} ({sign}{item.dayChangePercent.toFixed(2)}%)
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button type="button" onClick={() => openTrade(item.symbol, "buy")} className="btn btn--buy btn--small" aria-label={`Buy ${item.symbol}, ${item.name}`}>Buy</button>
                    <button type="button" onClick={() => openTrade(item.symbol, "sell")} disabled={!owned} className="btn btn--ghost btn--small" aria-label={owned ? `Sell ${item.symbol}` : `Sell ${item.symbol} (you don't own this)`}>Sell</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
