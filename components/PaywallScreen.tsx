import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, ScrollView,
  Animated, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useSubscription } from '@/lib/subscription-context';
import { usePets, type UserRole } from '@/lib/pet-context';

const C = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PlanSelection = 'free' | 'monthly' | 'annual';

interface PaywallScreenProps {
  onComplete: () => void;
  showBackButton?: boolean;
  onBack?: () => void;
}

const PARENT_FREE_FEATURES = [
  { text: '1 pet profile', included: true },
  { text: '3 AI triage sessions/month', included: true },
  { text: 'Daily wellness logging', included: true },
  { text: 'Health task tracking', included: true },
];

const PARENT_PREMIUM_FEATURES = [
  { text: 'Unlimited pet profiles', included: true },
  { text: 'Unlimited AI triage sessions', included: true },
  { text: 'Daily wellness logging', included: true },
  { text: 'Health task tracking', included: true },
  { text: 'Priority support', included: true },
];

const SITTER_FREE_FEATURES = [
  { text: '1 pet profile (owned or shared)', included: true },
  { text: '3 AI triage sessions/month', included: true },
  { text: 'Add sitter notes & updates', included: true },
];

const SITTER_PREMIUM_FEATURES = [
  { text: 'Unlimited pet profiles', included: true },
  { text: 'Unlimited shared pets', included: true },
  { text: 'Unlimited AI triage sessions', included: true },
  { text: 'Add sitter notes & updates', included: true },
  { text: 'Priority support', included: true },
];

const PRICING = {
  parent: { monthly: '$5.99', annual: '$49.99', monthlyEquiv: '$4.17', save: '~30%' },
  sitter: { monthly: '$6.99', annual: '$69.99', monthlyEquiv: '$5.83', save: '~30%' },
  vet: { monthly: '$5.99', annual: '$49.99', monthlyEquiv: '$4.17', save: '~30%' },
};

