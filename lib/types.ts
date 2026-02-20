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
}

export interface DailyLog {
  id: string;
  petId: string;
  date: string;
  entries: DailyEntry[];
}

export interface DailyEntry {
  category: 'water' | 'food' | 'energy' | 'mood' | 'bathroom' | 'sleep' | 'custom';
  value: number;
  label: string;
  note?: string;
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
