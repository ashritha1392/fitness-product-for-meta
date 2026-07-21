import React, { useEffect, useRef } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useSessionStore } from "../state/sessionStore";
import { getExercise } from "../workouts/ExerciseLibrary";

/**
 * The phone screen acts as a live monitor (handy for setup/debugging or a
 * spotter watching along) while the *actual* coaching happens hands-free
 * through the glasses: voice cues in your ear, rep count and form flags on
 * the Ray-Ban Display HUD in your line of sight. You are not meant to be
 * looking at this screen mid-set.
 */
export function WorkoutScreen({ exerciseId, onDone }: { exerciseId: string; onDone: () => void }) {
  const startExercise = useSessionStore((s) => s.startExercise);
  const endExercise = useSessionStore((s) => s.endExercise);
  const activeSession = useSessionStore((s) => s.activeSession);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startExercise(exerciseId);
    tickRef.current = setInterval(() => {
      useSessionStore.getState().activeSession?.tick(Date.now());
    }, 33);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [exerciseId, startExercise]);

  const exercise = getExercise(exerciseId);

  const handleEnd = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    endExercise();
    onDone();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{exercise.name}</Text>
      <Text style={styles.hint}>
        {activeSession ? "Session running — glasses are coaching hands-free." : "Starting..."}
      </Text>
      <Button title="End set" onPress={handleEnd} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  hint: { fontSize: 15, color: "#444" },
});
