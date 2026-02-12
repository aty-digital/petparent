import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ActivityIndicator, ScrollView, KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { usePets, generateId } from '@/lib/pet-context';
import { apiRequest } from '@/lib/query-client';
import type { TriageResult } from '@/lib/types';

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
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTriage = async () => {
    if (!symptoms.trim() || !activePet) return;
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

  return (
    <View style={styles.container}>
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
});
