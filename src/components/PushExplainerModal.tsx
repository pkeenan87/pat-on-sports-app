import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  visible: boolean;
  onTurnOn: () => void;
  onNotNow: () => void;
};

export function PushExplainerModal({ visible, onTurnOn, onNotNow }: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onNotNow}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.title}>New post alerts</Text>
          <Text style={styles.body}>
            One notification when a new post is published. A couple a week in
            season, nothing else.
          </Text>
          <Pressable
            onPress={onTurnOn}
            style={styles.primaryButton}
            accessibilityRole="button"
            accessibilityLabel="Turn on"
          >
            <Text style={styles.primaryLabel}>Turn on</Text>
          </Pressable>
          <Pressable
            onPress={onNotNow}
            style={styles.secondaryButton}
            accessibilityRole="button"
            accessibilityLabel="Not now"
          >
            <Text style={styles.secondaryLabel}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(8, 22, 40, 0.55)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.paper,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: 14,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 28,
    letterSpacing: 0.4,
    color: colors.navy,
  },
  body: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    lineHeight: 24,
    color: colors.navyMuted,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: colors.navy,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 8,
  },
  primaryLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 18,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.paper,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryLabel: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 16,
    color: colors.navyMuted,
  },
});
