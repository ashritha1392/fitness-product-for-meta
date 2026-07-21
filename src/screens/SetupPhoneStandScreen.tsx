import React, { useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

/**
 * Calibration step: ask the user to prop their phone up a few feet away
 * (any stand, wall, or shoe works) so PhoneBodyTracker gets a stable
 * full-body view before the set starts. This single step is what lets
 * Vantage do full-body form-check at all — the glasses' own camera can't
 * see the wearer's body, so the phone has to.
 */
export function SetupPhoneStandScreen({ onReady }: { onReady: () => void }) {
  const [confirmed, setConfirmed] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set up your phone</Text>
      <Text style={styles.body}>
        Prop your phone up against something stable, about 6-8 feet away, so your whole body fits in frame. This is
        what lets Vantage see your form — the glasses only see what's in front of you, not you.
      </Text>
      <Button
        title={confirmed ? "Looks good" : "I'm in frame"}
        onPress={() => {
          setConfirmed(true);
          onReady();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  body: { fontSize: 15, color: "#444", lineHeight: 21 },
});
