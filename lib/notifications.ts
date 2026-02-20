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

export type PermissionCheckResult = 'granted' | 'can_ask' | 'denied';

export async function checkNotificationPermissionStatus(): Promise<PermissionCheckResult> {
  if (Platform.OS === 'web') return 'denied';

  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (canAskAgain) return 'can_ask';
  return 'denied';
}

export function getFrequencyLabel(frequency: MedicationFrequency): string {
  switch (frequency) {
    case 'once_daily': return 'Once Daily';
    case 'twice_daily': return 'Twice Daily';
    case 'three_daily': return 'Three Times Daily';
    case 'weekly': return 'Weekly';
    case 'biweekly': return 'Every 2 Weeks';
    case 'monthly': return 'Monthly';
    case 'every_3_months': return 'Every 3 Months';
    case 'as_needed': return 'As Needed';
    default: return frequency;
  }
}

function buildTrigger(
  frequency: MedicationFrequency,
  hours: number,
  minutes: number,
): Notifications.NotificationTriggerInput {
  switch (frequency) {
    case 'weekly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: new Date().getDay() + 1,
        hour: hours,
        minute: minutes,
      };
    case 'monthly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: new Date().getDate(),
        hour: hours,
        minute: minutes,
      };
    case 'biweekly':
      return {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 14 * 24 * 60 * 60,
        repeats: true,
      };
    case 'every_3_months':
      return {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 90 * 24 * 60 * 60,
        repeats: true,
      };
    case 'once_daily':
    case 'twice_daily':
    case 'three_daily':
    default:
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      };
  }
}

export type ReminderType = 'medication' | 'flea_treatment' | 'vaccination';

function getReminderTitle(petName: string, reminderType: ReminderType): string {
  switch (reminderType) {
    case 'flea_treatment': return `${petName} - Flea Treatment`;
    case 'vaccination': return `${petName} - Vaccination`;
    case 'medication':
    default: return `${petName} - Medication Reminder`;
  }
}

function getReminderBody(
  petName: string,
  itemName: string,
  frequency: MedicationFrequency,
  reminderType: ReminderType,
): string {
  switch (reminderType) {
    case 'flea_treatment':
      return `Time for ${petName}'s flea treatment: ${itemName} (${getFrequencyLabel(frequency)})`;
    case 'vaccination':
      return `${petName}'s vaccination is due: ${itemName}`;
    case 'medication':
    default:
      return `Time to give ${petName} their ${itemName} (${getFrequencyLabel(frequency)})`;
  }
}

export async function scheduleReminders(
  petName: string,
  itemName: string,
  frequency: MedicationFrequency,
  reminderTimes: string[],
  reminderType: ReminderType = 'medication',
): Promise<string[]> {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) return [];

  const notificationIds: string[] = [];

  for (const timeStr of reminderTimes) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) continue;

    const trigger = buildTrigger(frequency, hours, minutes);

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: getReminderTitle(petName, reminderType),
          body: getReminderBody(petName, itemName, frequency, reminderType),
          sound: true,
          data: { type: `${reminderType}_reminder`, petName, itemName },
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

export async function scheduleMedicationReminders(
  petName: string,
  medicationName: string,
  frequency: MedicationFrequency,
  reminderTimes: string[],
): Promise<string[]> {
  return scheduleReminders(petName, medicationName, frequency, reminderTimes, 'medication');
}

export async function cancelReminders(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.warn('Failed to cancel notification:', e);
    }
  }
}

export const cancelMedicationReminders = cancelReminders;
