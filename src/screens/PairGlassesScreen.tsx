import React from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import { useSessionStore } from "../state/sessionStore";

export function PairGlassesScreen({ onPaired }: { onPaired: () => void }) {
  const connectionState = useSessionStore((s) => s.connectionState);
  const connectGlasses = useSessionStore((s) => s.connectGlasses);

  const handleConnect = async () => {
    await connectGlasses();
    onPaired();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pair your Meta glasses</Text>
      <Text style={styles.body}>
        Open the Meta AI app, make sure your Ray-Ban Meta or Ray-Ban Display glasses are connected, then tap below.
        Vantage requests camera-frame streaming and open-ear audio access via the Wearables Device Access Toolkit.
      </Text>
      <Text style={styles.status}>Status: {connectionState}</Text>
      <Button title="Connect glasses" onPress={handleConnect} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: "center", gap: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  body: { fontSize: 15, color: "#444", lineHeight: 21 },
  status: { fontSize: 14, color: "#888" },
});
