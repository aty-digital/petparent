import React from 'react';
import {
  StyleSheet, Text, View, Pressable, Modal, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import type { PendingSitterNote } from '@/lib/types';

const C = Colors.dark;

function NoteCard({ note, onLog, onDismiss }: {
  note: PendingSitterNote;
  onLog: () => void;
  onDismiss: () => void;
}) {
  const dateStr = new Date(note.createdAt).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteHeader}>
        <View style={styles.noteIconWrap}>
          <Ionicons name="chatbox-ellipses" size={20} color="#7C3AED" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.noteTitle}>Note from {note.sitterName}</Text>
          <Text style={styles.noteMeta}>About {note.petName} · {dateStr}</Text>
        </View>
      </View>
      <Text style={styles.noteText}>{note.text}</Text>
      <View style={styles.noteActions}>
        <Pressable
          style={styles.dismissBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onDismiss();
          }}
        >
          <Ionicons name="close-circle-outline" size={18} color={C.textSecondary} />
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
        <Pressable
          style={styles.logBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onLog();
          }}
        >
          <Ionicons name="document-text-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logText}>Log to Tracker</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function SitterNoteModal() {
  const { pendingSitterNotes, dismissPendingSitterNote, logPendingSitterNote, userRole, activeView } = usePets();

  const isParentView = userRole === 'pet_parent' || (userRole === 'sitter' && activeView === 'parent');
  const currentNote = isParentView && pendingSitterNotes.length > 0 ? pendingSitterNotes[0] : null;

  if (!currentNote) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Ionicons name="notifications" size={24} color="#7C3AED" />
            <Text style={styles.headerTitle}>Sitter Update</Text>
            {pendingSitterNotes.length > 1 && (
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{pendingSitterNotes.length}</Text>
              </View>
            )}
          </View>
          <NoteCard
            note={currentNote}
            onLog={() => logPendingSitterNote(currentNote)}
            onDismiss={() => dismissPendingSitterNote(currentNote.id)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: C.surface,
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 24 },
      android: { elevation: 16 },
      web: { boxShadow: '0 8px 24px rgba(0,0,0,0.25)' },
    }),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.text,
    flex: 1,
  },
  countBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  noteCard: {
    backgroundColor: C.surfaceElevated,
    borderRadius: 14,
    padding: 16,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  noteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124,58,237,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noteTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.text,
  },
  noteMeta: {
    fontSize: 12,
    color: C.textSecondary,
    marginTop: 2,
  },
  noteText: {
    fontSize: 14,
    color: C.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  noteActions: {
    flexDirection: 'row',
    gap: 10,
  },
  dismissBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.cardBorder,
    backgroundColor: C.surface,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.textSecondary,
  },
  logBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#7C3AED',
  },
  logText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
