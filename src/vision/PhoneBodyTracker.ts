import { Joint, PoseFrame } from "../workouts/types";

/**
 * Wraps an on-device pose model (e.g. MoveNet Lightning via TFLite, or
 * react-native-mlkit-pose-detection) run against the phone's own camera feed
 * once it's propped up during SetupPhoneStandScreen. This is the "sees your
 * whole body" sensor in the fusion pair — see src/vision/SensorFusion.ts.
 *
 * Kept as a typed interface + stub emitter here (rather than binding a real
 * native camera pipeline) so the scaffold runs and tests in plain Node/Jest.
 * Swap `PhoneBodyTracker.start()`'s internals for a real frame processor
 * (e.g. VisionCamera `useFrameProcessor`) when wiring up the actual RN app.
 */
export class PhoneBodyTracker {
  private listeners = new Set<(frame: PoseFrame) => void>();
  private running = false;

  onFrame(callback: (frame: PoseFrame) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  get isRunning(): boolean {
    return this.running;
  }

  /**
   * Test/dev helper: inject a synthetic pose frame as if the on-device model
   * had produced it. Real integration replaces this call site with the
   * model's per-frame callback.
   */
  emitFrame(joints: PoseFrame["joints"], confidence: PoseFrame["confidence"], timestampMs: number): void {
    if (!this.running) return;
    const frame: PoseFrame = { timestampMs, joints, confidence, source: "phone" };
    this.listeners.forEach((cb) => cb(frame));
  }
}

export const ALL_JOINTS: Joint[] = [
  "leftShoulder",
  "rightShoulder",
  "leftElbow",
  "rightElbow",
  "leftWrist",
  "rightWrist",
  "leftHip",
  "rightHip",
  "leftKnee",
  "rightKnee",
  "leftAnkle",
  "rightAnkle",
];
