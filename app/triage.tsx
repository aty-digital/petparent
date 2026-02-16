import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView, Modal,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { usePets, generateId } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import { apiRequest } from '@/lib/query-client';
import type { TriageResult } from '@/lib/types';

const TRIAGE_DISCLAIMER_KEY = '@pawguard_triage_disclaimer_accepted';

const C = Colors.dark;

const QUICK_SYMPTOMS = [
  'Not eating or drinking',
  'Vomiting or diarrhea',
  'Limping or difficulty walking',
  'Excessive scratching',
  'Lethargy or weakness',
  'Difficulty breathing',
  'Unusual swelling',
  'Eye or ear discharge',
];

export default function TriageScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, addTriageResult, addRecord } = usePets();
  const { canUseTriageThisMonth, triageUsedThisMonth, maxFreeTriagePerMonth, tier, recordTriageUsage, monthlyPackage, annualPackage, purchasePackage, restorePurchases } = useSubscription();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const triageAllowed = canUseTriageThisMonth();

  useEffect(() => {
    AsyncStorage.getItem(TRIAGE_DISCLAIMER_KEY).then(val => {
      if (val !== 'true') setShowDisclaimer(true);
    });
  }, []);

  const acceptDisclaimer = async () => {
    await AsyncStorage.setItem(TRIAGE_DISCLAIMER_KEY, 'true');
    setShowDisclaimer(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTriage = async () => {
    if (!symptoms.trim() || !activePet) return;
    if (!triageAllowed && tier === 'free') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowPaywall(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);
    setError('');

    try {
      const age = getAge(activePet.birthDate);
      const res = await apiRequest('POST', '/api/triage', {
        symptoms: symptoms.trim(),
        petName: activePet.name,
        breed: activePet.breed,
        species: activePet.species,
        age,
        weight: `${activePet.weight} ${activePet.weightUnit}`,
      });
      const data = await res.json();

      const result: TriageResult = {
        id: generateId(),
        petId: activePet.id,
        date: new Date().toISOString(),
        description: symptoms.trim(),
        urgency: data.urgency || 'low',
        urgencyLabel: data.urgencyLabel || 'Assessment Complete',
        urgencyMessage: data.urgencyMessage || '',
        analysisSummary: data.analysisSummary || '',
        keyFindings: data.keyFindings || [],
        actionSteps: data.actionSteps || [],
        disclaimer: data.disclaimer || 'This is AI guidance and not a substitute for professional veterinary care.',
      };

      await addTriageResult(result);
      await recordTriageUsage();
      await addRecord({
        id: generateId(),
        petId: activePet.id,
        type: 'triage',
        title: 'Symptom Triage Log',
        description: `${result.urgencyLabel}: ${symptoms.trim().substring(0, 100)}`,
        date: new Date().toISOString(),
        status: result.urgency,
      });

      router.replace({ pathname: '/triage-result', params: { resultId: result.id } });
    } catch (e) {
      setError('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addQuickSymptom = (s: string) => {
    Haptics.selectionAsync();
    setSymptoms(prev => prev ? `${prev}, ${s.toLowerCase()}` : s);
  };

  const monthlyPrice = monthlyPackage?.product?.priceString || '$4.99/month';
  const annualPrice = annualPackage?.product?.priceString || '$29.99/year';
  const annualMonthly = annualPackage?.product?.price
    ? `$${(annualPackage.product.price / 12).toFixed(2)}/mo`
    : '$2.50/mo';
  const savingsPercent = (monthlyPackage?.product?.price && annualPackage?.product?.price)
    ? Math.round(100 - ((annualPackage.product.price / 12) / monthlyPackage.product.price) * 100)
    : 50;

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      setShowPaywall(false);
      return;
    }
    setPurchasing(true);
    try {
      const success = await purchasePackage(pkg);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowPaywall(false);
      }
    } catch (_e) {
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowPaywall(false);
      }
    } catch (_e) {
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <Modal
        visible={showDisclaimer}
        animationType="fade"
        transparent
        statusBarTranslucent
      >
        <View style={styles.disclaimerOverlay}>
          <View style={styles.disclaimerCard}>
            <View style={styles.disclaimerIconWrap}>
              <MaterialCommunityIcons name="stethoscope" size={32} color={C.accent} />
            </View>
            <Text style={styles.disclaimerTitle}>Important Notice</Text>
            <Text style={styles.disclaimerBody}>
              The AI Symptom Triage feature provides general guidance only. It is{' '}
              <Text style={{ fontFamily: 'Inter_700Bold' }}>not a substitute for professional veterinary care</Text>.
            </Text>
            <Text style={styles.disclaimerBody}>
              Always consult a licensed veterinarian for any health concerns about your pet. In an emergency, contact your nearest emergency veterinary clinic immediately.
            </Text>
            <Text style={styles.disclaimerBody}>
              AI-generated assessments may not always be accurate and should never be used to delay seeking professional veterinary advice.
            </Text>

            <Pressable
              style={styles.disclaimerCheckRow}
              onPress={() => {
                Haptics.selectionAsync();
                setDisclaimerChecked(!disclaimerChecked);
              }}
            >
              <View style={[styles.disclaimerCheckbox, disclaimerChecked && styles.disclaimerCheckboxActive]}>
                {disclaimerChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={styles.disclaimerCheckText}>I understand this is not veterinary advice</Text>
            </Pressable>

            <Pressable
              style={[styles.disclaimerAcceptBtn, !disclaimerChecked && { opacity: 0.4 }]}
              onPress={acceptDisclaimer}
              disabled={!disclaimerChecked}
            >
              <Text style={styles.disclaimerAcceptText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topInset + 12, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={C.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Symptom Triage</Text>
            <View style={{ width: 40 }} />
          </View>

          {activePet && (
            <View style={styles.petBadge}>
              <View style={styles.petBadgeAvatar}>
                <Ionicons name="paw" size={16} color={C.accent} />
              </View>
              <Text style={styles.petBadgeName}>{activePet.name}</Text>
              <Text style={styles.petBadgeBreed}>{activePet.breed} {'\u00B7'} {getAge(activePet.birthDate)}</Text>
            </View>
          )}

          {tier === 'free' && (
            <View style={{
              backgroundColor: triageAllowed ? C.accentSoft : C.dangerSoft,
              borderRadius: 12,
              padding: 14,
              marginBottom: 16,
              flexDirection: 'row' as const,
              alignItems: 'center',
              gap: 10,
            }}>
              <Ionicons
                name={triageAllowed ? 'information-circle' : 'lock-closed'}
                size={20}
                color={triageAllowed ? C.accent : C.danger}
              />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: triageAllowed ? C.text : C.danger,
                }}>
                  {triageAllowed
                    ? `${triageUsedThisMonth} of ${maxFreeTriagePerMonth} free sessions used this month`
                    : `Monthly limit reached (${maxFreeTriagePerMonth}/${maxFreeTriagePerMonth})`
                  }
                </Text>
                {!triageAllowed && (
                  <Text style={{
                    fontFamily: 'Inter_400Regular',
                    fontSize: 12,
                    color: C.textMuted,
                    marginTop: 2,
                  }}>
                    Upgrade to Premium for unlimited triage sessions
                  </Text>
                )}
              </View>
            </View>
          )}

          <Text style={styles.label}>Describe the symptoms</Text>
          <Text style={styles.sublabel}>Be as detailed as possible - include when symptoms started, severity, and any changes in behavior.</Text>

          <TextInput
            style={styles.input}
            value={symptoms}
            onChangeText={setSymptoms}
            placeholder="e.g., My dog has been limping on their front left paw since this morning. They whimper when I touch it..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />

          <Text style={styles.quickLabel}>Quick Add Symptoms</Text>
          <View style={styles.quickChips}>
            {QUICK_SYMPTOMS.map(s => (
              <Pressable key={s} style={styles.quickChip} onPress={() => addQuickSymptom(s)}>
                <Ionicons name="add" size={14} color={C.accent} />
                <Text style={styles.quickChipText}>{s}</Text>
              </Pressable>
            ))}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={C.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleTriage}
            disabled={!symptoms.trim() || loading}
            style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
          >
            <LinearGradient
              colors={symptoms.trim() && !loading ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color={C.background} />
              ) : (
                <>
                  <MaterialCommunityIcons name="stethoscope" size={18} color={symptoms.trim() ? C.background : C.textMuted} />
                  <Text style={[styles.submitText, !symptoms.trim() && { color: C.textMuted }]}>Analyze Symptoms</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.disclaimer}>
            This AI triage tool provides general guidance only and is not a substitute for professional veterinary care. Always consult your veterinarian for medical advice.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showPaywall}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => !purchasing && setShowPaywall(false)}
      >
        <View style={pw.overlay}>
          <View style={pw.sheet}>
            <Pressable style={pw.closeBtn} onPress={() => !purchasing && setShowPaywall(false)}>
              <Ionicons name="close" size={22} color={C.textMuted} />
            </Pressable>

            <View style={pw.iconBadge}>
              <Ionicons name="star" size={28} color="#FFB800" />
            </View>
            <Text style={pw.title}>Upgrade to Premium</Text>
            <Text style={pw.subtitle}>
              You've used all {maxFreeTriagePerMonth} free triage sessions this month. Unlock unlimited AI symptom analysis and more.
            </Text>

            <View style={pw.perksRow}>
              {['Unlimited triage', 'Unlimited pets', 'Priority support'].map(perk => (
                <View key={perk} style={pw.perkItem}>
                  <Ionicons name="checkmark-circle" size={16} color={C.accent} />
                  <Text style={pw.perkText}>{perk}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={[pw.planCard, selectedPlan === 'annual' && pw.planCardSelected]}
              onPress={() => setSelectedPlan('annual')}
            >
              <View style={pw.planRadio}>
                {selectedPlan === 'annual' ? (
                  <View style={pw.planRadioFilled} />
                ) : (
                  <View style={pw.planRadioEmpty} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={pw.planName}>Annual</Text>
                  <View style={pw.saveBadge}>
                    <Text style={pw.saveBadgeText}>Save {savingsPercent}%</Text>
                  </View>
                </View>
                <Text style={pw.planPrice}>{annualPrice}</Text>
                <Text style={pw.planSub}>{annualMonthly} billed annually</Text>
              </View>
            </Pressable>

            <Pressable
              style={[pw.planCard, selectedPlan === 'monthly' && pw.planCardSelected]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={pw.planRadio}>
                {selectedPlan === 'monthly' ? (
                  <View style={pw.planRadioFilled} />
                ) : (
                  <View style={pw.planRadioEmpty} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={pw.planName}>Monthly</Text>
                <Text style={pw.planPrice}>{monthlyPrice}</Text>
              </View>
            </Pressable>

            <Pressable style={pw.purchaseBtn} onPress={handlePurchase} disabled={purchasing}>
              <LinearGradient colors={[C.accent, C.accentDim]} style={pw.purchaseBtnGrad}>
                {purchasing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={pw.purchaseBtnText}>Continue</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable style={pw.restoreBtn} onPress={handleRestore} disabled={restoring}>
              <Text style={pw.restoreText}>{restoring ? 'Restoring...' : 'Restore Purchases'}</Text>
            </Pressable>

            <Text style={pw.legal}>
              Payment will be charged to your Apple ID account at confirmation. Subscription automatically renews unless canceled at least 24 hours before the end of the current period. Manage subscriptions in your Account Settings.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getAge(birthDate: string): string {
  if (!birthDate) return 'Unknown age';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years > 0) return `${years}y ${Math.max(0, months)}m`;
  return months <= 0 ? 'Newborn' : `${months}m`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  petBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 24, borderWidth: 1, borderColor: C.cardBorder },
  petBadgeAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  petBadgeName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  petBadgeBreed: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, flex: 1 },
  label: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.text, marginBottom: 6 },
  sublabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, lineHeight: 18, marginBottom: 12 },
  input: { backgroundColor: C.card, borderRadius: 14, padding: 16, minHeight: 140, borderWidth: 1, borderColor: C.cardBorder, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, marginBottom: 20, lineHeight: 20 },
  quickLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSecondary, marginBottom: 10 },
  quickChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.cardBorder },
  quickChipText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.dangerSoft, borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.danger, flex: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 14, paddingVertical: 16 },
  submitText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.background },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 16, lineHeight: 16 },
  disclaimerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  disclaimerCard: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  disclaimerIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  disclaimerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  disclaimerBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    lineHeight: 21,
    marginBottom: 12,
  },
  disclaimerCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  disclaimerCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: C.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disclaimerCheckboxActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  disclaimerCheckText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: C.text,
    flex: 1,
  },
  disclaimerAcceptBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disclaimerAcceptText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

const pw = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 34,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,184,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  perksRow: {
    gap: 8,
    marginBottom: 20,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: C.text,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: C.cardBorder,
  },
  planCardSelected: {
    borderColor: C.accent,
    backgroundColor: C.accentSoft,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 6,
    borderColor: C.accent,
    backgroundColor: '#fff',
  },
  planRadioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: C.textMuted,
  },
  planName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: C.text,
  },
  planPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: C.text,
    marginTop: 2,
  },
  planSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 1,
  },
  saveBadge: {
    backgroundColor: C.accent,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  purchaseBtn: {
    marginTop: 6,
    borderRadius: 14,
    overflow: 'hidden',
  },
  purchaseBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  purchaseBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  restoreBtn: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  restoreText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.accent,
  },
  legal: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    paddingHorizontal: 8,
  },
});