export default function PaywallScreen({ onComplete, showBackButton, onBack }: PaywallScreenProps) {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { purchasePackage, monthlyPackage, annualPackage, setPaywallComplete, restorePurchases } = useSubscription();
  const { userRole } = usePets();

  const roleKey = userRole === 'sitter' ? 'sitter' : userRole === 'vet' ? 'vet' : 'parent';
  const pricing = PRICING[roleKey];
  const FREE_FEATURES = roleKey === 'sitter' ? SITTER_FREE_FEATURES : PARENT_FREE_FEATURES;
  const PREMIUM_FEATURES = roleKey === 'sitter' ? SITTER_PREMIUM_FEATURES : PARENT_PREMIUM_FEATURES;
  const subtitleText = roleKey === 'sitter'
    ? 'Unlock unlimited pet profiles and shared pet access for your sitting business'
    : 'Unlock the full potential of PetParent for all your furry friends';

  const [selectedPlan, setSelectedPlan] = useState<PlanSelection>('annual');
  const [purchasing, setPurchasing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.spring(badgeScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true, delay: 300 }).start();
  }, []);

  const handleContinue = async () => {
    if (selectedPlan === 'free') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setPaywallComplete();
      onComplete();
      return;
    }

    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pkg = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;

    if (!pkg) {
      await setPaywallComplete();
      onComplete();
      setPurchasing(false);
      return;
    }

    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await setPaywallComplete();
        onComplete();
      }
    } catch (e) {
      Alert.alert('Purchase Failed', 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchasing(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Restored', 'Your premium subscription has been restored.');
        await setPaywallComplete();
        onComplete();
      } else {
        Alert.alert('No Subscription Found', 'We could not find an active subscription to restore.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const selectPlan = (plan: PlanSelection) => {
    Haptics.selectionAsync();
    setSelectedPlan(plan);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: bottomInset + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {showBackButton && (
          <Pressable onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
        )}

        <Animated.View style={[styles.headerSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.crownCircle}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>
            {subtitleText}
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <Pressable
            style={[styles.planCard, selectedPlan === 'annual' && styles.planCardSelected]}
            onPress={() => selectPlan('annual')}
            testID="plan-annual"
          >
            <Animated.View style={[styles.saveBadge, { transform: [{ scale: badgeScale }] }]}>
              <Text style={styles.saveBadgeText}>Save {pricing.save}</Text>
            </Animated.View>

            <View style={styles.planCardHeader}>
              <View style={[styles.radioOuter, selectedPlan === 'annual' && styles.radioOuterSelected]}>
                {selectedPlan === 'annual' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.planCardInfo}>
                <Text style={[styles.planName, selectedPlan === 'annual' && styles.planNameSelected]}>
                  Annual
                </Text>
                <Text style={styles.planSubtext}>Best value</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={[styles.planPrice, selectedPlan === 'annual' && styles.planPriceSelected]}>
                  {pricing.annual}
                </Text>
                <Text style={styles.planPeriod}>/year</Text>
              </View>
            </View>

            <View style={styles.planMonthlyBreakdown}>
              <Text style={styles.monthlyEquiv}>{pricing.monthlyEquiv}/month</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.planCard, selectedPlan === 'monthly' && styles.planCardSelected]}
            onPress={() => selectPlan('monthly')}
            testID="plan-monthly"
          >
            <View style={styles.planCardHeader}>
              <View style={[styles.radioOuter, selectedPlan === 'monthly' && styles.radioOuterSelected]}>
                {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
              </View>
              <View style={styles.planCardInfo}>
                <Text style={[styles.planName, selectedPlan === 'monthly' && styles.planNameSelected]}>
                  Monthly
                </Text>
                <Text style={styles.planSubtext}>Flexible</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={[styles.planPrice, selectedPlan === 'monthly' && styles.planPriceSelected]}>
                  {pricing.monthly}
                </Text>
                <Text style={styles.planPeriod}>/month</Text>
              </View>
            </View>
          </Pressable>

          <View style={styles.premiumFeatures}>
            <Text style={styles.featuresLabel}>Premium includes:</Text>
            {PREMIUM_FEATURES.map((f) => (
              <View key={f.text} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={C.accent} />
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={handleContinue}
            disabled={purchasing}
            testID="paywall-continue"
          >
            <LinearGradient
              colors={selectedPlan !== 'free' ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.continueBtn}
            >
              {purchasing ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={[styles.continueBtnText, selectedPlan === 'free' && { color: C.text }]}>
                    {selectedPlan === 'free' ? 'Continue with Free' : 'Subscribe Now'}
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={selectedPlan !== 'free' ? '#FFFFFF' : C.text}
                  />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          <Pressable
            style={styles.freeOption}
            onPress={() => {
              selectPlan('free');
              setTimeout(async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await setPaywallComplete();
                onComplete();
              }, 100);
            }}
            testID="plan-free"
          >
            <Text style={styles.freeOptionText}>Continue with Free Plan</Text>
          </Pressable>

          <View style={styles.freeFeatures}>
            {FREE_FEATURES.map((f) => (
              <View key={f.text} style={styles.freeFeatureRow}>
                <Feather name="check" size={14} color={C.textMuted} />
                <Text style={styles.freeFeatureText}>{f.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.bottomLinks}>
            <Pressable onPress={handleRestore}>
              <Text style={styles.linkText}>Restore Purchases</Text>
            </Pressable>
          </View>

          <Text style={styles.legalText}>
            Payment will be charged to your Apple ID account at confirmation of purchase.
            Subscription automatically renews unless auto-renew is turned off at least
            24-hours before the end of the current period. Your account will be charged
            for renewal within 24-hours prior to the end of the current period.
          </Text>
        </Animated.View>
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
    paddingHorizontal: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  crownCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  planCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: C.cardBorder,
    position: 'relative' as const,
    overflow: 'visible' as const,
  },
  planCardSelected: {
    borderColor: C.accent,
    backgroundColor: 'rgba(45, 106, 79, 0.04)',
  },
  saveBadge: {
    position: 'absolute' as const,
    top: -11,
    right: 16,
    backgroundColor: C.warning,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  saveBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  planCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.cardBorder,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 12,
  },
  radioOuterSelected: {
    borderColor: C.accent,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.accent,
  },
  planCardInfo: {
    flex: 1,
  },
  planName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: C.text,
  },
  planNameSelected: {
    color: C.accent,
  },
  planSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    marginTop: 1,
  },
  planPricing: {
    alignItems: 'flex-end' as const,
  },
  planPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: C.text,
  },
  planPriceSelected: {
    color: C.accent,
  },
  planPeriod: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    marginTop: -2,
  },
  planMonthlyBreakdown: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.cardBorder,
    alignItems: 'center' as const,
  },
  monthlyEquiv: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.accent,
  },
  premiumFeatures: {
    marginTop: 8,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  featuresLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  featureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
  },
  continueBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  continueBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  dividerRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginVertical: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.cardBorder,
  },
  dividerText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textMuted,
  },
  freeOption: {
    alignItems: 'center' as const,
    paddingVertical: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  freeOptionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: C.textSecondary,
  },
  freeFeatures: {
    marginTop: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  freeFeatureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    gap: 8,
  },
  freeFeatureText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textMuted,
  },
  bottomLinks: {
    flexDirection: 'row' as const,
    justifyContent: 'center',
    marginTop: 20,
    gap: 20,
  },
  linkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.accent,
    textDecorationLine: 'underline' as const,
  },
  legalText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center' as const,
    lineHeight: 15,
    marginTop: 16,
    paddingHorizontal: 8,
  },
});
