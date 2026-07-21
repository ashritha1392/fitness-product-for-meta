import { create } from "zustand";
import { GlassesConnectionState, MockWDATBridge, WDATBridge } from "../glasses/WDATBridge";
import { WorkoutSession, WorkoutSessionSummary } from "../workouts/WorkoutSession";
import { getExercise } from "../workouts/ExerciseLibrary";

interface SessionState {
  glasses: WDATBridge;
  connectionState: GlassesConnectionState;
  activeSession: WorkoutSession | null;
  lastSummary: WorkoutSessionSummary | null;

  connectGlasses: () => Promise<void>;
  startExercise: (exerciseId: string) => void;
  endExercise: () => void;
}

// Swap MockWDATBridge for a real native-backed WDATBridge implementation
// (see native/README.md) once you have Meta partner SDK access.
const glasses = new MockWDATBridge({ simulateDisplay: true });

export const useSessionStore = create<SessionState>((set, get) => ({
  glasses,
  connectionState: glasses.getConnectionState(),
  activeSession: null,
  lastSummary: null,

  connectGlasses: async () => {
    await glasses.connect();
    set({ connectionState: glasses.getConnectionState() });
  },

  startExercise: (exerciseId: string) => {
    const exercise = getExercise(exerciseId);
    const session = new WorkoutSession(exercise, get().glasses);
    session.start(Date.now());
    set({ activeSession: session });
  },

  endExercise: () => {
    const session = get().activeSession;
    if (!session) return;
    const summary = session.finish(Date.now());
    set({ activeSession: null, lastSummary: summary });
  },
}));
