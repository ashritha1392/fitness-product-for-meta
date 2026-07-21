import { Point2D } from "../workouts/types";

/**
 * Angle in degrees at vertex `b`, formed by rays b->a and b->c.
 * Used to compute e.g. knee angle from hip(a)-knee(b)-ankle(c).
 */
export function angleAtVertex(a: Point2D, b: Point2D, c: Point2D): number {
  const abx = a.x - b.x;
  const aby = a.y - b.y;
  const cbx = c.x - b.x;
  const cby = c.y - b.y;

  const dot = abx * cbx + aby * cby;
  const magAB = Math.hypot(abx, aby);
  const magCB = Math.hypot(cbx, cby);

  if (magAB === 0 || magCB === 0) return NaN;

  const cos = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * Exponential moving average smoother for noisy per-frame angle readings.
 * alpha closer to 1 = more responsive/noisy, closer to 0 = smoother/laggier.
 */
export class ExponentialSmoother {
  private value: number | null = null;
  constructor(private readonly alpha: number = 0.35) {}

  next(sample: number): number {
    if (Number.isNaN(sample)) {
      return this.value ?? NaN;
    }
    this.value = this.value === null ? sample : this.alpha * sample + (1 - this.alpha) * this.value;
    return this.value;
  }

  reset(): void {
    this.value = null;
  }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Weighted average of confidences, used when fusing phone + glasses signals for the same joint. */
export function fuseConfidence(readings: Array<{ value: number; confidence: number }>): {
  value: number;
  confidence: number;
} {
  const totalWeight = readings.reduce((sum, r) => sum + r.confidence, 0);
  if (totalWeight === 0) return { value: NaN, confidence: 0 };

  const value = readings.reduce((sum, r) => sum + r.value * r.confidence, 0) / totalWeight;
  // Combined confidence rewards agreement between sources, not just their average.
  const avgConfidence = totalWeight / readings.length;
  return { value, confidence: avgConfidence };
}
