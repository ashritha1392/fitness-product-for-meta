import { ExerciseDefinition } from "./types";

/**
 * Exercise definitions drive both the RepCounter state machine and the
 * CoachingEngine's cue selection. Angle thresholds are deliberately
 * conservative defaults; SetupPhoneStandScreen calibration can nudge them
 * per-user in a future iteration (see docs/ARCHITECTURE.md).
 */
export const ExerciseLibrary: Record<string, ExerciseDefinition> = {
  squat: {
    id: "squat",
    name: "Bodyweight Squat",
    visibleFromGlasses: false, // needs the phone's wide, low framing
    primaryAngle: {
      joint: "leftKnee",
      neighbors: ["leftHip", "leftAnkle"],
      bottomThreshold: 100,
      topThreshold: 165,
      faultBelow: 70,
      faultMessage: "Careful — that's deeper than your mobility target, ease up.",
    },
    secondaryAngle: {
      joint: "leftHip",
      neighbors: ["leftShoulder", "leftKnee"],
      bottomThreshold: 80,
      topThreshold: 170,
      faultBelow: 60,
      faultMessage: "Chest is dropping too far forward — brace your core.",
    },
    cueBank: {
      depthTooShallow: ["A bit deeper next rep", "Sink your hips lower"],
      goodRep: ["Nice depth", "That's the range we want"],
      faultDetected: ["Watch your knees caving in", "Keep weight through your heels"],
      tempoTooFast: ["Slow the descent down", "Control the negative"],
    },
  },
  pushup: {
    id: "pushup",
    name: "Push-Up",
    visibleFromGlasses: true, // hands/floor are in the wearer's own POV
    primaryAngle: {
      joint: "leftElbow",
      neighbors: ["leftShoulder", "leftWrist"],
      bottomThreshold: 95,
      topThreshold: 165,
      faultBelow: 60,
      faultMessage: "That's very low — protect your shoulders.",
    },
    cueBank: {
      depthTooShallow: ["Lower your chest a bit more", "Almost — a little further down"],
      goodRep: ["Full range, good", "Solid rep"],
      faultDetected: ["Keep your hips from sagging", "Squeeze your core"],
      tempoTooFast: ["Slow that down slightly"],
    },
  },
  lunge: {
    id: "lunge",
    name: "Forward Lunge",
    visibleFromGlasses: false,
    primaryAngle: {
      joint: "leftKnee",
      neighbors: ["leftHip", "leftAnkle"],
      bottomThreshold: 95,
      topThreshold: 170,
      faultBelow: 70,
      faultMessage: "Front knee is traveling past your toes — shift weight back.",
    },
    cueBank: {
      depthTooShallow: ["Drop the back knee a little lower"],
      goodRep: ["Good depth and balance"],
      faultDetected: ["Keep your front knee stacked over your ankle"],
      tempoTooFast: ["Ease into the bottom position"],
    },
  },
};

export function getExercise(id: string): ExerciseDefinition {
  const def = ExerciseLibrary[id];
  if (!def) throw new Error(`Unknown exercise id: ${id}`);
  return def;
}
