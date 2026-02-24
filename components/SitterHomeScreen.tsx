import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import type { SharedPet } from '@/lib/types';

const C = Colors.dark;

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

function SharedPetCard({ shared }: { shared: SharedPet }) {
  const { pet, ownerName } = shared;
  const age = getAge(pet.birthDate);

  return (
    <Pressable
      style={styles.petCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/sitter-pet-detail?id=${shared.id}` as any);
      }}
    >
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
          <Text style={styles.petBreed}>
            {pet.breed}{age ? ` \u00B7 ${age}` : ''}
          </Text>
          <View style={styles.ownerBadge}>
            <Ionicons name="person-outline" size={11} color={C.accent} />
            <Text style={styles.ownerBadgeText}>Owner: {ownerName}</Text>
          </View>
        </View>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

function SitterTriageCTA() {
  const { canUseTriageThisMonth, triageUsedThisMonth, maxFreeTriagePerMonth, tier } = useSubscription();
  const triageAllowed = canUseTriageThisMonth();

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/triage' as any);
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
            <MaterialCommunityIcons name="stethoscope" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.triageTitle}>AI Symptom Triage</Text>
            <Text style={styles.triageSubtitle}>
              {tier === 'free'
                ? `${triageUsedThisMonth}/${maxFreeTriagePerMonth} free sessions used`
                : 'Unlimited sessions'}
            </Text>
          </View>
        </View>
        <View style={styles.triageButton}>
          <Text style={styles.triageButtonText}>Triage Now</Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={C.accent} />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SelectedPetDetail({ shared }: { shared: SharedPet }) {
  const { pet, ownerName } = shared;
  const { sitterNotes } = usePets();
  const age = getAge(pet.birthDate);
  const petNotes = sitterNotes.filter(n => n.sharedPetId === shared.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.detailCard}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          {pet.photoUri ? (
            <Image source={{ uri: pet.photoUri }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.accent }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentSoft, borderWidth: 3, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="paw" size={36} color={C.accent} />
            </View>
          )}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: C.text, marginTop: 10 }}>{pet.name}</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSecondary, marginTop: 2 }}>
            {pet.breed}{age ? ` \u00B7 ${age}` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <View style={{ flex: 1, backgroundColor: C.surfaceElevated, borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>WEIGHT</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.text }}>{pet.weight} {pet.weightUnit}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.surfaceElevated, borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>SPECIES</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.text, textTransform: 'capitalize' }}>{pet.species}</Text>
          </View>
          <View style={{ flex: 1, backgroundColor: C.surfaceElevated, borderRadius: 12, padding: 12, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginBottom: 4 }}>OWNER</Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text }} numberOfLines={1}>{ownerName}</Text>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 12 }}>
        <SitterTriageCTA />
      </View>

      <View style={{ marginTop: 4 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.text }}>Your Notes</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/sitter-pet-detail?id=${shared.id}` as any);
            }}
          >
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.accent }}>View All</Text>
          </Pressable>
        </View>

        {petNotes.length === 0 ? (
          <View style={{ backgroundColor: C.card, borderRadius: 14, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder }}>
            <Ionicons name="document-text-outline" size={28} color={C.textMuted} />
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted, marginTop: 8, textAlign: 'center' }}>
              No notes yet. Tap "View All" to add your first note about {pet.name}.
            </Text>
          </View>
        ) : (
          petNotes.map(note => (
            <View key={note.id} style={{ backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder }}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, lineHeight: 20 }}>{note.text}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 6 }}>
                {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

export default function SitterHomeScreen() {
  const { sharedPets, selectedSharedPetId } = usePets();

  const selectedPet = selectedSharedPetId
    ? sharedPets.find(sp => sp.id === selectedSharedPetId)
    : null;

  if (sharedPets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="paw-off" size={40} color={C.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No pets shared with you yet</Text>
          <Text style={styles.emptyText}>
            When a pet parent shares their pet with you, it will appear here. Accept an invite code to get started.
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/accept-invite' as any);
            }}
          >
            <LinearGradient
              colors={[C.accent, C.accentDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButton}
            >
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Accept an Invite</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  if (selectedPet) {
    return (
      <View style={styles.container}>
        <SelectedPetDetail shared={selectedPet} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <SitterTriageCTA />
        {sharedPets.map(shared => (
          <SharedPetCard key={shared.id} shared={shared} />
        ))}
      </ScrollView>

      <Pressable
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/accept-invite' as any);
        }}
      >
        <LinearGradient
          colors={[C.accent, C.accentDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  detailCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  petCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  petCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.accentSoft,
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: C.accent,
  },
  petInfo: {
    marginLeft: 14,
    flex: 1,
  },
  petName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.text,
  },
  petBreed: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textSecondary,
    marginTop: 2,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: C.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  ownerBadgeText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.accent,
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    borderRadius: 28,
    shadowColor: C.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  triageCTA: { borderRadius: 16, padding: 20, marginBottom: 16 },
  triageCTATop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  triageIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  triageTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: '#FFFFFF' },
  triageSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  triageButton: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  triageButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.accent },
});
