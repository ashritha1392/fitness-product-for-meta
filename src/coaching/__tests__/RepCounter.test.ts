import { RepCounter } from "../RepCounter";
import { AngleTarget } from "../../workouts/types";

const squatKnee: AngleTarget = {
  joint: "leftKnee",
  neighbors: ["leftHip", "leftAnkle"],
  bottomThreshold: 100,
  topThreshold: 165,
  faultBelow: 70,
  faultMessage: "Too deep",
};

function feed(counter: RepCounter, angles: number[], startMs = 0, stepMs = 33) {
  let t = startMs;
  const events = [];
  for (const a of angles) {
    const event = counter.update(a, t);
    if (event) events.push(event);
    t += stepMs;
  }
  return events;
}

describe("RepCounter", () => {
  it("counts exactly one rep for a full top->bottom->top cycle", () => {
    const counter = new RepCounter(squatKnee);
    const angles = [170, 160, 140, 120, 100, 90, 100, 120, 140, 160, 170];
    const events = feed(counter, angles);

    expect(events).toHaveLength(1);
    expect(events[0].repIndex).toBe(1);
    expect(counter.completedReps).toBe(1);
  });

  it("does not double-count noise oscillating near the bottom threshold", () => {
    const counter = new RepCounter(squatKnee);
    // Dip to bottom, then wobble right around bottomThreshold+/-2 a few times
    // before actually ascending back to top.
    const angles = [170, 150, 120, 100, 98, 101, 99, 102, 98, 130, 160, 170];
    const events = feed(counter, angles);

    expect(events).toHaveLength(1);
  });

  it("counts multiple consecutive reps correctly", () => {
    const counter = new RepCounter(squatKnee);
    const oneRep = [160, 140, 120, 100, 90, 100, 120, 140, 165];
    const angles = [...oneRep, ...oneRep, ...oneRep];
    const events = feed(counter, angles);

    expect(events).toHaveLength(3);
    expect(events.map((e) => e.repIndex)).toEqual([1, 2, 3]);
  });

  it("flags a fault when the angle passes faultBelow, and reports it on the completed rep", () => {
    const counter = new RepCounter(squatKnee);
    const angles = [170, 140, 100, 65, 100, 140, 170]; // dips below faultBelow=70
    const events = feed(counter, angles);

    expect(events).toHaveLength(1);
    expect(events[0].faults).toContain("Too deep");
  });

  it("does not flag a fault for a clean rep that stays above faultBelow", () => {
    const counter = new RepCounter(squatKnee);
    const angles = [170, 140, 100, 95, 100, 140, 170];
    const events = feed(counter, angles);

    expect(events).toHaveLength(1);
    expect(events[0].faults).toHaveLength(0);
  });

  it("ignores NaN samples without throwing or advancing phase", () => {
    const counter = new RepCounter(squatKnee);
    expect(() => counter.update(NaN, 0)).not.toThrow();
    expect(counter.currentPhase).toBe("top");
  });

  it("reset() clears rep count and phase", () => {
    const counter = new RepCounter(squatKnee);
    feed(counter, [170, 140, 100, 90, 100, 140, 170]);
    expect(counter.completedReps).toBe(1);

    counter.reset();
    expect(counter.completedReps).toBe(0);
    expect(counter.currentPhase).toBe("top");
  });
});
