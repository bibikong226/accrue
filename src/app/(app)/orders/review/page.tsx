"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { holdings, portfolioSummary } from "@/data/mockPortfolio";
import { formatCurrency } from "@/lib/format";
import { announce, announceError } from "@/lib/a11y/useAnnouncer";

/* ─── Pre-trade risk rows ─── */
interface RiskRow {
  label: string;
  level: "low" | "moderate" | "high";
  description: string;
}

function getRiskRows(symbol: string, action: string, total: number): RiskRow[] {
  const holding = holdings.find((h) => h.symbol === symbol);
  const postTradeWeight = holding
    ? ((holding.marketValue + (action === "buy" ? total : -total)) /
        (portfolioSummary.totalValue + (action === "buy" ? total : -total))) *
      100
    : 0;

  return [
    {
      label: "Concentration",
      level: postTradeWeight > 30 ? "high" : postTradeWeight > 20 ? "moderate" : "low",
      description:
        postTradeWeight > 30
          ? `This trade would make ${symbol} ${postTradeWeight.toFixed(1)}% of your portfolio, exceeding the 30% concentration threshold.`
          : `${symbol} would be ${postTradeWeight.toFixed(1)}% of your portfolio after this trade.`,
    },
    {
      label: "Sector drift",
      level: "low",
      description: `Your sector allocation remains within target ranges after this trade.`,
    },
    {
      label: "Tax impact",
      level: action === "sell" && holding && holding.gainLossDollar > 0 ? "moderate" : "low",
      description:
        action === "sell" && holding && holding.gainLossDollar > 0
          ? `Selling ${symbol} would realize a gain of ${formatCurrency(holding.gainLossDollar)}, which may be subject to capital gains tax.`
          : "No significant tax impact expected from this trade.",
    },
    {
      label: "Goal deviation",
      level: "low",
      description: `This trade does not significantly affect your progress toward your ${portfolioSummary.goalLabel}.`,
    },
  ];
}

const riskLevelColors = {
  low: "text-gain",
  moderate: "text-feedback-warning",
  high: "text-loss",
};

const riskLevelLabels = {
  low: "Low risk",
  moderate: "Moderate risk",
  high: "High risk",
};

