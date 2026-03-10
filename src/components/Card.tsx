import React from "react";
import { View, StyleSheet } from "react-native";
import { radius, shadow, spacing } from "../theme/theme";

export default function Card({ children }: any) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.light,
  },
});