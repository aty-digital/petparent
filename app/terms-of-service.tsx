import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const C = Colors.dark;

const LAST_UPDATED = 'February 13, 2026';

export default function TermsOfServiceScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

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
            testID="terms-back"
          >
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Text style={styles.intro}>
          Welcome to PetParent, powered by ATY Digital. By downloading, installing, or using the PetParent mobile application ("the app"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>1. About PetParent</Text>
        <Text style={styles.body}>
          PetParent is a pet health management tool designed to help pet parents track their pets' health through medical records, daily wellness logging, health task scheduling, and AI-powered symptom guidance. The app is intended for informational and organizational purposes only.
        </Text>

        <Text style={styles.sectionTitle}>2. Not a Substitute for Veterinary Care</Text>
        <Text style={styles.body}>
          PetParent is not a veterinary service, and the app does not provide veterinary medical advice, diagnosis, or treatment. The AI-powered symptom triage feature provides general guidance based on the symptoms you describe, but it is not a replacement for professional veterinary care.
        </Text>
        <Text style={styles.body}>
          You should always consult a licensed veterinarian for any health concerns about your pet. In an emergency, contact your nearest emergency veterinary clinic immediately. Never delay seeking professional veterinary care based on information provided by this app.
        </Text>

        <Text style={styles.sectionTitle}>3. Your Account</Text>
        <Text style={styles.body}>
          You are responsible for maintaining the security of your account credentials. Your account data is stored locally on your device and is not backed up to any external server. You are responsible for backing up your own data if needed.
        </Text>
        <Text style={styles.body}>
          You may delete your account at any time through the Settings screen. Account deletion is permanent and irreversible, and all associated data will be removed from your device.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
        <Text style={styles.body}>
          You agree to use PetParent only for its intended purpose of tracking and managing pet health information. You agree not to:
        </Text>
        <View style={styles.bulletList}>
          <Text style={styles.bulletItem}>Use the app for any unlawful purpose</Text>
          <Text style={styles.bulletItem}>Attempt to reverse-engineer, modify, or tamper with the app</Text>
          <Text style={styles.bulletItem}>Use the AI features to generate content unrelated to pet health</Text>
          <Text style={styles.bulletItem}>Misrepresent AI-generated triage results as professional veterinary advice</Text>
        </View>

        <Text style={styles.sectionTitle}>5. AI-Powered Features</Text>
        <Text style={styles.body}>
          The AI symptom triage and care tips features use third-party artificial intelligence services to generate responses. These responses are generated automatically and may not always be accurate, complete, or appropriate for your pet's specific situation.
        </Text>
        <Text style={styles.body}>
          We make no warranties regarding the accuracy, reliability, or suitability of AI-generated content. You use these features at your own discretion and risk. AI results should always be verified with a qualified veterinarian.
        </Text>

        <Text style={styles.sectionTitle}>6. Data and Privacy</Text>
        <Text style={styles.body}>
          Your use of PetParent is also governed by our Privacy Policy, which describes how we collect, use, and protect your information. By using the app, you consent to the practices described in the Privacy Policy.
        </Text>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.body}>
          The PetParent app, including its design, code, graphics, icons, and content, is protected by intellectual property laws. You may not copy, modify, distribute, or create derivative works based on the app without our prior written consent.
        </Text>

        <Text style={styles.sectionTitle}>8. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          PetParent is provided "as is" and "as available" without warranties of any kind, whether express or implied. We do not warrant that the app will be uninterrupted, error-free, or free of harmful components. We disclaim all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
        </Text>

        <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the fullest extent permitted by applicable law, PetParent and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the app, including but not limited to damages related to pet health decisions made based on app content or AI-generated guidance.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to These Terms</Text>
        <Text style={styles.body}>
          We reserve the right to update these Terms at any time. When we make changes, we will update the "Last updated" date at the top of this page. Your continued use of the app after changes are posted constitutes your acceptance of the revised Terms.
        </Text>

        <Text style={styles.sectionTitle}>11. Termination</Text>
        <Text style={styles.body}>
          We reserve the right to suspend or terminate your access to the app at any time, for any reason, without prior notice. You may stop using the app at any time by deleting your account and uninstalling the app.
        </Text>

        <Text style={styles.sectionTitle}>12. Governing Law</Text>
        <Text style={styles.body}>
          These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles.
        </Text>

        <Text style={styles.sectionTitle}>13. About Us</Text>
        <Text style={styles.body}>
          PetParent is powered by ATY Digital. ATY Digital owns, develops, and operates the PetParent application. All rights, title, and interest in the app are held by ATY Digital.
        </Text>

        <Text style={styles.sectionTitle}>14. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions about these Terms of Service, please contact us at:
        </Text>
        <Text style={styles.contact}>hello@atydigital.com</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.text,
  },
  updated: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    marginBottom: 16,
  },
  intro: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: C.text,
    marginBottom: 8,
    marginTop: 8,
  },
  body: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
    marginBottom: 12,
  },
  bulletList: {
    paddingLeft: 16,
    marginBottom: 12,
    gap: 6,
  },
  bulletItem: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 22,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: C.accent,
  },
  contact: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.accent,
    marginTop: 4,
    marginBottom: 20,
  },
});
