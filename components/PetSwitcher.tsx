import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import { useNotifications } from '@/lib/notification-context';

const C = Colors.dark;

export default function PetSwitcher() {
  const insets = useSafeAreaInsets();
  const { pets, activePet, setActivePetId, userName } = usePets();
  const { unreadCount } = useNotifications();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.wrapper, { paddingTop: topInset + 8 }]}>
      <View style={styles.ownerRow}>
        <View>
          <Text style={styles.welcomeLabel}>Pet Parent</Text>
          <Text style={styles.ownerName}>{userName || 'My Pets'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/notifications');
            }}
            style={styles.bellButton}
            testID="header-notifications"
          >
            <Ionicons name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} size={22} color={unreadCount > 0 ? C.accent : C.textSecondary} />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/add-pet');
            }}
            style={styles.addButton}
            testID="header-add-pet"
          >
            <Ionicons name="add-circle" size={28} color={C.accent} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            hitSlop={8}
            testID="header-settings"
          >
            <Ionicons name="settings-outline" size={22} color={C.textSecondary} />
          </Pressable>
        </View>
      </View>
      {pets.length > 0 && (<ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {pets.map(pet => {
          const isActive = pet.id === activePet?.id;
          return (
            <Pressable
              key={pet.id}
              onPress={() => {
                if (!isActive) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setActivePetId(pet.id);
                }
              }}
              style={[styles.chip, isActive && styles.chipActive]}
              testID={`pet-switcher-${pet.id}`}
            >
              {pet.photoUri ? (
                <Image source={{ uri: pet.photoUri }} style={[styles.chipAvatar, isActive && styles.chipAvatarActive]} />
              ) : (
                <View style={[styles.chipAvatarPlaceholder, isActive && styles.chipAvatarPlaceholderActive]}>
                  <Ionicons name="paw" size={12} color={isActive ? C.background : C.textMuted} />
                </View>
              )}
              <Text style={[styles.chipName, isActive && styles.chipNameActive]} numberOfLines={1}>
                {pet.name}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/add-pet');
          }}
          style={styles.addChip}
          testID="pet-switcher-add"
        >
          <Ionicons name="add" size={16} color={C.accent} />
        </Pressable>
      </ScrollView>)}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: C.background,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
    paddingBottom: 10,
  },
  ownerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  welcomeLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.accent,
    letterSpacing: 0.5,
  },
  ownerName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.text,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative' as const,
  },
  badge: {
    position: 'absolute' as const,
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#D64545',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 9,
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingLeft: 6,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 6,
  },
  chipActive: {
    backgroundColor: C.accentSoft,
    borderColor: C.accent,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  chipAvatarActive: {
    borderColor: C.accent,
  },
  chipAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: C.cardBorder,
  },
  chipAvatarPlaceholderActive: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  chipName: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.textSecondary,
    maxWidth: 80,
  },
  chipNameActive: {
    color: C.accent,
    fontFamily: 'Inter_600SemiBold',
  },
  addChip: {
    width: 32,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.cardBorder,
    borderStyle: 'dashed' as any,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
