import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import type { Pet, MedicalRecord, DailyLog, DailyEntry, HealthTask, TriageResult, SharedPet, SitterNote, InviteCode, PendingSitterNote, InAppNotification } from './types';

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

export type ActiveView = 'parent' | 'sitter' | 'vet';

interface PetContextValue {
  pets: Pet[];
  activePet: Pet | null;
  setActivePetId: (id: string) => void;
  addPet: (pet: Pet) => Promise<void>;
  updatePet: (pet: Pet) => Promise<void>;
  deletePet: (id: string) => Promise<void>;
  records: MedicalRecord[];
  addRecord: (record: MedicalRecord) => Promise<void>;
  updateRecord: (record: MedicalRecord) => Promise<void>;
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
  isAlsoPetParent: boolean;
  setIsAlsoPetParent: (val: boolean) => Promise<void>;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => Promise<void>;
  sharedPets: SharedPet[];
  addSharedPet: (sp: SharedPet) => Promise<void>;
  removeSharedPet: (id: string) => Promise<void>;
  selectedSharedPetId: string | null;
  setSelectedSharedPetId: (id: string | null) => void;
  sitterNotes: SitterNote[];
  addSitterNote: (note: SitterNote) => Promise<void>;
  pendingSitterNotes: PendingSitterNote[];
  dismissPendingSitterNote: (id: string) => Promise<void>;
  logPendingSitterNote: (pending: PendingSitterNote) => Promise<void>;
  clinicName: string;
  clinicAddress: string;
  setClinicInfo: (name: string, address: string) => Promise<void>;
  vetClients: SharedPet[];
  addVetClient: (sp: SharedPet) => Promise<void>;
  removeVetClient: (id: string) => Promise<void>;
  selectedVetClientId: string | null;
  setSelectedVetClientId: (id: string | null) => void;
  generateInviteCode: () => Promise<InviteCode | null>;
  acceptInviteCode: (code: string) => Promise<{ success: boolean; error?: string }>;
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
  const [isAlsoPetParent, setIsAlsoPetParentState] = useState(false);
  const [activeView, setActiveViewState] = useState<ActiveView>('parent');
  const [sharedPets, setSharedPets] = useState<SharedPet[]>([]);
  const [sitterNotes, setSitterNotes] = useState<SitterNote[]>([]);
  const [pendingSitterNotes, setPendingSitterNotes] = useState<PendingSitterNote[]>([]);
  const [selectedSharedPetId, setSelectedSharedPetId] = useState<string | null>(null);
  const [clinicName, setClinicNameState] = useState('');
  const [clinicAddress, setClinicAddressState] = useState('');
  const [vetClients, setVetClients] = useState<SharedPet[]>([]);
  const [selectedVetClientId, setSelectedVetClientId] = useState<string | null>(null);

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
    setIsAlsoPetParentState(false);
    setActiveViewState('parent');
    setSharedPets([]);
    setSitterNotes([]);
    setPendingSitterNotes([]);
    setClinicNameState('');
    setClinicAddressState('');
    setVetClients([]);
  }, []);

  const loadUserData = useCallback(async (email: string) => {
    try {
      const [petsData, activeId, recordsData, logsData, tasksData, triageData, nameData, onboardingData, roleData, alsoPetParentData, activeViewData, sharedPetsData, sitterNotesData, clinicNameData, clinicAddressData, vetClientsData, pendingNotesData] = await Promise.all([
        AsyncStorage.getItem(userKey(email, 'pets')),
        AsyncStorage.getItem(userKey(email, 'active_pet')),
        AsyncStorage.getItem(userKey(email, 'records')),
        AsyncStorage.getItem(userKey(email, 'daily_logs')),
        AsyncStorage.getItem(userKey(email, 'tasks')),
        AsyncStorage.getItem(userKey(email, 'triage')),
        AsyncStorage.getItem(userKey(email, 'name')),
        AsyncStorage.getItem(userKey(email, 'onboarding_complete')),
        AsyncStorage.getItem(userKey(email, 'role')),
        AsyncStorage.getItem(userKey(email, 'also_pet_parent')),
        AsyncStorage.getItem(userKey(email, 'active_view')),
        AsyncStorage.getItem(userKey(email, 'shared_pets')),
        AsyncStorage.getItem(userKey(email, 'sitter_notes')),
        AsyncStorage.getItem(userKey(email, 'clinic_name')),
        AsyncStorage.getItem(userKey(email, 'clinic_address')),
        AsyncStorage.getItem(userKey(email, 'vet_clients')),
        AsyncStorage.getItem(userKey(email, 'pending_sitter_notes')),
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
      setIsAlsoPetParentState(alsoPetParentData === 'true');
      if (activeViewData) setActiveViewState(activeViewData as ActiveView);
      setSharedPets(sharedPetsData ? JSON.parse(sharedPetsData) : []);
      setSitterNotes(sitterNotesData ? JSON.parse(sitterNotesData) : []);
      setPendingSitterNotes(pendingNotesData ? JSON.parse(pendingNotesData) : []);
      if (clinicNameData) setClinicNameState(clinicNameData);
      if (clinicAddressData) setClinicAddressState(clinicAddressData);
      setVetClients(vetClientsData ? JSON.parse(vetClientsData) : []);
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

  const updateRecord = useCallback(async (record: MedicalRecord) => {
    const updated = records.map(r => r.id === record.id ? record : r);
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

  const setIsAlsoPetParent = useCallback(async (val: boolean) => {
    setIsAlsoPetParentState(val);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'also_pet_parent'), val ? 'true' : 'false');
    }
  }, [userEmail]);

  const setActiveView = useCallback(async (view: ActiveView) => {
    setActiveViewState(view);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'active_view'), view);
    }
  }, [userEmail]);

  const addSharedPet = useCallback(async (sp: SharedPet) => {
    const updated = [...sharedPets, sp];
    setSharedPets(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'shared_pets'), JSON.stringify(updated));
    }
  }, [sharedPets, userEmail]);

  const removeSharedPet = useCallback(async (id: string) => {
    const updated = sharedPets.filter(s => s.id !== id);
    setSharedPets(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'shared_pets'), JSON.stringify(updated));
    }
  }, [sharedPets, userEmail]);

  const addSitterNote = useCallback(async (note: SitterNote) => {
    const updated = [note, ...sitterNotes];
    setSitterNotes(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'sitter_notes'), JSON.stringify(updated));
    }

    const sharedPet = sharedPets.find(sp => sp.id === note.sharedPetId);
    if (sharedPet?.ownerEmail) {
      const parentEmail = sharedPet.ownerEmail;
      const petName = sharedPet.pet.name || 'Unknown Pet';
      try {
        const pendingNote: PendingSitterNote = {
          id: `psn_${note.id}`,
          noteId: note.id,
          petId: note.petId,
          petName,
          sitterName: note.sitterName,
          text: note.text,
          createdAt: note.createdAt,
        };
        const existingPendingData = await AsyncStorage.getItem(userKey(parentEmail, 'pending_sitter_notes'));
        const existingPending: PendingSitterNote[] = existingPendingData ? JSON.parse(existingPendingData) : [];
        const updatedPending = [pendingNote, ...existingPending];
        await AsyncStorage.setItem(userKey(parentEmail, 'pending_sitter_notes'), JSON.stringify(updatedPending));

        const notifKey = `@pawguard_user_${parentEmail.toLowerCase().trim()}_notifications`;
        const existingNotifData = await AsyncStorage.getItem(notifKey);
        const existingNotifs: InAppNotification[] = existingNotifData ? JSON.parse(existingNotifData) : [];
        const newNotif: InAppNotification = {
          id: `sitter_note_${note.id}`,
          petId: note.petId,
          recordId: '',
          type: 'sitter_note',
          title: `${note.sitterName} left a note about ${petName}`,
          body: note.text.length > 100 ? note.text.substring(0, 100) + '...' : note.text,
          createdAt: note.createdAt,
          read: false,
          dismissed: false,
          sitterName: note.sitterName,
        };
        await AsyncStorage.setItem(notifKey, JSON.stringify([newNotif, ...existingNotifs]));

        if (Platform.OS !== 'web') {
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: `Sitter Note: ${petName}`,
                body: `${note.sitterName}: ${note.text.length > 80 ? note.text.substring(0, 80) + '...' : note.text}`,
                data: { type: 'sitter_note', petId: note.petId },
              },
              trigger: null,
            });
          } catch (e) {
            console.warn('Could not schedule push notification:', e);
          }
        }
      } catch (e) {
        console.warn('Failed to deliver note to pet parent:', e);
      }
    }
  }, [sitterNotes, userEmail, sharedPets]);

  const dismissPendingSitterNote = useCallback(async (id: string) => {
    const updated = pendingSitterNotes.filter(n => n.id !== id);
    setPendingSitterNotes(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'pending_sitter_notes'), JSON.stringify(updated));
    }
  }, [pendingSitterNotes, userEmail]);

  const logPendingSitterNote = useCallback(async (pending: PendingSitterNote) => {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = dailyLogs.find(l => l.petId === pending.petId && l.date === today);
    const newEntry: DailyEntry = {
      category: 'sitter_note',
      value: 3,
      label: 'Sitter Note',
      note: pending.text,
      sitterName: pending.sitterName,
    };

    if (existingLog) {
      const updatedLog = { ...existingLog, entries: [...existingLog.entries, newEntry] };
      const updatedLogs = dailyLogs.map(l => l.id === existingLog.id ? updatedLog : l);
      setDailyLogs(updatedLogs);
      if (userEmail) {
        await AsyncStorage.setItem(userKey(userEmail, 'daily_logs'), JSON.stringify(updatedLogs));
      }
    } else {
      const newLog: DailyLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        petId: pending.petId,
        date: today,
        entries: [newEntry],
      };
      const updatedLogs = [newLog, ...dailyLogs];
      setDailyLogs(updatedLogs);
      if (userEmail) {
        await AsyncStorage.setItem(userKey(userEmail, 'daily_logs'), JSON.stringify(updatedLogs));
      }
    }

    const updated = pendingSitterNotes.filter(n => n.id !== pending.id);
    setPendingSitterNotes(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'pending_sitter_notes'), JSON.stringify(updated));
    }
  }, [pendingSitterNotes, dailyLogs, userEmail]);

  const setClinicInfo = useCallback(async (name: string, address: string) => {
    setClinicNameState(name);
    setClinicAddressState(address);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'clinic_name'), name);
      await AsyncStorage.setItem(userKey(userEmail, 'clinic_address'), address);
    }
  }, [userEmail]);

  const addVetClient = useCallback(async (sp: SharedPet) => {
    const updated = [...vetClients, sp];
    setVetClients(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'vet_clients'), JSON.stringify(updated));
    }
  }, [vetClients, userEmail]);

  const removeVetClient = useCallback(async (id: string) => {
    const updated = vetClients.filter(s => s.id !== id);
    setVetClients(updated);
    if (userEmail) {
      await AsyncStorage.setItem(userKey(userEmail, 'vet_clients'), JSON.stringify(updated));
    }
  }, [vetClients, userEmail]);

  const generateInviteCode = useCallback(async (): Promise<InviteCode | null> => {
    if (!activePet || !userEmail) return null;
    const code = generateId().substring(0, 8).toUpperCase();
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const invite: InviteCode = {
      code,
      petId: activePet.id,
      ownerEmail: userEmail,
      ownerName: userName,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    const existingCodes = await AsyncStorage.getItem('@pawguard_invite_codes') || '[]';
    const codes: InviteCode[] = JSON.parse(existingCodes);
    codes.push(invite);
    await AsyncStorage.setItem('@pawguard_invite_codes', JSON.stringify(codes));
    return invite;
  }, [activePet, userEmail, userName]);

  const acceptInviteCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const existingCodes = await AsyncStorage.getItem('@pawguard_invite_codes') || '[]';
      const codes: InviteCode[] = JSON.parse(existingCodes);
      const invite = codes.find(c => c.code === code.toUpperCase());
      if (!invite) {
        return { success: false, error: 'Invalid invite code. Please check and try again.' };
      }
      if (new Date(invite.expiresAt) < new Date()) {
        return { success: false, error: 'This invite code has expired. Ask the pet parent for a new one.' };
      }
      const isVet = activeView === 'vet' || userRole === 'vet';
      const existingList = isVet ? vetClients : sharedPets;
      const alreadyShared = existingList.find(s => s.pet.id === invite.petId);
      if (alreadyShared) {
        return { success: false, error: 'This pet is already shared with you.' };
      }
      const ownerPetsData = await AsyncStorage.getItem(userKey(invite.ownerEmail, 'pets'));
      const ownerPets: Pet[] = ownerPetsData ? JSON.parse(ownerPetsData) : [];
      const pet = ownerPets.find(p => p.id === invite.petId);
      if (!pet) {
        return { success: false, error: 'Pet profile not found. The owner may have removed it.' };
      }
      const shared: SharedPet = {
        id: generateId(),
        pet,
        ownerName: invite.ownerName,
        ownerEmail: invite.ownerEmail,
        sharedAt: new Date().toISOString(),
        inviteCode: code.toUpperCase(),
      };
      if (isVet) {
        await addVetClient(shared);
      } else {
        await addSharedPet(shared);
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }, [sharedPets, addSharedPet, vetClients, addVetClient, activeView, userRole]);

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

    const suffixes = ['pets', 'active_pet', 'records', 'daily_logs', 'tasks', 'triage', 'name', 'onboarding_complete', 'role', 'subscription_tier', 'triage_usage', 'paywall_complete', 'also_pet_parent', 'active_view', 'shared_pets', 'sitter_notes', 'pending_sitter_notes'];
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

    const suffixes = ['pets', 'active_pet', 'records', 'daily_logs', 'tasks', 'triage', 'name', 'onboarding_complete', 'role', 'password', 'subscription_tier', 'triage_usage', 'paywall_complete', 'also_pet_parent', 'active_view', 'shared_pets', 'sitter_notes', 'pending_sitter_notes'];
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
    records, addRecord, updateRecord, deleteRecord,
    dailyLogs, addDailyLog, updateDailyLog, getTodayLog,
    tasks, addTask, toggleTask, deleteTask,
    triageResults, addTriageResult,
    isLoading, userName, setUserName,
    onboardingComplete, userEmail, userRole, setUserRole,
    isAlsoPetParent, setIsAlsoPetParent,
    activeView, setActiveView,
    sharedPets, addSharedPet, removeSharedPet,
    selectedSharedPetId, setSelectedSharedPetId,
    sitterNotes, addSitterNote,
    pendingSitterNotes, dismissPendingSitterNote, logPendingSitterNote,
    clinicName, clinicAddress, setClinicInfo,
    vetClients, addVetClient, removeVetClient,
    selectedVetClientId, setSelectedVetClientId,
    generateInviteCode, acceptInviteCode,
    signup, login, logout, completeOnboarding,
    updateEmail, updatePassword, deleteAccount,
  }), [pets, activePet, setActivePetId, addPet, updatePet, deletePet,
    records, addRecord, updateRecord, deleteRecord,
    dailyLogs, addDailyLog, updateDailyLog, getTodayLog,
    tasks, addTask, toggleTask, deleteTask,
    triageResults, addTriageResult, isLoading, userName, setUserName,
    onboardingComplete, userEmail, userRole, setUserRole,
    isAlsoPetParent, setIsAlsoPetParent,
    activeView, setActiveView,
    sharedPets, addSharedPet, removeSharedPet,
    selectedSharedPetId, setSelectedSharedPetId,
    sitterNotes, addSitterNote,
    pendingSitterNotes, dismissPendingSitterNote, logPendingSitterNote,
    clinicName, clinicAddress, setClinicInfo,
    vetClients, addVetClient, removeVetClient,
    selectedVetClientId, setSelectedVetClientId,
    generateInviteCode, acceptInviteCode,
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
