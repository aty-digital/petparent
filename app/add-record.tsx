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
import type { MedicalRecord } from '@/lib/types';

const C = Colors.dark;

type RecordType = MedicalRecord['type'];
const TYPES: { key: RecordType; label: string; icon: string; color: string }[] = [
  { key: 'vet_visit', label: 'Vet Visit', icon: 'medkit', color: '#4FC3F7' },
  { key: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark', color: '#00E676' },
  { key: 'medication', label: 'Medication', icon: 'medical', color: '#FFB74D' },
];

export default function AddRecordScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, addRecord } = usePets();

  const [type, setType] = useState<RecordType>('vet_visit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [doctor, setDoctor] = useState('');
  const [clinic, setClinic] = useState('');
  const [expiresDate, setExpiresDate] = useState('');

  const isValid = title.trim() && date;

  const handleSave = async () => {
    if (!isValid || !activePet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const record: MedicalRecord = {
      id: generateId(),
      petId: activePet.id,
      type,
      title: title.trim(),
      description: description.trim(),
      date,
      doctor: doctor.trim() || undefined,
      clinic: clinic.trim() || undefined,
      expiresDate: expiresDate || undefined,
    };

    await addRecord(record);
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
            <Text style={styles.headerTitle}>Add Record</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TYPES.map(t => (
              <Pressable
                key={t.key}
                style={[styles.typeChip, type === t.key && styles.typeChipActive]}
                onPress={() => { Haptics.selectionAsync(); setType(t.key); }}
              >
                <Ionicons name={t.icon as any} size={16} color={type === t.key ? t.color : C.textMuted} />
                <Text style={[styles.typeText, type === t.key && { color: t.color }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Title *</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g., Annual Wellness Exam" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Description</Text>
          <TextInput style={[styles.input, { minHeight: 80 }]} value={description} onChangeText={setDescription} placeholder="Details about the visit, medication, or vaccine..." placeholderTextColor={C.textMuted} multiline textAlignVertical="top" />

          <Text style={styles.label}>Date *</Text>
          <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />

          {type === 'vaccination' && (
            <>
              <Text style={styles.label}>Expiration Date</Text>
              <TextInput style={styles.input} value={expiresDate} onChangeText={setExpiresDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
            </>
          )}

          <Text style={styles.label}>Doctor</Text>
          <TextInput style={styles.input} value={doctor} onChangeText={setDoctor} placeholder="Dr. Smith" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Clinic</Text>
          <TextInput style={styles.input} value={clinic} onChangeText={setClinic} placeholder="City Vet Clinic" placeholderTextColor={C.textMuted} />

          <Pressable onPress={handleSave} disabled={!isValid}>
            <LinearGradient
              colors={isValid ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.saveBtn}
            >
              <Text style={[styles.saveBtnText, !isValid && { color: C.textMuted }]}>Save Record</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSecondary, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.card, borderRadius: 12, paddingVertical: 12, borderWidth: 1, borderColor: C.cardBorder },
  typeChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  typeText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.textMuted },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.background },
});
