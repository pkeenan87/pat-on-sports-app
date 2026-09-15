import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { usePushAlerts } from "@/src/push/PushAlertsProvider";
import { colors } from "@/src/theme/colors";

const LINKS = [
  { label: "Website", url: "https://patonsports.com" },
  { label: "RSS", url: "https://patonsports.com/rss.xml" },
  { label: "Privacy", url: "https://patonsports.com/privacy" },
  { label: "Support", url: "https://patonsports.com/support" },
] as const;

export default function AboutScreen() {
  const { alertsEnabled, enableAlerts, disableAlerts } = usePushAlerts();
  const [toggling, setToggling] = useState(false);

  const onAlertsChange = useCallback(
    (next: boolean) => {
      void (async () => {
        setToggling(true);
        try {
          if (next) {
            await enableAlerts();
          } else {
            await disableAlerts();
          }
        } finally {
          setToggling(false);
        }
      })();
    },
    [enableAlerts, disableAlerts]
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>About</Text>
      <Text style={styles.title}>Weekly recaps, without the noise.</Text>

      <View style={styles.copy}>
        <Text style={styles.paragraph}>
          Pat on Sports is a one-person column on the New England Patriots and,
          this year, the UCLA Bruins. Each week I write a recap of the previous
          game — what worked, what didn’t, and what it means for the rest of the
          season.
        </Text>
        <Text style={styles.paragraph}>
          Patriots posts stay in the Pros & Cons format. UCLA recaps follow the
          Bruins week to week. When the slate is bigger than one game, I’ll also
          write a preview. The archive is the whole 2025 Patriots run, from the
          opener in Las Vegas through the playoffs, plus UCLA as the 2026 season
          goes.
        </Text>
        <Text style={styles.paragraph}>
          Independent commentary. Not affiliated with the NFL, the New England
          Patriots, the NCAA, or UCLA.
        </Text>
      </View>

      <View style={styles.settings}>
        <View style={styles.settingRow}>
          <View style={styles.settingCopy}>
            <Text style={styles.settingLabel}>New post alerts</Text>
            <Text style={styles.settingHint}>
              One notification when a new post is published.
            </Text>
          </View>
          {toggling ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Switch
              value={alertsEnabled}
              onValueChange={onAlertsChange}
              trackColor={{ false: colors.silver, true: colors.navy }}
              thumbColor={colors.white}
              accessibilityLabel="New post alerts"
            />
          )}
        </View>
      </View>

      <View style={styles.links}>
        {LINKS.map((link) => (
          <Pressable
            key={link.url}
            onPress={() => {
              void WebBrowser.openBrowserAsync(link.url);
            }}
            style={styles.linkRow}
            accessibilityRole="link"
          >
            <Text style={styles.linkLabel}>{link.label}</Text>
            <Text style={styles.linkArrow}>→</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 16,
  },
  eyebrow: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: colors.red,
  },
  title: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 34,
    letterSpacing: 0.4,
    color: colors.navy,
  },
  copy: {
    gap: 14,
  },
  paragraph: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 17,
    lineHeight: 28,
    color: colors.navyMuted,
  },
  settings: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(162, 170, 173, 0.55)",
    paddingTop: 4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(162, 170, 173, 0.45)",
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 18,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.navy,
  },
  settingHint: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 13,
    lineHeight: 18,
    color: colors.navyMuted,
  },
  links: {
    marginTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(162, 170, 173, 0.55)",
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(162, 170, 173, 0.45)",
  },
  linkLabel: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 18,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: colors.navy,
  },
  linkArrow: {
    fontFamily: "IBMPlexSans_500Medium",
    fontSize: 18,
    color: colors.red,
  },
});
