"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { TradeSlideOver, TradeAction } from "./TradeSlideOver";

interface TradeCtx {
  openTrade: (symbol: string, action: TradeAction) => void;
}

const Ctx = createContext<TradeCtx | null>(null);

export function TradeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; symbol: string; action: TradeAction }>({
    open: false, symbol: "", action: "buy",
  });

  return (
    <Ctx.Provider value={{
      openTrade: (symbol, action) => setState({ open: true, symbol, action }),
    }}>
      {children}
      <TradeSlideOver
        open={state.open}
        symbol={state.symbol}
        action={state.action}
        onClose={() => setState(s => ({ ...s, open: false }))}
      />
    </Ctx.Provider>
  );
}

export function useTrade(): TradeCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTrade must be used inside <TradeProvider>");
  return ctx;
}
