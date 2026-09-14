import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/src/theme/colors";
import {
  CATEGORY_ORDER,
  type CategoryLabel,
} from "@/src/lib/format";

type Props = {
  selected: CategoryLabel | "All";
  onSelect: (value: CategoryLabel | "All") => void;
};

export function CategoryFilter({ selected, onSelect }: Props) {
  const options: (CategoryLabel | "All")[] = ["All", ...CATEGORY_ORDER];

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {options.map((option) => {
        const active = option === selected;
        return (
          <Pressable
            key={option}
            onPress={() => onSelect(option)}
            style={[styles.chip, active && styles.chipActive]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(162, 170, 173, 0.55)",
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  label: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 13,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: colors.navy,
  },
  labelActive: {
    color: colors.white,
  },
});
