import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, Image, TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets, generateId } from '@/lib/pet-context';

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon as any} size={18} color={C.accent} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SitterPetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sharedPets, sitterNotes, addSitterNote, userName } = usePets();
  const insets = useSafeAreaInsets();
  const [noteText, setNoteText] = useState('');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  const sharedPet = sharedPets.find(sp => sp.id === id);
  const pet = sharedPet?.pet;
  const petNotes = sitterNotes.filter(n => n.sharedPetId === id);

  const handleAddNote = async () => {
    if (!noteText.trim() || !sharedPet || !pet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const note = {
      id: generateId(),
      sharedPetId: sharedPet.id,
      petId: pet.id,
      text: noteText.trim(),
      createdAt: new Date().toISOString(),
      sitterName: userName,
    };
    await addSitterNote(note);
    setNoteText('');
  };

  if (!sharedPet || !pet) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyText}>Pet not found</Text>
        </View>
      </View>
    );
  }

  const age = getAge(pet.birthDate);
  const hasVetInfo = pet.vetName || pet.vetClinic || pet.vetPhone;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={[styles.headerBar, { paddingTop: topInset + 8 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Pet Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={[C.accent, C.accentDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {pet.photoUri ? (
            <Image source={{ uri: pet.photoUri }} style={styles.heroAvatar} />
          ) : (
            <View style={styles.heroAvatarPlaceholder}>
              <Ionicons name="paw" size={36} color={C.accent} />
            </View>
          )}
          <Text style={styles.heroName}>{pet.name}</Text>
          <Text style={styles.heroBreed}>{pet.breed}</Text>
          <View style={styles.ownerBadge}>
            <Ionicons name="person-circle-outline" size={14} color={C.accent} />
            <Text style={styles.ownerBadgeText}>Owner: {sharedPet.ownerName}</Text>
          </View>
        </LinearGradient>

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="information-outline" size={20} color={C.accent} />
          <Text style={styles.sectionTitle}>Pet Information</Text>
        </View>

        <View style={styles.card}>
          <InfoRow icon="paw" label="Species" value={pet.species.charAt(0).toUpperCase() + pet.species.slice(1)} />
          <View style={styles.divider} />
          <InfoRow icon="ribbon" label="Breed" value={pet.breed} />
          <View style={styles.divider} />
          <InfoRow icon="scale" label="Weight" value={`${pet.weight} ${pet.weightUnit}`} />
          <View style={styles.divider} />
          <InfoRow icon="male-female" label="Gender" value={pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)} />
          <View style={styles.divider} />
          <InfoRow icon="color-palette" label="Color" value={pet.color} />
          <View style={styles.divider} />
          <InfoRow icon="calendar" label="Age" value={age || 'Unknown'} />
        </View>

        {hasVetInfo && (
          <>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="stethoscope" size={20} color={C.accent} />
              <Text style={styles.sectionTitle}>Veterinarian</Text>
            </View>
            <View style={styles.card}>
              {pet.vetName && (
                <InfoRow icon="person" label="Vet Name" value={pet.vetName} />
              )}
              {pet.vetName && pet.vetClinic && <View style={styles.divider} />}
              {pet.vetClinic && (
                <InfoRow icon="business" label="Clinic" value={pet.vetClinic} />
              )}
              {(pet.vetName || pet.vetClinic) && pet.vetPhone && <View style={styles.divider} />}
              {pet.vetPhone && (
                <InfoRow icon="call" label="Phone" value={pet.vetPhone} />
              )}
            </View>
          </>
        )}

        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="note-text-outline" size={20} color={C.accent} />
          <Text style={styles.sectionTitle}>Sitter Notes</Text>
          {petNotes.length > 0 && (
            <View style={styles.noteCount}>
              <Text style={styles.noteCountText}>{petNotes.length}</Text>
            </View>
          )}
        </View>

        {petNotes.length === 0 ? (
          <View style={styles.emptyNotes}>
            <Ionicons name="document-text-outline" size={32} color={C.textMuted} />
            <Text style={styles.emptyNotesText}>No notes yet</Text>
          </View>
        ) : (
          petNotes.map(note => (
            <View key={note.id} style={styles.noteCard}>
              <Text style={styles.noteTextContent}>{note.text}</Text>
              <View style={styles.noteMeta}>
                <View style={styles.noteMetaLeft}>
                  <Ionicons name="person-outline" size={12} color={C.textMuted} />
                  <Text style={styles.noteMetaText}>{note.sitterName}</Text>
                </View>
                <Text style={styles.noteMetaText}>{formatDate(note.createdAt)}</Text>
              </View>
            </View>
          ))
        )}

        <View style={styles.addNoteCard}>
          <TextInput
            style={styles.noteInput}
            placeholder="Add a note about this pet..."
            placeholderTextColor={C.textMuted}
            value={noteText}
            onChangeText={setNoteText}
            multiline
          />
          <Pressable
            style={[styles.addNoteButton, !noteText.trim() && styles.addNoteButtonDisabled]}
            onPress={handleAddNote}
            disabled={!noteText.trim()}
          >
            <LinearGradient
              colors={noteText.trim() ? [C.accent, C.accentDim] : [C.textMuted, C.textMuted]}
              style={styles.addNoteGradient}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addNoteText}>Add Note</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: C.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    color: C.text,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  heroCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  heroAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  heroName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroBreed: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 12,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ownerBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: C.accent,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.text,
    flex: 1,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: C.text,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginHorizontal: 14,
  },
  noteCount: {
    backgroundColor: C.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  noteCountText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: C.accent,
  },
  emptyNotes: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyNotesText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
    color: C.textMuted,
  },
  noteCard: {
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  noteTextContent: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
    lineHeight: 21,
    marginBottom: 10,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  noteMetaText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
  },
  addNoteCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    marginTop: 4,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  noteInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
    padding: 0,
  },
  addNoteButton: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-end',
  },
  addNoteButtonDisabled: {
    opacity: 0.5,
  },
  addNoteGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addNoteText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: C.textMuted,
  },
});
