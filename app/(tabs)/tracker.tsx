import React, { useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, FlatList,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import type { DailyLog, DailyEntry } from '@/lib/types';
import SitterTrackerScreen from '@/components/SitterTrackerScreen';
import VetNewClientTab from '@/components/VetNewClientTab';

const C = Colors.dark;

const CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string; iconSet: 'ion' | 'mci' }> = {
  water: { icon: 'water', label: 'Water Intake', color: '#3FA9D6', iconSet: 'ion' },
  food: { icon: 'restaurant', label: 'Appetite', color: '#D97706', iconSet: 'ion' },
  energy: { icon: 'flash', label: 'Energy Level', color: '#2D6A4F', iconSet: 'ion' },
  mood: { icon: 'happy', label: 'Mood', color: '#9333EA', iconSet: 'ion' },
  bathroom: { icon: 'leaf', label: 'Bathroom', color: '#059669', iconSet: 'ion' },
  sleep: { icon: 'moon', label: 'Sleep Quality', color: '#1E40AF', iconSet: 'ion' },
  custom: { icon: 'ellipsis-horizontal', label: 'Other', color: '#64748B', iconSet: 'ion' },
};

const VALUE_LABELS: Record<number, string> = {
  1: 'Very Low',
  2: 'Low',
  3: 'Normal',
  4: 'High',
  5: 'Very High',
};

function EntryCard({ entry }: { entry: DailyEntry }) {
  const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.custom;
  const dots = [1, 2, 3, 4, 5];

  return (
    <View style={styles.entryCard}>
      <View style={styles.entryHeader}>
        <View style={[styles.entryIcon, { backgroundColor: `${config.color}18` }]}>
          <Ionicons name={config.icon as any} size={18} color={config.color} />
        </View>
        <Text style={styles.entryLabel}>{entry.label || config.label}</Text>
        <Text style={[styles.entryValue, { color: config.color }]}>{VALUE_LABELS[entry.value] || 'Normal'}</Text>
      </View>
      <View style={styles.dotsRow}>
        {dots.map(d => (
          <View key={d} style={[styles.dot, d <= entry.value && { backgroundColor: config.color }]} />
        ))}
      </View>
      {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
    </View>
  );
}

function DayLogCard({ log }: { log: DailyLog }) {
  const dateStr = new Date(log.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });
  const isToday = log.date === new Date().toISOString().split('T')[0];

  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayDate}>{isToday ? 'Today' : dateStr}</Text>
        <Text style={styles.dayEntries}>{log.entries.length} entries</Text>
      </View>
      {log.entries.map((entry, i) => (
        <EntryCard key={`${log.id}-${i}`} entry={entry} />
      ))}
    </View>
  );
}

function ParentTrackerContent() {
  const { activePet, dailyLogs } = usePets();

  const petLogs = useMemo(() =>
    dailyLogs
      .filter(l => l.petId === activePet?.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 14),
    [dailyLogs, activePet?.id]
  );

  const today = new Date().toISOString().split('T')[0];
  const hasToday = petLogs.some(l => l.date === today);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <Text style={styles.headerTitle}>Daily Tracker</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.logTodayCTA}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/daily-tracker');
          }}
        >
          <View style={styles.logTodayLeft}>
            <View style={styles.logTodayIcon}>
              <Ionicons name={hasToday ? 'create' : 'add'} size={20} color={C.accent} />
            </View>
            <View>
              <Text style={styles.logTodayTitle}>{hasToday ? 'Update Today\'s Log' : 'Log Today\'s Behavior'}</Text>
              <Text style={styles.logTodaySub}>Track water, food, energy, mood & more</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </Pressable>

        {petLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={40} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No Logs Yet</Text>
            <Text style={styles.emptyText}>Start tracking your pet's daily behavior to spot patterns and concerns early.</Text>
          </View>
        ) : (
          petLogs.map(log => <DayLogCard key={log.id} log={log} />)
        )}
      </ScrollView>
    </View>
  );
}

export default function TrackerScreen() {
  const { userRole, activeView } = usePets();

  if (userRole === 'sitter' && activeView === 'sitter') {
    return <SitterTrackerScreen />;
  }

  if (userRole === 'vet' && activeView !== 'parent') {
    return <VetNewClientTab />;
  }

  return <ParentTrackerContent />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text },
  scroll: { paddingHorizontal: 20 },
  logTodayCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.accentBorder },
  logTodayLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logTodayIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  logTodayTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  logTodaySub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  dayCard: { marginBottom: 16 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  dayDate: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  dayEntries: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted },
  entryCard: { backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: C.cardBorder },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  entryIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  entryLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text, flex: 1 },
  entryValue: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 8, marginLeft: 42 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.surfaceElevated },
  entryNote: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted, marginTop: 6, marginLeft: 42 },
  emptyState: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.textSecondary },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
});
