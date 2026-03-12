import { QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { Asset } from "expo-asset";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { StatusBar } from "expo-status-bar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/lib/query-client";
import { PetProvider, usePets } from "@/lib/pet-context";
import { SubscriptionProvider } from "@/lib/subscription-context";
import { NotificationProvider } from "@/lib/notification-context";
import SwoopNotification from "@/components/SwoopNotification";
import SitterNoteModal from "@/components/SitterNoteModal";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";

SplashScreen.preventAutoHideAsync();

const ONBOARDING_ALLOWED_ROUTES = ['onboarding', 'privacy-policy', 'terms-of-service', 'support'];

function RootLayoutNav() {
  const { isLoading, onboardingComplete } = usePets();
  const segments = useSegments();
  const currentRoute = segments[0] ?? '';

  const needsRedirectToOnboarding = !onboardingComplete && !ONBOARDING_ALLOWED_ROUTES.includes(currentRoute);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FAF8F0', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#FAF8F0' } }}>
        <Stack.Screen name="onboarding" options={{ animation: 'none' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="triage" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="triage-result" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-record" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-task" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="add-pet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="daily-tracker" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="edit-pet" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="settings" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="privacy-policy" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="terms-of-service" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="support" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      {needsRedirectToOnboarding && <Redirect href="/onboarding" />}
      {onboardingComplete && <SwoopNotification />}
      {onboardingComplete && <SitterNoteModal />}
    </>
  );
}

const onboardingImages = [
  require('@/assets/images/pack-title.png'),
  require('@/assets/images/paw-yellow.png'),
  require('@/assets/images/paw-blue.png'),
  require('@/assets/images/testimonial-avatar.png'),
  require('@/assets/images/pet-emojis.png'),
  require('@/assets/images/bell-notification.png'),
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    Asset.loadAsync(onboardingImages).then(() => setImagesLoaded(true)).catch(() => setImagesLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && imagesLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, imagesLoaded]);

  if (!fontsLoaded || !imagesLoaded) return null;

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <PetProvider>
              <SubscriptionProvider>
                <NotificationProvider>
                  <StatusBar style="dark" />
                  <RootLayoutNav />
                </NotificationProvider>
              </SubscriptionProvider>
            </PetProvider>
          </KeyboardProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
