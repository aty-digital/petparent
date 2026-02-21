import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useNotifications } from '@/lib/notification-context';

const C = Colors.dark;

export default function SwoopNotification() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { pendingSwoopNotification, dismissSwoop, dismissNotification } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-200)).current;

  useEffect(() => {
    if (pendingSwoopNotification) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 10,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [pendingSwoopNotification]);

  if (!pendingSwoopNotification) return null;

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dismissNotification(pendingSwoopNotification.id);
    dismissSwoop();
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: topInset + 8, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="alarm" size={22} color="#FFB74D" />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{pendingSwoopNotification.title}</Text>
          <Text style={styles.body} numberOfLines={2}>{pendingSwoopNotification.body}</Text>
        </View>
        <Pressable onPress={handleDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>Dismiss</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 183, 77, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flex: 1 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  body: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, marginTop: 2 },
  dismissBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: C.surfaceElevated,
  },
  dismissText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: C.textSecondary },
});
