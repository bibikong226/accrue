"use client";

import { useState, useRef, useEffect } from "react";
import { mockPortfolio } from "@/data/mockPortfolio";

export type TradeAction = "buy" | "sell";
type Step = "amount" | "type" | "review" | "done";
type OrderType = "market" | "limit" | "stop";

export interface TradeFlowProps {
  symbol: string;
  defaultAction?: TradeAction;
  variant?: "slideover" | "fullpage";
  onCancel?: () => void;
  onComplete?: () => void;
  hideHeader?: boolean;
}

export function TradeFlow({
  symbol,
  defaultAction = "buy",
  variant = "slideover",
  onCancel,
  onComplete,
  hideHeader = false,
}: TradeFlowProps) {
  const [action, setAction] = useState<TradeAction>(defaultAction);
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"dollars" | "shares">("dollars");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [ack, setAck] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  const holding = mockPortfolio.holdings?.find(h => h.symbol === symbol);
  const price = holding?.currentPrice ?? 100;
  const name = holding?.name ?? symbol;
  const cash = mockPortfolio.portfolio?.cashBalance ?? 0;
  const portfolioValue = mockPortfolio.portfolio?.totalValue ?? 1;
  const ownsIt = !!holding;

  const amountNum = parseFloat(amount) || 0;
  const shares = mode === "dollars" ? amountNum / price : amountNum;
  const totalCost = mode === "dollars" ? amountNum : amountNum * price;
  const canAfford = action === "sell" || cash >= totalCost;
  const currentValue = holding?.marketValue ?? 0;
  const concentrationAfter = action === "buy"
    ? (((currentValue + totalCost) / (portfolioValue + totalCost)) * 100)
    : ((currentValue - totalCost) / portfolioValue) * 100;

  useEffect(() => {
    if (!liveRegionRef.current) return;
    const labels: Record<Step, string> = {
      amount: `Step 1 of 3: Amount. ${action === "buy" ? "Buying" : "Selling"} ${symbol}.`,
      type: "Step 2 of 3: Order type.",
      review: "Step 3 of 3: Review order.",
      done: "Order placed successfully.",
    };
    liveRegionRef.current.textContent = labels[step];
  }, [step, action, symbol]);

  const next = () => { if (step === "amount") setStep("type"); else if (step === "type") setStep("review"); };
  const back = () => { if (step === "type") setStep("amount"); else if (step === "review") setStep("type"); };
  const confirm = async () => { setSubmitting(true); await new Promise(r => setTimeout(r, 600)); setSubmitting(false); setStep("done"); };
  const finish = () => { if (onComplete) onComplete(); else if (onCancel) onCancel(); };

  const actionLabel = action === "buy" ? "Buy" : "Sell";
  const actionColor = action === "buy" ? "#059669" : "#B91C1C";

  return (
    <div className={`trade-flow trade-flow--${variant}`}>
      <div ref={liveRegionRef} role="status" aria-live="polite" className="sr-only" />

      {!hideHeader && (
        <header className="trade-flow__head">
          <h2 className="trade-flow__title">
            <span style={{ color: actionColor }}>{actionLabel}</span> {symbol}
            <small className="trade-flow__name">{name}</small>
          </h2>
        </header>
      )}

      {step === "amount" && variant === "fullpage" && (
        <div className="trade-flow__action-toggle" role="radiogroup" aria-label="Trade action">
          <label className={action === "buy" ? "active" : ""}>
            <input type="radio" name="action" checked={action === "buy"} onChange={() => setAction("buy")} />
            Buy
          </label>
          <label className={action === "sell" ? "active" : ""} aria-disabled={!ownsIt ? "true" : undefined}>
            <input type="radio" name="action" checked={action === "sell"} onChange={() => ownsIt && setAction("sell")} disabled={!ownsIt} />
            Sell {!ownsIt && <small>(you don&apos;t own this)</small>}
          </label>
        </div>
      )}

      <div className="trade-flow__stepper" aria-label="Trade progress">
        <ol>
          <li aria-current={step === "amount" ? "step" : undefined} className={step === "amount" ? "active" : (step !== "amount" ? "done" : "")}>1. Amount</li>
          <li aria-current={step === "type" ? "step" : undefined} className={step === "type" ? "active" : (step === "review" || step === "done" ? "done" : "")}>2. Type</li>
          <li aria-current={step === "review" ? "step" : undefined} className={step === "review" ? "active" : (step === "done" ? "done" : "")}>3. Review</li>
        </ol>
      </div>

      <div className="trade-flow__body">
        {step === "amount" && (
          <section aria-label="Enter amount">
            <div className="trade-mode-toggle" role="radiogroup" aria-label="Amount mode">
              <label><input type="radio" checked={mode === "dollars"} onChange={() => setMode("dollars")} /> Dollars</label>
              <label><input type="radio" checked={mode === "shares"} onChange={() => setMode("shares")} /> Shares</label>
            </div>
            <label className="trade-amount-label" htmlFor="trade-flow-amount">{mode === "dollars" ? "Dollar amount" : "Number of shares"}</label>
            <div className="trade-amount-wrap">
              {mode === "dollars" && <span className="trade-amount-prefix" aria-hidden="true">$</span>}
              <input id="trade-flow-amount" type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="trade-amount-input" autoFocus />
            </div>
            <p className="trade-amount-preview" aria-live="polite">
              {amountNum > 0 ? (mode === "dollars" ? `≈ ${shares.toFixed(4)} shares at $${price.toFixed(2)}` : `≈ $${totalCost.toFixed(2)} at $${price.toFixed(2)}`) : "Enter an amount to continue"}
            </p>
            <dl className="trade-context">
              <div><dt>Current price</dt><dd>${price.toFixed(2)}</dd></div>
              <div><dt>Cash available</dt><dd style={{ color: canAfford ? "#059669" : "#B91C1C" }}>${cash.toFixed(2)}{!canAfford && amountNum > 0 && " (insufficient)"}</dd></div>
              {action === "buy" && amountNum > 0 && <div><dt>{symbol} concentration after</dt><dd>{concentrationAfter.toFixed(1)}%</dd></div>}
              {holding && action === "sell" && <div><dt>You currently own</dt><dd>{holding.shares} shares (${holding.marketValue.toFixed(2)})</dd></div>}
            </dl>
          </section>
        )}

        {step === "type" && (
          <section aria-label="Select order type">
            <fieldset className="trade-order-type">
              <legend>Order type</legend>
              {(["market", "limit", "stop"] as const).map(ot => (
                <label key={ot} className="trade-order-type__option">
                  <input type="radio" name="order-type" checked={orderType === ot} onChange={() => setOrderType(ot)} />
                  <span>
                    <strong>{ot.charAt(0).toUpperCase() + ot.slice(1)}</strong>
                    <small>
                      {ot === "market" && "Execute immediately at current market price"}
                      {ot === "limit" && "Execute only if price reaches your target"}
                      {ot === "stop" && "Convert to market order if price hits stop level"}
                    </small>
                  </span>
                </label>
              ))}
            </fieldset>
            {(orderType === "limit" || orderType === "stop") && (
              <>
                <label htmlFor="trade-flow-limit" className="trade-amount-label">{orderType === "limit" ? "Limit price" : "Stop price"}</label>
                <input id="trade-flow-limit" type="number" inputMode="decimal" step="0.01" value={limitPrice} onChange={e => setLimitPrice(e.target.value)} className="trade-amount-input" />
              </>
            )}
          </section>
        )}

        {step === "review" && (
          <section aria-label="Review order">
            <h3 className="trade-review__heading">Review your order</h3>
            <dl className="trade-review">
              <div><dt>Action</dt><dd>{actionLabel}</dd></div>
              <div><dt>Symbol</dt><dd>{symbol}</dd></div>
              <div><dt>Company</dt><dd>{name}</dd></div>
              <div><dt>{mode === "dollars" ? "Amount" : "Shares"}</dt><dd>{mode === "dollars" ? `$${amountNum.toFixed(2)}` : amountNum.toFixed(4)}</dd></div>
              <div><dt>Estimated shares</dt><dd>{shares.toFixed(4)}</dd></div>
              <div><dt>Estimated price</dt><dd>${price.toFixed(2)}</dd></div>
              <div><dt>Order type</dt><dd>{orderType}</dd></div>
              {(orderType === "limit" || orderType === "stop") && <div><dt>{orderType === "limit" ? "Limit" : "Stop"} price</dt><dd>${parseFloat(limitPrice || "0").toFixed(2)}</dd></div>}
              <div><dt>Estimated fees</dt><dd>$0.00</dd></div>
              <div><dt>Estimated total</dt><dd><strong>${totalCost.toFixed(2)}</strong></dd></div>
            </dl>
            <label className="trade-ack">
              <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} />
              <span>I understand this places a real order.</span>
            </label>
          </section>
        )}

        {step === "done" && (
          <section aria-label="Order confirmed">
            <div className="trade-done" role="alert">
              <div className="trade-done__check" aria-hidden="true">✓</div>
              <h3>Order placed</h3>
              <p>You {action === "buy" ? "bought" : "sold"} {shares.toFixed(4)} shares of {symbol} at an estimated ${price.toFixed(2)} per share.</p>
              <p className="trade-done__total">Total: ${totalCost.toFixed(2)}</p>
              <p className="muted">You&apos;ll see it in Activity when it fills.</p>
            </div>
          </section>
        )}
      </div>

      <footer className="trade-flow__foot">
        {step === "amount" && (
          <><button type="button" onClick={onCancel} className="btn btn--ghost">Cancel</button>
          <button type="button" onClick={next} disabled={amountNum <= 0 || !canAfford} className="btn btn--primary">Next</button></>
        )}
        {step === "type" && (
          <><button type="button" onClick={back} className="btn btn--ghost">Back</button>
          <button type="button" onClick={next} className="btn btn--primary">Review</button></>
        )}
        {step === "review" && (
          <><button type="button" onClick={back} className="btn btn--ghost">Back</button>
          <button type="button" onClick={confirm} disabled={!ack || submitting} aria-busy={submitting} className="btn btn--primary" style={{ background: actionColor }}>{submitting ? "Placing order..." : `Confirm ${actionLabel}`}</button></>
        )}
        {step === "done" && <button type="button" onClick={finish} className="btn btn--primary">Done</button>}
      </footer>
    </div>
  );
}
