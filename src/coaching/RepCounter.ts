import { AngleTarget, RepEvent, RepPhase } from "../workouts/types";

/**
 * A per-exercise state machine that turns a stream of smoothed joint angles
 * into discrete rep events. Phase transitions use hysteresis (top/bottom
 * thresholds only trigger the *next* phase, never re-trigger the same one)
 * so noisy angle readings near a threshold don't cause double-counting.
 */
export class RepCounter {
  private phase: RepPhase = "top";
  private repIndex = 0;
  private minAngleThisRep = Infinity;
  private maxAngleThisRep = -Infinity;
  private phaseStartMs = 0;
  private phaseDurations: Partial<Record<RepPhase, number>> = {};
  private faults = new Set<string>();

  constructor(private readonly target: AngleTarget) {}

  get currentPhase(): RepPhase {
    return this.phase;
  }

  get completedReps(): number {
    return this.repIndex;
  }

  /**
   * Feed one smoothed angle sample. Returns a RepEvent when a full rep
   * (top -> bottom -> top) completes, otherwise null.
   */
  update(angleDeg: number, timestampMs: number): RepEvent | null {
    if (Number.isNaN(angleDeg)) return null;

    this.minAngleThisRep = Math.min(this.minAngleThisRep, angleDeg);
    this.maxAngleThisRep = Math.max(this.maxAngleThisRep, angleDeg);

    if (this.target.faultBelow !== undefined && angleDeg < this.target.faultBelow) {
      this.faults.add(this.target.faultMessage ?? "Form fault detected");
    }
    if (this.target.faultAbove !== undefined && angleDeg > this.target.faultAbove) {
      this.faults.add(this.target.faultMessage ?? "Form fault detected");
    }

    switch (this.phase) {
      case "top":
        if (angleDeg <= this.target.topThreshold - 5) {
          this.transitionTo("descending", timestampMs);
        }
        break;
      case "descending":
        if (angleDeg <= this.target.bottomThreshold) {
          this.transitionTo("bottom", timestampMs);
        }
        break;
      case "bottom":
        if (angleDeg >= this.target.bottomThreshold + 5) {
          this.transitionTo("ascending", timestampMs);
        }
        break;
      case "ascending":
        if (angleDeg >= this.target.topThreshold) {
          this.transitionTo("top", timestampMs);
          return this.finishRep(timestampMs);
        }
        break;
    }

    return null;
  }

  private transitionTo(next: RepPhase, timestampMs: number): void {
    const elapsed = timestampMs - this.phaseStartMs;
    if (this.phaseStartMs > 0) {
      this.phaseDurations[this.phase] = (this.phaseDurations[this.phase] ?? 0) + elapsed;
    }
    this.phase = next;
    this.phaseStartMs = timestampMs;
  }

  private finishRep(timestampMs: number): RepEvent {
    this.repIndex += 1;
    const event: RepEvent = {
      repIndex: this.repIndex,
      phaseDurationsMs: { ...this.phaseDurations },
      minAngle: this.minAngleThisRep,
      maxAngle: this.maxAngleThisRep,
      faults: Array.from(this.faults),
      completedAtMs: timestampMs,
    };

    this.minAngleThisRep = Infinity;
    this.maxAngleThisRep = -Infinity;
    this.phaseDurations = {};
    this.faults.clear();

    return event;
  }

  reset(): void {
    this.phase = "top";
    this.repIndex = 0;
    this.minAngleThisRep = Infinity;
    this.maxAngleThisRep = -Infinity;
    this.phaseStartMs = 0;
    this.phaseDurations = {};
    this.faults.clear();
  }
}
