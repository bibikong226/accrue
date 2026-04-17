/**
 * Audio sonification utilities for chart accessibility.
 * Maps data points to audio tones so BLV users can "hear" the chart shape.
 *
 * § 7 of the Chart Rebuild Spec.
 * Uses `value` (not `close`) to match the DataPoint type.
 */

/**
 * Play a brief overview earcon that sweeps through data points as tones.
 * Higher values map to higher pitch, giving an auditory sense of the chart shape.
 * Respects prefers-reduced-motion by shortening the sweep.
 */
export function playOverviewEarcon(
  points: Array<{ date: string; value: number }>,
  durationMs: number = 2000
): void {
  if (points.length === 0) return;
  if (typeof window === "undefined") return;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const values = points.map((p) => p.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;

  /* Reduced motion: compress to 500ms */
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const totalDuration = reducedMotion ? 500 : durationMs;

  /* Sample up to 20 points to keep the sweep short */
  const sampleCount = Math.min(points.length, 20);
  const step = Math.max(1, Math.floor(points.length / sampleCount));
  const sampled = points.filter((_, i) => i % step === 0);
  const noteDuration = totalDuration / sampled.length / 1000;

  sampled.forEach((pt, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    /* Map value to frequency: 200 Hz (low) to 800 Hz (high) */
    const normalized = (pt.value - minVal) / range;
    osc.frequency.value = 200 + normalized * 600;
    osc.type = "sine";

    /* Gentle envelope */
    const startTime = ctx.currentTime + i * noteDuration;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.15, startTime + noteDuration * 0.1);
    gain.gain.linearRampToValueAtTime(0, startTime + noteDuration * 0.9);

    osc.start(startTime);
    osc.stop(startTime + noteDuration);
  });

  /* Close audio context after sweep completes */
  setTimeout(() => {
    ctx.close();
  }, totalDuration + 200);
}
