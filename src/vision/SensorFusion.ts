import { AngleTarget, FormAnalysis, PoseFrame, RepPhase } from "../workouts/types";
import { angleAtVertex, ExponentialSmoother, fuseConfidence } from "../utils/math";

/**
 * This is the core of Vantage's differentiation: neither sensor alone is
 * enough. The phone (propped up, wide view) sees the whole body but sits
 * a few feet away and can lose the near-side arm during a push-up. The
 * glasses' POV camera sees hands/floor/equipment up close but can't see
 * the wearer's own torso or legs for most exercises. Fusing both — weighted
 * by per-joint confidence — gets a single, steadier angle stream, and lets
 * the system keep coaching even if one sensor temporarily loses tracking
 * (phone view briefly occluded by a person walking by, glasses looking away
 * mid-rep, etc).
 */
export class SensorFusion {
  private readonly smoother = new ExponentialSmoother(0.35);
  private latestPhoneFrame: PoseFrame | null = null;
  private latestGlassesFrame: PoseFrame | null = null;

  constructor(private readonly target: AngleTarget, private readonly phase: () => RepPhase) {}

  ingestPhoneFrame(frame: PoseFrame): void {
    this.latestPhoneFrame = frame;
  }

  ingestGlassesFrame(frame: PoseFrame): void {
    this.latestGlassesFrame = frame;
  }

  /**
   * Combine whichever frames are fresh (within `maxStalenessMs`) into one
   * FormAnalysis reading. If both sources have the joint, fuse by
   * confidence; if only one does, use it alone; if neither does, return a
   * NaN-angle reading with 0 confidence so callers can hold their last
   * good value rather than coach off garbage data.
   */
  analyze(nowMs: number, maxStalenessMs = 250): FormAnalysis {
    const candidates: Array<{ value: number; confidence: number; source: "phone" | "glasses" }> = [];

    for (const [frame, source] of [
      [this.latestPhoneFrame, "phone"] as const,
      [this.latestGlassesFrame, "glasses"] as const,
    ]) {
      if (!frame) continue;
      if (nowMs - frame.timestampMs > maxStalenessMs) continue;

      const angle = this.computeAngleFromFrame(frame);
      if (angle === null) continue;

      candidates.push({ value: angle.value, confidence: angle.confidence, source });
    }

    let fused = { value: NaN, confidence: 0 };
    if (candidates.length > 0) {
      fused = fuseConfidence(candidates);
    }

    const smoothed = this.smoother.next(fused.value);

    let fault: string | null = null;
    if (!Number.isNaN(smoothed)) {
      if (this.target.faultBelow !== undefined && smoothed < this.target.faultBelow) {
        fault = this.target.faultMessage ?? "Form fault detected";
      }
      if (this.target.faultAbove !== undefined && smoothed > this.target.faultAbove) {
        fault = this.target.faultMessage ?? "Form fault detected";
      }
    }

    return {
      timestampMs: nowMs,
      angleDeg: smoothed,
      phase: this.phase(),
      fault,
      confidence: fused.confidence,
      contributingSources: candidates.map((c) => c.source),
    };
  }

  private computeAngleFromFrame(frame: PoseFrame): { value: number; confidence: number } | null {
    const { joint, neighbors } = this.target;
    const a = frame.joints[neighbors[0]];
    const b = frame.joints[joint];
    const c = frame.joints[neighbors[1]];
    if (!a || !b || !c) return null;

    const value = angleAtVertex(a, b, c);
    if (Number.isNaN(value)) return null;

    const confA = frame.confidence[neighbors[0]] ?? 0;
    const confB = frame.confidence[joint] ?? 0;
    const confC = frame.confidence[neighbors[1]] ?? 0;
    const confidence = Math.min(confA, confB, confC);

    return { value, confidence };
  }

  reset(): void {
    this.smoother.reset();
    this.latestPhoneFrame = null;
    this.latestGlassesFrame = null;
  }
}
