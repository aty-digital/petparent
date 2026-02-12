import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Pet, MedicalRecord, DailyLog, DailyEntry, HealthTask, TriageResult } from './types';

export type UserRole = 'pet_parent' | 'sitter' | 'vet';

interface PetContextValue {
  pets: Pet[];
  activePet: Pet | null;
  setActivePetId: (id: string) => void;
  addPet: (pet: Pet) => Promise<void>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  records: MedicalRecord[];
  addRecord: (record: MedicalRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  dailyLogs: DailyLog[];
  addDailyLog: (log: DailyLog) => Promise<void>;
  updateDailyLog: (log: DailyLog) => Promise<void>;
  getTodayLog: () => DailyLog | undefined;
  tasks: HealthTask[];
  addTask: (task: HealthTask) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  triageResults: TriageResult[];
  addTriageResult: (result: TriageResult) => Promise<void>;
  isLoading: boolean;
  userName: string;
  setUserName: (name: string) => Promise<void>;
  onboardingComplete: boolean;
  userEmail: string;
  userRole: UserRole | null;
  setUserRole: (role: UserRole) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | null>(null);

const STORAGE_KEYS = {
  PETS: '@pawguard_pets',
  ACTIVE_PET: '@pawguard_active_pet',
  RECORDS: '@pawguard_records',
  DAILY_LOGS: '@pawguard_daily_logs',
  TASKS: '@pawguard_tasks',
  TRIAGE: '@pawguard_triage',
  USER_NAME: '@pawguard_user_name',
  ONBOARDING_COMPLETE: '@pawguard_onboarding_complete',
  USER_EMAIL: '@pawguard_user_email',
  USER_PASSWORD: '@pawguard_user_password',
  USER_ROLE: '@pawguard_user_role',
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function PetProvider({ children }: { children: ReactNode }) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetIdState] = useState<string>('');
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [tasks, setTasks] = useState<HealthTask[]>([]);
  const [triageResults, setTriageResults] = useState<TriageResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserNameState] = useState('Pet Owner');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [petsData, activeId, recordsData, logsData, tasksData, triageData, nameData, onboardingData, emailData, roleData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PETS),
        AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_PET),
        AsyncStorage.getItem(STORAGE_KEYS.RECORDS),
        AsyncStorage.getItem(STORAGE_KEYS.DAILY_LOGS),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.TRIAGE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
        AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE),
        AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL),
        AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE),
      ]);

      const loadedPets: Pet[] = petsData ? JSON.parse(petsData) : [];
      setPets(loadedPets);
      if (activeId && loadedPets.find(p => p.id === activeId)) {
        setActivePetIdState(activeId);
      } else if (loadedPets.length > 0) {
        setActivePetIdState(loadedPets[0].id);
      }
      setRecords(recordsData ? JSON.parse(recordsData) : []);
      setDailyLogs(logsData ? JSON.parse(logsData) : []);
      setTasks(tasksData ? JSON.parse(tasksData) : []);
      setTriageResults(triageData ? JSON.parse(triageData) : []);
      if (nameData) setUserNameState(nameData);
      if (onboardingData === 'true') setOnboardingComplete(true);
      if (emailData) setUserEmail(emailData);
      if (roleData) setUserRoleState(roleData as UserRole);
    } catch (e) {
      console.error('Failed to load data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const activePet = useMemo(() => pets.find(p => p.id === activePetId) || null, [pets, activePetId]);

  const setActivePetId = useCallback((id: string) => {
    setActivePetIdState(id);
    AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, id);
  }, []);

  const addPet = useCallback(async (pet: Pet) => {
    const updated = [...pets, pet];
    setPets(updated);
    if (!activePetId) setActivePetIdState(pet.id);
    await AsyncStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
    if (!activePetId) await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, pet.id);
  }, [pets, activePetId]);

  const updatePet = useCallback(async (pet: Pet) => {
    const updated = pets.map(p => p.id === pet.id ? pet : p);
    setPets(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
  }, [pets]);

  const deletePet = useCallback(async (id: string) => {
    const updated = pets.filter(p => p.id !== id);
    setPets(updated);
    if (activePetId === id && updated.length > 0) {
      setActivePetIdState(updated[0].id);
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_PET, updated[0].id);
    }
    await AsyncStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
  }, [pets, activePetId]);

  const addRecord = useCallback(async (record: MedicalRecord) => {
    const updated = [record, ...records];
    setRecords(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  }, [records]);

  const deleteRecord = useCallback(async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(updated));
  }, [records]);

  const addDailyLog = useCallback(async (log: DailyLog) => {
    const updated = [log, ...dailyLogs];
    setDailyLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updated));
  }, [dailyLogs]);

  const updateDailyLog = useCallback(async (log: DailyLog) => {
    const updated = dailyLogs.map(l => l.id === log.id ? log : l);
    setDailyLogs(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_LOGS, JSON.stringify(updated));
  }, [dailyLogs]);

  const getTodayLog = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyLogs.find(l => l.petId === activePetId && l.date === today);
  }, [dailyLogs, activePetId]);

  const addTask = useCallback(async (task: HealthTask) => {
    const updated = [...tasks, task];
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  }, [tasks]);

  const toggleTask = useCallback(async (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toISOString() : undefined } : t);
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  }, [tasks]);

  const deleteTask = useCallback(async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  }, [tasks]);

  const addTriageResult = useCallback(async (result: TriageResult) => {
    const updated = [result, ...triageResults];
    setTriageResults(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TRIAGE, JSON.stringify(updated));
  }, [triageResults]);

  const setUserName = useCallback(async (name: string) => {
    setUserNameState(name);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name);
  }, []);

  const setUserRole = useCallback(async (role: UserRole) => {
    setUserRoleState(role);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setUserNameState(name);
    setUserEmail(email);
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name),
      AsyncStorage.setItem(STORAGE_KEYS.USER_EMAIL, email),
      AsyncStorage.setItem(STORAGE_KEYS.USER_PASSWORD, password),
    ]);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const storedEmail = await AsyncStorage.getItem(STORAGE_KEYS.USER_EMAIL);
    const storedPassword = await AsyncStorage.getItem(STORAGE_KEYS.USER_PASSWORD);
    if (storedEmail === email && storedPassword === password) {
      setUserEmail(email);
      const nameData = await AsyncStorage.getItem(STORAGE_KEYS.USER_NAME);
      if (nameData) setUserNameState(nameData);
      const roleData = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);
      if (roleData) setUserRoleState(roleData as UserRole);
      setOnboardingComplete(true);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async () => {
    setOnboardingComplete(false);
    setUserEmail('');
    setUserRoleState(null);
    setUserNameState('Pet Owner');
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  }, []);

  const completeOnboarding = useCallback(async () => {
    setOnboardingComplete(true);
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  }, []);

  const value = useMemo(() => ({
    pets, activePet, setActivePetId, addPet, updatePet, deletePet,
    records, addRecord, deleteRecord,
    dailyLogs, addDailyLog, updateDailyLog, getTodayLog,
    tasks, addTask, toggleTask, deleteTask,
    triageResults, addTriageResult,
    isLoading, userName, setUserName,
    onboardingComplete, userEmail, userRole, setUserRole,
    signup, login, logout, completeOnboarding,
  }), [pets, activePet, setActivePetId, addPet, updatePet, deletePet,
    records, addRecord, deleteRecord,
    dailyLogs, addDailyLog, updateDailyLog, getTodayLog,
    tasks, addTask, toggleTask, deleteTask,
    triageResults, addTriageResult, isLoading, userName, setUserName,
    onboardingComplete, userEmail, userRole, setUserRole,
    signup, login, logout, completeOnboarding]);

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error('usePets must be used within PetProvider');
  return ctx;
}

export { generateId };
