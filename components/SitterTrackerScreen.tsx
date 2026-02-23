import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, TextInput, Platform,
  KeyboardAvoidingView, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';

const C = Colors.dark;

const BEHAVIOR_CATEGORIES = [
  { key: 'vomiting', icon: 'alert-circle', label: 'Vomiting', color: '#D64545' },
  { key: 'diarrhea', icon: 'water', label: 'Diarrhea', color: '#D97706' },
  { key: 'lethargy', icon: 'moon', label: 'Lethargy', color: '#1E40AF' },
  { key: 'appetite_change', icon: 'restaurant', label: 'Appetite Change', color: '#D97706' },
  { key: 'excessive_drinking', icon: 'water', label: 'Excessive Drinking', color: '#3FA9D6' },
  { key: 'limping', icon: 'walk', label: 'Limping', color: '#9333EA' },
  { key: 'scratching', icon: 'hand-left', label: 'Scratching', color: '#D4A574' },
  { key: 'other', icon: 'create', label: 'Other', color: '#64748B' },
] as const;

export default function SitterTrackerScreen() {
  const { sharedPets, selectedSharedPetId, sitterNotes, addSitterNote, userName } = usePets();
  const [noteText, setNoteText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const activePet = selectedSharedPetId
    ? sharedPets.find(sp => sp.id === selectedSharedPetId)
    : null;

  const filteredNotes = useMemo(() => {
    let notes = sitterNotes;
    if (selectedSharedPetId) {
      notes = notes.filter(n => n.sharedPetId === selectedSharedPetId);
    }
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [sitterNotes, selectedSharedPetId]);

  const handleAddNote = async () => {
    if (!noteText.trim()) {
      Alert.alert('Empty Note', 'Please enter a behavior description.');
      return;
    }
    if (!activePet) {
      Alert.alert('Select a Pet', 'Please select a specific pet from the top bar to log behavior.');
      return;
    }

    const prefix = selectedCategory
      ? BEHAVIOR_CATEGORIES.find(c => c.key === selectedCategory)?.label + ': '
      : '';

    await addSitterNote({
      id: Crypto.randomUUID(),
      sharedPetId: activePet.id,
      petId: activePet.pet.id,
      text: prefix + noteText.trim(),
      createdAt: new Date().toISOString(),
      sitterName: userName,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNoteText('');
    setSelectedCategory(null);
    setIsAdding(false);
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.header, { paddingTop: 12 }]}>
          <Text style={styles.headerTitle}>Behavior Tracker</Text>
          {activePet && (
            <Text style={styles.headerSubtitle}>Tracking for {activePet.pet.name}</Text>
          )}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {!activePet ? (
            <View style={styles.selectPrompt}>
              <View style={styles.selectIconWrap}>
                <MaterialCommunityIcons name="paw" size={32} color={C.textMuted} />
              </View>
              <Text style={styles.selectTitle}>Select a Pet</Text>
              <Text style={styles.selectText}>
                Choose a specific pet from the bar above to log their behavior. You can switch between pets anytime.
              </Text>
            </View>
          ) : (
            <>
              {!isAdding ? (
                <Pressable
                  style={styles.addCTA}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsAdding(true);
                  }}
                  testID="sitter-tracker-add"
                >
                  <View style={styles.addCTALeft}>
                    <View style={styles.addCTAIcon}>
                      <Ionicons name="add" size={20} color={C.accent} />
                    </View>
                    <View>
                      <Text style={styles.addCTATitle}>Log Behavior</Text>
                      <Text style={styles.addCTASub}>Note any unusual behavior for {activePet.pet.name}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
                </Pressable>
              ) : (
                <View style={styles.addForm}>
                  <Text style={styles.formLabel}>What happened?</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoryRow}
                  >
                    {BEHAVIOR_CATEGORIES.map(cat => {
                      const isActive = selectedCategory === cat.key;
                      return (
                        <Pressable
                          key={cat.key}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedCategory(isActive ? null : cat.key);
                          }}
                          style={[styles.categoryChip, isActive && { backgroundColor: `${cat.color}20`, borderColor: cat.color }]}
                        >
                          <Ionicons name={cat.icon as any} size={14} color={isActive ? cat.color : C.textMuted} />
                          <Text style={[styles.categoryText, isActive && { color: cat.color }]}>{cat.label}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  <TextInput
                    style={styles.noteInput}
                    placeholder={`Describe what you observed with ${activePet.pet.name}...`}
                    placeholderTextColor={C.textMuted}
                    value={noteText}
                    onChangeText={setNoteText}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    autoFocus
                  />

                  <View style={styles.formActions}>
                    <Pressable
                      style={styles.cancelBtn}
                      onPress={() => {
                        setIsAdding(false);
                        setNoteText('');
                        setSelectedCategory(null);
                      }}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.saveBtn, !noteText.trim() && { opacity: 0.5 }]}
                      onPress={handleAddNote}
                      disabled={!noteText.trim()}
                    >
                      <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                      <Text style={styles.saveText}>Save</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.historySection}>
                <Text style={styles.historyTitle}>Recent Observations</Text>
                {filteredNotes.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="document-text-outline" size={36} color={C.textMuted} />
                    <Text style={styles.emptyTitle}>No notes yet</Text>
                    <Text style={styles.emptyText}>
                      Tap "Log Behavior" to record your first observation about {activePet.pet.name}.
                    </Text>
                  </View>
                ) : (
                  filteredNotes.map(note => {
                    const pet = sharedPets.find(sp => sp.id === note.sharedPetId);
                    return (
                      <View key={note.id} style={styles.noteCard}>
                        <View style={styles.noteHeader}>
                          <View style={styles.noteIconWrap}>
                            <Ionicons name="create" size={14} color={C.accent} />
                          </View>
                          <Text style={styles.notePetName}>{pet?.pet.name || 'Pet'}</Text>
                          <Text style={styles.noteDate}>
                            {new Date(note.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                            })}
                          </Text>
                        </View>
                        <Text style={styles.noteText}>{note.text}</Text>
                      </View>
                    );
                  })
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text },
  headerSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, marginTop: 2 },
  scroll: { paddingHorizontal: 20 },
  selectPrompt: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30 },
  selectIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.surfaceElevated, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  selectTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: C.text, marginBottom: 8 },
  selectText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textMuted, textAlign: 'center', lineHeight: 22 },
  addCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.accentBorder },
  addCTALeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addCTAIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  addCTATitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  addCTASub: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  addForm: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: C.accentBorder },
  formLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text, marginBottom: 10 },
  categoryRow: { gap: 8, marginBottom: 12 },
  categoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: C.surfaceElevated, borderWidth: 1, borderColor: C.cardBorder },
  categoryText: { fontFamily: 'Inter_500Medium', fontSize: 12, color: C.textMuted },
  noteInput: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, backgroundColor: C.surfaceElevated, borderRadius: 12, padding: 14, minHeight: 100, marginBottom: 12 },
  formActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  cancelText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.textMuted },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  saveText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  historySection: { marginTop: 4 },
  historyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.text, marginBottom: 12 },
  noteCard: { backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  noteIconWrap: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  notePetName: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text, flex: 1 },
  noteDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted },
  noteText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 30, gap: 8 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.textSecondary },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
});
