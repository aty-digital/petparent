import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, KeyboardAvoidingView, Modal, ActivityIndicator,
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
  const { addPet, pets } = usePets();
  const { canAddMorePets, tier, monthlyPackage, annualPackage, purchasePackage, restorePurchases } = useSubscription();
  const allowed = canAddMorePets(pets.length);

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [species, setSpecies] = useState<Pet['species']>('dog');
  const [birthDate, setBirthDate] = useState('');
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
      birthDate: birthDate || new Date().toISOString().split('T')[0],
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

  const monthlyPrice = monthlyPackage?.product?.priceString || '$5.99/month';
  const annualPrice = annualPackage?.product?.priceString || '$49.99/year';
  const annualMonthly = annualPackage?.product?.price
    ? `$${(annualPackage.product.price / 12).toFixed(2)}/mo`
    : '$4.17/mo';
  const savingsPercent = (monthlyPackage?.product?.price && annualPackage?.product?.price)
    ? Math.round(100 - ((annualPackage.product.price / 12) / monthlyPackage.product.price) * 100)
    : 30;

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

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Birth Date</Text>
              <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
            </View>
            <View style={styles.halfField}>
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
            </View>
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
        onRequestClose={() => { if (!purchasing) { setShowPaywall(false); router.replace('/'); } }}
      >
        <View style={pw.overlay}>
          <View style={pw.sheet}>
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
});
