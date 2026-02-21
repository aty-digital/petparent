import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePets } from './pet-context';
import type { InAppNotification } from './types';

interface NotificationContextValue {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (notification: InAppNotification) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => Promise<void>;
  pendingSwoopNotification: InAppNotification | null;
  dismissSwoop: () => void;
  checkFollowUpNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

function notifKey(email: string): string {
  return `@pawguard_user_${email.toLowerCase().trim()}_notifications`;
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { userEmail, records, activePet } = usePets();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [pendingSwoopNotification, setPendingSwoopNotification] = useState<InAppNotification | null>(null);

  useEffect(() => {
    if (userEmail) {
      loadNotifications(userEmail);
    } else {
      setNotifications([]);
    }
  }, [userEmail]);

  const loadNotifications = async (email: string) => {
    try {
      const data = await AsyncStorage.getItem(notifKey(email));
      if (data) {
        setNotifications(JSON.parse(data));
      }
    } catch (e) {
      console.warn('Failed to load notifications:', e);
    }
  };

  const saveNotifications = async (updated: InAppNotification[]) => {
    setNotifications(updated);
    if (userEmail) {
      await AsyncStorage.setItem(notifKey(userEmail), JSON.stringify(updated));
    }
  };

  const addNotification = useCallback(async (notification: InAppNotification) => {
    const existing = notifications.find(n => n.id === notification.id);
    if (existing) return;
    const updated = [notification, ...notifications];
    await saveNotifications(updated);
  }, [notifications, userEmail]);

  const markAsRead = useCallback(async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    await saveNotifications(updated);
  }, [notifications, userEmail]);

  const dismissNotification = useCallback(async (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, dismissed: true } : n);
    await saveNotifications(updated);
    if (pendingSwoopNotification?.id === id) {
      setPendingSwoopNotification(null);
    }
  }, [notifications, userEmail, pendingSwoopNotification]);

  const markAllAsRead = useCallback(async () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    await saveNotifications(updated);
  }, [notifications, userEmail]);

  const clearAll = useCallback(async () => {
    await saveNotifications([]);
  }, [userEmail]);

  const dismissSwoop = useCallback(() => {
    setPendingSwoopNotification(null);
  }, []);

  const checkFollowUpNotifications = useCallback(() => {
    const now = Date.now();
    records.forEach(record => {
      if (record.type !== 'vet_visit' || !record.followUpScheduled || !record.followUpDate || !record.followUpRemindersEnabled) return;

      const [year, month, day] = record.followUpDate.split('-').map(Number);
      const timeParts = (record.followUpTime || '09:00').split(':').map(Number);
      if ([year, month, day].some(isNaN)) return;

      const followUpMs = new Date(year, month - 1, day, timeParts[0] || 9, timeParts[1] || 0).getTime();

      const oneWeekBeforeMs = followUpMs - 7 * 24 * 60 * 60 * 1000;
      const oneWeekId = `followup_1week_${record.id}`;
      if (now >= oneWeekBeforeMs && now < followUpMs) {
        const existing = notifications.find(n => n.id === oneWeekId);
        if (!existing) {
          const clinic = record.clinic || '';
          const doctor = record.doctor || '';
          const petName = activePet?.name || 'Your pet';
          addNotification({
            id: oneWeekId,
            petId: record.petId,
            recordId: record.id,
            type: 'follow_up_1_week',
            title: `${petName} - Vet Visit in 1 Week`,
            body: `Follow-up visit${clinic ? ` at ${clinic}` : ''}${doctor ? ` with ${doctor}` : ''} is coming up on ${record.followUpDate}.`,
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
          });
        }
      }

      const oneDayBeforeMs = followUpMs - 24 * 60 * 60 * 1000;
      const oneDayId = `followup_24h_${record.id}`;
      if (now >= oneDayBeforeMs && now < followUpMs) {
        const existing = notifications.find(n => n.id === oneDayId);
        if (!existing) {
          const clinic = record.clinic || '';
          const doctor = record.doctor || '';
          const petName = activePet?.name || 'Your pet';
          const newNotif: InAppNotification = {
            id: oneDayId,
            petId: record.petId,
            recordId: record.id,
            type: 'follow_up_24_hours',
            title: `${petName} - Vet Visit Tomorrow`,
            body: `Follow-up visit${clinic ? ` at ${clinic}` : ''}${doctor ? ` with ${doctor}` : ''} is tomorrow${record.followUpTime ? ` at ${record.followUpTime}` : ''}.`,
            createdAt: new Date().toISOString(),
            read: false,
            dismissed: false,
          };
          addNotification(newNotif);
          setPendingSwoopNotification(newNotif);
        } else if (!existing.dismissed) {
          setPendingSwoopNotification(existing);
        }
      }
    });
  }, [records, notifications, activePet, addNotification]);

  useEffect(() => {
    if (userEmail && records.length > 0) {
      const timer = setTimeout(() => checkFollowUpNotifications(), 1000);
      return () => clearTimeout(timer);
    }
  }, [userEmail, records.length]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    dismissNotification,
    markAllAsRead,
    clearAll,
    pendingSwoopNotification,
    dismissSwoop,
    checkFollowUpNotifications,
  }), [notifications, unreadCount, addNotification, markAsRead, dismissNotification, markAllAsRead, clearAll, pendingSwoopNotification, dismissSwoop, checkFollowUpNotifications]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
