import { ExerciseDefinition, FormAnalysis, RepEvent } from "../workouts/types";

export interface VoiceCue {
  text: string;
  priority: "fault" | "rep-feedback" | "encouragement";
  timestampMs: number;
}

export interface CoachingPort {
  /** Speaks through the glasses' open-ear speakers via WDATBridge.speak(). */
  speak(text: string): void;
}

/**
 * Decides *when* to talk, not just what to say. Real-time form coaching is
 * useless (and annoying) if it talks over every frame — this throttles cues
 * so at most one plays per rep phase, prioritizes safety faults over
 * encouragement, and never repeats the same line twice in a row.
 */
export class CoachingEngine {
  private lastSpokenAtMs = 0;
  private lastCueText: string | null = null;
  private readonly minGapMs: number;

  constructor(private readonly exercise: ExerciseDefinition, private readonly port: CoachingPort, minGapMs = 1500) {
    this.minGapMs = minGapMs;
  }

  /** Call on every fused FormAnalysis frame — usually a no-op unless a fault just started. */
  onFrame(analysis: FormAnalysis, nowMs: number): void {
    if (!analysis.fault) return;
    if (nowMs - this.lastSpokenAtMs < this.minGapMs) return;

    this.say(analysis.fault, "fault", nowMs);
  }

  /** Call once per completed rep. */
  onRepCompleted(rep: RepEvent, nowMs: number): void {
    if (rep.faults.length > 0) {
      // Faults already spoken live via onFrame; just log, don't double-talk.
      return;
    }

    if (nowMs - this.lastSpokenAtMs < this.minGapMs) return;

    const bank = this.exercise.cueBank.goodRep;
    const cue = bank[rep.repIndex % bank.length];
    this.say(`${cue}. That's ${rep.repIndex}.`, "rep-feedback", nowMs);
  }

  private say(text: string, priority: VoiceCue["priority"], nowMs: number): void {
    if (text === this.lastCueText && priority !== "fault") return;
    this.port.speak(text);
    this.lastSpokenAtMs = nowMs;
    this.lastCueText = text;
  }
}
