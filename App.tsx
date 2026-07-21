import React, { useState } from "react";
import { SafeAreaView } from "react-native";
import { PairGlassesScreen } from "./src/screens/PairGlassesScreen";
import { SetupPhoneStandScreen } from "./src/screens/SetupPhoneStandScreen";
import { WorkoutScreen } from "./src/screens/WorkoutScreen";
import { SummaryScreen } from "./src/screens/SummaryScreen";
import { useSessionStore } from "./src/state/sessionStore";

type Step = "pair" | "setup" | "workout" | "summary";

export default function App() {
  const [step, setStep] = useState<Step>("pair");
  const [exerciseId] = useState("squat");
  const lastSummary = useSessionStore((s) => s.lastSummary);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {step === "pair" && <PairGlassesScreen onPaired={() => setStep("setup")} />}
      {step === "setup" && <SetupPhoneStandScreen onReady={() => setStep("workout")} />}
      {step === "workout" && <WorkoutScreen exerciseId={exerciseId} onDone={() => setStep("summary")} />}
      {step === "summary" && lastSummary && (
        <SummaryScreen summary={lastSummary} onRestart={() => setStep("workout")} />
      )}
    </SafeAreaView>
  );
}
