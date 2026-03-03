import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { usePets, type UserRole } from './pet-context';
import { apiRequest } from './query-client';

export type SubscriptionTier = 'free' | 'premium';

interface SubscriptionContextValue {
  tier: SubscriptionTier;
  isLoading: boolean;
  packages: PurchasesPackage[];
  monthlyPackage: PurchasesPackage | null;
  annualPackage: PurchasesPackage | null;
  purchasePackage: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  canAddMorePets: (currentPetCount: number) => boolean;
  canUseTriageThisMonth: () => boolean;
  triageUsedThisMonth: number;
  maxFreePets: number;
  maxFreeTriagePerMonth: number;
  recordTriageUsage: () => Promise<void>;
  setPaywallComplete: () => Promise<void>;
  paywallComplete: boolean;
  isStoreAvailable: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function subKey(email: string, suffix: string): string {
  const sanitized = email.toLowerCase().trim();
  return `@pawguard_user_${sanitized}_${suffix}`;
}

const MAX_FREE_PETS = 1;
const MAX_FREE_TRIAGE_PER_MONTH = 3;

const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

const ENTITLEMENT_ID = 'premium';

interface TriageUsage {
  month: string;
  count: number;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { userEmail, userRole, sharedPets } = usePets();
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [triageUsage, setTriageUsage] = useState<TriageUsage>({ month: getCurrentMonth(), count: 0 });
  const [paywallComplete, setPaywallCompleteState] = useState(false);
  const [rcInitialized, setRcInitialized] = useState(false);

  useEffect(() => {
    initializeSubscription();
  }, [userEmail]);

