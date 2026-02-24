export interface Pet {
  id: string;
  name: string;
  breed: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  birthDate: string;
  weight: number;
  weightUnit: 'kg' | 'lbs';
  gender: 'male' | 'female';
  photoUri?: string;
  color: string;
  microchipId?: string;
  vetName?: string;
  vetPhone?: string;
  vetClinic?: string;
}

export type MedicationFrequency = 'once_daily' | 'twice_daily' | 'three_daily' | 'weekly' | 'biweekly' | 'monthly' | 'every_3_months' | 'as_needed';

export interface MedicalRecord {
  id: string;
  petId: string;
  type: 'vet_visit' | 'medication' | 'vaccination' | 'triage' | 'flea_treatment';
  title: string;
  brand?: string;
  description: string;
  date: string;
  doctor?: string;
  clinic?: string;
  status?: string;
  expiresDate?: string;
  currentlyTaking?: boolean;
  frequency?: MedicationFrequency;
  reminderTimes?: string[];
  remindersEnabled?: boolean;
  notificationIds?: string[];
  followUpScheduled?: boolean;
  followUpDate?: string;
  followUpTime?: string;
  followUpRemindersEnabled?: boolean;
  followUpNotificationIds?: string[];
}

export interface InAppNotification {
  id: string;
  petId: string;
  recordId: string;
  type: 'follow_up_1_week' | 'follow_up_24_hours' | 'sitter_note';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  dismissed: boolean;
  sitterName?: string;
}

export interface PendingSitterNote {
  id: string;
  noteId: string;
  petId: string;
  petName: string;
  sitterName: string;
  text: string;
  createdAt: string;
}

export interface DailyLog {
  id: string;
  petId: string;
  date: string;
  entries: DailyEntry[];
}

export interface DailyEntry {
  category: 'water' | 'food' | 'energy' | 'mood' | 'bathroom' | 'sleep' | 'custom' | 'sitter_note';
  value: number;
  label: string;
  note?: string;
  sitterName?: string;
}

export interface HealthTask {
  id: string;
  petId: string;
  title: string;
  type: 'medication' | 'vaccination' | 'supplement' | 'checkup';
  dueDate: string;
  dueTime?: string;
  completed: boolean;
  completedDate?: string;
  recurring?: 'daily' | 'weekly' | 'monthly' | 'yearly';
}

export interface TriageResult {
  id: string;
  petId: string;
  date: string;
  description: string;
  urgency: 'urgent' | 'moderate' | 'low';
  urgencyLabel: string;
  urgencyMessage: string;
  analysisSummary: string;
  keyFindings: string[];
  actionSteps: string[];
  disclaimer: string;
}

export interface SharedPet {
  id: string;
  pet: Pet;
  ownerName: string;
  ownerEmail: string;
  sharedAt: string;
  inviteCode: string;
}

export interface SitterNote {
  id: string;
  sharedPetId: string;
  petId: string;
  text: string;
  createdAt: string;
  sitterName: string;
}

export interface InviteCode {
  code: string;
  petId: string;
  ownerEmail: string;
  ownerName: string;
  createdAt: string;
  expiresAt: string;
}
