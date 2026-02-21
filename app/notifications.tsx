import React from 'react';
import {
  StyleSheet, Text, View, Pressable, Platform, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useNotifications } from '@/lib/notification-context';
import type { InAppNotification } from '@/lib/types';

const C = Colors.dark;

function NotificationItem({ item, onPress }: { item: InAppNotification; onPress: () => void }) {
  const isWeek = item.type === 'follow_up_1_week';
  const timeAgo = getTimeAgo(item.createdAt);

  return (
    <Pressable
      style={[styles.notifItem, !item.read && styles.notifItemUnread]}
      onPress={onPress}
    >
      <View style={[styles.notifIcon, { backgroundColor: isWeek ? 'rgba(79, 195, 247, 0.12)' : 'rgba(255, 183, 77, 0.12)' }]}>
        <Ionicons
          name={isWeek ? 'calendar-outline' : 'alarm-outline'}
          size={20}
          color={isWeek ? '#4FC3F7' : '#FFB74D'}
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>{item.title}</Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
        <Text style={styles.notifTime}>{timeAgo}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </Pressable>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { notifications, markAsRead, markAllAsRead, clearAll } = useNotifications();

  const handlePress = (item: InAppNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.read) {
      markAsRead(item.id);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: topInset + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={C.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <Pressable onPress={() => { Haptics.selectionAsync(); markAllAsRead(); }} hitSlop={8}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={C.textMuted} />
          <Text style={styles.emptyTitle}>No notifications yet</Text>
          <Text style={styles.emptyText}>Follow-up visit reminders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <NotificationItem item={item} onPress={() => handlePress(item)} />
          )}
          contentContainerStyle={[styles.list, { paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!notifications.length}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.cardBorder,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  markAllText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.accent },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
    gap: 12,
  },
  notifItemUnread: { backgroundColor: 'rgba(45, 106, 79, 0.04)', borderColor: C.accentBorder },
  notifIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.text },
  notifTitleUnread: { fontFamily: 'Inter_600SemiBold' },
  notifBody: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, marginTop: 3, lineHeight: 18 },
  notifTime: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, marginTop: 6 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, color: C.text },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center' },
});
