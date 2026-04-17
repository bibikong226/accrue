export interface NarrationInput {
  ticker: string;
  timeframe: string;
  points: Array<{ date: string; value: number }>;
}

export function buildChartNarration(input: NarrationInput): string {
  const { ticker, timeframe, points } = input;
  if (points.length < 2) return `Not enough data to summarize ${ticker} over this period.`;

  const first = points[0];
  const last = points[points.length - 1];
  const high = points.reduce((a, b) => (a.value > b.value ? a : b));
  const low = points.reduce((a, b) => (a.value < b.value ? a : b));
  const delta = last.value - first.value;
  const deltaPct = (delta / first.value) * 100;

  const direction = Math.abs(deltaPct) < 1
    ? "moved sideways"
    : deltaPct > 0
      ? `rose ${deltaPct.toFixed(1)}% to $${last.value.toFixed(2)}`
      : `fell ${Math.abs(deltaPct).toFixed(1)}% to $${last.value.toFixed(2)}`;

  const volatility = classifyVolatility(points);

  return `This is ${ticker} over the last ${timeframe}. It started near $${first.value.toFixed(2)}, ${direction} by ${last.date}, with a peak of $${high.value.toFixed(2)} on ${high.date} and a low of $${low.value.toFixed(2)} on ${low.date}. Overall direction: ${deltaPct > 1 ? "up" : deltaPct < -1 ? "down" : "sideways"}. Volatility: ${volatility}.`;
}

function classifyVolatility(points: Array<{ value: number }>): string {
  if (points.length < 3) return "insufficient data";
  const changes = [];
  for (let i = 1; i < points.length; i++) {
    changes.push(Math.abs((points[i].value - points[i-1].value) / points[i-1].value) * 100);
  }
  const avg = changes.reduce((a, b) => a + b, 0) / changes.length;
  if (avg < 0.5) return "low";
  if (avg < 1.5) return "moderate";
  return "high";
}