  const initializeSubscription = async () => {
    setIsLoading(true);

    if (!userEmail) {
      setTier('free');
      setTriageUsage({ month: getCurrentMonth(), count: 0 });
      setPaywallCompleteState(false);
      setIsLoading(false);
      return;
    }

    try {
      const [savedTier, savedUsage, savedPaywall] = await Promise.all([
        AsyncStorage.getItem(subKey(userEmail, 'subscription_tier')),
        AsyncStorage.getItem(subKey(userEmail, 'triage_usage')),
        AsyncStorage.getItem(subKey(userEmail, 'paywall_complete')),
      ]);

      if (savedTier === 'premium') {
        setTier('premium');
      } else {
        setTier('free');
        try {
          const res = await apiRequest('GET', `/api/users/${encodeURIComponent(userEmail)}/subscription`);
          const data = await res.json();
          if (data.subscriptionTier === 'premium') {
            setTier('premium');
            await AsyncStorage.setItem(subKey(userEmail, 'subscription_tier'), 'premium');
          }
        } catch (backendErr) {
          console.log('Backend tier check failed (non-blocking):', backendErr);
        }
      }

      if (savedPaywall === 'true') {
        setPaywallCompleteState(true);
      } else {
        setPaywallCompleteState(false);
      }

      if (savedUsage) {
        const usage: TriageUsage = JSON.parse(savedUsage);
        const currentMonth = getCurrentMonth();
        if (usage.month === currentMonth) {
          setTriageUsage(usage);
        } else {
          const reset = { month: currentMonth, count: 0 };
          setTriageUsage(reset);
          await AsyncStorage.setItem(subKey(userEmail, 'triage_usage'), JSON.stringify(reset));
        }
      } else {
        setTriageUsage({ month: getCurrentMonth(), count: 0 });
      }

      if (Platform.OS !== 'web') {
        const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
        if (apiKey) {
          try {
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
            await Purchases.configure({ apiKey });
            setRcInitialized(true);

            const customerInfo = await Purchases.getCustomerInfo();
            checkEntitlements(customerInfo);

            try {
              const offerings = await Purchases.getOfferings();
              if (offerings.current && offerings.current.availablePackages) {
                setPackages(offerings.current.availablePackages);
              }
            } catch (offerErr) {
              console.log('RevenueCat offerings not available (expected in dev):', offerErr);
            }
          } catch (rcErr) {
            console.log('RevenueCat not available (expected in Expo Go/dev):', rcErr);
          }
        } else {
          console.log('RevenueCat API key not configured, skipping SDK initialization');
        }
      }
    } catch (e) {
      console.error('Failed to initialize subscriptions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const syncTierToBackend = async (email: string, newTier: SubscriptionTier) => {
    try {
      await apiRequest('PATCH', `/api/users/${encodeURIComponent(email)}/subscription`, { tier: newTier });
    } catch (e) {
      console.log('Failed to sync tier to backend (non-blocking):', e);
    }
  };

  const syncBrevoUpgrade = (email: string) => {
    apiRequest('POST', '/api/brevo/upgrade', { email })
      .catch(e => console.log('Brevo upgrade sync (non-blocking):', e));
  };

  const checkEntitlements = (customerInfo: CustomerInfo) => {
    if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      setTier('premium');
      if (userEmail) {
        AsyncStorage.setItem(subKey(userEmail, 'subscription_tier'), 'premium');
        syncTierToBackend(userEmail, 'premium');
        syncBrevoUpgrade(userEmail);
      }
    }
  };

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!rcInitialized) {
      console.warn('RevenueCat not initialized — purchase unavailable');
      throw new Error('Purchases are not available right now. Please try again later.');
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setTier('premium');
        if (userEmail) {
          await AsyncStorage.setItem(subKey(userEmail, 'subscription_tier'), 'premium');
          await syncTierToBackend(userEmail, 'premium');
          syncBrevoUpgrade(userEmail);
        }
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.userCancelled) return false;
      console.error('Purchase failed:', e);
      return false;
    }
  }, [rcInitialized, userEmail]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!rcInitialized) return false;
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setTier('premium');
        if (userEmail) {
          await AsyncStorage.setItem(subKey(userEmail, 'subscription_tier'), 'premium');
          await syncTierToBackend(userEmail, 'premium');
          syncBrevoUpgrade(userEmail);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  }, [rcInitialized, userEmail]);

  const canAddMorePets = useCallback((currentPetCount: number): boolean => {
    if (tier === 'premium') return true;
    if (userRole === 'sitter') {
      const totalProfiles = currentPetCount + sharedPets.length;
      return totalProfiles < MAX_FREE_PETS;
    }
    return currentPetCount < MAX_FREE_PETS;
  }, [tier, userRole, sharedPets]);

  const canUseTriageThisMonth = useCallback((): boolean => {
    if (tier === 'premium') return true;
    const currentMonth = getCurrentMonth();
    if (triageUsage.month !== currentMonth) return true;
    return triageUsage.count < MAX_FREE_TRIAGE_PER_MONTH;
  }, [tier, triageUsage]);

  const triageUsedThisMonth = useMemo(() => {
    const currentMonth = getCurrentMonth();
    if (triageUsage.month !== currentMonth) return 0;
    return triageUsage.count;
  }, [triageUsage]);

  const recordTriageUsage = useCallback(async () => {
    const currentMonth = getCurrentMonth();
    const newUsage: TriageUsage = {
      month: currentMonth,
      count: triageUsage.month === currentMonth ? triageUsage.count + 1 : 1,
    };
    setTriageUsage(newUsage);
    if (userEmail) {
      await AsyncStorage.setItem(subKey(userEmail, 'triage_usage'), JSON.stringify(newUsage));
    }
  }, [triageUsage, userEmail]);

  const setPaywallComplete = useCallback(async () => {
    setPaywallCompleteState(true);
    if (userEmail) {
      await AsyncStorage.setItem(subKey(userEmail, 'paywall_complete'), 'true');
    }
  }, [userEmail]);

  const monthlyPackage = useMemo(() =>
    packages.find(p => p.packageType === 'MONTHLY') || null,
  [packages]);

  const annualPackage = useMemo(() =>
    packages.find(p => p.packageType === 'ANNUAL') || null,
  [packages]);

  const isStoreAvailable = rcInitialized;

  const value = useMemo(() => ({
    tier,
    isLoading,
    packages,
    monthlyPackage,
    annualPackage,
    purchasePackage,
    restorePurchases,
    canAddMorePets,
    canUseTriageThisMonth,
    triageUsedThisMonth,
    maxFreePets: MAX_FREE_PETS,
    maxFreeTriagePerMonth: MAX_FREE_TRIAGE_PER_MONTH,
    recordTriageUsage,
    setPaywallComplete,
    paywallComplete,
    isStoreAvailable,
  }), [tier, isLoading, packages, monthlyPackage, annualPackage,
    purchasePackage, restorePurchases, canAddMorePets, canUseTriageThisMonth,
    triageUsedThisMonth, recordTriageUsage, setPaywallComplete, paywallComplete,
    isStoreAvailable]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
