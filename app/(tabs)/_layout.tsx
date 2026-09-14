import { SymbolView } from "expo-symbols";
import { Tabs } from "expo-router";

import { colors } from "@/src/theme/colors";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.navyMuted,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: "rgba(162, 170, 173, 0.45)",
        },
        tabBarLabelStyle: {
          fontFamily: "BarlowCondensed_700Bold",
          fontSize: 11,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.navy,
        headerTitleStyle: {
          fontFamily: "BarlowCondensed_700Bold",
          fontSize: 22,
          letterSpacing: 0.6,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Latest",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "newspaper",
                android: "article",
                web: "article",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: "Archive",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "books.vertical",
                android: "menu_book",
                web: "menu_book",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="listen"
        options={{
          title: "Listen",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "headphones",
                android: "headphones",
                web: "headphones",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{
                ios: "info.circle",
                android: "info",
                web: "info",
              }}
              tintColor={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}
