/**
 * WDATBridge — typed adapter over Meta's Wearables Device Access Toolkit (WDAT).
 *
 * WDAT is Meta's real, current (2026) developer preview SDK that lets a
 * paired iOS/Android app request camera-frame streaming, open-ear
 * mic/speaker access, and — for Ray-Ban Display glasses specifically — push
 * content to the right-lens display. See:
 *   https://developers.meta.com/blog/introducing-meta-wearables-device-access-toolkit/
 *   https://wearables.developer.meta.com/docs/develop/dat/
 *
 * Public rollout is still partner-gated as of this writing (broader GA is
 * expected later in 2026), and the real bridge requires native modules
 * (Android/iOS SDK binaries) that can't be vendored into a plain TS
 * scaffold. This file defines the interface Vantage's app code programs
 * against, plus a MockWDATBridge that simulates it for local development —
 * so `src/vision`, `src/coaching`, and `src/screens` are already written
 * against the real shape and only need the mock swapped for
 * `native/android` / `native/ios` implementations once you have partner
 * access. See native/README.md for the integration checklist.
 */

export type GlassesConnectionState = "disconnected" | "pairing" | "connected" | "error";

export interface CameraFrame {
  timestampMs: number;
  /** Raw frame bytes (JPEG/YUV depending on WDAT config) — opaque to app code until decoded by the vision layer. */
  data: Uint8Array;
  width: number;
  height: number;
}

export interface DisplayContent {
  /** Minimal HUD payload pushed to the right-lens display: rep count, form flag, elapsed time. */
  primaryText: string;
  secondaryText?: string;
  accentColor?: "neutral" | "warning" | "success";
}

export interface WDATBridge {
  getConnectionState(): GlassesConnectionState;
  connect(): Promise<void>;
  disconnect(): Promise<void>;

  /** Subscribe to the glasses' POV camera stream. Returns an unsubscribe function. */
  onCameraFrame(callback: (frame: CameraFrame) => void): () => void;

  /** Speak through the glasses' open-ear speakers (TTS is synthesized on-device/phone and streamed to the glasses' audio output). */
  speak(text: string): void;

  /** Push a HUD update to the Ray-Ban Display right-lens display. No-ops on non-Display hardware. */
  updateDisplay(content: DisplayContent): void;

  /** Whether the paired hardware supports the display (Ray-Ban Display) vs. audio-only (Ray-Ban Meta Gen 1/2). */
  hasDisplay(): boolean;
}

/**
 * Local-dev mock: simulates a connected glasses device with a synthetic
 * camera tick and a console-logged "speaker" so the rest of the app can be
 * built and tested without physical hardware or partner SDK access.
 */
export class MockWDATBridge implements WDATBridge {
  private state: GlassesConnectionState = "disconnected";
  private frameListeners = new Set<(frame: CameraFrame) => void>();
  private frameTimer: ReturnType<typeof setInterval> | null = null;
  private readonly simulateDisplay: boolean;
  public spokenLog: string[] = [];
  public displayLog: DisplayContent[] = [];

  constructor(options?: { simulateDisplay?: boolean }) {
    this.simulateDisplay = options?.simulateDisplay ?? true;
  }

  getConnectionState(): GlassesConnectionState {
    return this.state;
  }

  async connect(): Promise<void> {
    this.state = "pairing";
    await new Promise((resolve) => setTimeout(resolve, 10));
    this.state = "connected";
    this.frameTimer = setInterval(() => {
      const frame: CameraFrame = {
        timestampMs: Date.now(),
        data: new Uint8Array(0),
        width: 1280,
        height: 960,
      };
      this.frameListeners.forEach((cb) => cb(frame));
    }, 33); // ~30fps
  }

  async disconnect(): Promise<void> {
    if (this.frameTimer) clearInterval(this.frameTimer);
    this.frameTimer = null;
    this.state = "disconnected";
  }

  onCameraFrame(callback: (frame: CameraFrame) => void): () => void {
    this.frameListeners.add(callback);
    return () => this.frameListeners.delete(callback);
  }

  speak(text: string): void {
    this.spokenLog.push(text);
    // eslint-disable-next-line no-console
    console.log(`[glasses speaker] ${text}`);
  }

  updateDisplay(content: DisplayContent): void {
    this.displayLog.push(content);
  }

  hasDisplay(): boolean {
    return this.simulateDisplay;
  }
}
