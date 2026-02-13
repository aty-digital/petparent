import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import BrandLogo from '@/components/BrandLogo';
import { usePets } from '@/lib/pet-context';

const C = Colors.dark;

function PetCard({ pet }: { pet: any }) {
  const age = getAge(pet.birthDate);
  return (
    <View style={styles.petCard}>
      <View style={styles.petCardInner}>
        {pet.photoUri ? (
          <Image source={{ uri: pet.photoUri }} style={styles.petAvatarImage} />
        ) : (
          <View style={styles.petAvatar}>
            <Ionicons name="paw" size={28} color={C.accent} />
          </View>
        )}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>{pet.breed} {age ? `\u00B7 ${age}` : ''}</Text>
          <View style={styles.healthBadge}>
            <Text style={styles.healthBadgeText}>HEALTHY</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function TriageCTA() {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/triage');
      }}
    >
      <LinearGradient
        colors={[C.accent, C.accentDim]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.triageCTA}
      >
        <View style={styles.triageCTATop}>
          <View style={styles.triageIcon}>
            <MaterialCommunityIcons name="stethoscope" size={20} color={C.accent} />
          </View>
          <View>
            <Text style={styles.triageTitle}>AI Symptom Triage</Text>
            <Text style={styles.triageSubtitle}>Analyze symptoms instantly</Text>
          </View>
        </View>
        <View style={styles.triageButton}>
          <Text style={styles.triageButtonText}>Triage Now</Text>
          <Ionicons name="arrow-forward" size={16} color={C.background} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function StatCard({ icon, label, value, unit }: { icon: string; label: string; value: string; unit: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={C.accent} />
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statRow}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statUnit}>{unit}</Text>
      </View>
    </View>
  );
}

function TaskItem({ task, onToggle }: { task: any; onToggle: () => void }) {
  const getIcon = () => {
    switch (task.type) {
      case 'vaccination': return 'shield-checkmark';
      case 'medication': return 'medical';
      case 'supplement': return 'nutrition';
      default: return 'clipboard';
    }
  };
  const getColor = () => {
    switch (task.type) {
      case 'vaccination': return '#5DA8D3';
      case 'medication': return C.accent;
      case 'supplement': return '#D4A574';
      default: return C.accent;
    }
  };

  const dueText = getDueText(task.dueDate);

  return (
    <Pressable
      style={styles.taskItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onToggle();
      }}
    >
      <View style={[styles.taskIcon, { backgroundColor: `${getColor()}18` }]}>
        <Ionicons name={getIcon() as any} size={18} color={getColor()} />
      </View>
      <View style={styles.taskInfo}>
        <Text style={[styles.taskTitle, task.completed && styles.taskCompleted]}>{task.title}</Text>
        <Text style={styles.taskDue}>{dueText}</Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle();
        }}
        style={[styles.taskCheck, task.completed && styles.taskCheckDone]}
      >
        {task.completed && <Ionicons name="checkmark" size={14} color={C.background} />}
      </Pressable>
    </Pressable>
  );
}

