import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';

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
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

const STORAGE_KEYS = {
  SUBSCRIPTION_TIER: '@pawguard_subscription_tier',
  TRIAGE_USAGE: '@pawguard_triage_usage',
  PAYWALL_COMPLETE: '@pawguard_paywall_complete',
};

const MAX_FREE_PETS = 1;
const MAX_FREE_TRIAGE_PER_MONTH = 3;

const REVENUECAT_API_KEY_IOS = 'appl_PLACEHOLDER_KEY';
const REVENUECAT_API_KEY_ANDROID = 'goog_PLACEHOLDER_KEY';

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
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [isLoading, setIsLoading] = useState(true);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [triageUsage, setTriageUsage] = useState<TriageUsage>({ month: getCurrentMonth(), count: 0 });
  const [paywallComplete, setPaywallCompleteState] = useState(false);
  const [rcInitialized, setRcInitialized] = useState(false);

  useEffect(() => {
    initializeSubscription();
  }, []);

  const initializeSubscription = async () => {
    try {
      const [savedTier, savedUsage, savedPaywall] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_TIER),
        AsyncStorage.getItem(STORAGE_KEYS.TRIAGE_USAGE),
        AsyncStorage.getItem(STORAGE_KEYS.PAYWALL_COMPLETE),
      ]);

      if (savedTier === 'premium') setTier('premium');
      if (savedPaywall === 'true') setPaywallCompleteState(true);

      if (savedUsage) {
        const usage: TriageUsage = JSON.parse(savedUsage);
        const currentMonth = getCurrentMonth();
        if (usage.month === currentMonth) {
          setTriageUsage(usage);
        } else {
          const reset = { month: currentMonth, count: 0 };
          setTriageUsage(reset);
          await AsyncStorage.setItem(STORAGE_KEYS.TRIAGE_USAGE, JSON.stringify(reset));
        }
      }

      if (Platform.OS !== 'web') {
        try {
          const apiKey = Platform.OS === 'ios' ? REVENUECAT_API_KEY_IOS : REVENUECAT_API_KEY_ANDROID;
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
      }
    } catch (e) {
      console.error('Failed to initialize subscriptions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEntitlements = (customerInfo: CustomerInfo) => {
    if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
      setTier('premium');
      AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, 'premium');
    }
  };

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    if (!rcInitialized) {
      setTier('premium');
      await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, 'premium');
      return true;
    }
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setTier('premium');
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, 'premium');
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.userCancelled) return false;
      console.error('Purchase failed:', e);
      return false;
    }
  }, [rcInitialized]);

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    if (!rcInitialized) return false;
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setTier('premium');
        await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_TIER, 'premium');
        return true;
      }
      return false;
    } catch (e) {
      console.error('Restore failed:', e);
      return false;
    }
  }, [rcInitialized]);

  const canAddMorePets = useCallback((currentPetCount: number): boolean => {
    if (tier === 'premium') return true;
    return currentPetCount < MAX_FREE_PETS;
  }, [tier]);

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
    await AsyncStorage.setItem(STORAGE_KEYS.TRIAGE_USAGE, JSON.stringify(newUsage));
  }, [triageUsage]);

  const setPaywallComplete = useCallback(async () => {
    setPaywallCompleteState(true);
    await AsyncStorage.setItem(STORAGE_KEYS.PAYWALL_COMPLETE, 'true');
  }, []);

  const monthlyPackage = useMemo(() =>
    packages.find(p => p.packageType === 'MONTHLY') || null,
  [packages]);

  const annualPackage = useMemo(() =>
    packages.find(p => p.packageType === 'ANNUAL') || null,
  [packages]);

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
  }), [tier, isLoading, packages, monthlyPackage, annualPackage,
    purchasePackage, restorePurchases, canAddMorePets, canUseTriageThisMonth,
    triageUsedThisMonth, recordTriageUsage, setPaywallComplete, paywallComplete]);

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
