import { StyleSheet, Text } from "react-native";

import { colors } from "@/src/theme/colors";
import { formatScoreline } from "@/src/lib/format";

type Props = {
  result: "W" | "L" | "T";
  scoreUs: number;
  scoreThem: number;
};

export function ScorelineBadge({ result, scoreUs, scoreThem }: Props) {
  const color =
    result === "W" ? colors.navy : result === "L" ? colors.red : colors.navyMuted;

  return (
    <Text style={[styles.badge, { color }]} accessibilityRole="text">
      {formatScoreline(result, scoreUs, scoreThem)}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 1.6,
  },
});
