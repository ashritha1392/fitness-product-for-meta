/**
 * Shared domain types for exercises, joint tracking, and session state.
 *
 * Joint positions are expressed in normalized image space (0..1 on both axes)
 * so the same types work whether the sample came from the phone's full-body
 * camera or (for the small set of exercises where it's visible) the glasses'
 * POV camera.
 */

export type Joint =
  | "leftShoulder"
  | "rightShoulder"
  | "leftElbow"
  | "rightElbow"
  | "leftWrist"
  | "rightWrist"
  | "leftHip"
  | "rightHip"
  | "leftKnee"
  | "rightKnee"
  | "leftAnkle"
  | "rightAnkle";

export interface Point2D {
  x: number;
  y: number;
}

/** A single frame of pose data, keyed by joint, with a per-joint confidence score. */
export interface PoseFrame {
  timestampMs: number;
  joints: Partial<Record<Joint, Point2D>>;
  confidence: Partial<Record<Joint, number>>;
  source: "phone" | "glasses";
}

/** The angle (in degrees) formed at a joint by two adjacent bones, e.g. knee angle from hip-knee-ankle. */
export interface AngleTarget {
  joint: Joint;
  /** The two neighboring joints that define the angle at `joint`. */
  neighbors: [Joint, Joint];
  /** Degrees considered "bottom of rep" (e.g. deep squat knee angle). */
  bottomThreshold: number;
  /** Degrees considered "top of rep" / lockout. */
  topThreshold: number;
  /** Below/above this, form is flagged (e.g. knee collapsing inward, back rounding). */
  faultBelow?: number;
  faultAbove?: number;
  faultMessage?: string;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  /** Whether this exercise is fully visible to a chest-height glasses POV camera (rare) or needs the phone's wide view. */
  visibleFromGlasses: boolean;
  primaryAngle: AngleTarget;
  /** Optional secondary check, e.g. torso lean, used for extra form cues. */
  secondaryAngle?: AngleTarget;
  cueBank: {
    depthTooShallow: string[];
    goodRep: string[];
    faultDetected: string[];
    tempoTooFast: string[];
  };
}

export type RepPhase = "top" | "descending" | "bottom" | "ascending";

export interface RepEvent {
  repIndex: number;
  phaseDurationsMs: Partial<Record<RepPhase, number>>;
  minAngle: number;
  maxAngle: number;
  faults: string[];
  completedAtMs: number;
}

export interface FormAnalysis {
  timestampMs: number;
  angleDeg: number;
  phase: RepPhase;
  fault: string | null;
  /** 0..1, combined confidence from whichever sensor(s) contributed. */
  confidence: number;
  contributingSources: Array<"phone" | "glasses">;
}
