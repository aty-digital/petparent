import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import type { Pet, MedicalRecord, DailyLog, DailyEntry, HealthTask, TriageResult } from './types';

function secureKey(email: string): string {
  const sanitized = email.toLowerCase().trim().replace(/[^a-zA-Z0-9._-]/g, '_');
  return `pawguard_pwd_${sanitized}`;
}

async function setSecurePassword(email: string, password: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(userKey(email, 'password'), password);
  } else {
    await SecureStore.setItemAsync(secureKey(email), password);
  }
}

async function getSecurePassword(email: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(userKey(email, 'password'));
  }
  const securePwd = await SecureStore.getItemAsync(secureKey(email));
  if (securePwd) return securePwd;
  const legacyPwd = await AsyncStorage.getItem(userKey(email, 'password'));
  if (legacyPwd) {
    await SecureStore.setItemAsync(secureKey(email), legacyPwd);
    await AsyncStorage.removeItem(userKey(email, 'password'));
    return legacyPwd;
  }
  return null;
}

async function deleteSecurePassword(email: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(userKey(email, 'password'));
  } else {
    try { await SecureStore.deleteItemAsync(secureKey(email)); } catch {}
    try { await AsyncStorage.removeItem(userKey(email, 'password')); } catch {}
  }
}

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
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
  deleteAccount: () => Promise<void>;
}

const PetContext = createContext<PetContextValue | null>(null);

const ACCOUNTS_REGISTRY_KEY = '@pawguard_accounts_registry';
const ACTIVE_SESSION_KEY = '@pawguard_active_session';

function userKey(email: string, suffix: string): string {
  const sanitized = email.toLowerCase().trim();
  return `@pawguard_user_${sanitized}_${suffix}`;
}

