import { PoseFrame } from "../workouts/types";
import { WDATBridge } from "../glasses/WDATBridge";

/**
 * Consumes the glasses' POV camera stream (via WDATBridge.onCameraFrame) and
 * runs a lightweight, glasses-appropriate model: it can only ever see the
 * wearer's own hands/forearms and whatever's in front of them (floor,
 * dumbbells, a barbell), never their own torso or legs. That's fine — for
 * exercises like push-ups (see ExerciseLibrary.pushup, visibleFromGlasses:
 * true) that's exactly the joint we need, and for everything else this
 * stream still contributes equipment recognition and hand-position cues
 * that the phone's wider, farther-away view often misses.
 *
 * Decoding real camera frames (JPEG/YUV -> tensor) is intentionally left as
 * a TODO hook — plug in a lightweight on-device model (e.g. a distilled
 * hand/wrist keypoint model) once you have WDAT partner access and real
 * frame bytes to test against.
 */
export class GlassesLimbTracker {
  private unsubscribeCamera: (() => void) | null = null;
  private listeners = new Set<(frame: PoseFrame) => void>();

  constructor(private readonly glasses: WDATBridge) {}

  start(): void {
    this.unsubscribeCamera = this.glasses.onCameraFrame((cameraFrame) => {
      const poseFrame = this.decode(cameraFrame.timestampMs);
      if (poseFrame) this.listeners.forEach((cb) => cb(poseFrame));
    });
  }

  stop(): void {
    this.unsubscribeCamera?.();
    this.unsubscribeCamera = null;
  }

  onFrame(callback: (frame: PoseFrame) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // TODO(partner-access): replace with a real hand/wrist/elbow keypoint model
  // fed by `cameraFrame.data`. Returns null until that's wired up so the
  // fusion layer simply treats "no glasses signal yet" as phone-only.
  private decode(_timestampMs: number): PoseFrame | null {
    return null;
  }
}
