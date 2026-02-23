import { Tabs } from "expo-router";
import { Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import PetSwitcher from "@/components/PetSwitcher";
import SitterPetSwitcher from "@/components/SitterPetSwitcher";
import React from "react";
import { usePets } from "@/lib/pet-context";

export default function TabLayout() {
  const C = Colors.dark;
  const { userRole, activeView } = usePets();

  const isSitterView = userRole === 'sitter' && activeView === 'sitter';
  const isVetView = userRole === 'vet' && activeView !== 'parent';

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      {isSitterView ? <SitterPetSwitcher /> : isVetView ? null : <PetSwitcher />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: C.accent,
          tabBarInactiveTintColor: C.tabIconDefault,
          tabBarStyle: {
            position: "absolute" as const,
            backgroundColor: Platform.select({
              ios: "transparent",
              android: C.tabBar,
              web: C.tabBar,
            }),
            borderTopWidth: 1,
            borderTopColor: '#E8E5DC',
            elevation: 0,
            height: Platform.OS === 'web' ? 84 : 88,
            paddingBottom: Platform.OS === 'web' ? 34 : 28,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter_500Medium',
            fontSize: 11,
            marginTop: 2,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={80}
                tint="light"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tracker"
          options={{
            title: isVetView ? "New Client" : "Tracker",
            tabBarIcon: ({ color, size }) => isVetView ? (
              <Ionicons name="person-add" size={22} color={color} />
            ) : (
              <Ionicons name="calendar" size={22} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="records"
          options={{
            title: isSitterView ? "Notifications" : "Records",
            tabBarIcon: ({ color, size }) => isSitterView ? (
              <Ionicons name="notifications" size={22} color={color} />
            ) : (
              <MaterialCommunityIcons name="clipboard-pulse" size={22} color={color} />
            ),
            ...(isVetView ? { href: null } : {}),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="paw" size={22} color={color} />
            ),
            ...(isSitterView || isVetView ? { href: null } : {}),
          }}
        />
      </Tabs>
    </View>
  );
}
