import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, TextInput,
  KeyboardAvoidingView, ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';

const C = Colors.dark;

export default function AcceptInviteScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { acceptInviteCode, sharedPets } = usePets();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [petName, setPetName] = useState('');

  const handleAccept = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter an invite code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError('');
    setLoading(true);

    const prevCount = sharedPets.length;
    const result = await acceptInviteCode(trimmed);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => {
        if (router.canGoBack()) {
          router.back();
        }
      }, 1800);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Something went wrong.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Pet Added!</Text>
          <Text style={styles.successSubtitle}>
            You now have access to the shared pet profile.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 24 }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            hitSlop={12}
            style={styles.backBtn}
            testID="accept-invite-back"
          >
            <Ionicons name="arrow-back" size={26} color={C.text} />
          </Pressable>

          <View style={styles.heroSection}>
            <View style={styles.iconBadge}>
              <MaterialCommunityIcons name="link-variant" size={32} color={C.accent} />
            </View>
            <Text style={styles.title}>Add a Shared Pet</Text>
            <Text style={styles.subtitle}>
              Enter the invite code from the pet parent to access their pet's profile
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>INVITE CODE</Text>
            <TextInput
              style={styles.codeInput}
              value={code}
              onChangeText={(text) => {
                setCode(text.toUpperCase());
                if (error) setError('');
              }}
              placeholder="ENTER CODE"
              placeholderTextColor={C.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              textAlign="center"
              returnKeyType="done"
              onSubmitEditing={handleAccept}
              editable={!loading}
              testID="accept-invite-input"
            />

            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle" size={16} color={C.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleAccept}
              disabled={loading || !code.trim()}
              style={({ pressed }) => [
                styles.acceptBtnWrapper,
                (loading || !code.trim()) && { opacity: 0.5 },
                pressed && { opacity: 0.85 },
              ]}
              testID="accept-invite-btn"
            >
              <LinearGradient
                colors={[C.gradient.start, C.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.acceptBtn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.acceptBtnText}>Accept Invite</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>

          <View style={styles.hintSection}>
            <MaterialCommunityIcons name="information-outline" size={16} color={C.textMuted} />
            <Text style={styles.hintText}>
              Ask the pet parent to share their invite code with you. Codes expire after 7 days.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 24,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: C.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  formSection: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    padding: 24,
    gap: 16,
  },
  inputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: -4,
  },
  codeInput: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: C.text,
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    paddingVertical: 18,
    paddingHorizontal: 16,
    letterSpacing: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.danger,
    flex: 1,
  },
  acceptBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 14,
  },
  acceptBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  hintSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 8,
  },
  hintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textMuted,
    flex: 1,
    lineHeight: 19,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: C.text,
    marginBottom: 10,
  },
  successSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
