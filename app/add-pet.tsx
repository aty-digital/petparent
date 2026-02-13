import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, KeyboardAvoidingView,
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
  const { canAddMorePets, tier } = useSubscription();
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

  const isValid = name.trim() && breed.trim() && weight.trim();

  const handleSave = async () => {
    if (!isValid) return;
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

          {!allowed && (
            <View style={{
              backgroundColor: C.dangerSoft,
              borderRadius: 12,
              padding: 16,
              marginBottom: 20,
              alignItems: 'center' as const,
              gap: 8,
            }}>
              <Ionicons name="lock-closed" size={24} color={C.danger} />
              <Text style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 15,
                color: C.danger,
                textAlign: 'center' as const,
              }}>
                Pet Limit Reached
              </Text>
              <Text style={{
                fontFamily: 'Inter_400Regular',
                fontSize: 13,
                color: C.textSecondary,
                textAlign: 'center' as const,
                lineHeight: 18,
              }}>
                Free plan allows 1 pet profile. Upgrade to Premium in Settings for unlimited pets.
              </Text>
              <Pressable
                onPress={() => { router.back(); router.push('/settings'); }}
                style={{
                  backgroundColor: C.accent,
                  borderRadius: 10,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  marginTop: 4,
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>
                  View Plans
                </Text>
              </Pressable>
            </View>
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

          <Pressable onPress={handleSave} disabled={!isValid || !allowed}>
            <LinearGradient
              colors={isValid && allowed ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.saveBtn}
            >
              <Text style={[styles.saveBtnText, (!isValid || !allowed) && { color: C.textMuted }]}>
                {allowed ? 'Save Pet' : 'Upgrade to Add'}
              </Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
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
