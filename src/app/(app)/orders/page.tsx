"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { holdings } from "@/data/mockPortfolio";
import { formatCurrency } from "@/lib/format";
import { announce, announceError } from "@/lib/a11y/useAnnouncer";

/* ─── Order types with descriptions ─── */
const ORDER_TYPES = [
  {
    value: "market",
    label: "Market Order",
    description:
      "Executes immediately at the best available price. Price may differ from what you see now.",
  },
  {
    value: "limit",
    label: "Limit Order",
    description:
      "Executes only at your specified price or better. May not execute if the price is not reached.",
  },
  {
    value: "stop",
    label: "Stop Order",
    description:
      "Becomes a market order when the stock reaches your specified price. Used to limit losses.",
  },
] as const;

type OrderType = (typeof ORDER_TYPES)[number]["value"];

interface FormErrors {
  symbol?: string;
  quantity?: string;
  limitPrice?: string;
  stopPrice?: string;
}

function OrdersPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  /* State */
  const [symbolInput, setSymbolInput] = useState(
    searchParams.get("symbol") || ""
  );
  const [selectedSymbol, setSelectedSymbol] = useState(
    searchParams.get("symbol") || ""
  );
  const [action, setAction] = useState<"buy" | "sell">(
    (searchParams.get("action") as "buy" | "sell") || "buy"
  );
  const [amountType, setAmountType] = useState<"dollars" | "shares">("shares");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const symbolInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLUListElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);

  /* Filter symbols for autocomplete */
  const filteredSymbols = holdings.filter(
    (h) =>
      h.symbol.toLowerCase().includes(symbolInput.toLowerCase()) ||
      h.name.toLowerCase().includes(symbolInput.toLowerCase())
  );

  /* Selected holding data */
  const selectedHolding = holdings.find((h) => h.symbol === selectedSymbol);

  /* Cost preview */
  const quantityNum = parseFloat(quantity) || 0;
  const estimatedPrice = selectedHolding?.currentPrice ?? 0;
  const estimatedTotal =
    amountType === "shares"
      ? quantityNum * estimatedPrice
      : quantityNum;
  const estimatedShares =
    amountType === "dollars" && estimatedPrice > 0
      ? quantityNum / estimatedPrice
      : quantityNum;

  /* Validation */
  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!selectedSymbol) {
      errs.symbol = "Please select a valid stock symbol.";
    }
    if (!quantity || quantityNum <= 0) {
      errs.quantity = `Please enter a valid ${amountType === "shares" ? "number of shares" : "dollar amount"}.`;
    }
    if (
      action === "sell" &&
      selectedHolding &&
      amountType === "shares" &&
      quantityNum > selectedHolding.shares
    ) {
      errs.quantity = `You only own ${selectedHolding.shares} shares of ${selectedSymbol}.`;
    }
    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      errs.limitPrice = "Please enter a valid limit price.";
    }
    if (orderType === "stop" && (!stopPrice || parseFloat(stopPrice) <= 0)) {
      errs.stopPrice = "Please enter a valid stop price.";
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      announceError(
        `${Object.keys(validationErrors).length} errors found. Please correct them before continuing.`
      );
      if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      }
      return;
    }

    /* Navigate to review page */
    const params = new URLSearchParams({
      symbol: selectedSymbol,
      action,
      amountType,
      quantity,
      orderType,
      ...(orderType === "limit" ? { limitPrice } : {}),
      ...(orderType === "stop" ? { stopPrice } : {}),
    });
    router.push(`/orders/review?${params.toString()}`);
  };

  const selectSymbol = (symbol: string) => {
    setSelectedSymbol(symbol);
    setSymbolInput(symbol);
    setShowDropdown(false);
    setDropdownIndex(-1);
    announce(`Selected ${symbol}`, "polite");
  };

  const handleSymbolKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownIndex((prev) =>
        Math.min(prev + 1, filteredSymbols.length - 1)
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" && dropdownIndex >= 0) {
      e.preventDefault();
      selectSymbol(filteredSymbols[dropdownIndex].symbol);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setDropdownIndex(-1);
    }
  };

  return (
    <>
      <h1 className="text-2xl font-bold text-primary mb-6">Place a Trade</h1>

      {/* Error Summary */}
      {submitted && Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          tabIndex={-1}
          className="mb-6 p-4 border-2 border-feedback-error rounded-lg bg-red-50 focus:outline-none"
        >
          <h2 className="text-sm font-bold text-feedback-error mb-2">
            Please correct the following errors:
          </h2>
          <ul className="list-disc list-inside text-sm text-feedback-error">
            {errors.symbol && <li>{errors.symbol}</li>}
            {errors.quantity && <li>{errors.quantity}</li>}
            {errors.limitPrice && <li>{errors.limitPrice}</li>}
            {errors.stopPrice && <li>{errors.stopPrice}</li>}
          </ul>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-xl"
      >
        {/* Symbol Search */}
        <div className="mb-6 relative">
          <label
            htmlFor="symbol-search"
            className="block text-sm font-semibold text-primary mb-1"
          >
            Stock Symbol <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="symbol-search"
            ref={symbolInputRef}
            type="text"
            role="combobox"
            aria-expanded={showDropdown}
            aria-controls="symbol-listbox"
            aria-autocomplete="list"
            aria-activedescendant={
              dropdownIndex >= 0
                ? `symbol-option-${dropdownIndex}`
                : undefined
            }
            aria-describedby={errors.symbol ? "symbol-error" : undefined}
            aria-invalid={errors.symbol ? "true" : undefined}
            value={symbolInput}
            onChange={(e) => {
              setSymbolInput(e.target.value.toUpperCase());
              setSelectedSymbol("");
              setShowDropdown(e.target.value.length > 0);
              setDropdownIndex(-1);
            }}
            onFocus={() => {
              if (symbolInput.length > 0) setShowDropdown(true);
            }}
            onBlur={() => {
              /* Delay to allow click on dropdown item */
              setTimeout(() => setShowDropdown(false), 200);
            }}
            onKeyDown={handleSymbolKeyDown}
            placeholder="Search by symbol or name..."
            className={`w-full min-h-[44px] px-3 py-2 rounded-md border ${
              errors.symbol
                ? "border-feedback-error"
                : "border-border-default"
            } bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
          />
          {errors.symbol && (
            <p
              id="symbol-error"
              className="text-sm text-feedback-error mt-1"
              role="alert"
            >
              {errors.symbol}
            </p>
          )}

          {/* Dropdown */}
          {showDropdown && filteredSymbols.length > 0 && (
            <ul
              id="symbol-listbox"
              ref={dropdownRef}
              role="listbox"
              aria-label="Stock symbol suggestions"
              className="absolute z-20 w-full mt-1 bg-surface-raised border border-border-default rounded-md shadow-lg max-h-48 overflow-y-auto"
            >
              {filteredSymbols.map((h, i) => (
                <li
                  key={h.symbol}
                  id={`symbol-option-${i}`}
                  role="option"
                  aria-selected={dropdownIndex === i}
                  className={`px-3 py-2 min-h-[44px] flex items-center justify-between cursor-pointer ${
                    dropdownIndex === i
                      ? "bg-surface-sunken"
                      : "hover:bg-surface-sunken"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSymbol(h.symbol);
                  }}
                >
                  <span>
                    <span className="font-semibold text-primary">
                      {h.symbol}
                    </span>
                    <span className="text-xs text-muted ml-2">{h.name}</span>
                  </span>
                  <span className="text-sm tabular-nums text-secondary">
                    {formatCurrency(h.currentPrice)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div aria-live="polite" className="sr-only">
            {showDropdown && filteredSymbols.length > 0
              ? `${filteredSymbols.length} suggestions available`
              : showDropdown && symbolInput.length > 0
                ? "No matching symbols found"
                : ""}
          </div>
        </div>

        {/* Buy / Sell Radio */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-semibold text-primary mb-2">
            Action <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </legend>
          <div className="flex gap-4">
            {(["buy", "sell"] as const).map((a) => (
              <label
                key={a}
                className={`flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-md border cursor-pointer font-medium text-sm focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                  action === a
                    ? a === "buy"
                      ? "border-action-primary bg-green-50 text-action-primary"
                      : "border-action-destructive bg-red-50 text-action-destructive"
                    : "border-border-default text-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={a}
                  checked={action === a}
                  onChange={() => setAction(a)}
                  className="sr-only"
                />
                {a === "buy" ? "Buy" : "Sell"}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Dollars / Shares Toggle */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-semibold text-primary mb-2">
            Amount Type
          </legend>
          <div className="flex gap-4">
            {(["shares", "dollars"] as const).map((t) => (
              <label
                key={t}
                className={`flex items-center min-h-[44px] min-w-[44px] px-4 py-2 rounded-md border cursor-pointer font-medium text-sm focus-within:outline-3 focus-within:outline-focus-ring focus-within:outline-offset-2 ${
                  amountType === t
                    ? "border-action-primary bg-green-50 text-action-primary"
                    : "border-border-default text-secondary"
                }`}
              >
                <input
                  type="radio"
                  name="amountType"
                  value={t}
                  checked={amountType === t}
                  onChange={() => setAmountType(t)}
                  className="sr-only"
                />
                {t === "shares" ? "Shares" : "Dollars"}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Quantity */}
        <div className="mb-6">
          <label
            htmlFor="quantity"
            className="block text-sm font-semibold text-primary mb-1"
          >
            Quantity ({amountType === "shares" ? "shares" : "USD"}){" "}
            <span aria-hidden="true">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <input
            id="quantity"
            type="number"
            min="0"
            step={amountType === "shares" ? "0.0001" : "0.01"}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
            aria-invalid={errors.quantity ? "true" : undefined}
            placeholder={
              amountType === "shares" ? "Number of shares" : "Dollar amount"
            }
            className={`w-full min-h-[44px] px-3 py-2 rounded-md border ${
              errors.quantity
                ? "border-feedback-error"
                : "border-border-default"
            } bg-surface-base text-primary tabular-nums focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
          />
          {errors.quantity && (
            <p
              id="quantity-error"
              className="text-sm text-feedback-error mt-1"
              role="alert"
            >
              {errors.quantity}
            </p>
          )}
        </div>

        {/* Order Type */}
        <div className="mb-6">
          <label
            htmlFor="order-type"
            className="block text-sm font-semibold text-primary mb-1"
          >
            Order Type
          </label>
          <p className="text-sm text-muted mb-2">
            Not sure? Market orders work for most first-time buys on liquid stocks.
          </p>
          <select
            id="order-type"
            value={orderType}
            onChange={(e) => setOrderType(e.target.value as OrderType)}
            className="w-full min-h-[44px] px-3 py-2 rounded-md border border-border-default bg-surface-base text-primary focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
          >
            {ORDER_TYPES.map((ot) => (
              <option key={ot.value} value={ot.value}>
                {ot.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted mt-1">
            {ORDER_TYPES.find((ot) => ot.value === orderType)?.description}
          </p>
        </div>

        {/* Limit Price (conditional) */}
        {orderType === "limit" && (
          <div className="mb-6">
            <label
              htmlFor="limit-price"
              className="block text-sm font-semibold text-primary mb-1"
            >
              Limit Price (USD) <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="limit-price"
              type="number"
              min="0"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              aria-describedby={
                errors.limitPrice ? "limit-price-error" : undefined
              }
              aria-invalid={errors.limitPrice ? "true" : undefined}
              className={`w-full min-h-[44px] px-3 py-2 rounded-md border ${
                errors.limitPrice
                  ? "border-feedback-error"
                  : "border-border-default"
              } bg-surface-base text-primary tabular-nums focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
            />
            {errors.limitPrice && (
              <p
                id="limit-price-error"
                className="text-sm text-feedback-error mt-1"
                role="alert"
              >
                {errors.limitPrice}
              </p>
            )}
          </div>
        )}

        {/* Stop Price (conditional) */}
        {orderType === "stop" && (
          <div className="mb-6">
            <label
              htmlFor="stop-price"
              className="block text-sm font-semibold text-primary mb-1"
            >
              Stop Price (USD) <span aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </label>
            <input
              id="stop-price"
              type="number"
              min="0"
              step="0.01"
              value={stopPrice}
              onChange={(e) => setStopPrice(e.target.value)}
              aria-describedby={
                errors.stopPrice ? "stop-price-error" : undefined
              }
              aria-invalid={errors.stopPrice ? "true" : undefined}
              className={`w-full min-h-[44px] px-3 py-2 rounded-md border ${
                errors.stopPrice
                  ? "border-feedback-error"
                  : "border-border-default"
              } bg-surface-base text-primary tabular-nums focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2`}
            />
            {errors.stopPrice && (
              <p
                id="stop-price-error"
                className="text-sm text-feedback-error mt-1"
                role="alert"
              >
                {errors.stopPrice}
              </p>
            )}
          </div>
        )}

        {/* Cost Preview */}
        {selectedHolding && quantityNum > 0 && (
          <div className="mb-6 bg-surface-sunken rounded-lg p-4">
            <h2 className="text-sm font-semibold text-primary mb-2">
              Estimated Cost
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Price per share</dt>
                <dd className="tabular-nums text-primary">
                  {formatCurrency(estimatedPrice)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">
                  {amountType === "shares" ? "Shares" : "Est. shares"}
                </dt>
                <dd className="tabular-nums text-primary">
                  {amountType === "shares"
                    ? quantityNum
                    : estimatedShares.toFixed(4)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-border-default pt-2 font-semibold">
                <dt className="text-primary">Estimated total</dt>
                <dd className="tabular-nums text-primary">
                  {formatCurrency(estimatedTotal)}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {/* PFOF Disclosure */}
        <div className="mb-6 p-3 bg-surface-sunken rounded-md text-xs text-muted">
          <p>
            <strong>Payment for Order Flow (PFOF):</strong> Accrue may receive
            compensation from market makers for routing your order. This means
            your execution price may not always be the best available. All fees
            will be shown on the review screen.
          </p>
        </div>

        {/* Margin Disclaimer */}
        <div className="mb-6 p-3 bg-surface-sunken rounded-md text-xs text-muted">
          <p>
            <strong>Margin trading is not available.</strong> All trades are
            executed with settled cash in your account. You cannot lose more than
            you invest.
          </p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full min-h-[44px] px-6 py-3 rounded-md bg-action-primary text-inverse font-semibold text-base hover:bg-action-primary-hover focus-visible:outline-3 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
        >
          Review Order
        </button>
      </form>
    </>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading trade form...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
