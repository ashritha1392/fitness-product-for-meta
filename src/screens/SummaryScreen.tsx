import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { WorkoutSessionSummary } from "../workouts/WorkoutSession";

export function SummaryScreen({ summary, onRestart }: { summary: WorkoutSessionSummary; onRestart: () => void }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set complete</Text>
      <Text style={styles.stat}>{summary.totalReps} reps</Text>
      <Text style={styles.stat}>{summary.faultCount} form flags</Text>
      <Text style={styles.stat}>{Math.round(summary.durationMs / 1000)}s</Text>
      <Button title="Do another set" onPress={onRestart} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 8 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12 },
  stat: { fontSize: 17, color: "#333" },
});
