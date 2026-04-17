"use client";

import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  type FormEvent,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getStockBySymbol,
  getHoldingBySymbol,
  calculateFees,
  mockPortfolio,
  accountInfo,
  sectorTargets,
  taxInfo,
  type StockQuote,
  type Holding,
} from "@/data/mockPortfolio";

/* ------------------------------------------------------------------ */
/*  Decision journal placeholder prompts (§ 4.4)                      */
/* ------------------------------------------------------------------ */

const JOURNAL_PLACEHOLDERS = [
  "What's your thesis?",
  "Why now, and not next week?",
  "What would make you sell?",
  "What evidence supports this trade?",
  "How does this fit your long-term plan?",
] as const;

/* ------------------------------------------------------------------ */
/*  Review Page Component                                              */
/* ------------------------------------------------------------------ */

import { Suspense } from "react";

function OrderReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /* ---- extract order params from URL ---- */
  const symbol = searchParams.get("symbol") || "AAPL";
  const action = (searchParams.get("action") || "buy") as "buy" | "sell";
  const inputMode = (searchParams.get("inputMode") || "shares") as "shares" | "dollars";
  const rawQuantity = searchParams.get("quantity") || "1";
  const orderType = searchParams.get("orderType") || "market";
  const limitPriceParam = searchParams.get("limitPrice") || "";

  /* ---- resolve stock & holding data from mock ---- */
  const stock: StockQuote | undefined = useMemo(
    () => getStockBySymbol(symbol),
    [symbol],
  );
  const holding: Holding | undefined = useMemo(
    () => getHoldingBySymbol(symbol),
    [symbol],
  );

  const price = stock?.currentPrice ?? 178.72;
  const stockName = stock?.name ?? "Apple Inc.";
  const sector = stock?.sector ?? "Technology";

  /* ---- compute shares from input mode ---- */
  const shares = useMemo(() => {
    const raw = parseFloat(rawQuantity);
    if (isNaN(raw) || raw <= 0) return 1;
    if (inputMode === "dollars" && price > 0) return raw / price;
    return raw;
  }, [rawQuantity, inputMode, price]);

  /* ---- fees ---- */
  const fees = useMemo(
    () => calculateFees(action, shares, price),
    [action, shares, price],
  );

  const subtotal = shares * price;
  const estimatedTotal =
    action === "buy" ? subtotal + fees.total : subtotal - fees.total;

  /* ---- concentration risk calculations ---- */
  const totalPortfolioValue = mockPortfolio.totalValue;

  const currentWeight = useMemo(() => {
    if (holding) return holding.portfolioWeight;
    return 0;
  }, [holding]);

  const newWeight = useMemo(() => {
    const existingValue = holding ? holding.marketValue : 0;
    const tradeValue = action === "buy" ? subtotal : -subtotal;
    const newHoldingValue = existingValue + tradeValue;
    const newTotal = totalPortfolioValue + (action === "buy" ? subtotal : -subtotal);
    if (newTotal <= 0) return 0;
    return +((newHoldingValue / newTotal) * 100).toFixed(1);
  }, [holding, action, subtotal, totalPortfolioValue]);

  const concentrationFlag = newWeight > 20;

  /* ---- sector drift calculations ---- */
  const currentSectorAllocation = useMemo(() => {
    const alloc = mockPortfolio.sectorAllocations.find(
      (sa) => sa.sector === sector,
    );
    return alloc?.percent ?? 0;
  }, [sector]);

  const newSectorWeight = useMemo(() => {
    const existingSectorValue =
      mockPortfolio.sectorAllocations.find((sa) => sa.sector === sector)?.value ?? 0;
    const tradeValue = action === "buy" ? subtotal : -subtotal;
    const newSectorValue = existingSectorValue + tradeValue;
    const newTotal = totalPortfolioValue + (action === "buy" ? subtotal : -subtotal);
    if (newTotal <= 0) return 0;
    return +((newSectorValue / newTotal) * 100).toFixed(1);
  }, [sector, action, subtotal, totalPortfolioValue]);

  const sectorTarget = sectorTargets[sector] ?? 30;

  /* ---- tax impact ---- */
  const taxImpactMessage = useMemo(() => {
    if (action === "buy") {
      return "This purchase doesn't trigger a taxable event.";
    }
    if (!holding) return "No existing position to assess tax impact.";
    const gainPerShare = price - holding.avgCost;
    if (gainPerShare <= 0) {
      return `This sale would realize a loss of $${Math.abs(
        +(gainPerShare * shares).toFixed(2),
      )}, which may offset other gains.`;
    }
    const totalGain = +(gainPerShare * shares).toFixed(2);
    const estimatedTax = +(totalGain * taxInfo.shortTermRate).toFixed(2);
    return `Estimated short-term capital gain: $${totalGain}. Estimated tax: $${estimatedTax} at ${(taxInfo.shortTermRate * 100).toFixed(0)}% rate.`;
  }, [action, holding, price, shares]);

  /* ---- goal deviation ---- */
  const goalMessage = useMemo(() => {
    const goal = mockPortfolio.goal;
    if (goal.status === "on-track") {
      return "This trade doesn't significantly impact your goal progress.";
    }
    if (action === "buy") {
      return `You're currently ${goal.statusLabel.toLowerCase()} on your ${goal.targetDateDisplay} goal. This buy reduces your cash by $${subtotal.toFixed(2)}.`;
    }
    return `You're currently ${goal.statusLabel.toLowerCase()} on your ${goal.targetDateDisplay} goal. This sell adds $${(subtotal - fees.total).toFixed(2)} to your cash.`;
  }, [action, subtotal, fees.total]);

  /* ---- estimated sell tax (sells only) ---- */
  const estimatedTaxAmount = useMemo(() => {
    if (action !== "sell" || !holding) return null;
    const gainPerShare = price - holding.avgCost;
    if (gainPerShare <= 0) return 0;
    return +(gainPerShare * shares * taxInfo.shortTermRate).toFixed(2);
  }, [action, holding, price, shares]);

  /* ---- decision journal state (§ 4.4) ---- */
  const [journalEntry, setJournalEntry] = useState("");
  const [journalError, setJournalError] = useState("");

  /* ---- regret rehearsal state (§ 4.5) ---- */
  const [regretExpanded, setRegretExpanded] = useState(true);
  const [regretEntry, setRegretEntry] = useState("");
  const [regretSkipped, setRegretSkipped] = useState(false);

  /* ---- acknowledgment + confirmation state ---- */
  const [acknowledged, setAcknowledged] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  /* ---- placeholder rotation ---- */
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  useEffect(() => {
    setPlaceholderIndex(Math.floor(Math.random() * JOURNAL_PLACEHOLDERS.length));
  }, []);

  /* ---- expandable "learn why" states for risk rows ---- */
  const [expandedRisk, setExpandedRisk] = useState<Record<string, boolean>>({});
  const toggleRiskExpand = useCallback((key: string) => {
    setExpandedRisk((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* ---- refs ---- */
  const journalRef = useRef<HTMLTextAreaElement>(null);
  const confirmAlertRef = useRef<HTMLDivElement>(null);

  /* ---- can confirm? ---- */
  const canConfirm = acknowledged && journalEntry.trim().length >= 12;

  /* ---- handle confirm ---- */
  const handleConfirm = useCallback(
    (e: FormEvent) => {
      e.preventDefault();

      if (journalEntry.trim().length < 12) {
        setJournalError(
          "Your trade rationale must be at least 12 characters. Future you will thank you.",
        );
        journalRef.current?.focus();
        return;
      }
      setJournalError("");

      if (!acknowledged) return;

      setIsConfirmed(true);

      /* a11y: after a short delay let the confirmation alert announce */
      setTimeout(() => {
        confirmAlertRef.current?.focus();
      }, 100);
    },
    [journalEntry, acknowledged],
  );

  /* ---- handle change order (go back) ---- */
  const handleChangeOrder = useCallback(() => {
    router.back();
  }, [router]);

  /* ---- handle cancel ---- */
  const handleCancel = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  /* ---- "why no confetti?" state ---- */
  const [confettiExplained, setConfettiExplained] = useState(false);

  /* ================================================================ */
  /*  POST-TRADE CONFIRMATION VIEW                                    */
  /* ================================================================ */

  if (isConfirmed) {
    return (
      <div className="max-w-xl">
        {/* a11y: role="alert" announces confirmation to screen readers */}
        <div
          ref={confirmAlertRef}
          role="alert"
          tabIndex={-1}
          className="outline-none"
        >
          <div className="flex items-center gap-3 mb-6">
            {/* Static checkmark — NO animation, NO confetti per A2.5 */}
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-feedback-success text-inverse text-lg"
              aria-hidden="true"
            >
              &#10003;
            </span>
            <h1 className="text-2xl font-semibold text-primary">Order Placed</h1>
          </div>

          <p className="text-sm text-primary mb-6">
            Order placed. You&apos;ll see it in Activity when it fills &mdash; usually
            within seconds.
          </p>

          {/* a11y: full announcement for screen readers */}
          <p className="sr-only">
            Order placed. You {action === "buy" ? "bought" : "sold"}{" "}
            {shares.toFixed(4)} shares of {symbol} at{" "}
            {orderType.charAt(0).toUpperCase() + orderType.slice(1)} price. Estimated
            total: ${estimatedTotal.toFixed(2)}.
          </p>
        </div>

        {/* Order summary — identical to review per spec */}
        <div className="rounded-lg border border-border-default bg-surface-raised p-4 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Order Summary</h2>
          <dl className="space-y-3">
            <OrderRow label="Action" value={action === "buy" ? "Buy" : "Sell"} />
            <OrderRow label="Ticker" value={`${symbol} — ${stockName}`} />
            <OrderRow
              label="Quantity"
              value={`${shares.toFixed(4)} shares`}
              mono
            />
            <OrderRow
              label="Estimated Price"
              value={`$${price.toFixed(2)}`}
              mono
            />
            <OrderRow
              label="Estimated Total"
              value={`$${estimatedTotal.toFixed(2)}`}
              mono
            />
            <OrderRow
              label="Fees"
              value={`$${fees.total.toFixed(2)} (spread: $${fees.spread.toFixed(2)}, commission: $${fees.commission.toFixed(2)}${action === "sell" ? `, SEC: $${fees.secFee.toFixed(4)}, TAF: $${fees.tafFee.toFixed(4)}` : ""})`}
            />
            <OrderRow label="Account" value={accountInfo.name} />
            <OrderRow
              label="Order Type"
              value={orderType.charAt(0).toUpperCase() + orderType.slice(1)}
            />
            <OrderRow label="Time in Force" value="Day" />
          </dl>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="flex-1 rounded-lg bg-action-primary px-6 py-3 text-sm font-semibold text-inverse hover:bg-action-primary-hover min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition-colors"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => router.push("/history")}
            className="flex-1 rounded-lg border-2 border-action-primary px-6 py-3 text-sm font-semibold text-action-primary hover:bg-surface-raised min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition-colors"
          >
            View activity
          </button>
        </div>

        {/* "Why no confetti?" */}
        <div className="text-sm">
          <button
            type="button"
            onClick={() => setConfettiExplained((prev) => !prev)}
            aria-expanded={confettiExplained}
            className="text-muted underline hover:text-secondary min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            Why no confetti?
          </button>
          {confettiExplained && (
            <p className="mt-2 text-muted text-sm leading-relaxed">
              Research shows that celebratory animations after trades &mdash;
              confetti, fireworks, reward sounds &mdash; activate the same
              dopamine pathways as slot machines (Ahn et al., 2021). They frame
              investing as a game where trading more equals winning more. Accrue
              deliberately omits gamification to keep your focus on long-term
              goals, not short-term excitement. Your portfolio grows through
              patience, not dopamine.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  REVIEW VIEW (pre-confirmation)                                  */
  /* ================================================================ */

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-primary mb-2">Review Your Order</h1>
      <p className="text-sm text-secondary mb-6">
        Please review all details carefully before confirming. All costs are shown
        below &mdash; nothing new appears after confirmation.
      </p>

      {/* -------------------------------------------------------------- */}
      {/*  Order details (§ 4.1 — EXACT order, all readable HTML text)   */}
      {/* -------------------------------------------------------------- */}
      <div className="rounded-lg border border-border-default bg-surface-raised p-4 mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Order Details</h2>
        <dl className="space-y-3">
          <OrderRow label="1. Action" value={action === "buy" ? "Buy" : "Sell"} />
          <OrderRow label="2. Ticker" value={`${symbol} — ${stockName}`} />
          <OrderRow
            label="3. Quantity"
            value={`${shares.toFixed(4)} shares`}
            mono
          />
          <OrderRow
            label="4. Estimated Price"
            value={
              orderType === "market"
                ? `$${price.toFixed(2)} (market)`
                : `$${limitPriceParam || price.toFixed(2)} (${orderType})`
            }
            mono
          />
          <OrderRow
            label="5. Estimated Total"
            value={`$${estimatedTotal.toFixed(2)}`}
            mono
          />
          <OrderRow
            label="6. Fees"
            value={`Spread: $${fees.spread.toFixed(2)} | Commission: $${fees.commission.toFixed(2)}${action === "sell" ? ` | SEC: $${fees.secFee.toFixed(4)} | TAF: $${fees.tafFee.toFixed(4)}` : ""} | Total: $${fees.total.toFixed(2)}`}
          />
          {action === "sell" && estimatedTaxAmount !== null && (
            <OrderRow
              label="7. Estimated Tax Impact"
              value={
                estimatedTaxAmount > 0
                  ? `~$${estimatedTaxAmount.toFixed(2)} (short-term at ${(taxInfo.shortTermRate * 100).toFixed(0)}%)`
                  : "No taxable gain"
              }
            />
          )}
          {action === "buy" && (
            <OrderRow
              label="7. Estimated Tax Impact"
              value="Purchases are not taxable events"
            />
          )}
          <OrderRow label="8. Account" value={`${accountInfo.name} (${accountInfo.type})`} />
          <OrderRow
            label="9. Order Type"
            value={orderType.charAt(0).toUpperCase() + orderType.slice(1)}
          />
          <OrderRow label="10. Time in Force" value="Day (expires at market close)" />
        </dl>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Pre-Trade Risk Assessment Card (§ 2.4)                        */}
      {/* -------------------------------------------------------------- */}
      <div className="rounded-lg border border-border-default bg-surface-raised p-4 mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">
          Pre-Trade Risk Assessment
        </h2>

        <div className="space-y-4">
          {/* Concentration */}
          <RiskRow
            label="Concentration"
            status={concentrationFlag ? "warning" : "ok"}
            summary={
              concentrationFlag
                ? `After this trade, ${symbol} will be ${newWeight}% of your portfolio, up from ${currentWeight}%. Accrue flags single positions above 20%.`
                : `After this trade, ${symbol} will be ${newWeight}% of your portfolio, up from ${currentWeight}%. Within normal range.`
            }
            expandKey="concentration"
            expandedRisk={expandedRisk}
            toggleRiskExpand={toggleRiskExpand}
            learnWhy="Concentration risk means a single stock's decline can disproportionately affect your entire portfolio. Financial advisors typically recommend keeping any single position below 20% of your total portfolio to limit downside exposure."
          />

          {/* Sector drift */}
          <RiskRow
            label="Sector drift"
            status={
              Math.abs(newSectorWeight - sectorTarget) > 10 ? "warning" : "ok"
            }
            summary={`${sector} rises from ${currentSectorAllocation}% to ${newSectorWeight}%. Your target is ${sectorTarget}%.`}
            expandKey="sector"
            expandedRisk={expandedRisk}
            toggleRiskExpand={toggleRiskExpand}
            learnWhy="Sector drift occurs when one industry becomes overrepresented in your portfolio. This can happen gradually as certain sectors outperform. Rebalancing toward your target allocations helps maintain your intended risk profile."
          />

          {/* Tax */}
          <RiskRow
            label="Tax"
            status={action === "buy" ? "ok" : "info"}
            summary={taxImpactMessage}
            expandKey="tax"
            expandedRisk={expandedRisk}
            toggleRiskExpand={toggleRiskExpand}
            learnWhy="In taxable accounts, selling stocks at a gain triggers capital gains tax. Short-term gains (held < 1 year) are taxed at your income rate. Long-term gains (held > 1 year) have lower rates. Buying does not create a taxable event."
          />

          {/* Goal deviation */}
          <RiskRow
            label="Goal deviation"
            status={mockPortfolio.goal.status === "on-track" ? "ok" : "info"}
            summary={goalMessage}
            expandKey="goal"
            expandedRisk={expandedRisk}
            toggleRiskExpand={toggleRiskExpand}
            learnWhy="Every trade affects your progress toward your financial goal. Buying reduces your cash cushion; selling adds to it but may reduce growth potential. Consider whether this trade moves you closer to or further from your target."
          />
        </div>
      </div>

      {/* -------------------------------------------------------------- */}
      {/*  Decision Journal (§ 4.4 — THESIS CONTRIBUTION)               */}
      {/* -------------------------------------------------------------- */}
      <form onSubmit={handleConfirm} noValidate>
        <div className="rounded-lg border border-border-default bg-surface-raised p-4 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-1">
            Decision Journal
          </h2>
          <p className="text-sm text-secondary mb-4">
            Recording your reasoning now helps you learn from outcomes later.
          </p>

          <label
            htmlFor="journal-input"
            className="block text-sm font-medium text-primary mb-1"
          >
            Why this trade?
            <span className="text-feedback-error ml-1" aria-hidden="true">*</span>
          </label>
          <p id="journal-helper" className="text-xs text-muted mb-2">
            One sentence. Future you will read this.
          </p>
          <textarea
            ref={journalRef}
            id="journal-input"
            aria-required="true"
            aria-invalid={!!journalError}
            aria-describedby={
              [journalError ? "journal-error" : null, "journal-helper", "journal-count"]
                .filter(Boolean)
                .join(" ")
            }
            value={journalEntry}
            onChange={(e) => {
              if (e.target.value.length <= 240) {
                setJournalEntry(e.target.value);
              }
              if (journalError && e.target.value.trim().length >= 12) {
                setJournalError("");
              }
            }}
            placeholder={JOURNAL_PLACEHOLDERS[placeholderIndex]}
            rows={3}
            minLength={12}
            maxLength={240}
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-primary bg-surface-base min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring resize-y ${
              journalError
                ? "border-feedback-error"
                : "border-border-default focus:border-action-primary"
            }`}
          />
          <div className="flex justify-between mt-1">
            {journalError && (
              <p
                id="journal-error"
                role="alert"
                className="text-sm text-feedback-error"
              >
                {journalError}
              </p>
            )}
            <p
              id="journal-count"
              className={`text-xs ml-auto ${
                journalEntry.length < 12
                  ? "text-feedback-error"
                  : "text-muted"
              }`}
              aria-live="polite"
            >
              {journalEntry.length}/240 (minimum 12)
            </p>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/*  Regret Rehearsal (§ 4.5)                                      */}
        {/* -------------------------------------------------------------- */}
        <div className="rounded-lg border border-border-default bg-surface-raised p-4 mb-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-primary">
              Regret Rehearsal
              <span className="text-xs font-normal text-muted ml-2">(optional)</span>
            </h2>
            {!regretSkipped && (
              <button
                type="button"
                onClick={() => {
                  setRegretSkipped(true);
                  setRegretExpanded(false);
                  setRegretEntry("");
                }}
                className="text-sm text-muted underline hover:text-secondary min-h-[44px] px-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Skip reflection
              </button>
            )}
          </div>

          {regretSkipped ? (
            <p className="text-sm text-muted">
              Reflection skipped.{" "}
              <button
                type="button"
                onClick={() => {
                  setRegretSkipped(false);
                  setRegretExpanded(true);
                }}
                className="underline text-action-primary hover:text-action-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              >
                Undo
              </button>
            </p>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setRegretExpanded((prev) => !prev)}
                aria-expanded={regretExpanded}
                aria-controls="regret-content"
                className="text-sm text-secondary mb-2 min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring flex items-center gap-1"
              >
                <span aria-hidden="true">{regretExpanded ? "\u25BC" : "\u25B6"}</span>
                Imagine it&apos;s six months later and this trade failed. What happened?
              </button>

              {regretExpanded && (
                <div id="regret-content">
                  <p id="regret-helper" className="text-xs text-muted mb-2">
                    This is a &ldquo;pre-mortem&rdquo; (Klein, 2007). It makes failure
                    visible before it happens.
                  </p>
                  <textarea
                    id="regret-input"
                    aria-describedby="regret-helper"
                    value={regretEntry}
                    onChange={(e) => setRegretEntry(e.target.value)}
                    placeholder="The stock dropped 30% because..."
                    rows={3}
                    maxLength={500}
                    className="w-full rounded-lg border-2 border-border-default px-4 py-3 text-sm text-primary bg-surface-base min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring resize-y"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* -------------------------------------------------------------- */}
        {/*  Acknowledgment + Confirmation Controls                        */}
        {/* -------------------------------------------------------------- */}
        <div className="rounded-lg border border-border-default bg-surface-raised p-4 mb-6">
          <label className="flex items-start gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 w-5 h-5 accent-action-primary rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
              aria-describedby="ack-description"
            />
            <span id="ack-description" className="text-sm text-primary">
              I understand this places a real order to{" "}
              <strong>{action === "buy" ? "buy" : "sell"}</strong>{" "}
              <strong>{shares.toFixed(4)} shares</strong> of{" "}
              <strong>{symbol}</strong> for an estimated total of{" "}
              <strong>${estimatedTotal.toFixed(2)}</strong>.
            </span>
          </label>
        </div>

        {/* a11y: Cancel and Confirm have EQUAL visual prominence per § 4.1 / A2.3.
            Same footprint, same contrast. Never a tiny Cancel next to a giant Confirm.
            Bachtiar & Mulia (2023): asymmetric prominence generates post-trade regret. */}
        <div className="flex gap-4 mb-4">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 rounded-lg border-2 border-border-strong bg-surface-raised px-6 py-3 text-sm font-semibold text-primary hover:bg-surface-overlay min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition-colors"
          >
            Cancel Order
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            aria-disabled={!canConfirm}
            className={`flex-1 rounded-lg border-2 px-6 py-3 text-sm font-semibold min-h-[48px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition-colors ${
              canConfirm
                ? "border-action-primary bg-surface-raised text-action-primary hover:bg-surface-overlay cursor-pointer"
                : "border-border-default bg-surface-sunken text-muted cursor-not-allowed"
            }`}
          >
            {canConfirm
              ? `Confirm ${action === "buy" ? "Buy" : "Sell"} Order`
              : acknowledged
                ? "Write rationale to confirm"
                : "Check acknowledgment to confirm"}
          </button>
        </div>
        <button
          type="button"
          onClick={handleChangeOrder}
          className="w-full text-center text-sm text-secondary hover:text-primary underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring rounded min-h-[44px] py-2"
        >
          Change Order
        </button>

        {!canConfirm && (
          <p className="mt-2 text-xs text-muted text-center" aria-live="polite">
            {!acknowledged && journalEntry.trim().length < 12
              ? "Check the acknowledgment box and write your trade rationale (12+ characters) to enable confirmation."
              : !acknowledged
                ? "Check the acknowledgment box to enable confirmation."
                : "Write your trade rationale (12+ characters) to enable confirmation."}
          </p>
        )}
      </form>

      {/* Disclosures */}
      <div className="mt-6 space-y-2 text-xs text-muted">
        <p>
          We don&apos;t accept payment for order flow on stock trades. We route
          directly to exchanges.
        </p>
        <p>
          Accrue is cash-only. We don&apos;t offer margin loans.
        </p>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Sub-components                                                     */
/* ================================================================== */

/** Labeled value row for order details — readable HTML, not canvas */
function OrderRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
      <dt className="text-sm text-secondary">{label}</dt>
      <dd
        className={`text-sm text-primary ${mono ? "font-mono font-semibold" : "font-medium"}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Risk assessment row with expandable "Learn why" */
function RiskRow({
  label,
  status,
  summary,
  expandKey,
  expandedRisk,
  toggleRiskExpand,
  learnWhy,
}: {
  label: string;
  status: "ok" | "warning" | "info";
  summary: string;
  expandKey: string;
  expandedRisk: Record<string, boolean>;
  toggleRiskExpand: (key: string) => void;
  learnWhy: string;
}) {
  const isExpanded = expandedRisk[expandKey] ?? false;
  const statusIcon =
    status === "warning" ? "\u26A0" : status === "info" ? "\u24D8" : "\u2713";
  const statusColor =
    status === "warning"
      ? "text-feedback-warning"
      : status === "info"
        ? "text-feedback-info"
        : "text-feedback-success";
  const statusLabel =
    status === "warning" ? "Warning" : status === "info" ? "Information" : "OK";

  return (
    <div className="border-b border-border-default pb-3 last:border-b-0 last:pb-0">
      <div className="flex items-start gap-2">
        <span
          className={`${statusColor} text-sm mt-0.5`}
          /* a11y: aria-label provides the status meaning beyond the icon */
          aria-label={statusLabel}
        >
          {statusIcon}
        </span>
        <div className="flex-1">
          <p className="text-sm font-medium text-primary">{label}</p>
          <p className="text-sm text-secondary mt-0.5">{summary}</p>
          <button
            type="button"
            onClick={() => toggleRiskExpand(expandKey)}
            aria-expanded={isExpanded}
            aria-controls={`risk-detail-${expandKey}`}
            className="text-xs text-action-primary underline mt-1 min-h-[44px] px-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {isExpanded ? "Hide explanation" : "Learn why"}
          </button>
          {isExpanded && (
            <p
              id={`risk-detail-${expandKey}`}
              className="text-xs text-muted mt-1 leading-relaxed"
            >
              {learnWhy}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderReviewPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading order review...</div>}>
      <OrderReviewContent />
    </Suspense>
  );
}
