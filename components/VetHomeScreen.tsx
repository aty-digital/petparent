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

function ClientPetCard({ shared }: { shared: SharedPet }) {
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
            <Text style={styles.ownerBadgeText}>Client: {ownerName}</Text>
          </View>
        </View>
        <View style={styles.chevronWrap}>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </View>
      </View>
    </Pressable>
  );
}

export default function VetHomeScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { vetClients, clinicName, userName } = usePets();

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: topInset + 8 }]}>
      <View>
        <Text style={styles.headerGreeting}>Welcome back,</Text>
        <Text style={styles.headerName}>Dr. {userName || 'Vet'}</Text>
      </View>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push('/settings' as any);
        }}
        style={styles.settingsBtn}
      >
        <Ionicons name="settings-outline" size={22} color={C.text} />
      </Pressable>
    </View>
  );

  if (vetClients.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <MaterialCommunityIcons name="stethoscope" size={40} color={C.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>No client pets yet</Text>
          <Text style={styles.emptyText}>
            Add a client's pet manually or accept an invite code from a pet parent to get started.
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/vet-add-client' as any);
            }}
          >
            <LinearGradient
              colors={[C.accent, C.accentDim]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyButton}
            >
              <Ionicons name="person-add" size={18} color="#FFFFFF" />
              <Text style={styles.emptyButtonText}>Add Client</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        {clinicName ? (
          <View style={styles.clinicBanner}>
            <MaterialCommunityIcons name="hospital-building" size={18} color={C.accent} />
            <Text style={styles.clinicBannerText}>{clinicName}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{vetClients.length}</Text>
            <Text style={styles.statLabel}>Client Pets</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {new Set(vetClients.map(c => c.ownerEmail)).size}
            </Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
        </View>

        {vetClients.map(shared => (
          <ClientPetCard key={shared.id} shared={shared} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerGreeting: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
  },
  headerName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: C.text,
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  clinicBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  clinicBannerText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.accent,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: C.text,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.5,
    marginTop: 4,
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
