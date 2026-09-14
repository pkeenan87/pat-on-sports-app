import { useRef, useState } from "react";
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { ProsConsSections } from "@/src/lib/api";
import { colors } from "@/src/theme/colors";

type Props = {
  prosCons: ProsConsSections;
};

const CARD_GAP = 12;

export function ProsConsCards({ prosCons }: Props) {
  const [pageWidth, setPageWidth] = useState(
    Dimensions.get("window").width - 32
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const onMomentumScrollEnd = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / (pageWidth + CARD_GAP));
    setActiveIndex(Math.min(1, Math.max(0, index)));
  };

  return (
    <View style={styles.wrap}>
      {prosCons.intro.map((block, index) => {
        if (block.type === "heading") {
          return (
            <Text key={`h-${index}`} style={styles.introHeading}>
              {block.text}
            </Text>
          );
        }
        if (block.type === "list") {
          return (
            <View key={`l-${index}`} style={styles.introList}>
              {block.items.map((item) => (
                <Text key={item} style={styles.introParagraph}>
                  • {item}
                </Text>
              ))}
            </View>
          );
        }
        return (
          <Text key={`p-${index}`} style={styles.introParagraph}>
            {block.text}
          </Text>
        );
      })}

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        decelerationRate="fast"
        snapToInterval={pageWidth + CARD_GAP}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setPageWidth(e.nativeEvent.layout.width)}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentContainerStyle={styles.row}
        accessibilityLabel="Pros and cons cards"
      >
        <View style={[styles.card, styles.prosCard, { width: pageWidth }]}>
          <Text style={[styles.cardLabel, styles.prosLabel]}>Pros</Text>
          {prosCons.pros.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Text style={styles.bullet}>+</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.card, styles.consCard, { width: pageWidth }]}>
          <Text style={[styles.cardLabel, styles.consLabel]}>Cons</Text>
          {prosCons.cons.map((item) => (
            <View key={item} style={styles.itemRow}>
              <Text style={styles.bullet}>−</Text>
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.dots} accessibilityElementsHidden>
        <View style={[styles.dot, activeIndex === 0 && styles.dotActive]} />
        <View style={[styles.dot, activeIndex === 1 && styles.dotActive]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 14,
  },
  introHeading: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 22,
    color: colors.navy,
    letterSpacing: 0.3,
  },
  introParagraph: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 16,
    lineHeight: 26,
    color: colors.navyMuted,
  },
  introList: {
    gap: 6,
  },
  row: {
    gap: CARD_GAP,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  prosCard: {
    backgroundColor: colors.white,
    borderColor: "rgba(12, 35, 64, 0.18)",
  },
  consCard: {
    backgroundColor: colors.white,
    borderColor: "rgba(200, 16, 46, 0.22)",
  },
  cardLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 18,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  prosLabel: {
    color: colors.navy,
  },
  consLabel: {
    color: colors.red,
  },
  itemRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
  },
  bullet: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 18,
    color: colors.navy,
    lineHeight: 24,
    width: 16,
  },
  itemText: {
    flex: 1,
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: "rgba(162, 170, 173, 0.55)",
  },
  dotActive: {
    backgroundColor: colors.navy,
  },
});
