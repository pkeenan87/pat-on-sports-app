import { StyleSheet, Text, type TextProps } from "react-native";

import { colors, categoryColorMap, type CategoryColorToken } from "@/src/theme/colors";
import type { ApiCategory } from "@/src/lib/api";

type Props = TextProps & {
  category: ApiCategory;
};

export function CategoryChip({ category, style, ...rest }: Props) {
  const backgroundColor =
    categoryColorMap[category.color as CategoryColorToken] ?? colors.navy;

  return (
    <Text
      {...rest}
      style={[styles.chip, { backgroundColor }, style]}
      accessibilityRole="text"
    >
      {category.label}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    overflow: "hidden",
    color: colors.white,
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
});
