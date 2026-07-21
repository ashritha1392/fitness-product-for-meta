import { SensorFusion } from "../SensorFusion";
import { AngleTarget, PoseFrame } from "../../workouts/types";

const elbowTarget: AngleTarget = {
  joint: "leftElbow",
  neighbors: ["leftShoulder", "leftWrist"],
  bottomThreshold: 95,
  topThreshold: 165,
};

/** Builds a PoseFrame where the angle at `elbow`, formed by shoulder-elbow-wrist, is exactly `angleDeg`. */
function makeFrame(
  angleDeg: number,
  confidence: number,
  timestampMs: number,
  source: "phone" | "glasses"
): PoseFrame {
  const elbow = { x: 0, y: 0 };
  const shoulder = { x: 1, y: 0 };
  const rad = (angleDeg * Math.PI) / 180;
  const wrist = { x: Math.cos(rad), y: Math.sin(rad) };

  return {
    timestampMs,
    joints: { leftElbow: elbow, leftShoulder: shoulder, leftWrist: wrist },
    confidence: { leftElbow: confidence, leftShoulder: confidence, leftWrist: confidence },
    source,
  };
}

describe("SensorFusion", () => {
  it("uses the single available source when only the phone has fresh data", () => {
    const fusion = new SensorFusion(elbowTarget, () => "descending");
    fusion.ingestPhoneFrame(makeFrame(120, 0.9, 1000, "phone"));

    const result = fusion.analyze(1010);

    expect(result.angleDeg).toBeCloseTo(120, 0);
    expect(result.contributingSources).toEqual(["phone"]);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it("fuses phone and glasses readings, weighted toward the higher-confidence source", () => {
    const fusion = new SensorFusion(elbowTarget, () => "bottom");
    fusion.ingestPhoneFrame(makeFrame(100, 0.9, 1000, "phone"));
    fusion.ingestGlassesFrame(makeFrame(140, 0.1, 1000, "glasses"));

    const result = fusion.analyze(1010);

    // Weighted average should sit much closer to the high-confidence phone reading (100) than glasses (140).
    expect(result.angleDeg).toBeLessThan(115);
    expect(result.contributingSources.sort()).toEqual(["glasses", "phone"]);
  });

  it("drops stale frames older than maxStalenessMs", () => {
    const fusion = new SensorFusion(elbowTarget, () => "top");
    fusion.ingestPhoneFrame(makeFrame(150, 0.9, 1000, "phone"));

    // 500ms later, well past the default 250ms staleness window.
    const result = fusion.analyze(1500);

    expect(result.contributingSources).toEqual([]);
    expect(Number.isNaN(result.angleDeg)).toBe(true);
  });

  it("returns null-ish (NaN angle, 0 confidence) when no frames have ever arrived", () => {
    const fusion = new SensorFusion(elbowTarget, () => "top");
    const result = fusion.analyze(0);

    expect(result.confidence).toBe(0);
    expect(Number.isNaN(result.angleDeg)).toBe(true);
  });

  it("reset() clears buffered frames so a stale phone frame no longer contributes", () => {
    const fusion = new SensorFusion(elbowTarget, () => "top");
    fusion.ingestPhoneFrame(makeFrame(150, 0.9, 1000, "phone"));
    fusion.reset();

    const result = fusion.analyze(1010);
    expect(result.contributingSources).toEqual([]);
  });
});
