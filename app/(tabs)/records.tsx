import React, { useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, Pressable, Platform, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import { cancelReminders } from '@/lib/notifications';
import type { MedicalRecord } from '@/lib/types';

const C = Colors.dark;

type FilterType = 'all' | 'flea_treatment' | 'vet_visit' | 'medication' | 'vaccination' | 'triage';

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'flea_treatment', label: 'Flea Treatment' },
  { key: 'vet_visit', label: 'Vet Visits' },
  { key: 'vaccination', label: 'Vaccines' },
  { key: 'medication', label: 'Meds' },
  { key: 'triage', label: 'Triage' },
];

function formatRecordDate(dateStr: string): string {
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${months[m - 1]} ${d}, ${y}`;
    }
  }
  const fallback = new Date(dateStr);
  if (!isNaN(fallback.getTime())) {
    return fallback.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return dateStr;
}

function RecordItem({ record, onDelete }: { record: MedicalRecord; onDelete: () => void }) {
  const getIcon = () => {
    switch (record.type) {
      case 'flea_treatment': return 'bug';
      case 'vet_visit': return 'medkit';
      case 'vaccination': return 'shield-checkmark';
      case 'medication': return 'medical';
      case 'triage': return 'analytics';
      default: return 'document';
    }
  };
  const getColor = () => {
    switch (record.type) {
      case 'flea_treatment': return '#81C784';
      case 'vet_visit': return '#5DA8D3';
      case 'vaccination': return C.accent;
      case 'medication': return '#D4A574';
      case 'triage': return '#A77C9E';
      default: return C.accent;
    }
  };
  const col = getColor();
  const formattedDate = formatRecordDate(record.date);

  return (
    <Pressable
      style={styles.recordItem}
      onPress={() => {
        Haptics.selectionAsync();
        router.push({ pathname: '/edit-record', params: { recordId: record.id } });
      }}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (Platform.OS === 'web') {
          if (confirm('Delete this record?')) onDelete();
        } else {
          Alert.alert('Delete Record', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
          ]);
        }
      }}
    >
      <View style={[styles.recordIcon, { backgroundColor: `${col}18` }]}>
        <Ionicons name={getIcon() as any} size={18} color={col} />
      </View>
      <View style={styles.recordInfo}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={styles.recordTitle}>{record.title}</Text>
          {record.remindersEnabled && record.notificationIds && record.notificationIds.length > 0 && (
            <Ionicons name="notifications" size={12} color={C.accent} />
          )}
        </View>
        <Text style={styles.recordDesc} numberOfLines={1}>{record.description}</Text>
        {record.doctor && <Text style={styles.recordMeta}>{record.doctor}{record.clinic ? ` \u00B7 ${record.clinic}` : ''}</Text>}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Text style={styles.recordDate}>{formattedDate}</Text>
        <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
      </View>
    </Pressable>
  );
}

export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, records, deleteRecord } = usePets();
  const [filter, setFilter] = useState<FilterType>('all');

  const petRecords = records
    .filter(r => r.petId === activePet?.id)
    .filter(r => filter === 'all' || r.type === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: 12 }]}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={styles.headerTitle}>Track Your Pet's Health</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, lineHeight: 17, marginTop: 4 }}>Log Flea Treatments, Vet Visits, and Medications. Set Reminders As-Needed</Text>
        </View>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/add-record');
          }}
        >
          <Ionicons name="add-circle" size={28} color={C.accent} />
        </Pressable>
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={item => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.filterChip, filter === item.key && styles.filterChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(item.key);
              }}
            >
              <Text style={[styles.filterText, filter === item.key && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          )}
        />
      </View>

      <FlatList
        data={petRecords}
        keyExtractor={item => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        scrollEnabled={petRecords.length > 0}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={40} color={C.textMuted} />
            <Text style={styles.emptyTitle}>No Records Yet</Text>
            <Text style={styles.emptyText}>Add vet visits, medications, and vaccinations to keep track of your pet's health history.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <RecordItem record={item} onDelete={async () => {
            if (item.notificationIds && item.notificationIds.length > 0) {
              await cancelReminders(item.notificationIds);
            }
            deleteRecord(item.id);
          }} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text },
  filters: { paddingBottom: 8 },
  filterList: { paddingHorizontal: 20, paddingRight: 30, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder },
  filterChipActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  filterText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSecondary },
  filterTextActive: { color: C.accent },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  recordItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  recordIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  recordInfo: { flex: 1, marginLeft: 12 },
  recordTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  recordDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  recordMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 2 },
  recordDate: { fontFamily: 'Inter_500Medium', fontSize: 11, color: C.textMuted },
  emptyState: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.textSecondary },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
});
