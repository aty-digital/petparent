import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
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

export default function SitterHomeScreen() {
  const insets = useSafeAreaInsets();
  const { sharedPets, isAlsoPetParent } = usePets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (sharedPets.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.headerBar, { paddingTop: topInset + 12 }]}>
          <Text style={styles.headerTitle}>My Care Pets</Text>
        </View>
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

  return (
    <View style={styles.container}>
      <View style={[styles.headerBar, { paddingTop: topInset + 12 }]}>
        <Text style={styles.headerTitle}>My Care Pets</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{sharedPets.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
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
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: C.text,
  },
  countBadge: {
    backgroundColor: C.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: C.accentBorder,
  },
  countBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.accent,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 4,
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
});
