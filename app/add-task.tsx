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
import type { HealthTask } from '@/lib/types';

const C = Colors.dark;

type TaskType = HealthTask['type'];
const TASK_TYPES: { key: TaskType; label: string; icon: string; color: string }[] = [
  { key: 'medication', label: 'Medication', icon: 'medical', color: C.accent },
  { key: 'vaccination', label: 'Vaccination', icon: 'shield-checkmark', color: '#4FC3F7' },
  { key: 'supplement', label: 'Supplement', icon: 'nutrition', color: '#FFB74D' },
  { key: 'checkup', label: 'Checkup', icon: 'clipboard', color: '#CE93D8' },
];

const RECURRING: { key: string; label: string }[] = [
  { key: 'none', label: 'One-time' },
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

export default function AddTaskScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, addTask } = usePets();

  const [type, setType] = useState<TaskType>('medication');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('08:00');
  const [recurring, setRecurring] = useState('none');

  const isValid = title.trim() && dueDate;

  const handleSave = async () => {
    if (!isValid || !activePet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const task: HealthTask = {
      id: generateId(),
      petId: activePet.id,
      title: title.trim(),
      type,
      dueDate,
      dueTime: dueTime || undefined,
      completed: false,
      recurring: recurring !== 'none' ? recurring as HealthTask['recurring'] : undefined,
    };

    await addTask(task);
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
            <Text style={styles.headerTitle}>Add Task</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.label}>Type</Text>
          <View style={styles.typeRow}>
            {TASK_TYPES.map(t => (
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
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g., Heartworm Pill" placeholderTextColor={C.textMuted} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Due Date *</Text>
              <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Time</Text>
              <TextInput style={styles.input} value={dueTime} onChangeText={setDueTime} placeholder="08:00" placeholderTextColor={C.textMuted} />
            </View>
          </View>

          <Text style={styles.label}>Recurring</Text>
          <View style={styles.recurRow}>
            {RECURRING.map(r => (
              <Pressable
                key={r.key}
                style={[styles.recurChip, recurring === r.key && styles.recurChipActive]}
                onPress={() => { Haptics.selectionAsync(); setRecurring(r.key); }}
              >
                <Text style={[styles.recurText, recurring === r.key && styles.recurTextActive]}>{r.label}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={handleSave} disabled={!isValid}>
            <LinearGradient
              colors={isValid ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.saveBtn}
            >
              <Text style={[styles.saveBtnText, !isValid && { color: C.textMuted }]}>Save Task</Text>
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
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.cardBorder },
  typeChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  typeText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.textMuted },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  recurRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recurChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  recurChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  recurText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.textMuted },
  recurTextActive: { color: C.accent },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.background },
});