function ActiveMedCard({ record }: { record: any }) {
  const freqLabels: Record<string, string> = {
    once_daily: '1x/day', twice_daily: '2x/day', three_daily: '3x/day',
    weekly: 'Weekly', biweekly: 'Biweekly', monthly: 'Monthly', as_needed: 'As needed',
  };
  const freqLabel = record.frequency ? freqLabels[record.frequency] || record.frequency : '';
  const timesLabel = record.reminderTimes?.length ? record.reminderTimes.join(', ') : '';

  return (
    <View style={styles.activeMedCard}>
      <View style={styles.activeMedIcon}>
        <Ionicons name="medical" size={16} color="#D4A574" />
      </View>
      <View style={styles.activeMedInfo}>
        <Text style={styles.activeMedName}>{record.title}</Text>
        <Text style={styles.activeMedDetails}>
          {freqLabel}{timesLabel ? ` \u00B7 ${timesLabel}` : ''}
        </Text>
      </View>
      {record.remindersEnabled && (
        <View style={styles.activeMedBell}>
          <Ionicons name="notifications" size={14} color={C.accent} />
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { activePet, pets, records, tasks, toggleTask, isLoading, userName } = usePets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const activeMeds = records.filter(
    r => r.petId === activePet?.id && r.type === 'medication' && r.currentlyTaking
  );

  const petTasks = tasks
    .filter(t => t.petId === activePet?.id)
    .sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    })
    .slice(0, 5);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={C.accent} size="large" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!activePet) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <BrandLogo size="medium" showText={true} showSubtitle={false} />
          <Text style={styles.emptyTitle}>Welcome!</Text>
          <Text style={styles.emptyText}>Add your first pet to get started with health tracking, AI symptom triage, and more.</Text>
          <Pressable
            style={styles.addPetButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/add-pet');
            }}
          >
            <LinearGradient
              colors={[C.accent, C.accentDim]}
              style={styles.addPetGradient}
            >
              <Ionicons name="add" size={20} color={C.background} />
              <Text style={styles.addPetText}>Add Your Pet</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 16, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <PetCard pet={activePet} />
        <TriageCTA />

        <View style={styles.statsRow}>
          <StatCard icon="heart" label="WEIGHT" value={String(activePet.weight)} unit={activePet.weightUnit} />
          <StatCard icon="fitness" label="SPECIES" value={activePet.species.charAt(0).toUpperCase() + activePet.species.slice(1)} unit="" />
        </View>

        {activeMeds.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Medications</Text>
              <View style={styles.activeMedCount}>
                <Text style={styles.activeMedCountText}>{activeMeds.length}</Text>
              </View>
            </View>
            {activeMeds.map(med => (
              <ActiveMedCard key={med.id} record={med} />
            ))}
            <View style={{ height: 16 }} />
          </>
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Tasks</Text>
          <Pressable onPress={() => router.push('/add-task')}>
            <Ionicons name="add-circle-outline" size={22} color={C.accent} />
          </Pressable>
        </View>

        {petTasks.length === 0 ? (
          <View style={styles.emptyTasks}>
            <Ionicons name="checkmark-done-circle-outline" size={32} color={C.textMuted} />
            <Text style={styles.emptyTasksText}>No upcoming tasks</Text>
            <Pressable
              onPress={() => router.push('/add-task')}
              style={styles.addTaskLink}
            >
              <Text style={styles.addTaskLinkText}>Add a medication or vaccination reminder</Text>
            </Pressable>
          </View>
        ) : (
          petTasks.map(task => (
            <TaskItem key={task.id} task={task} onToggle={() => toggleTask(task.id)} />
          ))
        )}

        <Pressable
          style={styles.dailyTrackerCTA}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/daily-tracker');
          }}
        >
          <View style={styles.dailyTrackerLeft}>
            <Ionicons name="analytics" size={20} color={C.accent} />
            <View>
              <Text style={styles.dailyTrackerTitle}>Daily Tracker</Text>
              <Text style={styles.dailyTrackerSub}>Log today's behavior and concerns</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

function getAge(birthDate: string): string {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years > 0) {
    if (months < 0) return `${years - 1}y ${12 + months}m`;
    return years === 1 && months === 0 ? '1 Year' : `${years}y ${months}m`;
  }
  return months <= 0 ? 'Newborn' : `${months}m`;
}

function getDueText(dueDate: string): string {
  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} days`;
  if (diffDays === 0) return 'Due today';
  if (diffDays === 1) return 'Due tomorrow';
  if (diffDays <= 30) return `Due in ${diffDays} days`;
  return `Due ${due.toLocaleDateString()}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  welcomeText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.accent },
  userName: { fontFamily: 'Inter_700Bold', fontSize: 26, color: C.text },
  notifButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  petCard: { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder },
  petCardInner: { flexDirection: 'row', alignItems: 'center' },
  petAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.accentSoft, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  petAvatarImage: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: C.accent },
  petInfo: { marginLeft: 14, flex: 1 },
  petName: { fontFamily: 'Inter_700Bold', fontSize: 20, color: C.text },
  petBreed: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, marginTop: 2 },
  healthBadge: { backgroundColor: C.successSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, alignSelf: 'flex-start', marginTop: 6 },
  healthBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 10, color: C.accent, letterSpacing: 1 },
  triageCTA: { borderRadius: 16, padding: 20, marginBottom: 16 },
  triageCTATop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  triageIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  triageTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF' },
  triageSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  triageButton: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  triageButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.accent },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.cardBorder },
  statLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: C.textMuted, letterSpacing: 1, marginTop: 8 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3, marginTop: 4 },
  statValue: { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.text },
  statUnit: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  taskItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  taskIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1, marginLeft: 12 },
  taskTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  taskCompleted: { textDecorationLine: 'line-through', color: C.textMuted },
  taskDue: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  taskCheck: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  taskCheckDone: { backgroundColor: C.accent, borderColor: C.accent },
  emptyTasks: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyTasksText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.textMuted },
  addTaskLink: { marginTop: 4 },
  addTaskLinkText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.accent },
  dailyTrackerCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.cardBorder },
  dailyTrackerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dailyTrackerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  dailyTrackerSub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, paddingTop: 100 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  emptyTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text, marginBottom: 12 },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', lineHeight: 22 },
  addPetButton: { marginTop: 24, borderRadius: 14, overflow: 'hidden' },
  addPetGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  addPetText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.background },
  activeMedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  activeMedIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(212, 165, 116, 0.15)', alignItems: 'center', justifyContent: 'center' },
  activeMedInfo: { flex: 1, marginLeft: 10 },
  activeMedName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  activeMedDetails: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  activeMedBell: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  activeMedCount: { backgroundColor: 'rgba(212, 165, 116, 0.2)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  activeMedCountText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#D4A574' },
});
