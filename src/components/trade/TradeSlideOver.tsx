"use client";

import { useEffect, useId, useRef } from "react";
import { TradeFlow } from "./TradeFlow";

export type TradeAction = "buy" | "sell";

export interface TradeSlideOverProps {
  open: boolean;
  symbol: string;
  action: TradeAction;
  onClose: () => void;
}

export function TradeSlideOver({ open, symbol, action, onClose }: TradeSlideOverProps) {
  const titleId = useId();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const invokerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) {
      invokerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => closeBtnRef.current?.focus(), 50);
    } else {
      invokerRef.current?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="trade-backdrop" onClick={onClose} aria-hidden="true" />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="trade-slideover"
      >
        <header className="trade-slideover__head">
          <h2 id={titleId} className="trade-slideover__title">Trade</h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close trade panel"
            className="trade-slideover__close"
          >
            ×
          </button>
        </header>

        <TradeFlow
          symbol={symbol}
          defaultAction={action}
          variant="slideover"
          onCancel={onClose}
          onComplete={onClose}
        />
      </aside>
    </>
  );
}
