import Markdown from "react-native-markdown-display";
import { StyleSheet } from "react-native";

import { colors } from "@/src/theme/colors";

type Props = {
  markdown: string;
};

export function ArticleMarkdown({ markdown }: Props) {
  return <Markdown style={markdownStyles}>{markdown}</Markdown>;
}

const markdownStyles = StyleSheet.create({
  body: {
    fontFamily: "IBMPlexSans_400Regular",
    fontSize: 17,
    lineHeight: 28,
    color: colors.ink,
  },
  heading1: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 30,
    letterSpacing: 0.4,
    color: colors.navy,
    marginTop: 20,
    marginBottom: 8,
  },
  heading2: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 24,
    letterSpacing: 0.4,
    color: colors.navy,
    marginTop: 22,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(162, 170, 173, 0.5)",
    paddingBottom: 6,
  },
  heading3: {
    fontFamily: "BarlowCondensed_700Bold",
    fontSize: 20,
    color: colors.navy,
    marginTop: 18,
    marginBottom: 6,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 14,
  },
  link: {
    color: colors.navy,
    textDecorationLine: "underline",
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: colors.red,
    paddingLeft: 12,
    marginVertical: 10,
    fontStyle: "italic",
    color: colors.navyMuted,
  },
  bullet_list: {
    marginBottom: 12,
  },
  ordered_list: {
    marginBottom: 12,
  },
  list_item: {
    marginVertical: 4,
  },
  strong: {
    fontFamily: "IBMPlexSans_600SemiBold",
    fontWeight: "600",
  },
  em: {
    fontStyle: "italic",
  },
  code_inline: {
    fontFamily: "IBMPlexSans_500Medium",
    backgroundColor: "rgba(162, 170, 173, 0.2)",
    paddingHorizontal: 4,
    borderRadius: 4,
  },
});
