import { WDATBridge } from "../glasses/WDATBridge";
import { CoachingEngine } from "../coaching/CoachingEngine";
import { RepCounter } from "../coaching/RepCounter";
import { SensorFusion } from "../vision/SensorFusion";
import { ExerciseDefinition, PoseFrame, RepEvent } from "./types";

export interface WorkoutSessionSummary {
  exerciseId: string;
  totalReps: number;
  faultCount: number;
  durationMs: number;
  reps: RepEvent[];
}

/**
 * Orchestrates one exercise "set": wires the phone/glasses pose streams into
 * SensorFusion -> RepCounter -> CoachingEngine, and mirrors state to the
 * glasses HUD (if the paired hardware has a display) on every rep.
 */
export class WorkoutSession {
  private readonly fusion: SensorFusion;
  private readonly repCounter: RepCounter;
  private readonly coaching: CoachingEngine;
  private readonly reps: RepEvent[] = [];
  private startedAtMs = 0;
  private active = false;

  constructor(private readonly exercise: ExerciseDefinition, private readonly glasses: WDATBridge) {
    this.repCounter = new RepCounter(exercise.primaryAngle);
    this.fusion = new SensorFusion(exercise.primaryAngle, () => this.repCounter.currentPhase);
    this.coaching = new CoachingEngine(exercise, { speak: (t) => glasses.speak(t) });
  }

  start(nowMs: number): void {
    this.active = true;
    this.startedAtMs = nowMs;
    this.reps.length = 0;
    this.repCounter.reset();
    this.fusion.reset();
    this.updateHud(0);
  }

  ingestPhoneFrame(frame: PoseFrame): void {
    if (this.active) this.fusion.ingestPhoneFrame(frame);
  }

  ingestGlassesFrame(frame: PoseFrame): void {
    if (this.active) this.fusion.ingestGlassesFrame(frame);
  }

  /** Advance the session with the latest fused reading. Call at your pose-estimation frame rate (e.g. ~20-30Hz). */
  tick(nowMs: number): void {
    if (!this.active) return;

    const analysis = this.fusion.analyze(nowMs);
    this.coaching.onFrame(analysis, nowMs);

    if (Number.isNaN(analysis.angleDeg)) return;

    const repEvent = this.repCounter.update(analysis.angleDeg, nowMs);
    if (repEvent) {
      this.reps.push(repEvent);
      this.coaching.onRepCompleted(repEvent, nowMs);
      this.updateHud(this.reps.length, repEvent.faults.length > 0);
    }
  }

  private updateHud(repCount: number, lastRepHadFault = false): void {
    if (!this.glasses.hasDisplay()) return;
    this.glasses.updateDisplay({
      primaryText: `${repCount} reps`,
      secondaryText: this.exercise.name,
      accentColor: lastRepHadFault ? "warning" : "success",
    });
  }

  finish(nowMs: number): WorkoutSessionSummary {
    this.active = false;
    const faultCount = this.reps.reduce((sum, r) => sum + r.faults.length, 0);
    return {
      exerciseId: this.exercise.id,
      totalReps: this.reps.length,
      faultCount,
      durationMs: nowMs - this.startedAtMs,
      reps: [...this.reps],
    };
  }
}
