import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, TextInput,
  KeyboardAvoidingView, ActivityIndicator, ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Crypto from 'expo-crypto';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import type { Pet, SharedPet } from '@/lib/types';

const C = Colors.dark;

const SPECIES_OPTIONS: { key: Pet['species']; label: string }[] = [
  { key: 'dog', label: 'Dog' },
  { key: 'cat', label: 'Cat' },
  { key: 'bird', label: 'Bird' },
  { key: 'rabbit', label: 'Rabbit' },
  { key: 'other', label: 'Other' },
];

type Mode = 'choose' | 'manual' | 'invite';

export default function VetNewClientTab() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { addVetClient, acceptInviteCode, vetClients } = usePets();

  const [mode, setMode] = useState<Mode>('choose');
  const [clientName, setClientName] = useState('');
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petSpecies, setPetSpecies] = useState<Pet['species']>('dog');
  const [petWeight, setPetWeight] = useState('');
  const [petWeightUnit, setPetWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setClientName('');
    setPetName('');
    setPetBreed('');
    setPetSpecies('dog');
    setPetWeight('');
    setPetWeightUnit('kg');
    setCode('');
    setError('');
    setSuccess(false);
    setLoading(false);
  };

  const handleManualAdd = async () => {
    if (!clientName.trim() || !petName.trim()) {
      setError('Please enter both client name and pet name.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');

    const pet: Pet = {
      id: Crypto.randomUUID(),
      name: petName.trim(),
      breed: petBreed.trim() || 'Unknown',
      species: petSpecies,
      birthDate: '',
      weight: parseFloat(petWeight) || 0,
      weightUnit: petWeightUnit,
      gender: 'male',
      color: '',
    };

    const shared: SharedPet = {
      id: Crypto.randomUUID(),
      pet,
      ownerName: clientName.trim(),
      ownerEmail: `client-${Crypto.randomUUID().substring(0, 8)}@manual`,
      sharedAt: new Date().toISOString(),
      inviteCode: 'MANUAL',
    };

    await addVetClient(shared);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSuccess(true);
    setTimeout(() => {
      resetForm();
      setMode('choose');
    }, 1500);
  };

  const handleInviteAccept = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Please enter an invite code.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setError('');
    setLoading(true);

    const result = await acceptInviteCode(trimmed);

    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
      setTimeout(() => {
        resetForm();
        setMode('choose');
      }, 1500);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result.error || 'Something went wrong.');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.successContainer}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>
          <Text style={styles.successTitle}>Client Added!</Text>
          <Text style={styles.successSubtitle}>
            The pet has been added to your client list.
          </Text>
        </View>
      </View>
    );
  }

  if (mode === 'choose') {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { paddingTop: topInset + 24, paddingBottom: bottomInset + 100 }]}>
          <View style={styles.heroSection}>
            <View style={styles.iconBadge}>
              <Ionicons name="person-add" size={32} color={C.accent} />
            </View>
            <Text style={styles.title}>New Client</Text>
            <Text style={styles.subtitle}>
              Add a client pet to your practice records
            </Text>
          </View>

          <View style={{ gap: 12 }}>
            <Pressable
              style={styles.optionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('manual');
              }}
            >
              <View style={styles.optionIconWrap}>
                <Ionicons name="create-outline" size={24} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Add Manually</Text>
                <Text style={styles.optionDesc}>Enter client and pet details by hand</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
            </Pressable>

            <Pressable
              style={styles.optionCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setMode('invite');
              }}
            >
              <View style={styles.optionIconWrap}>
                <MaterialCommunityIcons name="link-variant" size={24} color={C.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Accept Invite Code</Text>
                <Text style={styles.optionDesc}>Use a code shared by the pet parent</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
            </Pressable>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statPill}>
              <MaterialCommunityIcons name="stethoscope" size={14} color={C.accent} />
              <Text style={styles.statPillText}>{vetClients.length} client pets</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (mode === 'invite') {
    return (
      <View style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={90}
        >
          <View style={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 }]}>
            <Pressable
              onPress={() => { setMode('choose'); setError(''); }}
              hitSlop={12}
              style={styles.backBtn}
            >
              <Ionicons name="arrow-back" size={26} color={C.text} />
            </Pressable>

            <View style={styles.heroSection}>
              <View style={styles.iconBadge}>
                <MaterialCommunityIcons name="link-variant" size={32} color={C.accent} />
              </View>
              <Text style={styles.title}>Accept Invite</Text>
              <Text style={styles.subtitle}>
                Enter the invite code from the pet parent
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
                onSubmitEditing={handleInviteAccept}
                editable={!loading}
              />

              {error ? (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={16} color={C.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleInviteAccept}
                disabled={loading || !code.trim()}
                style={({ pressed }) => [
                  styles.btnWrapper,
                  (loading || !code.trim()) && { opacity: 0.5 },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <LinearGradient
                  colors={[C.gradient.start, C.gradient.end]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btn}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.btnText}>Accept Invite</Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: topInset + 16, paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable
            onPress={() => { setMode('choose'); setError(''); }}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={26} color={C.text} />
          </Pressable>

          <View style={styles.heroSection}>
            <View style={styles.iconBadge}>
              <Ionicons name="create-outline" size={32} color={C.accent} />
            </View>
            <Text style={styles.title}>Add Client Pet</Text>
            <Text style={styles.subtitle}>
              Enter the client and pet information
            </Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.inputLabel}>CLIENT (OWNER) NAME</Text>
            <TextInput
              style={styles.textInput}
              value={clientName}
              onChangeText={(t) => { setClientName(t); if (error) setError(''); }}
              placeholder="e.g. John Smith"
              placeholderTextColor={C.textMuted}
              autoCapitalize="words"
              editable={!loading}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>PET NAME</Text>
            <TextInput
              style={styles.textInput}
              value={petName}
              onChangeText={(t) => { setPetName(t); if (error) setError(''); }}
              placeholder="e.g. Buddy"
              placeholderTextColor={C.textMuted}
              autoCapitalize="words"
              editable={!loading}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>SPECIES</Text>
            <View style={styles.speciesRow}>
              {SPECIES_OPTIONS.map(opt => (
                <Pressable
                  key={opt.key}
                  style={[styles.speciesChip, petSpecies === opt.key && styles.speciesChipActive]}
                  onPress={() => setPetSpecies(opt.key)}
                >
                  <Text style={[styles.speciesChipText, petSpecies === opt.key && styles.speciesChipTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>BREED (OPTIONAL)</Text>
            <TextInput
              style={styles.textInput}
              value={petBreed}
              onChangeText={setPetBreed}
              placeholder="e.g. Golden Retriever"
              placeholderTextColor={C.textMuted}
              autoCapitalize="words"
              editable={!loading}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>WEIGHT (OPTIONAL)</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={petWeight}
                onChangeText={setPetWeight}
                placeholder="0"
                placeholderTextColor={C.textMuted}
                keyboardType="numeric"
                editable={!loading}
              />
              <View style={styles.unitToggle}>
                <Pressable
                  style={[styles.unitBtn, petWeightUnit === 'kg' && styles.unitBtnActive]}
                  onPress={() => setPetWeightUnit('kg')}
                >
                  <Text style={[styles.unitBtnText, petWeightUnit === 'kg' && styles.unitBtnTextActive]}>kg</Text>
                </Pressable>
                <Pressable
                  style={[styles.unitBtn, petWeightUnit === 'lbs' && styles.unitBtnActive]}
                  onPress={() => setPetWeightUnit('lbs')}
                >
                  <Text style={[styles.unitBtnText, petWeightUnit === 'lbs' && styles.unitBtnTextActive]}>lbs</Text>
                </Pressable>
              </View>
            </View>

            {error ? (
              <View style={[styles.errorRow, { marginTop: 12 }]}>
                <Ionicons name="alert-circle" size={16} color={C.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleManualAdd}
              disabled={loading || !clientName.trim() || !petName.trim()}
              style={({ pressed }) => [
                styles.btnWrapper,
                { marginTop: 20 },
                (loading || !clientName.trim() || !petName.trim()) && { opacity: 0.5 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={[C.gradient.start, C.gradient.end]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.btnText}>Add Client Pet</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
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
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 32,
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
  },
  inputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  textInput: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: C.text,
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 16,
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
  speciesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  speciesChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  speciesChipActive: {
    backgroundColor: C.accentSoft,
    borderColor: C.accent,
  },
  speciesChipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.textSecondary,
  },
  speciesChipTextActive: {
    color: C.accent,
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: C.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitBtnActive: {
    backgroundColor: C.accentSoft,
  },
  unitBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.textMuted,
  },
  unitBtnTextActive: {
    color: C.accent,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 14,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: C.text,
    marginBottom: 2,
  },
  optionDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.accentSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statPillText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.accent,
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
  btnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 4,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: 14,
  },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
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
