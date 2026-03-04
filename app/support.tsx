import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const C = Colors.dark;

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const openWebsite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://atydigital.com');
  };

  const openEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('mailto:hello@atydigital.com');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: bottomInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            hitSlop={12}
            testID="support-back"
          >
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Support</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="help-buoy" size={36} color={C.accent} />
          </View>
          <Text style={styles.heroTitle}>Need Help?</Text>
          <Text style={styles.heroSubtitle}>
            We're here to help you and your pets. Reach out to us anytime.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIconRow}>
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(45, 106, 79, 0.08)' }]}>
              <Ionicons name="mail" size={22} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Email Us</Text>
              <Text style={styles.cardDescription}>
                Send us a message and we'll get back to you as soon as possible.
              </Text>
            </View>
          </View>
          <Pressable onPress={openEmail} style={styles.cardButton} testID="support-email">
            <Ionicons name="mail-outline" size={18} color="#FFFFFF" />
            <Text style={styles.cardButtonText}>hello@atydigital.com</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <View style={styles.cardIconRow}>
            <View style={[styles.cardIcon, { backgroundColor: 'rgba(45, 106, 79, 0.08)' }]}>
              <Ionicons name="globe" size={22} color={C.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardLabel}>Visit Our Website</Text>
              <Text style={styles.cardDescription}>
                Learn more about ATY Digital and our products.
              </Text>
            </View>
          </View>
          <Pressable onPress={openWebsite} style={styles.cardButton} testID="support-website">
            <Ionicons name="open-outline" size={18} color="#FFFFFF" />
            <Text style={styles.cardButtonText}>atydigital.com</Text>
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Powered by ATY Digital
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.text,
    letterSpacing: -0.3,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(45, 106, 79, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 106, 79, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: C.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 20,
    marginBottom: 16,
  },
  cardIconRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: C.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textSecondary,
    lineHeight: 19,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.accent,
    borderRadius: 100,
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  cardButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  footerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
});
