import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { PetProvider, usePets } from "@/lib/pet-context";
import OnboardingScreen from "@/components/OnboardingScreen";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

function MainStack() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF8F0' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="triage" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="triage-result" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="add-record" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="add-task" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="add-pet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="daily-tracker" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="edit-pet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
    </Stack>
  );
}

function RootLayoutNav() {
  const { isLoading, onboardingComplete } = usePets();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return <OnboardingScreen />;
  }

  return <MainStack />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <PetProvider>
              <StatusBar style="dark" />
              <RootLayoutNav />
            </PetProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
