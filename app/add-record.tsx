import React, { useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, KeyboardAvoidingView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { usePets, generateId } from '@/lib/pet-context';
import { scheduleMedicationReminders, requestNotificationPermission, getFrequencyLabel } from '@/lib/notifications';
import type { MedicalRecord, MedicationFrequency } from '@/lib/types';

const C = Colors.dark;

type RecordType = MedicalRecord['type'];
const TYPES: { key: RecordType; label: string; icon: string; color: string }[] = [
  { key: 'vet_visit', label: 'Vet Visit', icon: 'medkit', color: '#4FC3F7' },
  { key: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark', color: C.accent },
  { key: 'medication', label: 'Medication', icon: 'medical', color: '#FFB74D' },
];

const FREQUENCIES: { key: MedicationFrequency; label: string }[] = [
  { key: 'once_daily', label: 'Once Daily' },
  { key: 'twice_daily', label: 'Twice Daily' },
  { key: 'three_daily', label: '3x Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'biweekly', label: 'Biweekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'as_needed', label: 'As Needed' },
];

const DEFAULT_TIMES: Record<MedicationFrequency, string[]> = {
  once_daily: ['09:00'],
  twice_daily: ['09:00', '21:00'],
  three_daily: ['08:00', '14:00', '20:00'],
  weekly: ['09:00'],
  biweekly: ['09:00'],
  monthly: ['09:00'],
  as_needed: [],
};

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

  const [currentlyTaking, setCurrentlyTaking] = useState(false);
  const [frequency, setFrequency] = useState<MedicationFrequency>('once_daily');
  const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  const isMedication = type === 'medication';
  const isValid = title.trim() && date;

  const handleFrequencyChange = (freq: MedicationFrequency) => {
    Haptics.selectionAsync();
    setFrequency(freq);
    setReminderTimes(DEFAULT_TIMES[freq]);
  };

  const handleReminderTimeChange = (index: number, value: string) => {
    const cleaned = value.replace(/[^0-9:]/g, '');
    const updated = [...reminderTimes];
    updated[index] = cleaned;
    setReminderTimes(updated);
  };

  const handleToggleReminders = async (val: boolean) => {
    if (val && Platform.OS !== 'web') {
      const granted = await requestNotificationPermission();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive medication reminders.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setRemindersEnabled(val);
  };

  const handleSave = async () => {
    if (!isValid || !activePet || saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let notificationIds: string[] = [];

    if (isMedication && currentlyTaking && remindersEnabled && frequency !== 'as_needed') {
      notificationIds = await scheduleMedicationReminders(
        activePet.name,
        title.trim(),
        frequency,
        reminderTimes,
      );
    }

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
      currentlyTaking: isMedication ? currentlyTaking : undefined,
      frequency: isMedication && currentlyTaking ? frequency : undefined,
      reminderTimes: isMedication && currentlyTaking ? reminderTimes : undefined,
      remindersEnabled: isMedication && currentlyTaking ? remindersEnabled : undefined,
      notificationIds: notificationIds.length > 0 ? notificationIds : undefined,
    };

    await addRecord(record);
    setSaving(false);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
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
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g., Amoxicillin 250mg" placeholderTextColor={C.textMuted} />

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

          {isMedication && (
            <>
              <View style={styles.divider} />

              <Pressable
                style={styles.checkboxRow}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCurrentlyTaking(!currentlyTaking);
                }}
              >
                <View style={[styles.checkbox, currentlyTaking && styles.checkboxChecked]}>
                  {currentlyTaking && <Ionicons name="checkmark" size={14} color={C.background} />}
                </View>
                <View style={styles.checkboxTextWrap}>
                  <Text style={styles.checkboxLabel}>Currently Taking</Text>
                  <Text style={styles.checkboxSub}>This medication is part of an ongoing treatment</Text>
                </View>
              </Pressable>

              {currentlyTaking && (
                <View style={styles.medSection}>
                  <Text style={styles.label}>Frequency</Text>
                  <View style={styles.freqGrid}>
                    {FREQUENCIES.map(f => (
                      <Pressable
                        key={f.key}
                        style={[styles.freqChip, frequency === f.key && styles.freqChipActive]}
                        onPress={() => handleFrequencyChange(f.key)}
                      >
                        <Text style={[styles.freqText, frequency === f.key && styles.freqTextActive]}>{f.label}</Text>
                      </Pressable>
                    ))}
                  </View>

                  {frequency !== 'as_needed' && (
                    <>
                      <Text style={styles.label}>Reminder Times</Text>
                      {reminderTimes.map((time, i) => (
                        <View key={i} style={styles.timeRow}>
                          <Ionicons name="time-outline" size={18} color={C.accent} />
                          <TextInput
                            style={styles.timeInput}
                            value={time}
                            onChangeText={(v) => handleReminderTimeChange(i, v)}
                            placeholder="HH:MM"
                            placeholderTextColor={C.textMuted}
                            keyboardType="numbers-and-punctuation"
                            maxLength={5}
                          />
                          <Text style={styles.timeDoseLabel}>Dose {i + 1}</Text>
                        </View>
                      ))}

                      <View style={styles.reminderToggle}>
                        <View style={styles.reminderToggleLeft}>
                          <Ionicons name="notifications-outline" size={20} color={remindersEnabled ? C.accent : C.textMuted} />
                          <View>
                            <Text style={styles.reminderToggleLabel}>Remind Me</Text>
                            <Text style={styles.reminderToggleSub}>
                              {Platform.OS === 'web'
                                ? 'Available on mobile devices'
                                : 'Get notified when it\'s time for a dose'}
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={remindersEnabled}
                          onValueChange={handleToggleReminders}
                          trackColor={{ false: C.cardBorder, true: C.accentSoft }}
                          thumbColor={remindersEnabled ? C.accent : C.textMuted}
                          disabled={Platform.OS === 'web'}
                        />
                      </View>
                    </>
                  )}
                </View>
              )}
            </>
          )}

          <Text style={styles.label}>Doctor</Text>
          <TextInput style={styles.input} value={doctor} onChangeText={setDoctor} placeholder="Dr. Smith" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Clinic</Text>
          <TextInput style={styles.input} value={clinic} onChangeText={setClinic} placeholder="City Vet Clinic" placeholderTextColor={C.textMuted} />

          <Pressable onPress={handleSave} disabled={!isValid || saving}>
            <LinearGradient
              colors={isValid && !saving ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.saveBtn}
            >
              <Text style={[styles.saveBtnText, (!isValid || saving) && { color: C.textMuted }]}>
                {saving ? 'Saving...' : 'Save Record'}
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
  divider: { height: 1, backgroundColor: C.cardBorder, marginVertical: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  checkboxChecked: { backgroundColor: C.accent, borderColor: C.accent },
  checkboxTextWrap: { flex: 1 },
  checkboxLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.text },
  checkboxSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  medSection: { marginTop: 4 },
  freqGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  freqChip: { backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.cardBorder },
  freqChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  freqText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.textMuted },
  freqTextActive: { color: C.accent },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  timeInput: { flex: 1, backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontFamily: 'Inter_500Medium', fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  timeDoseLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, width: 50 },
  reminderToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: C.cardBorder },
  reminderToggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  reminderToggleLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  reminderToggleSub: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textSecondary, marginTop: 1 },
});
