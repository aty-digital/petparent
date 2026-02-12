import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { MedicationFrequency } from './types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

function getRepeatInterval(frequency: MedicationFrequency): { seconds: number } | null {
  switch (frequency) {
    case 'once_daily': return { seconds: 86400 };
    case 'twice_daily': return { seconds: 43200 };
    case 'three_daily': return { seconds: 28800 };
    case 'weekly': return { seconds: 604800 };
    case 'biweekly': return { seconds: 1209600 };
    case 'monthly': return { seconds: 2592000 };
    case 'as_needed': return null;
    default: return null;
  }
}

function getFrequencyLabel(frequency: MedicationFrequency): string {
  switch (frequency) {
    case 'once_daily': return 'Once Daily';
    case 'twice_daily': return 'Twice Daily';
    case 'three_daily': return 'Three Times Daily';
    case 'weekly': return 'Weekly';
    case 'biweekly': return 'Every 2 Weeks';
    case 'monthly': return 'Monthly';
    case 'as_needed': return 'As Needed';
    default: return frequency;
  }
}

export async function scheduleMedicationReminders(
  petName: string,
  medicationName: string,
  frequency: MedicationFrequency,
  reminderTimes: string[],
): Promise<string[]> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return [];

  const notificationIds: string[] = [];

  for (const timeStr of reminderTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);

    const trigger: Notifications.NotificationTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: hours,
      minute: minutes,
    };

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${petName} - Medication Reminder`,
          body: `Time to give ${petName} their ${medicationName} (${getFrequencyLabel(frequency)})`,
          sound: true,
          data: { type: 'medication_reminder', petName, medicationName },
        },
        trigger,
      });
      notificationIds.push(id);
    } catch (e) {
      console.warn('Failed to schedule notification:', e);
    }
  }

  return notificationIds;
}

export async function cancelMedicationReminders(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn('Failed to cancel notification:', e);
    }
  }
}

export { getFrequencyLabel };
