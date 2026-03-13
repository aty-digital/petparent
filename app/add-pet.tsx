import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, KeyboardAvoidingView, Modal, ActivityIndicator, Animated, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { usePets, generateId } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import type { Pet } from '@/lib/types';

const C = Colors.dark;

const SPECIES_OPTIONS: { key: Pet['species']; label: string; icon: string }[] = [
  { key: 'dog', label: 'Dog', icon: 'paw' },
  { key: 'cat', label: 'Cat', icon: 'paw' },
  { key: 'bird', label: 'Bird', icon: 'leaf' },
  { key: 'rabbit', label: 'Rabbit', icon: 'heart' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export default function AddPetScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { addPet, pets, userRole } = usePets();
  const { canAddMorePets, tier, monthlyPackage, annualPackage, purchasePackage, restorePurchases } = useSubscription();
  const allowed = canAddMorePets(pets.length);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState<Pet['species']>('dog');
  const [ageMode, setAgeMode] = useState<'date' | 'age'>('date');
  const [birthDate, setBirthDate] = useState('');
  const [ageYears, setAgeYears] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [color, setColor] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vetClinic, setVetClinic] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [showPurchaseConfirmation, setShowPurchaseConfirmation] = useState(false);
  const [purchasedPlanLabel, setPurchasedPlanLabel] = useState('');
  const confirmFadeAnim = useRef(new Animated.Value(0)).current;
  const confirmScaleAnim = useRef(new Animated.Value(0.8)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;

  const isValid = name.trim() && breed.trim() && weight.trim();

  useEffect(() => {
    if (!allowed && tier === 'free') {
      setShowPaywall(true);
    }
  }, []);

  const handleSave = async () => {
    if (!isValid) return;
    if (!allowed && tier === 'free') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowPaywall(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const pet: Pet = {
      id: generateId(),
      name: name.trim(),
      breed: breed.trim(),
      species,
      birthDate: ageMode === 'date' && birthDate.trim()
        ? (() => { const parts = birthDate.trim().split('/'); return parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}` : new Date().toISOString().split('T')[0]; })()
        : ageMode === 'age' && ageYears.trim()
          ? (() => { const d = new Date(); d.setFullYear(d.getFullYear() - (parseInt(ageYears) || 0)); return d.toISOString().split('T')[0]; })()
          : new Date().toISOString().split('T')[0],
      weight: parseFloat(weight) || 0,
      weightUnit,
      gender,
      color: color.trim() || 'Unknown',
      vetName: vetName.trim() || undefined,
      vetPhone: vetPhone.trim() || undefined,
      vetClinic: vetClinic.trim() || undefined,
    };

    await addPet(pet);
    router.back();
  };

  const rolePricing = userRole === 'vet' ? { m: '$25.99/month', a: '$259.99/year', ae: '$21.67/mo' } : userRole === 'sitter' ? { m: '$6.99/month', a: '$69.99/year', ae: '$5.83/mo' } : { m: '$4.99/month', a: '$49.99/year', ae: '$4.17/mo' };
  const monthlyPrice = monthlyPackage?.product?.priceString || rolePricing.m;
  const annualPrice = annualPackage?.product?.priceString || rolePricing.a;
  const annualMonthly = annualPackage?.product?.price
    ? `$${(annualPackage.product.price / 12).toFixed(2)}/mo`
    : rolePricing.ae;
  const savingsPercent = (monthlyPackage?.product?.price && annualPackage?.product?.price)
    ? Math.round(100 - ((annualPackage.product.price / 12) / monthlyPackage.product.price) * 100)
    : 30;

  const showConfirmation = (planLabel: string) => {
    setPurchasedPlanLabel(planLabel);
    setShowPurchaseConfirmation(true);
    confirmFadeAnim.setValue(0);
    confirmScaleAnim.setValue(0.8);
    checkmarkScaleAnim.setValue(0);
    Animated.parallel([
      Animated.timing(confirmFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(confirmScaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(checkmarkScaleAnim, { toValue: 1, friction: 4, tension: 50, useNativeDriver: true }).start();
    });
  };

  const handleConfirmationDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPurchaseConfirmation(false);
    setShowPaywall(false);
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'monthly' ? monthlyPackage : annualPackage;
    if (!pkg) {
      setShowPaywall(false);
      return;
    }
    setPurchasing(true);
    try {
      const result = await purchasePackage(pkg);
      if (result === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showConfirmation(selectedPlan === 'annual' ? 'Annual' : 'Monthly');
      } else if (result === 'error') {
        Alert.alert('Purchase Not Completed', 'The purchase could not be verified. Please try restoring your purchases or contact support.');
      }
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Purchase Failed', e.message || 'Something went wrong. Please try again.');
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
        showConfirmation('Restored');
      }
    } catch (_e) {
    } finally {
      setRestoring(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topInset + 12, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={22} color={C.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Add Pet</Text>
            <View style={{ width: 40 }} />
          </View>

          <View style={styles.avatarSection}>
            <View style={styles.avatarLarge}>
              <Ionicons name="paw" size={32} color={C.accent} />
            </View>
          </View>

          {!allowed && tier === 'free' && (
            <Pressable
              onPress={() => setShowPaywall(true)}
              style={{
                backgroundColor: C.accentSoft,
                borderRadius: 12,
                padding: 14,
                marginBottom: 20,
                flexDirection: 'row' as const,
                alignItems: 'center',
                gap: 10,
                borderWidth: 1,
                borderColor: C.accentBorder,
              }}
            >
              <Ionicons name="star" size={20} color={C.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 13,
                  color: C.text,
                }}>
                  Free plan allows 1 pet. Tap to upgrade for unlimited pets.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={C.accent} />
            </Pressable>
          )}

          <Text style={styles.label}>Name *</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Pet's name" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Species</Text>
          <View style={styles.optionsRow}>
            {SPECIES_OPTIONS.map(opt => (
              <Pressable
                key={opt.key}
                style={[styles.optionChip, species === opt.key && styles.optionChipActive]}
                onPress={() => { Haptics.selectionAsync(); setSpecies(opt.key); }}
              >
                <Ionicons name={opt.icon as any} size={14} color={species === opt.key ? C.accent : C.textMuted} />
                <Text style={[styles.optionText, species === opt.key && styles.optionTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Breed *</Text>
          <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholder="e.g., Golden Retriever" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Age / Birthday</Text>
          <View style={styles.toggleRow}>
            <Pressable
              style={[styles.toggleBtn, ageMode === 'date' && styles.toggleBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setAgeMode('date'); }}
            >
              <Text style={[styles.toggleText, ageMode === 'date' && styles.toggleTextActive]}>Birth Date</Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, ageMode === 'age' && styles.toggleBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setAgeMode('age'); }}
            >
              <Text style={[styles.toggleText, ageMode === 'age' && styles.toggleTextActive]}>Approx. Age</Text>
            </Pressable>
          </View>
          {ageMode === 'date' ? (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={birthDate}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9/]/g, '');
                if (cleaned.length <= 10) {
                  if (cleaned.length === 2 && birthDate.length < 2) setBirthDate(cleaned + '/');
                  else if (cleaned.length === 5 && birthDate.length < 5) setBirthDate(cleaned + '/');
                  else setBirthDate(cleaned);
                }
              }}
              placeholder="MM/DD/YYYY"
              placeholderTextColor={C.textMuted}
              keyboardType="number-pad"
              maxLength={10}
              testID="pet-birth-date"
            />
          ) : (
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={ageYears}
              onChangeText={(text) => setAgeYears(text.replace(/[^0-9]/g, ''))}
              placeholder="e.g., 5"
              placeholderTextColor={C.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              testID="pet-age-years"
            />
          )}
          <Text style={styles.helperText}>
            {ageMode === 'date' ? 'Enter your pet\'s date of birth' : 'Enter your pet\'s approximate age in years'}
          </Text>

          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            <Pressable
              style={[styles.genderBtn, gender === 'male' && styles.genderBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setGender('male'); }}
            >
              <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
            </Pressable>
            <Pressable
              style={[styles.genderBtn, gender === 'female' && styles.genderBtnActive]}
              onPress={() => { Haptics.selectionAsync(); setGender('female'); }}
            >
              <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
            </Pressable>
          </View>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Weight *</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} placeholder="0" placeholderTextColor={C.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.genderRow}>
                <Pressable
                  style={[styles.genderBtn, weightUnit === 'kg' && styles.genderBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setWeightUnit('kg'); }}
                >
                  <Text style={[styles.genderText, weightUnit === 'kg' && styles.genderTextActive]}>kg</Text>
                </Pressable>
                <Pressable
                  style={[styles.genderBtn, weightUnit === 'lbs' && styles.genderBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setWeightUnit('lbs'); }}
                >
                  <Text style={[styles.genderText, weightUnit === 'lbs' && styles.genderTextActive]}>lbs</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Color</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholder="e.g., Golden, Black & White" placeholderTextColor={C.textMuted} />

          <Text style={styles.sectionLabel}>Vet Information (Optional)</Text>

          <Text style={styles.label}>Vet Name</Text>
          <TextInput style={styles.input} value={vetName} onChangeText={setVetName} placeholder="Dr. Smith" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Clinic</Text>
          <TextInput style={styles.input} value={vetClinic} onChangeText={setVetClinic} placeholder="City Vet Clinic" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={vetPhone} onChangeText={setVetPhone} placeholder="(555) 123-4567" placeholderTextColor={C.textMuted} keyboardType="phone-pad" />

          <Pressable onPress={handleSave} disabled={!isValid}>
            <LinearGradient
              colors={isValid ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.saveBtn}
            >
              <Text style={[styles.saveBtnText, !isValid && { color: C.textMuted }]}>
                {allowed ? 'Save Pet' : 'Upgrade & Save'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={showPaywall}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => { if (!purchasing && !showPurchaseConfirmation) { setShowPaywall(false); router.replace('/'); } }}
      >
        <View style={pw.overlay}>
          <View style={pw.sheet}>
            {showPurchaseConfirmation ? (
              <Animated.View style={[pw.confirmContainer, { opacity: confirmFadeAnim, transform: [{ scale: confirmScaleAnim }] }]}>
                <Animated.View style={[pw.confirmCheckCircle, { transform: [{ scale: checkmarkScaleAnim }] }]}>
                  <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                </Animated.View>
                <Text style={pw.confirmTitle}>Welcome to Premium!</Text>
                <Text style={pw.confirmSubtitle}>
                  Thank you for upgrading. Your {purchasedPlanLabel} plan is now active.
                </Text>
                <View style={pw.confirmFeatures}>
                  {['Unlimited pet profiles', 'Unlimited AI triage sessions', 'Priority support'].map((feature) => (
                    <View key={feature} style={pw.confirmFeatureRow}>
                      <Ionicons name="checkmark-circle" size={18} color={C.accent} />
                      <Text style={pw.confirmFeatureText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                <Pressable onPress={handleConfirmationDismiss}>
                  <LinearGradient colors={[C.accent, C.accentDim]} style={pw.purchaseBtnGrad}>
                    <Text style={pw.purchaseBtnText}>Get Started</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ) : (
              <>
                <Pressable style={pw.closeBtn} onPress={() => { if (!purchasing) { setShowPaywall(false); router.replace('/'); } }}>
                  <Ionicons name="close" size={22} color={C.textMuted} />
                </Pressable>

                <View style={pw.iconBadge}>
                  <Ionicons name="star" size={28} color="#FFB800" />
                </View>
                <Text style={pw.title}>Upgrade to Premium</Text>
                <Text style={pw.subtitle}>
                  Free plan allows 1 pet profile. Unlock unlimited pets and all premium features.
                </Text>

                <View style={pw.perksRow}>
                  {['Unlimited pets', 'Unlimited triage', 'Priority support'].map(perk => (
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
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatarLarge: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.accentSoft, borderWidth: 3, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSecondary, marginBottom: 6, marginTop: 12 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.text, marginTop: 24, marginBottom: 4 },
  input: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: C.cardBorder },
  optionChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  optionText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textMuted },
  optionTextActive: { color: C.accent },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  genderBtnActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  genderText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textMuted },
  genderTextActive: { color: C.accent },
  toggleRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  toggleBtn: { flex: 1, backgroundColor: C.card, borderRadius: 10, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  toggleBtnActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  toggleText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textMuted },
  toggleTextActive: { color: C.accent },
  helperText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 4 },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.background },
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
  confirmContainer: {
    alignItems: 'center' as const,
    paddingVertical: 16,
  },
  confirmCheckCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  confirmTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    color: C.text,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  confirmSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  confirmFeatures: {
    width: '100%' as const,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 10,
  },
  confirmFeatureRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  confirmFeatureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: C.text,
  },
});