/* ─── Inner component that uses searchParams ─── */
function ReviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const symbol = searchParams.get("symbol") || "";
  const action = searchParams.get("action") || "buy";
  const amountType = searchParams.get("amountType") || "shares";
  const quantity = parseFloat(searchParams.get("quantity") || "0");
  const orderType = searchParams.get("orderType") || "market";
  const limitPrice = parseFloat(searchParams.get("limitPrice") || "0");
  const stopPrice = parseFloat(searchParams.get("stopPrice") || "0");

  const holding = holdings.find((h) => h.symbol === symbol);
  const price = holding?.currentPrice ?? 0;
  const shares = amountType === "shares" ? quantity : price > 0 ? quantity / price : 0;
  const total = amountType === "shares" ? quantity * price : quantity;
  const fees = 0;
  const estimatedTax = action === "sell" && holding && holding.gainLossDollar > 0
    ? Math.round(holding.gainLossDollar * 0.15 * 100) / 100
    : 0;

  const [journalEntry, setJournalEntry] = useState("");
  const [regretRehearsal, setRegretRehearsal] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [journalError, setJournalError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const alertRef = useRef<HTMLDivElement>(null);

  const riskRows = getRiskRows(symbol, action, total);

  const handleConfirm = () => {
    let hasError = false;

    if (journalEntry.length < 12) {
      setJournalError(
        "Please write at least 12 characters explaining your reasoning for this trade."
      );
      hasError = true;
    } else {
      setJournalError("");
    }

    if (!acknowledged) {
      announceError("You must acknowledge that this places a real order.");
      hasError = true;
    }

    if (hasError) {
      setSubmitted(true);
      return;
    }

    setConfirmed(true);
    announce(
      `Order confirmed. ${action === "buy" ? "Bought" : "Sold"} ${shares.toFixed(4)} shares of ${symbol} for approximately ${formatCurrency(total)}.`,
      "assertive"
    );
  };

  if (!holding) {
    return (
      <div className="text-center py-12">
        <p className="text-secondary mb-4">
          No valid order to review. Please go back and create an order.
        </p>
        <Link
          href="/orders"
          className="inline-flex items-center min-h-[44px] px-6 py-2 rounded-md bg-action-primary text-inverse font-medium hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Go to Trade
        </Link>
      </div>
    );
  }

  /* ─── Post-trade confirmation ─── */
  if (confirmed) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div
          role="alert"
          ref={alertRef}
          tabIndex={-1}
          className="focus:outline-none"
        >
          {/* Static checkmark — no animation, no confetti */}
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full border-4 border-gain mb-6"
            aria-hidden="true"
          >
            <span className="text-3xl text-gain">&#10003;</span>
          </div>
          <h2 className="text-xl font-bold text-primary mb-2">
            Order Confirmed
          </h2>
          <p className="text-secondary mb-4">
            {action === "buy" ? "Bought" : "Sold"}{" "}
            {shares.toFixed(4)} shares of {symbol} for approximately{" "}
            {formatCurrency(total)}.
          </p>

          <details className="text-left mb-6 bg-surface-sunken rounded-lg p-4">
            <summary className="text-sm font-medium text-action-primary cursor-pointer min-h-[44px] flex items-center focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2">
              Why no confetti?
            </summary>
            <p className="text-xs text-secondary mt-2">
              Confetti and celebratory animations can create a gambling-like
              association with investing. Research shows that gamification
              elements encourage more frequent trading, which typically hurts
              long-term returns. Investing is a serious financial decision, and
              Accrue treats it that way.
            </p>
          </details>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center min-h-[44px] px-6 py-2 rounded-md bg-action-primary text-inverse font-medium hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              View Portfolio
            </Link>
            <Link
              href="/history"
              className="inline-flex items-center min-h-[44px] px-6 py-2 rounded-md border border-border-default text-secondary font-medium hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            >
              Transaction History
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">
        Review Your Order
      </h1>

      {/* ─── Order Summary ─── */}
      <section aria-labelledby="order-summary-heading" className="mb-6">
        <h2
          id="order-summary-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Order Details
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Action</dt>
              <dd
                className={`font-semibold ${action === "buy" ? "text-gain" : "text-loss"}`}
              >
                {action === "buy" ? "Buy" : "Sell"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Ticker</dt>
              <dd className="font-semibold text-primary">{symbol}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Quantity</dt>
              <dd className="tabular-nums text-primary">
                {shares.toFixed(4)} shares
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">
                {orderType === "limit"
                  ? "Limit Price"
                  : orderType === "stop"
                    ? "Stop Price"
                    : "Estimated Price"}
              </dt>
              <dd className="tabular-nums text-primary">
                {formatCurrency(
                  orderType === "limit"
                    ? limitPrice
                    : orderType === "stop"
                      ? stopPrice
                      : price
                )}
              </dd>
            </div>
            <div className="flex justify-between border-t border-border-default pt-3">
              <dt className="text-primary font-semibold">Estimated Total</dt>
              <dd className="tabular-nums font-bold text-primary">
                {formatCurrency(total)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Fees</dt>
              <dd className="tabular-nums text-primary">
                {fees === 0 ? "$0.00 (commission-free)" : formatCurrency(fees)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Est. Tax Impact</dt>
              <dd className="tabular-nums text-primary">
                {estimatedTax > 0
                  ? `~${formatCurrency(estimatedTax)} (estimated capital gains)`
                  : "None expected"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Account</dt>
              <dd className="text-primary">Individual Brokerage</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Order Type</dt>
              <dd className="text-primary capitalize">{orderType}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted font-medium">Time in Force</dt>
              <dd className="text-primary">
                {orderType === "market" ? "Immediate" : "Good till canceled (GTC)"}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* ─── Pre-trade Risk Card ─── */}
      <section aria-labelledby="risk-heading" className="mb-6">
        <h2
          id="risk-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Pre-trade Risk Assessment
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <dl className="space-y-4">
            {riskRows.map((row) => (
              <div
                key={row.label}
                className="flex items-start justify-between gap-4"
              >
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-primary">
                    {row.label}
                  </dt>
                  <dd className="text-xs text-secondary mt-0.5">
                    {row.description}
                  </dd>
                </div>
                <dd
                  className={`text-xs font-bold flex-shrink-0 ${riskLevelColors[row.level]}`}
                >
                  {riskLevelLabels[row.level]}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ─── Decision Journal ─── */}
      <section aria-labelledby="journal-heading" className="mb-6">
        <h2
          id="journal-heading"
          className="text-lg font-semibold text-primary mb-3"
        >
          Decision Journal
        </h2>
        <div className="bg-surface-raised border border-border-default rounded-lg p-6">
          <div className="mb-4">
            <label
              htmlFor="journal-entry"
              className="block text-sm font-semibold text-primary mb-1"
            >
              Why are you making this trade? <span aria-hidden="true">*</span>
              <span className="sr-only">(required, minimum 12 characters)</span>
            </label>
            <textarea
              id="journal-entry"
              value={journalEntry}
              onChange={(e) => {
                setJournalEntry(e.target.value);
                if (e.target.value.length >= 12) setJournalError("");
              }}
              aria-describedby={
                journalError ? "journal-error" : "journal-help"
              }
              aria-invalid={journalError ? "true" : undefined}
              rows={3}
              className={`w-full min-h-[88px] px-3 py-2 rounded-md border ${
                journalError
                  ? "border-feedback-error"
                  : "border-border-default"
              } bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
              placeholder="Write your reasoning here..."
            />
            {journalError ? (
              <p
                id="journal-error"
                className="text-sm text-feedback-error mt-1"
                role="alert"
              >
                {journalError}
              </p>
            ) : (
              <p id="journal-help" className="text-xs text-muted mt-1">
                {journalEntry.length}/12 characters minimum.
                Writing your reasoning helps you make more deliberate decisions
                and learn from past trades.
              </p>
            )}
          </div>

          {/* On sell: surface original buy thesis and ask what happened */}
          {action === "sell" && (
            <div className="mb-4 p-3 bg-surface-sunken rounded-md">
              <p className="text-xs font-semibold text-muted uppercase tracking-wide mb-1">
                Your original buy thesis
              </p>
              <p className="text-sm text-secondary italic mb-3">
                &quot;I believe {symbol} has strong long-term growth potential based on fundamentals and sector trends.&quot;
              </p>
              <label
                htmlFor="sell-reflection"
                className="block text-sm font-semibold text-primary mb-1"
              >
                What happened since then? (optional)
              </label>
              <textarea
                id="sell-reflection"
                value={regretRehearsal}
                onChange={(e) => setRegretRehearsal(e.target.value)}
                rows={2}
                className="w-full min-h-[66px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                placeholder="Describe what changed since your original thesis..."
              />
            </div>
          )}

          {/* On buy: What would make this fail? */}
          {action !== "sell" && (
            <div className="mb-4">
              <label
                htmlFor="failure-rehearsal"
                className="block text-sm font-semibold text-primary mb-1"
              >
                What would make this fail? (optional)
              </label>
              <p className="text-xs text-muted mb-2">
                Thinking about conditions that would invalidate your thesis
                helps you make more deliberate decisions.
              </p>
              <textarea
                id="failure-rehearsal"
                value={regretRehearsal}
                onChange={(e) => setRegretRehearsal(e.target.value)}
                rows={2}
                className="w-full min-h-[66px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
                placeholder="This trade would fail if..."
              />
            </div>
          )}
        </div>
      </section>

      {/* ─── Acknowledgment ─── */}
      <div className="mb-6">
        <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 w-5 h-5 rounded border-border-default text-action-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
            aria-describedby="ack-description"
          />
          <span id="ack-description" className="text-sm text-primary">
            I understand this places a real order and I have reviewed all costs
            and risks above.
          </span>
        </label>
        {submitted && !acknowledged && (
          <p className="text-sm text-feedback-error mt-1 ml-8" role="alert">
            You must check this box to confirm your order.
          </p>
        )}
      </div>

      {/* ─── Cancel + Confirm (equal prominence per § 4.1) ─── */}
      {/* Both buttons share identical dimensions, border weight, font, and contrast. */}
      <div className="flex gap-4 mb-6">
        <Link
          href="/orders"
          className="flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-md border-2 border-border-strong text-primary font-semibold text-base hover:bg-surface-sunken focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!acknowledged}
          aria-disabled={!acknowledged}
          className={`flex-1 inline-flex items-center justify-center min-h-[48px] px-6 py-3 rounded-md border-2 font-semibold text-base focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2 ${
            acknowledged
              ? "border-border-strong text-primary hover:bg-surface-sunken"
              : "border-border-default text-muted cursor-not-allowed"
          }`}
        >
          Confirm Order
        </button>
      </div>
    </>
  );
}

/* ─── Page wrapper with Suspense for useSearchParams ─── */
export default function ReviewPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-secondary">
          Loading review...
        </div>
      }
    >
      <ReviewContent />
    </Suspense>
  );
}