interface AccountEntry {
  email: string;
  password: string;
  name: string;
}

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
  const [userName, setUserNameState] = useState('Pet Parent');
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRoleState] = useState<UserRole | null>(null);

  useEffect(() => {
    restoreSession();
  }, []);

  const clearInMemoryState = useCallback(() => {
    setPets([]);
    setActivePetIdState('');
    setRecords([]);
    setDailyLogs([]);
    setTasks([]);
    setTriageResults([]);
    setUserNameState('Pet Parent');
    setUserEmail('');
    setUserRoleState(null);
    setOnboardingComplete(false);
  }, []);

  const loadUserData = useCallback(async (email: string) => {
    try {
      const [petsData, activeId, recordsData, logsData, tasksData, triageData, nameData, onboardingData, roleData] = await Promise.all([
        AsyncStorage.getItem(userKey(email, 'pets')),
        AsyncStorage.getItem(userKey(email, 'active_pet')),
        AsyncStorage.getItem(userKey(email, 'records')),
        AsyncStorage.getItem(userKey(email, 'daily_logs')),
        AsyncStorage.getItem(userKey(email, 'tasks')),
        AsyncStorage.getItem(userKey(email, 'triage')),
        AsyncStorage.getItem(userKey(email, 'name')),
        AsyncStorage.getItem(userKey(email, 'onboarding_complete')),
        AsyncStorage.getItem(userKey(email, 'role')),
      ]);

      const loadedPets: Pet[] = petsData ? JSON.parse(petsData) : [];
      setPets(loadedPets);
      if (activeId && loadedPets.find(p => p.id === activeId)) {
        setActivePetIdState(activeId);
      } else if (loadedPets.length > 0) {
        setActivePetIdState(loadedPets[0].id);
      } else {
        setActivePetIdState('');
      }
      setRecords(recordsData ? JSON.parse(recordsData) : []);
      setDailyLogs(logsData ? JSON.parse(logsData) : []);
      setTasks(tasksData ? JSON.parse(tasksData) : []);
      setTriageResults(triageData ? JSON.parse(triageData) : []);
      if (nameData) setUserNameState(nameData);
      setUserEmail(email);
      if (onboardingData === 'true') setOnboardingComplete(true);
      if (roleData) setUserRoleState(roleData as UserRole);
    } catch (e) {
      console.error('Failed to load user data:', e);
    }
  }, []);

  const restoreSession = async () => {
    try {
      const activeEmail = await AsyncStorage.getItem(ACTIVE_SESSION_KEY);
      if (activeEmail) {
        await loadUserData(activeEmail);
      }
    } catch (e) {
      console.error('Failed to restore session:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getAccountsRegistry = async (): Promise<AccountEntry[]> => {
    try {
      const data = await AsyncStorage.getItem(ACCOUNTS_REGISTRY_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };

  const saveAccountsRegistry = async (accounts: AccountEntry[]) => {
    await AsyncStorage.setItem(ACCOUNTS_REGISTRY_KEY, JSON.stringify(accounts));
  };

  const activePet = useMemo(() => pets.find(p => p.id === activePetId) || null, [pets, activePetId]);

  const setActivePetId = useCallback((id: string) => {
    setActivePetIdState(id);
    if (userEmail) {
      AsyncStorage.setItem(userKey(userEmail, 'active_pet'), id);
    }
  }, [userEmail]);

  const addPet = useCallback(async (pet: Pet) => {
    const updated = [...pets, pet];
    setPets(updated);
    if (!activePetId) setActivePetIdState(pet.id);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'pets'), JSON.stringify(updated));
      if (!activePetId) await AsyncStorage.setItem(userKey(userEmail, 'active_pet'), pet.id);
    }
  }, [pets, activePetId, userEmail]);

  const updatePet = useCallback(async (pet: Pet) => {
    const updated = pets.map(p => p.id === pet.id ? pet : p);
    setPets(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'pets'), JSON.stringify(updated));
    }
  }, [pets, userEmail]);

  const deletePet = useCallback(async (id: string) => {
    const updated = pets.filter(p => p.id !== id);
    setPets(updated);
    if (activePetId === id && updated.length > 0) {
      setActivePetIdState(updated[0].id);
      if (userEmail) await AsyncStorage.setItem(userKey(userEmail, 'active_pet'), updated[0].id);
    }
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'pets'), JSON.stringify(updated));
    }
  }, [pets, activePetId, userEmail]);

  const addRecord = useCallback(async (record: MedicalRecord) => {
    const updated = [record, ...records];
    setRecords(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'records'), JSON.stringify(updated));
    }
  }, [records, userEmail]);

  const deleteRecord = useCallback(async (id: string) => {
    const updated = records.filter(r => r.id !== id);
    setRecords(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'records'), JSON.stringify(updated));
    }
  }, [records, userEmail]);

  const addDailyLog = useCallback(async (log: DailyLog) => {
    const updated = [log, ...dailyLogs];
    setDailyLogs(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'daily_logs'), JSON.stringify(updated));
    }
  }, [dailyLogs, userEmail]);

  const updateDailyLog = useCallback(async (log: DailyLog) => {
    const updated = dailyLogs.map(l => l.id === log.id ? log : l);
    setDailyLogs(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'daily_logs'), JSON.stringify(updated));
    }
  }, [dailyLogs, userEmail]);

  const getTodayLog = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return dailyLogs.find(l => l.petId === activePetId && l.date === today);
  }, [dailyLogs, activePetId]);

  const addTask = useCallback(async (task: HealthTask) => {
    const updated = [...tasks, task];
    setTasks(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'tasks'), JSON.stringify(updated));
    }
  }, [tasks, userEmail]);

  const toggleTask = useCallback(async (id: string) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedDate: !t.completed ? new Date().toISOString() : undefined } : t);
    setTasks(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'tasks'), JSON.stringify(updated));
    }
  }, [tasks, userEmail]);

  const deleteTask = useCallback(async (id: string) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'tasks'), JSON.stringify(updated));
    }
  }, [tasks, userEmail]);

  const addTriageResult = useCallback(async (result: TriageResult) => {
    const updated = [result, ...triageResults];
    setTriageResults(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'triage'), JSON.stringify(updated));
    }
  }, [triageResults, userEmail]);

  const setUserName = useCallback(async (name: string) => {
    setUserNameState(name);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'name'), name);
      const accounts = await getAccountsRegistry();
      const updated = accounts.map(a => a.email === userEmail.toLowerCase().trim() ? { ...a, name } : a);
      await saveAccountsRegistry(updated);
    }
  }, [userEmail]);

  const setUserRole = useCallback(async (role: UserRole) => {
    setUserRoleState(role);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'role'), role);
    }
  }, [userEmail]);

  const signup = useCallback(async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const normalizedEmail = email.toLowerCase().trim();
    const accounts = await getAccountsRegistry();
    const existing = accounts.find(a => a.email === normalizedEmail);
    if (existing) {
      return { success: false, error: 'An account with this email already exists. Please log in instead.' };
    }

    const updatedAccounts = [...accounts, { email: normalizedEmail, password, name }];
    await saveAccountsRegistry(updatedAccounts);

    clearInMemoryState();

    setUserNameState(name);
    setUserEmail(normalizedEmail);

    await Promise.all([
      AsyncStorage.setItem(userKey(normalizedEmail, 'name'), name),
      setSecurePassword(normalizedEmail, password),
      AsyncStorage.setItem(ACTIVE_SESSION_KEY, normalizedEmail),
    ]);

    return { success: true };
  }, [clearInMemoryState]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const normalizedEmail = email.toLowerCase().trim();
    const accounts = await getAccountsRegistry();
    const account = accounts.find(a => a.email === normalizedEmail);
    if (!account) return false;

    const storedPassword = await getSecurePassword(normalizedEmail);
    const passwordMatch = storedPassword ? storedPassword === password : account.password === password;
    if (!passwordMatch) {
      return false;
    }

    clearInMemoryState();
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, normalizedEmail);
    await loadUserData(normalizedEmail);
    setOnboardingComplete(true);
    return true;
  }, [clearInMemoryState, loadUserData]);

  const logout = useCallback(async () => {
    clearInMemoryState();
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [clearInMemoryState]);

  const completeOnboarding = useCallback(async () => {
    setOnboardingComplete(true);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'onboarding_complete'), 'true');
    }
  }, [userEmail]);

  const updateEmail = useCallback(async (newEmail: string) => {
    const normalizedNew = newEmail.toLowerCase().trim();
    const oldEmail = userEmail;
    if (!oldEmail || normalizedNew === oldEmail.toLowerCase().trim()) {
      setUserEmail(normalizedNew);
      return;
    }

    const accounts = await getAccountsRegistry();
    const existingNew = accounts.find(a => a.email === normalizedNew);
    if (existingNew) return;

    const suffixes = ['pets', 'active_pet', 'records', 'daily_logs', 'tasks', 'triage', 'name', 'onboarding_complete', 'role', 'subscription_tier', 'triage_usage', 'paywall_complete'];
    for (const suffix of suffixes) {
      const val = await AsyncStorage.getItem(userKey(oldEmail, suffix));
      if (val !== null) {
        await AsyncStorage.setItem(userKey(normalizedNew, suffix), val);
        await AsyncStorage.removeItem(userKey(oldEmail, suffix));
      }
    }

    const pwd = await getSecurePassword(oldEmail);
    if (pwd) {
      await setSecurePassword(normalizedNew, pwd);
      await deleteSecurePassword(oldEmail);
    }

    const updatedAccounts = accounts.map(a =>
      a.email === oldEmail.toLowerCase().trim()
        ? { ...a, email: normalizedNew }
        : a
    );
    await saveAccountsRegistry(updatedAccounts);

    setUserEmail(normalizedNew);
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, normalizedNew);
  }, [userEmail]);

  const updatePassword = useCallback(async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!userEmail) return false;
    const normalizedEmail = userEmail.toLowerCase().trim();
    const storedPassword = await getSecurePassword(normalizedEmail);
    const accounts = await getAccountsRegistry();
    const account = accounts.find(a => a.email === normalizedEmail);
    if (!account) return false;

    const currentPwd = storedPassword || account.password;
    if (currentPwd !== oldPassword) return false;

    const updatedAccounts = accounts.map(a =>
      a.email === normalizedEmail
        ? { ...a, password: newPassword }
        : a
    );
    await saveAccountsRegistry(updatedAccounts);
    await setSecurePassword(normalizedEmail, newPassword);
    return true;
  }, [userEmail]);

  const deleteAccount = useCallback(async () => {
    if (!userEmail) return;
    const normalizedEmail = userEmail.toLowerCase().trim();

    const suffixes = ['pets', 'active_pet', 'records', 'daily_logs', 'tasks', 'triage', 'name', 'onboarding_complete', 'role', 'password', 'subscription_tier', 'triage_usage', 'paywall_complete'];
    const keysToRemove = suffixes.map(s => userKey(normalizedEmail, s));
    await AsyncStorage.multiRemove(keysToRemove);
    await deleteSecurePassword(normalizedEmail);

    const accounts = await getAccountsRegistry();
    const updatedAccounts = accounts.filter(a => a.email !== normalizedEmail);
    await saveAccountsRegistry(updatedAccounts);

    clearInMemoryState();
    await AsyncStorage.removeItem(ACTIVE_SESSION_KEY);
  }, [userEmail, clearInMemoryState]);

  const value = useMemo(() => ({
    pets, activePet, setActivePetId, addPet, updatePet, deletePet,
    records, addRecord, deleteRecord,
    dailyLogs, addDailyLog, updateDailyLog, getTodayLog,
    tasks, addTask, toggleTask, deleteTask,
    triageResults, addTriageResult,
    isLoading, userName, setUserName,
    onboardingComplete, userEmail, userRole, setUserRole,
    signup, login, logout, completeOnboarding,
    updateEmail, updatePassword, deleteAccount,
  }), [pets, activePet, setActivePetId, addPet, updatePet, deletePet,
    records, addRecord, deleteRecord,
    dailyLogs, addDailyLog, updateDailyLog, getTodayLog,
    tasks, addTask, toggleTask, deleteTask,
    triageResults, addTriageResult, isLoading, userName, setUserName,
    onboardingComplete, userEmail, userRole, setUserRole,
    signup, login, logout, completeOnboarding,
    updateEmail, updatePassword, deleteAccount]);

  return <PetContext.Provider value={value}>{children}</PetContext.Provider>;
}

export function usePets() {
  const ctx = useContext(PetContext);
  if (!ctx) throw new Error('usePets must be used within PetProvider');
  return ctx;
}

export { generateId };
