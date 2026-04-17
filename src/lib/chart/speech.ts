/**
 * Web Speech API utilities for chart point narration.
 *
 * § 8 of the Chart Rebuild Spec.
 * Uses `value` (not `close`) to match the DataPoint type.
 */

/**
 * Speak a single data point using the Web Speech API.
 * Provides an accessible verbal readout of date and value.
 */
export function speakPoint(
  point: { date: string; value: number },
  index: number,
  total: number
): void {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) return;

  /* Cancel any in-progress speech */
  window.speechSynthesis.cancel();

  const dateFormatted = new Date(point.date + "T00:00:00").toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
    }
  );
  const valueFormatted = `$${point.value.toFixed(2)}`;
  const text = `Point ${index + 1} of ${total}. ${dateFormatted}. ${valueFormatted}.`;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

/**
 * Speak a semantic zone description using the Web Speech API.
 * Used by ChartListen's zone buttons.
 */
export function speakZone(description: string): void {
  if (typeof window === "undefined") return;
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(description);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}
