import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Image, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';

const C = Colors.dark;

export default function SitterPetSwitcher() {
  const insets = useSafeAreaInsets();
  const { sharedPets, userName, selectedSharedPetId, setSelectedSharedPetId } = usePets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.wrapper, { paddingTop: topInset + 8 }]}>
      <View style={styles.ownerRow}>
        <View>
          <Text style={styles.welcomeLabel}>Pet Sitter</Text>
          <Text style={styles.ownerName}>{userName || 'My Care Pets'}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/accept-invite' as any);
            }}
            style={styles.addButton}
            testID="sitter-header-add-pet"
          >
            <Ionicons name="add-circle" size={28} color={C.accent} />
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            hitSlop={8}
            testID="sitter-header-settings"
          >
            <Ionicons name="settings-outline" size={22} color={C.textSecondary} />
          </Pressable>
        </View>
      </View>
      {sharedPets.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedSharedPetId(null);
            }}
            style={[styles.chip, !selectedSharedPetId && styles.chipActive]}
            testID="sitter-pet-all"
          >
            <View style={[styles.chipAvatarPlaceholder, !selectedSharedPetId && styles.chipAvatarPlaceholderActive]}>
              <MaterialCommunityIcons name="view-grid" size={12} color={!selectedSharedPetId ? C.background : C.textMuted} />
            </View>
            <Text style={[styles.chipName, !selectedSharedPetId && styles.chipNameActive]} numberOfLines={1}>
              All
            </Text>
          </Pressable>
          {sharedPets.map(sp => {
            const isActive = selectedSharedPetId === sp.id;
            return (
              <Pressable
                key={sp.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedSharedPetId(sp.id);
                }}
                style={[styles.chip, isActive && styles.chipActive]}
                testID={`sitter-pet-${sp.id}`}
              >
                {sp.pet.photoUri ? (
                  <Image source={{ uri: sp.pet.photoUri }} style={[styles.chipAvatar, isActive && styles.chipAvatarActive]} />
                ) : (
                  <View style={[styles.chipAvatarPlaceholder, isActive && styles.chipAvatarPlaceholderActive]}>
                    <Ionicons name="paw" size={12} color={isActive ? C.background : C.textMuted} />
                  </View>
                )}
                <Text style={[styles.chipName, isActive && styles.chipNameActive]} numberOfLines={1}>
                  {sp.pet.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
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
});
