"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  type KeyboardEvent,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import {
  searchStocks,
  getStockBySymbol,
  calculateFees,
  type StockQuote,
} from "@/data/mockPortfolio";

/* ------------------------------------------------------------------ */
/*  Order type descriptions (novice-friendly per spec § 4)            */
/* ------------------------------------------------------------------ */

const ORDER_TYPES = [
  {
    value: "market",
    label: "Market",
    description: "Executes immediately at current market price",
  },
  {
    value: "limit",
    label: "Limit",
    description: "Executes only if price reaches your target",
  },
  {
    value: "stop",
    label: "Stop",
    description: "Sells automatically if price falls to your stop level",
  },
] as const;

type OrderType = (typeof ORDER_TYPES)[number]["value"];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OrderEntryPage() {
  const router = useRouter();

  /* ---- form state ---- */
  const [symbolQuery, setSymbolQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<StockQuote | null>(null);
  const [action, setAction] = useState<"buy" | "sell">("buy");
  const [inputMode, setInputMode] = useState<"shares" | "dollars">("shares");
  const [quantity, setQuantity] = useState("");
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [limitPrice, setLimitPrice] = useState("");

  /* ---- search state ---- */
  const [searchResults, setSearchResults] = useState<StockQuote[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);

  /* ---- validation state ---- */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  /* ---- refs ---- */
  const symbolInputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const selectionAnnouncerRef = useRef<HTMLDivElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const firstErrorFieldRef = useRef<HTMLElement | null>(null);

  /* ---- derived values ---- */
  const price = selectedStock?.currentPrice ?? 0;

  const numericQuantity = useMemo(() => {
    const raw = parseFloat(quantity);
    if (isNaN(raw) || raw <= 0) return 0;
    if (inputMode === "dollars" && price > 0) {
      return raw / price;
    }
    return raw;
  }, [quantity, inputMode, price]);

  const sharesDisplay = useMemo(() => {
    if (inputMode === "dollars" && price > 0 && numericQuantity > 0) {
      return numericQuantity.toFixed(4);
    }
    return null;
  }, [inputMode, price, numericQuantity]);

  const dollarsDisplay = useMemo(() => {
    if (inputMode === "shares" && price > 0 && numericQuantity > 0) {
      return (numericQuantity * price).toFixed(2);
    }
    return null;
  }, [inputMode, price, numericQuantity]);

  const fees = useMemo(() => {
    if (!selectedStock || numericQuantity <= 0) {
      return { spread: 0, commission: 0, secFee: 0, tafFee: 0, total: 0 };
    }
    return calculateFees(action, numericQuantity, price);
  }, [action, numericQuantity, price, selectedStock]);

  const estimatedTotal = useMemo(() => {
    if (numericQuantity <= 0 || price <= 0) return 0;
    const subtotal = numericQuantity * price;
    return action === "buy" ? subtotal + fees.total : subtotal - fees.total;
  }, [numericQuantity, price, fees.total, action]);

  /* ---- symbol search ---- */
  const handleSymbolChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSymbolQuery(q);
    setSelectedStock(null);
    if (q.trim().length > 0) {
      const results = searchStocks(q);
      setSearchResults(results);
      setIsDropdownOpen(results.length > 0);
      setActiveResultIndex(-1);
    } else {
      setSearchResults([]);
      setIsDropdownOpen(false);
    }
    if (submitted) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.symbol;
        return next;
      });
    }
  }, [submitted]);

  const selectStock = useCallback((stock: StockQuote) => {
    setSelectedStock(stock);
    setSymbolQuery(stock.symbol);
    setSearchResults([]);
    setIsDropdownOpen(false);
    setActiveResultIndex(-1);
    /* a11y: announce selection to screen readers via polite live region */
    if (selectionAnnouncerRef.current) {
      selectionAnnouncerRef.current.textContent = `${stock.symbol}, ${stock.name} selected.`;
    }
  }, []);

  const handleSymbolKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (!isDropdownOpen || searchResults.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveResultIndex((prev) =>
            prev < searchResults.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveResultIndex((prev) =>
            prev > 0 ? prev - 1 : searchResults.length - 1,
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeResultIndex >= 0 && activeResultIndex < searchResults.length) {
            selectStock(searchResults[activeResultIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsDropdownOpen(false);
          setActiveResultIndex(-1);
          break;
      }
    },
    [isDropdownOpen, searchResults, activeResultIndex, selectStock],
  );

  /* ---- close dropdown on outside click ---- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        symbolInputRef.current &&
        !symbolInputRef.current.contains(target) &&
        listboxRef.current &&
        !listboxRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ---- scroll active option into view ---- */
  useEffect(() => {
    if (activeResultIndex >= 0 && listboxRef.current) {
      const option = listboxRef.current.children[activeResultIndex] as HTMLElement;
      option?.scrollIntoView({ block: "nearest" });
    }
  }, [activeResultIndex]);

  /* ---- form validation ---- */
  const validate = useCallback((): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!selectedStock) {
      errs.symbol = "Ticker is required";
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      errs.quantity = `Quantity (${inputMode}) is required and must be greater than zero`;
    }
    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      errs.limitPrice = "Limit price is required for limit orders";
    }
    if (orderType === "stop" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      errs.limitPrice = "Stop price is required for stop orders";
    }
    return errs;
  }, [selectedStock, quantity, inputMode, orderType, limitPrice]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setSubmitted(true);

      const errs = validate();
      setErrors(errs);

      if (Object.keys(errs).length > 0) {
        /* a11y: Focus the first field with an error per § 2.3 */
        const firstKey = Object.keys(errs)[0];
        const fieldMap: Record<string, string> = {
          symbol: "symbol-input",
          quantity: "quantity-input",
          limitPrice: "limit-price-input",
        };
        const el = document.getElementById(fieldMap[firstKey] ?? "");
        el?.focus();
        return;
      }

      /* Navigate to review page with order data as URL search params */
      const params = new URLSearchParams({
        symbol: selectedStock!.symbol,
        action,
        inputMode,
        quantity,
        orderType,
        ...(orderType !== "market" && limitPrice ? { limitPrice } : {}),
      });

      router.push(`/orders/review?${params.toString()}`);
    },
    [validate, selectedStock, action, inputMode, quantity, orderType, limitPrice, router],
  );

  /* ---- clear field-level error on change ---- */
  const clearError = useCallback(
    (field: string) => {
      if (submitted) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [submitted],
  );

  /* ---- active descendant id ---- */
  const activeDescendantId =
    activeResultIndex >= 0 ? `symbol-option-${activeResultIndex}` : undefined;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold text-primary mb-6">Place a Trade</h1>

      {/* Error summary — rendered when form has been submitted with errors */}
      {submitted && Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          /* a11y: role="alert" causes screen readers to announce the error summary immediately */
          role="alert"
          className="mb-6 rounded-lg border-2 border-feedback-error bg-surface-raised p-4"
        >
          <p className="font-semibold text-feedback-error mb-2">
            Please fix the following errors:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key} className="text-feedback-error text-sm">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* -------------------------------------------------------- */}
        {/*  Symbol search                                           */}
        {/* -------------------------------------------------------- */}
        <div className="mb-6 relative">
          <label
            htmlFor="symbol-input"
            className="block text-sm font-medium text-primary mb-1"
          >
            Ticker symbol
            <span className="text-feedback-error ml-1" aria-hidden="true">*</span>
          </label>
          <input
            ref={symbolInputRef}
            id="symbol-input"
            type="text"
            /* a11y: combobox role for autocomplete with listbox popup */
            role="combobox"
            aria-required="true"
            aria-expanded={isDropdownOpen}
            aria-controls="symbol-listbox"
            aria-activedescendant={activeDescendantId}
            aria-autocomplete="list"
            aria-invalid={!!errors.symbol}
            aria-describedby={errors.symbol ? "symbol-error" : undefined}
            autoComplete="off"
            value={symbolQuery}
            onChange={handleSymbolChange}
            onKeyDown={handleSymbolKeyDown}
            onFocus={() => {
              if (searchResults.length > 0 && !selectedStock) {
                setIsDropdownOpen(true);
              }
            }}
            placeholder="Search by ticker or company name"
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm text-primary bg-surface-base min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              errors.symbol
                ? "border-feedback-error"
                : "border-border-default focus:border-action-primary"
            }`}
          />
          {errors.symbol && (
            <p
              id="symbol-error"
              /* a11y: role="alert" for inline field errors per § 2.3 */
              role="alert"
              className="mt-1 text-sm text-feedback-error"
            >
              {errors.symbol}
            </p>
          )}

          {/* a11y: Live region announces search results count and selection */}
          <div
            ref={selectionAnnouncerRef}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          />

          {/* Search results dropdown */}
          {isDropdownOpen && searchResults.length > 0 && (
            <ul
              ref={listboxRef}
              id="symbol-listbox"
              role="listbox"
              aria-label="Stock search results"
              className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border-2 border-border-default bg-surface-overlay shadow-lg"
            >
              {searchResults.map((stock, idx) => (
                <li
                  key={stock.symbol}
                  id={`symbol-option-${idx}`}
                  role="option"
                  /* a11y: aria-selected marks the visually focused option for screen readers */
                  aria-selected={idx === activeResultIndex}
                  onClick={() => selectStock(stock)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer min-h-[44px] ${
                    idx === activeResultIndex
                      ? "bg-surface-raised text-primary"
                      : "text-primary hover:bg-surface-raised"
                  }`}
                >
                  <span>
                    <span className="font-semibold font-mono">{stock.symbol}</span>
                    <span className="ml-2 text-sm text-secondary">{stock.name}</span>
                  </span>
                  <span className="text-sm font-mono text-secondary">
                    ${stock.currentPrice.toFixed(2)}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* a11y: announce result count for screen readers */}
          {isDropdownOpen && (
            <div aria-live="polite" className="sr-only">
              {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} available. Use arrow keys to navigate.
            </div>
          )}
        </div>

        {/* Selected stock info */}
        {selectedStock && (
          <div className="mb-6 rounded-lg border border-border-default bg-surface-raised p-4">
            <p className="text-sm text-primary">
              <span className="font-semibold font-mono">{selectedStock.symbol}</span>
              {" "}&mdash; {selectedStock.name}
            </p>
            <p className="text-sm text-secondary mt-1">
              Current price:{" "}
              <span className="font-mono font-semibold">
                ${selectedStock.currentPrice.toFixed(2)}
              </span>
              {" "}
              <span
                className={
                  selectedStock.todayChangePercent >= 0
                    ? "text-gain"
                    : "text-loss"
                }
              >
                {selectedStock.todayChangePercent >= 0 ? "+" : ""}
                {selectedStock.todayChangePercent.toFixed(2)}%
                {selectedStock.todayChangePercent >= 0 ? " up" : " down"} today
              </span>
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Buy / Sell selector                                     */}
        {/* -------------------------------------------------------- */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-primary mb-2">
            Action
            <span className="text-feedback-error ml-1" aria-hidden="true">*</span>
          </legend>
          <div className="flex gap-4">
            {(["buy", "sell"] as const).map((a) => (
              <label
                key={a}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border-2 cursor-pointer min-h-[44px] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring ${
                  action === a
                    ? "border-action-primary bg-surface-raised"
                    : "border-border-default bg-surface-base hover:bg-surface-raised"
                }`}
              >
                <input
                  type="radio"
                  name="action"
                  value={a}
                  checked={action === a}
                  onChange={() => setAction(a)}
                  /* a11y: aria-label provides full context: "Action: Buy" not just "Buy" */
                  aria-label={`Action: ${a === "buy" ? "Buy" : "Sell"}`}
                  className="w-5 h-5 accent-action-primary"
                />
                <span className="text-sm font-medium text-primary capitalize">
                  {a}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* -------------------------------------------------------- */}
        {/*  Dollars / Shares toggle                                 */}
        {/* -------------------------------------------------------- */}
        <fieldset className="mb-6">
          <legend className="block text-sm font-medium text-primary mb-2">
            Order in
          </legend>
          <div
            role="radiogroup"
            aria-label="Order input mode"
            className="inline-flex rounded-lg border-2 border-border-default overflow-hidden"
          >
            {(["shares", "dollars"] as const).map((mode) => (
              <label
                key={mode}
                className={`px-4 py-2 text-sm font-medium cursor-pointer min-h-[44px] flex items-center transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus-ring ${
                  inputMode === mode
                    ? "bg-action-primary text-inverse"
                    : "bg-surface-base text-primary hover:bg-surface-raised"
                }`}
              >
                <input
                  type="radio"
                  name="inputMode"
                  value={mode}
                  checked={inputMode === mode}
                  onChange={() => {
                    setInputMode(mode);
                    setQuantity("");
                  }}
                  className="sr-only"
                />
                <span className="capitalize">{mode}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* -------------------------------------------------------- */}
        {/*  Quantity field                                           */}
        {/* -------------------------------------------------------- */}
        <div className="mb-6">
          <label
            htmlFor="quantity-input"
            className="block text-sm font-medium text-primary mb-1"
          >
            Quantity ({inputMode})
            <span className="text-feedback-error ml-1" aria-hidden="true">*</span>
          </label>
          <input
            id="quantity-input"
            type="number"
            min="0"
            step={inputMode === "dollars" ? "0.01" : "0.0001"}
            aria-required="true"
            aria-invalid={!!errors.quantity}
            aria-describedby={
              [
                errors.quantity ? "quantity-error" : null,
                "quantity-preview",
              ]
                .filter(Boolean)
                .join(" ") || undefined
            }
            value={quantity}
            onChange={(e) => {
              setQuantity(e.target.value);
              clearError("quantity");
            }}
            placeholder={inputMode === "dollars" ? "e.g. 500.00" : "e.g. 10"}
            className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-mono text-primary bg-surface-base min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
              errors.quantity
                ? "border-feedback-error"
                : "border-border-default focus:border-action-primary"
            }`}
          />
          {errors.quantity && (
            <p
              id="quantity-error"
              role="alert"
              className="mt-1 text-sm text-feedback-error"
            >
              {errors.quantity}
            </p>
          )}

          {/* Live preview: conversion hint */}
          <p
            id="quantity-preview"
            aria-live="polite"
            className="mt-1 text-sm text-secondary"
          >
            {inputMode === "dollars" && sharesDisplay && selectedStock && (
              <>
                &asymp; {sharesDisplay} shares at ${selectedStock.currentPrice.toFixed(2)} (estimated)
              </>
            )}
            {inputMode === "shares" && dollarsDisplay && selectedStock && (
              <>
                &asymp; ${dollarsDisplay} at ${selectedStock.currentPrice.toFixed(2)} (estimated)
              </>
            )}
          </p>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  Order type                                              */}
        {/* -------------------------------------------------------- */}
        <div className="mb-6">
          <label
            htmlFor="order-type-select"
            className="block text-sm font-medium text-primary mb-1"
          >
            Order type
            <span className="text-feedback-error ml-1" aria-hidden="true">*</span>
          </label>
          <p id="order-type-helper" className="text-sm text-secondary mb-2">
            Not sure? Market orders work for most first-time buys.
          </p>
          <select
            id="order-type-select"
            aria-required="true"
            aria-describedby="order-type-helper order-type-description"
            value={orderType}
            onChange={(e) => {
              setOrderType(e.target.value as OrderType);
              if (e.target.value === "market") {
                setLimitPrice("");
              }
            }}
            className="w-full rounded-lg border-2 border-border-default px-4 py-3 text-sm text-primary bg-surface-base min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
          >
            {ORDER_TYPES.map((ot) => (
              <option key={ot.value} value={ot.value}>
                {ot.label}
              </option>
            ))}
          </select>
          <p id="order-type-description" className="mt-1 text-sm text-secondary">
            {ORDER_TYPES.find((ot) => ot.value === orderType)?.description}
          </p>
        </div>

        {/* Limit / Stop price field (shown only for non-market orders) */}
        {orderType !== "market" && (
          <div className="mb-6">
            <label
              htmlFor="limit-price-input"
              className="block text-sm font-medium text-primary mb-1"
            >
              {orderType === "limit" ? "Limit price ($)" : "Stop price ($)"}
              <span className="text-feedback-error ml-1" aria-hidden="true">*</span>
            </label>
            <input
              id="limit-price-input"
              type="number"
              min="0"
              step="0.01"
              aria-required="true"
              aria-invalid={!!errors.limitPrice}
              aria-describedby={errors.limitPrice ? "limit-price-error" : undefined}
              value={limitPrice}
              onChange={(e) => {
                setLimitPrice(e.target.value);
                clearError("limitPrice");
              }}
              placeholder="e.g. 150.00"
              className={`w-full rounded-lg border-2 px-4 py-3 text-sm font-mono text-primary bg-surface-base min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${
                errors.limitPrice
                  ? "border-feedback-error"
                  : "border-border-default focus:border-action-primary"
              }`}
            />
            {errors.limitPrice && (
              <p
                id="limit-price-error"
                role="alert"
                className="mt-1 text-sm text-feedback-error"
              >
                {errors.limitPrice}
              </p>
            )}
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Estimated cost preview                                  */}
        {/* -------------------------------------------------------- */}
        {selectedStock && numericQuantity > 0 && (
          <div
            className="mb-6 rounded-lg border border-border-default bg-surface-raised p-4"
            aria-live="polite"
          >
            <p className="text-sm font-medium text-primary mb-2">
              Estimated cost breakdown
            </p>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-secondary">
                  {numericQuantity.toFixed(4)} shares &times; ${price.toFixed(2)}
                </dt>
                <dd className="font-mono font-semibold text-primary">
                  ${(numericQuantity * price).toFixed(2)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Estimated spread</dt>
                <dd className="font-mono text-primary">${fees.spread.toFixed(2)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-secondary">Commission</dt>
                <dd className="font-mono text-primary">${fees.commission.toFixed(2)}</dd>
              </div>
              {action === "sell" && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-secondary">SEC fee</dt>
                    <dd className="font-mono text-primary">${fees.secFee.toFixed(4)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary">TAF fee</dt>
                    <dd className="font-mono text-primary">${fees.tafFee.toFixed(4)}</dd>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border-default pt-2 mt-2">
                <dt className="font-medium text-primary">
                  Estimated all-in {action === "buy" ? "cost" : "proceeds"}
                </dt>
                <dd className="font-mono font-semibold text-primary">
                  ${estimatedTotal.toFixed(2)}
                </dd>
              </div>
            </dl>
            <p className="mt-2 text-xs text-muted">
              Estimated all-in cost: ${fees.spread.toFixed(2)} spread + ${fees.commission.toFixed(2)} commission{action === "sell" ? ` + $${(fees.secFee + fees.tafFee).toFixed(4)} regulatory fees` : ""} = ${fees.total.toFixed(2)}
            </p>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/*  Disclosures                                             */}
        {/* -------------------------------------------------------- */}
        <div className="mb-6 space-y-2 text-xs text-muted">
          <p>
            We don&apos;t accept payment for order flow on stock trades. We route
            directly to exchanges.
          </p>
          <p>
            Accrue is cash-only. We don&apos;t offer margin loans.
          </p>
        </div>

        {/* -------------------------------------------------------- */}
        {/*  Submit                                                  */}
        {/* -------------------------------------------------------- */}
        <button
          type="submit"
          className="w-full rounded-lg bg-action-primary px-6 py-3 text-sm font-semibold text-inverse hover:bg-action-primary-hover min-h-[44px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring transition-colors"
        >
          Review Order
        </button>
      </form>
    </div>
  );
}
