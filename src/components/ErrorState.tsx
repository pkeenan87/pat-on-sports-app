import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  title: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, message, onRetry }: Props) {
  return (
    <View style={styles.centered} accessibilityRole="alert">
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.body}>{message}</Text> : null}
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          style={styles.button}
          accessibilityRole="button"
          accessibilityLabel="Retry"
        >
          <Text style={styles.buttonLabel}>Retry</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.paper,
    padding: 24,
    gap: 10,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    color: colors.navy,
    textAlign: "center",
  },
  body: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 14,
    color: colors.navyMuted,
    textAlign: "center",
  },
  button: {
    marginTop: 8,
    backgroundColor: colors.navy,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  buttonLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.white,
  },
});
