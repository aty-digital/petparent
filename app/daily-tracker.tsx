import React, { useState, useMemo } from 'react';
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
import type { DailyEntry, DailyLog } from '@/lib/types';

const C = Colors.dark;

const CATEGORIES: { key: DailyEntry['category']; label: string; icon: string; color: string }[] = [
  { key: 'water', label: 'Water Intake', icon: 'water', color: '#4FC3F7' },
  { key: 'food', label: 'Appetite', icon: 'restaurant', color: '#FFB74D' },
  { key: 'energy', label: 'Energy Level', icon: 'flash', color: '#00E676' },
  { key: 'mood', label: 'Mood', icon: 'happy', color: '#CE93D8' },
  { key: 'bathroom', label: 'Bathroom', icon: 'leaf', color: '#8BC34A' },
  { key: 'sleep', label: 'Sleep Quality', icon: 'moon', color: '#7986CB' },
];

const VALUE_OPTIONS = [
  { value: 1, label: 'Very Low' },
  { value: 2, label: 'Low' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'High' },
  { value: 5, label: 'Very High' },
];

function CategoryTracker({
  cat,
  value,
  note,
  onChange,
}: {
  cat: typeof CATEGORIES[0];
  value: number;
  note: string;
  onChange: (val: number, note: string) => void;
}) {
  const [showNote, setShowNote] = useState(!!note);

  return (
    <View style={styles.catCard}>
      <View style={styles.catHeader}>
        <View style={[styles.catIcon, { backgroundColor: `${cat.color}18` }]}>
          <Ionicons name={cat.icon as any} size={18} color={cat.color} />
        </View>
        <Text style={styles.catLabel}>{cat.label}</Text>
      </View>

      <View style={styles.valueRow}>
        {VALUE_OPTIONS.map(opt => (
          <Pressable
            key={opt.value}
            style={[styles.valueDot, value === opt.value && { backgroundColor: cat.color, borderColor: cat.color }]}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(opt.value, note);
            }}
          >
            <Text style={[styles.valueDotText, value === opt.value && styles.valueDotTextActive]}>
              {opt.value}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.valueLabelsRow}>
        <Text style={styles.valueLabelLeft}>Very Low</Text>
        <Text style={[styles.valueLabel, { color: cat.color }]}>
          {VALUE_OPTIONS.find(o => o.value === value)?.label || 'Select'}
        </Text>
        <Text style={styles.valueLabelRight}>Very High</Text>
      </View>

      {showNote ? (
        <TextInput
          style={styles.noteInput}
          value={note}
          onChangeText={n => onChange(value, n)}
          placeholder="Add a note..."
          placeholderTextColor={C.textMuted}
          multiline
        />
      ) : (
        <Pressable onPress={() => setShowNote(true)} style={styles.addNoteBtn}>
          <Ionicons name="create-outline" size={14} color={C.accent} />
          <Text style={styles.addNoteText}>Add note</Text>
        </Pressable>
      )}
    </View>
  );
}

export default function DailyTrackerScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, getTodayLog, addDailyLog, updateDailyLog } = usePets();

  const existingLog = getTodayLog();

  const [entries, setEntries] = useState<Record<string, { value: number; note: string }>>(() => {
    if (existingLog) {
      const map: Record<string, { value: number; note: string }> = {};
      existingLog.entries.forEach(e => {
        map[e.category] = { value: e.value, note: e.note || '' };
      });
      return map;
    }
    const map: Record<string, { value: number; note: string }> = {};
    CATEGORIES.forEach(c => {
      map[c.key] = { value: 3, note: '' };
    });
    return map;
  });

  const updateEntry = (key: string, value: number, note: string) => {
    setEntries(prev => ({ ...prev, [key]: { value, note } }));
  };

  const handleSave = async () => {
    if (!activePet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const today = new Date().toISOString().split('T')[0];
    const dailyEntries: DailyEntry[] = CATEGORIES.map(c => ({
      category: c.key,
      value: entries[c.key]?.value || 3,
      label: c.label,
      note: entries[c.key]?.note || undefined,
    }));

    if (existingLog) {
      await updateDailyLog({
        ...existingLog,
        entries: dailyEntries,
      });
    } else {
      const log: DailyLog = {
        id: generateId(),
        petId: activePet.id,
        date: today,
        entries: dailyEntries,
      };
      await addDailyLog(log);
    }

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
            <Text style={styles.headerTitle}>Daily Tracker</Text>
            <View style={{ width: 40 }} />
          </View>

          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Text>

          {activePet && (
            <View style={styles.petBadge}>
              <Ionicons name="paw" size={14} color={C.accent} />
              <Text style={styles.petBadgeText}>Tracking for {activePet.name}</Text>
            </View>
          )}

          {CATEGORIES.map(cat => (
            <CategoryTracker
              key={cat.key}
              cat={cat}
              value={entries[cat.key]?.value || 3}
              note={entries[cat.key]?.note || ''}
              onChange={(v, n) => updateEntry(cat.key, v, n)}
            />
          ))}

          <Pressable onPress={handleSave}>
            <LinearGradient
              colors={[C.accent, C.accentDim]}
              style={styles.saveBtn}
            >
              <Text style={styles.saveBtnText}>{existingLog ? 'Update Log' : 'Save Log'}</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  dateText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.textSecondary, textAlign: 'center', marginBottom: 12 },
  petBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 20 },
  petBadgeText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.accent },
  catCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.cardBorder },
  catHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  valueDot: { flex: 1, height: 40, borderRadius: 10, backgroundColor: C.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.cardBorder },
  valueDotText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.textMuted },
  valueDotTextActive: { color: C.background },
  valueLabelsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  valueLabelLeft: { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.textMuted },
  valueLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  valueLabelRight: { fontFamily: 'Inter_400Regular', fontSize: 10, color: C.textMuted },
  addNoteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  addNoteText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.accent },
  noteInput: { backgroundColor: C.surfaceElevated, borderRadius: 10, padding: 10, marginTop: 8, fontFamily: 'Inter_400Regular', fontSize: 13, color: C.text, minHeight: 40, borderWidth: 1, borderColor: C.cardBorder },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.background },
});
