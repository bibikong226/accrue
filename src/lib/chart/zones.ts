/**
 * Semantic zone narration functions for chart accessibility.
 *
 * § 10 of the Chart Rebuild Spec.
 * All functions use `value` (not `close`) to match the DataPoint type.
 */

export interface ZonePoint {
  date: string;
  value: number;
}

/**
 * Narrate the overall trend of the price series.
 */
export function narrateTrend(points: ZonePoint[]): string {
  if (points.length < 2) return "Not enough data to determine trend.";

  const first = points[0];
  const last = points[points.length - 1];
  const delta = last.value - first.value;
  const deltaPct = (delta / first.value) * 100;

  const direction =
    deltaPct > 1 ? "upward" : deltaPct < -1 ? "downward" : "sideways";

  return (
    `Overall trend: ${direction}, ${Math.abs(deltaPct).toFixed(1)}% change ` +
    `from $${first.value.toFixed(2)} to $${last.value.toFixed(2)}.`
  );
}

/**
 * Narrate the high and low extrema of the price series.
 */
export function narrateExtrema(points: ZonePoint[]): string {
  if (points.length < 2) return "Not enough data to determine extrema.";

  const high = points.reduce((a, b) => (a.value > b.value ? a : b));
  const low = points.reduce((a, b) => (a.value < b.value ? a : b));
  const range = high.value - low.value;

  return (
    `Peak: $${high.value.toFixed(2)} on ${high.date}. ` +
    `Low: $${low.value.toFixed(2)} on ${low.date}. ` +
    `Range: $${range.toFixed(2)}.`
  );
}

/**
 * Narrate the volatility of the price series.
 */
export function narrateVolatility(points: ZonePoint[]): string {
  if (points.length < 3) return "Not enough data to measure volatility.";

  const changes: number[] = [];
  for (let i = 1; i < points.length; i++) {
    changes.push(
      Math.abs((points[i].value - points[i - 1].value) / points[i - 1].value) *
        100
    );
  }
  const avgChange =
    changes.length > 0
      ? changes.reduce((a, b) => a + b, 0) / changes.length
      : 0;

  const maxChange = Math.max(...changes);
  const volLabel =
    avgChange < 0.5 ? "low" : avgChange < 1.5 ? "moderate" : "high";

  return (
    `Volatility is ${volLabel}. ` +
    `Average daily move: ${avgChange.toFixed(2)}%. ` +
    `Largest single move: ${maxChange.toFixed(2)}%.`
  );
}

/**
 * Narrate notable events during the price series period.
 * Since we only have price data (no event metadata), we identify
 * significant price movements as proxy events.
 */
export function narrateEvents(
  points: ZonePoint[],
  ticker?: string
): string {
  if (points.length < 3)
    return "Not enough data to identify notable events.";

  /* Find the largest single-day move */
  let maxMoveIdx = 1;
  let maxMoveAbs = 0;
  for (let i = 1; i < points.length; i++) {
    const move = Math.abs(points[i].value - points[i - 1].value);
    if (move > maxMoveAbs) {
      maxMoveAbs = move;
      maxMoveIdx = i;
    }
  }

  const movePoint = points[maxMoveIdx];
  const prevPoint = points[maxMoveIdx - 1];
  const movePct =
    ((movePoint.value - prevPoint.value) / prevPoint.value) * 100;
  const moveDir = movePct > 0 ? "up" : "down";

  const tickerLabel = ticker || "The price";

  return (
    `The largest single-period move was on ${movePoint.date}, ` +
    `when ${tickerLabel} moved ${moveDir} ${Math.abs(movePct).toFixed(2)}% ` +
    `from $${prevPoint.value.toFixed(2)} to $${movePoint.value.toFixed(2)}. ` +
    `Check the AI analysis below for events that may have influenced ` +
    `${ticker || "the price"} during this period.`
  );
}
