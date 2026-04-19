"use client";

import { useRouter } from "next/navigation";
import { use } from "react";
import { TradeFlow } from "@/components/trade/TradeFlow";

export default function TradeSymbolPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const router = useRouter();

  return (
    <main className="trade-page">
      <div className="trade-page__container trade-page__container--wide">
        <nav aria-label="Breadcrumb" className="trade-page__breadcrumb">
          <ol>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/trade">Trade</a></li>
            <li aria-current="page">{symbol.toUpperCase()}</li>
          </ol>
        </nav>

        <TradeFlow
          symbol={symbol.toUpperCase()}
          defaultAction="buy"
          onCancel={() => router.push("/trade")}
          onComplete={() => router.push("/activity")}
          variant="fullpage"
        />
      </div>
    </main>
  );
}
