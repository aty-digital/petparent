import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const C = Colors.dark;

const LAST_UPDATED = 'February 13, 2026';

export default function PrivacyPolicyScreen() {
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
            testID="privacy-back"
          >
            <Ionicons name="chevron-back" size={26} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 26 }} />
        </View>

        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Text style={styles.intro}>
          PetParent, powered by ATY Digital ("we," "our," or "the app"), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use the PetParent mobile application.
        </Text>

        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.body}>
          When you create an account, we collect the name, email address, and password you provide during sign-up. We also collect the role you select (Pet Parent, Pet Sitter, or Veterinarian).
        </Text>
        <Text style={styles.body}>
          When you use the app, you may enter pet profile information (name, breed, species, weight, date of birth, gender, color, photo, and veterinary contact details), medical records (vet visits, vaccinations, medications), daily wellness logs (water, food, energy, mood, bathroom, sleep ratings), health task schedules (medications, vaccinations, supplements, checkups), and symptom descriptions submitted to the AI triage feature.
        </Text>

        <Text style={styles.sectionTitle}>2. How Your Data Is Stored</Text>
        <Text style={styles.body}>
          All of your pet data, medical records, wellness logs, health tasks, and account information are stored locally on your device using secure on-device storage. We do not upload or store your personal data or pet records on any external server or cloud database.
        </Text>
        <Text style={styles.body}>
          This means your data remains on the device where you use PetParent. If you uninstall the app or clear its data, your information will be permanently deleted.
        </Text>

        <Text style={styles.sectionTitle}>3. AI-Powered Features</Text>
        <Text style={styles.body}>
          PetParent includes AI-powered features: a symptom triage tool and breed-specific care tips. When you use these features, the information you submit (such as your pet's symptoms, breed, species, and age) is sent to a third-party AI service (OpenAI) to generate a response.
        </Text>
        <Text style={styles.body}>
          We send only the minimum information needed for the AI to provide useful guidance. We do not send your name, email, or other personal account details to the AI service. The AI-generated responses are for informational purposes only and are not a substitute for professional veterinary advice.
        </Text>

        <Text style={styles.sectionTitle}>4. Notifications</Text>
        <Text style={styles.body}>
          If you enable medication reminders or health task notifications, PetParent uses local push notifications on your device. These notifications are processed entirely on your device and are not routed through any external notification server.
        </Text>

        <Text style={styles.sectionTitle}>5. Photos</Text>
        <Text style={styles.body}>
          If you add a photo to your pet's profile, the image is stored locally on your device. We do not upload pet photos to any server.
        </Text>

        <Text style={styles.sectionTitle}>6. Data Sharing</Text>
        <Text style={styles.body}>
          We do not sell, rent, or share your personal information with third parties for marketing purposes. The only external data transmission occurs when you use the AI triage or care tips features, as described in Section 3 above.
        </Text>

        <Text style={styles.sectionTitle}>7. Account Deletion</Text>
        <Text style={styles.body}>
          You can delete your account at any time from the Settings screen. Deleting your account permanently removes all data associated with your account from your device, including all pet profiles, medical records, wellness logs, health tasks, triage history, and account credentials. This action cannot be undone.
        </Text>

        <Text style={styles.sectionTitle}>8. Children's Privacy</Text>
        <Text style={styles.body}>
          PetParent is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 has provided us with personal information, please contact us so we can take appropriate action.
        </Text>

        <Text style={styles.sectionTitle}>9. Security</Text>
        <Text style={styles.body}>
          We take reasonable measures to protect your information. Since your data is stored locally on your device, its security depends on your device's own security measures (passcode, biometrics, encryption). We recommend keeping your device secure and up to date.
        </Text>

        <Text style={styles.sectionTitle}>10. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. We encourage you to review this policy periodically.
        </Text>

        <Text style={styles.sectionTitle}>11. About Us</Text>
        <Text style={styles.body}>
          PetParent is powered by ATY Digital. ATY Digital is responsible for the development, operation, and maintenance of the PetParent application.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions or concerns about this Privacy Policy or your data, please contact us at:
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
  contact: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.accent,
    marginTop: 4,
    marginBottom: 20,
  },
});
