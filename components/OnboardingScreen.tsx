import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView,
  KeyboardAvoidingView, Animated, Dimensions, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import BrandLogo, { PawImage } from '@/components/BrandLogo';
import { usePets, generateId, type UserRole, type ActiveView } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import { requestNotificationPermission } from '@/lib/notifications';
import PaywallScreen from '@/components/PaywallScreen';
import type { Pet } from '@/lib/types';

const C = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'intro_welcome' | 'intro_pack' | 'intro_how' | 'welcome' | 'signup' | 'login' | 'role' | 'sitter_followup' | 'sitter_upsell' | 'vet_clinic' | 'paywall' | 'petcount' | 'petcreate' | 'notifications' | 'complete';

const testimonialAvatar = require('@/assets/images/testimonial-avatar.png');
const yellowPaw = require('@/assets/images/paw-yellow.png');
const bluePaw = require('@/assets/images/paw-blue.png');
const petEmojis = require('@/assets/images/pet-emojis.png');
const bellIcon = require('@/assets/images/bell-notification.png');

const SPECIES_OPTIONS: { key: Pet['species']; label: string; icon: string }[] = [
  { key: 'dog', label: 'Dog', icon: 'paw' },
  { key: 'cat', label: 'Cat', icon: 'paw' },
  { key: 'bird', label: 'Bird', icon: 'leaf' },
  { key: 'rabbit', label: 'Rabbit', icon: 'heart' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

const ROLE_OPTIONS: { key: UserRole; title: string; desc: string; iconName: string; iconSet: 'ion' | 'mci' }[] = [
  { key: 'pet_parent', title: 'Pet Parent', desc: 'Track your fur babies\' health daily', iconName: 'heart-circle', iconSet: 'ion' },
  { key: 'sitter', title: 'Pet Sitter', desc: 'Manage pets you care for professionally', iconName: 'paw', iconSet: 'mci' },
  { key: 'vet', title: 'Veterinarian', desc: 'Monitor patient health records', iconName: 'stethoscope', iconSet: 'mci' },
];

const LOCKED_ROLES: Set<UserRole> = new Set(['sitter', 'vet']);

function useStaggerAnims(count: number, trigger: boolean) {
  const anims = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(18),
    }))
  ).current;

  useEffect(() => {
    if (trigger) {
      anims.forEach((a) => { a.opacity.setValue(0); a.translateY.setValue(18); });
      const animations = anims.map((a, i) =>
        Animated.parallel([
          Animated.timing(a.opacity, { toValue: 1, duration: 350, delay: i * 80, useNativeDriver: true }),
          Animated.timing(a.translateY, { toValue: 0, duration: 350, delay: i * 80, useNativeDriver: true }),
        ])
      );
      Animated.stagger(0, animations).start();
    }
  }, [trigger]);

  return anims;
}

function StaggerItem({ anim, children, style }: { anim: { opacity: Animated.Value; translateY: Animated.Value }; children: React.ReactNode; style?: any }) {
  return (
    <Animated.View style={[style, { opacity: anim.opacity, transform: [{ translateY: anim.translateY }] }]}>
      {children}
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { signup, login, setUserRole, addPet, completeOnboarding, setIsAlsoPetParent, setActiveView, userRole, setClinicInfo } = usePets();
  const { tier, canAddMorePets } = useSubscription();

  const [step, setStep] = useState<Step>('intro_welcome');

  const [signName, setSignName] = useState('');
  const [signEmail, setSignEmail] = useState('');
  const [signPassword, setSignPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [sitterOnlyMode, setSitterOnlyMode] = useState(false);
  const [petCount, setPetCount] = useState(1);

  const [currentPetIndex, setCurrentPetIndex] = useState(0);
  const [petName, setPetName] = useState('');
  const [petBreed, setPetBreed] = useState('');
  const [petSpecies, setPetSpecies] = useState<Pet['species']>('dog');
  const [petWeight, setPetWeight] = useState('');
  const [petWeightUnit, setPetWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [petGender, setPetGender] = useState<'male' | 'female'>('male');
  const [petColor, setPetColor] = useState('');
  const [petPhotoUri, setPetPhotoUri] = useState<string | undefined>(undefined);
  const [petAgeMode, setPetAgeMode] = useState<'date' | 'age'>('date');
  const [petBirthDate, setPetBirthDate] = useState('');
  const [petAgeYears, setPetAgeYears] = useState('');

  const [vetClinicName, setVetClinicName] = useState('');
  const [vetClinicAddress, setVetClinicAddress] = useState('');

  const [loading, setLoading] = useState(false);

  const welcomeAnims = useStaggerAnims(4, step === 'intro_welcome');
  const packAnims = useStaggerAnims(5, step === 'intro_pack');
  const howAnims = useStaggerAnims(6, step === 'intro_how');
  const signupAnims = useStaggerAnims(5, step === 'signup');
  const loginAnims = useStaggerAnims(4, step === 'login');
  const roleAnims = useStaggerAnims(5, step === 'role');
  const sitterFollowAnims = useStaggerAnims(4, step === 'sitter_followup');
  const sitterUpsellAnims = useStaggerAnims(6, step === 'sitter_upsell');
  const vetClinicAnims = useStaggerAnims(5, step === 'vet_clinic');
  const petCountAnims = useStaggerAnims(4, step === 'petcount');
  const petCreateAnims = useStaggerAnims(3, step === 'petcreate');
  const notifAnims = useStaggerAnims(4, step === 'notifications');
  const completeAnims = useStaggerAnims(4, step === 'complete');

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'intro_welcome' || step === 'welcome') {
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.06, duration: 1400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [step]);

  const confettiAnims = useRef(
    Array.from({ length: 30 }, () => ({
      x: new Animated.Value(Math.random() * SCREEN_WIDTH),
      y: new Animated.Value(-20 - Math.random() * 100),
      rotate: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    if (step === 'complete') {
      Animated.spring(checkScale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }).start();
      confettiAnims.forEach((anim, i) => {
        const delay = i * 60;
        const duration = 2000 + Math.random() * 1500;
        Animated.parallel([
          Animated.timing(anim.y, { toValue: 800, duration, delay, useNativeDriver: true }),
          Animated.timing(anim.x, { toValue: (Math.random() - 0.5) * SCREEN_WIDTH + SCREEN_WIDTH / 2, duration, delay, useNativeDriver: true }),
          Animated.timing(anim.rotate, { toValue: 3 + Math.random() * 4, duration, delay, useNativeDriver: true }),
          Animated.timing(anim.opacity, { toValue: 0, duration: duration * 0.8, delay: delay + duration * 0.2, useNativeDriver: true }),
        ]).start();
      });
    }
  }, [step]);

  const animateTransition = (next: Step) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -30, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setStep(next);
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleSignup = async () => {
    if (!signName.trim() || !signEmail.trim() || !signPassword.trim()) return;
    setLoading(true);
    setSignupError('');
    try {
      const result = await signup(signName.trim(), signEmail.trim(), signPassword);
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        animateTransition('role');
      } else {
        setSignupError(result.error || 'Something went wrong.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      setSignupError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword.trim()) return;
    setLoading(true);
    setLoginError('');
    try {
      const success = await login(loginEmail.trim(), loginPassword);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setLoginError('Invalid email or password. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (e) {
      setLoginError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = async (role: UserRole) => {
    setSelectedRole(role);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await setUserRole(role);
    if (role === 'sitter') {
      await setActiveView('sitter');
      setTimeout(() => animateTransition('sitter_followup'), 300);
    } else if (role === 'vet') {
      await setActiveView('vet');
      setTimeout(() => animateTransition('vet_clinic'), 300);
    } else {
      await setActiveView('parent');
      setTimeout(() => animateTransition('paywall'), 300);
    }
  };

  const handlePetCountNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentPetIndex(0);
    resetPetForm();
    animateTransition('petcreate');
  };

  const resetPetForm = () => {
    setPetName('');
    setPetBreed('');
    setPetSpecies('dog');
    setPetWeight('');
    setPetWeightUnit('kg');
    setPetGender('male');
    setPetColor('');
    setPetPhotoUri(undefined);
    setPetAgeMode('date');
    setPetBirthDate('');
    setPetAgeYears('');
  };

  const pickPetPhoto = async () => {
    Haptics.selectionAsync();
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setPetPhotoUri(result.assets[0].uri);
    }
  };

  const handleSavePet = async () => {
    if (!petName.trim() || !petBreed.trim() || !petWeight.trim()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const pet: Pet = {
      id: generateId(),
      name: petName.trim(),
      breed: petBreed.trim(),
      species: petSpecies,
      birthDate: petAgeMode === 'date' && petBirthDate.trim()
        ? (() => { const parts = petBirthDate.trim().split('/'); return parts.length === 3 ? `${parts[2]}-${parts[0].padStart(2,'0')}-${parts[1].padStart(2,'0')}` : new Date().toISOString().split('T')[0]; })()
        : petAgeMode === 'age' && petAgeYears.trim()
          ? (() => { const d = new Date(); d.setFullYear(d.getFullYear() - (parseInt(petAgeYears) || 0)); return d.toISOString().split('T')[0]; })()
          : new Date().toISOString().split('T')[0],
      weight: parseFloat(petWeight) || 0,
      weightUnit: petWeightUnit,
      gender: petGender,
      color: petColor.trim() || 'Unknown',
      ...(petPhotoUri ? { photoUri: petPhotoUri } : {}),
    };
    await addPet(pet);

    if (currentPetIndex < petCount - 1) {
      setCurrentPetIndex(prev => prev + 1);
      resetPetForm();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      animateTransition('notifications');
    }
    setLoading(false);
  };

  const handleAllowNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestNotificationPermission();
    animateTransition('complete');
  };

  const handleSkipNotifications = () => {
    Haptics.selectionAsync();
    animateTransition('complete');
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await completeOnboarding();
  };

  const renderIntroWelcome = () => (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#3BA776', '#2D8F65', '#2D6A4F']}
        style={{ flex: 1 }}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      >
        <View style={[introStyles.welcomeContainer, { paddingTop: topInset + 16 }]}>
          <StaggerItem anim={welcomeAnims[0]}>
            <View style={introStyles.welcomePawsRow}>
              <Image source={yellowPaw} style={{ width: 56, height: 56, transform: [{ rotate: '-15deg' }] }} resizeMode="contain" />
              <Image source={yellowPaw} style={{ width: 42, height: 42, transform: [{ rotate: '10deg' }] }} resizeMode="contain" />
            </View>
          </StaggerItem>

          <StaggerItem anim={welcomeAnims[1]}>
            <Text style={introStyles.welcomeTitle}>
              Welcome to{'\n'}
              <Text style={introStyles.welcomeTitleBold}>Pet</Text>
              <Text style={introStyles.welcomeTitleBoldAccent}>Parent!</Text>
            </Text>
            <Text style={introStyles.welcomeSubtext}>
              You just made the best decision{'\n'}for your furry family. Let's get your{'\n'}pack set up.
            </Text>
          </StaggerItem>

          <StaggerItem anim={welcomeAnims[2]}>
            <View style={introStyles.testimonialCard}>
              <Text style={introStyles.quoteMarkLeft}>{'\u201D'}</Text>
              <Text style={introStyles.testimonialTitle}>Perfect</Text>
              <View style={introStyles.starsRow}>
                {[1,2,3,4,5].map(i => (
                  <Ionicons key={i} name="star" size={22} color="#F4C542" />
                ))}
              </View>
              <Text style={introStyles.testimonialQuote}>
                {'\u201C'}This app is perfect for tracking all of my pets' health in one place.{'\u201D'}
              </Text>
              <Image
                source={testimonialAvatar}
                style={introStyles.testimonialAvatar}
              />
              <Text style={introStyles.quoteMarkRight}>{'\u201C'}</Text>
            </View>
          </StaggerItem>
        </View>

        <StaggerItem anim={welcomeAnims[3]} style={[introStyles.bottomBtnWrap, { paddingBottom: bottomInset + 20 }]}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animateTransition('intro_pack'); }}
            style={introStyles.introBtn}
            testID="intro-welcome-next"
          >
            <Text style={introStyles.introBtnText}>Let's Go</Text>
            <Ionicons name="arrow-forward" size={22} color={C.accent} />
          </Pressable>
          <Pressable onPress={() => animateTransition('login')} testID="intro-welcome-login">
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#FFFFFFCC', textAlign: 'center', marginTop: 14 }}>
              Already have an account? <Text style={{ fontFamily: 'Inter_700Bold', textDecorationLine: 'underline' }}>Log In</Text>
            </Text>
          </Pressable>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#FFFFFF88', textAlign: 'center', marginTop: 18 }}>
            Powered by ATY Digital
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 6, gap: 6 }}>
            <Pressable onPress={() => router.push('/privacy-policy')} hitSlop={8}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#FFFFFFAA', textDecorationLine: 'underline' }}>Privacy Policy</Text>
            </Pressable>
            <Text style={{ fontSize: 11, color: '#FFFFFF66' }}>|</Text>
            <Pressable onPress={() => router.push('/terms-of-service')} hitSlop={8}>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#FFFFFFAA', textDecorationLine: 'underline' }}>Terms of Service</Text>
            </Pressable>
          </View>
        </StaggerItem>
      </LinearGradient>
    </View>
  );

  const renderIntroPack = () => (
    <View style={[{ flex: 1, backgroundColor: '#FAF5EB' }, { paddingTop: topInset + 12 }]}>
      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <StaggerItem anim={packAnims[0]}>
          <View style={[introStyles.packTopBanner, { height: 80, marginBottom: 12 }]}>
            <View style={introStyles.packPawsOverlay}>
              <Image source={bluePaw} style={{ width: 36, height: 36, transform: [{ rotate: '-15deg' }] }} resizeMode="contain" />
              <Image source={yellowPaw} style={{ width: 28, height: 28, transform: [{ rotate: '10deg' }] }} resizeMode="contain" />
            </View>
          </View>
        </StaggerItem>

        <StaggerItem anim={packAnims[1]}>
          <View style={{ marginBottom: 4, marginHorizontal: -24, alignItems: 'center' }}>
            <Image source={require('../assets/images/pack-title.png')} style={{ width: '90%', height: 100 }} resizeMode="contain" />
          </View>
        </StaggerItem>

        <View style={[introStyles.packFeaturesList, { gap: 16 }]}>
          <StaggerItem anim={packAnims[2]}>
            <View style={introStyles.packFeatureItem}>
              <View style={[introStyles.packFeatureIcon, { backgroundColor: '#D6EBF2', width: 42, height: 42 }]}>
                <MaterialCommunityIcons name="hospital-building" size={22} color="#4A90A4" />
              </View>
              <View style={introStyles.packFeatureTextWrap}>
                <Text style={introStyles.packFeatureTitle}>Never miss a vet visit</Text>
                <Text style={[introStyles.packFeatureDesc, { fontSize: 13, lineHeight: 19 }]}>
                  Log appointments, vaccines, & medications for every pet {'\u2013'} all in one place.
                </Text>
              </View>
            </View>
          </StaggerItem>

          <StaggerItem anim={packAnims[3]}>
            <View style={introStyles.packFeatureItem}>
              <View style={[introStyles.packFeatureIcon, { backgroundColor: '#F8D9D9', width: 42, height: 42 }]}>
                <Ionicons name="warning" size={20} color="#D64545" />
              </View>
              <View style={introStyles.packFeatureTextWrap}>
                <Text style={introStyles.packFeatureTitle}>Know when it's urgent</Text>
                <Text style={[introStyles.packFeatureDesc, { fontSize: 13, lineHeight: 19 }]}>
                  Describe symptoms, and let AI tell you if it's urgent vs. wait-and-see in seconds.
                </Text>
              </View>
            </View>
          </StaggerItem>

          <StaggerItem anim={packAnims[4]}>
            <View style={introStyles.packFeatureItem}>
              <View style={[introStyles.packFeatureIcon, { backgroundColor: '#FDE8C8', width: 42, height: 42 }]}>
                <Ionicons name="heart" size={20} color="#D64545" />
              </View>
              <View style={introStyles.packFeatureTextWrap}>
                <Text style={introStyles.packFeatureTitle}>Care tailored to your breed</Text>
                <Text style={[introStyles.packFeatureDesc, { fontSize: 13, lineHeight: 19 }]}>
                  Get breed-specific tips, feeding guides, and reminders personalized to your pets.
                </Text>
              </View>
            </View>
          </StaggerItem>
        </View>
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: bottomInset + 20, paddingTop: 12, backgroundColor: '#FAF5EB' }}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animateTransition('intro_how'); }}
          style={introStyles.introBtnGreen}
          testID="intro-pack-next"
        >
          <Text style={introStyles.introBtnGreenText}>Meet the Features</Text>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );

  const renderIntroHow = () => (
    <View style={[{ flex: 1, backgroundColor: '#FAF5EB' }, { paddingTop: topInset + 16 }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StaggerItem anim={howAnims[0]}>
          <Text style={[introStyles.howTitle, { fontSize: 26, lineHeight: 34, marginBottom: 16 }]}>
            Here's how{'\n'}
            <Text style={{ color: C.accent }}>PetParent</Text> works
          </Text>
        </StaggerItem>

        <View style={[introStyles.howCardsList, { gap: 12 }]}>
          <StaggerItem anim={howAnims[1]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <Ionicons name="chatbubble-ellipses" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>AI Symptom Triage</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Describe what you're seeing in your pet. Get an urgent/not-urgent verdict with a clear reason why {'\u2013'} in under 30 seconds.
              </Text>
            </View>
          </StaggerItem>

          <StaggerItem anim={howAnims[2]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <MaterialCommunityIcons name="clipboard-text" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>Daily Logs & Health Records</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Keep daily logs of your pet's behavior, vet visits, and vaccines. Track medications for your entire pack {'\u2013'} all in one place.
              </Text>
            </View>
          </StaggerItem>

          <StaggerItem anim={howAnims[3]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <Ionicons name="notifications" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>Smart Reminders</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Never forget flea treatments, annual checkups, or medications again.
              </Text>
            </View>
          </StaggerItem>

          <StaggerItem anim={howAnims[4]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <MaterialCommunityIcons name="paw" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>Shareable Pet Profiles</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Share your pet's health habits and medication schedule directly with your vet, pet sitter and family members.
              </Text>
            </View>
          </StaggerItem>
        </View>
      </ScrollView>

      <StaggerItem anim={howAnims[5]} style={[introStyles.bottomBtnWrapCream, { paddingBottom: bottomInset + 20 }]}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animateTransition('signup'); }}
          style={introStyles.introBtnGreen}
          testID="intro-how-next"
        >
          <Text style={introStyles.introBtnGreenText}>Create My Profile</Text>
        </Pressable>
      </StaggerItem>
    </View>
  );

  const renderWelcome = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 20 }]}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }], opacity: logoOpacity }]}>
        <PawImage size={200} />
      </Animated.View>
      <View style={{ marginBottom: 10 }}>
        <BrandLogo size="large" showPaw={false} showText={true} showSubtitle={true} />
      </View>

      <View style={styles.featureList}>
        {[
          { icon: 'shield-checkmark', text: 'AI symptom triage' },
          { icon: 'calendar', text: 'Health task tracking' },
          { icon: 'analytics', text: 'Daily wellness logs' },
          { icon: 'qr-code', text: 'Shareable pet profiles' },
        ].map((f, i) => (
          <View key={f.icon} style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon as any} size={18} color={C.accent} />
            </View>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.bottomActions, { paddingBottom: bottomInset + 16 }]}>
        <Pressable onPress={() => animateTransition('signup')} testID="get-started-btn">
          <LinearGradient colors={[C.accent, C.accentDim]} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
        <Pressable onPress={() => animateTransition('login')} style={styles.secondaryBtn} testID="login-btn">
          <Text style={styles.secondaryBtnText}>Already have an account? Log In</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderSignup = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formContainer, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StaggerItem anim={signupAnims[0]}>
          <Pressable onPress={() => animateTransition('intro_how')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>

          <View style={styles.formHeader}>
            <Text style={styles.stepTitle}>Create Account</Text>
            <Text style={styles.stepSubtitle}>Join PetParent to start tracking your pet's health</Text>
          </View>
        </StaggerItem>

        <StaggerItem anim={signupAnims[1]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={signName}
                onChangeText={setSignName}
                placeholder="Enter your name"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
                testID="signup-name"
              />
            </View>
          </View>
        </StaggerItem>

        <StaggerItem anim={signupAnims[2]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={signEmail}
                onChangeText={setSignEmail}
                placeholder="you@email.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="signup-email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={signPassword}
                onChangeText={setSignPassword}
                placeholder="Create a password"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                testID="signup-password"
              />
            </View>
          </View>
        </StaggerItem>

        {signupError ? (
          <View style={{ backgroundColor: C.dangerSoft, borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row' as const, alignItems: 'center', gap: 8 }}>
            <Ionicons name="alert-circle" size={18} color={C.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.danger }}>{signupError}</Text>
            </View>
          </View>
        ) : null}

        <StaggerItem anim={signupAnims[3]}>
          <Pressable onPress={handleSignup} disabled={loading || !signName.trim() || !signEmail.trim() || !signPassword.trim()} testID="signup-submit">
            <LinearGradient
              colors={(signName.trim() && signEmail.trim() && signPassword.trim()) ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.submitBtn}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Text style={[styles.submitBtnText, !(signName.trim() && signEmail.trim() && signPassword.trim()) && { color: C.textMuted }]}>Continue</Text>
                  <Ionicons name="arrow-forward" size={18} color={(signName.trim() && signEmail.trim() && signPassword.trim()) ? '#FFFFFF' : C.textMuted} />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </StaggerItem>

        <StaggerItem anim={signupAnims[4]}>
          <Pressable onPress={() => { setSignupError(''); animateTransition('login'); }} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={styles.switchAuthText}>Already have an account? <Text style={{ color: C.accent }}>Log In</Text></Text>
          </Pressable>

          <Text style={styles.poweredBy}>Powered by ATY Digital</Text>
        </StaggerItem>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderLogin = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formContainer, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StaggerItem anim={loginAnims[0]}>
          <Pressable onPress={() => animateTransition('intro_how')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>

          <View style={styles.formHeader}>
            <Text style={styles.stepTitle}>Welcome Back</Text>
            <Text style={styles.stepSubtitle}>Log in to continue managing your pets</Text>
          </View>
        </StaggerItem>

        {loginError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={C.danger} />
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        ) : null}

        <StaggerItem anim={loginAnims[1]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={loginEmail}
                onChangeText={(t) => { setLoginEmail(t); setLoginError(''); }}
                placeholder="you@email.com"
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                testID="login-email"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={loginPassword}
                onChangeText={(t) => { setLoginPassword(t); setLoginError(''); }}
                placeholder="Enter your password"
                placeholderTextColor={C.textMuted}
                secureTextEntry
                testID="login-password"
              />
            </View>
          </View>
        </StaggerItem>

        <StaggerItem anim={loginAnims[2]}>
          <Pressable onPress={handleLogin} disabled={loading || !loginEmail.trim() || !loginPassword.trim()} testID="login-submit">
            <LinearGradient
              colors={(loginEmail.trim() && loginPassword.trim()) ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.submitBtn}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Text style={[styles.submitBtnText, !(loginEmail.trim() && loginPassword.trim()) && { color: C.textMuted }]}>Log In</Text>
                  <Ionicons name="arrow-forward" size={18} color={(loginEmail.trim() && loginPassword.trim()) ? '#FFFFFF' : C.textMuted} />
                </>
              )}
            </LinearGradient>
          </Pressable>
        </StaggerItem>

        <StaggerItem anim={loginAnims[3]}>
          <Pressable onPress={() => animateTransition('signup')} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={styles.switchAuthText}>New here? <Text style={{ color: C.accent }}>Create Account</Text></Text>
          </Pressable>

          <Text style={styles.poweredBy}>Powered by ATY Digital</Text>
        </StaggerItem>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRole = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 20 }]}>
      <StaggerItem anim={roleAnims[0]}>
        <View style={styles.formHeader}>
          <Text style={styles.stepTitle}>How will you use PetParent?</Text>
          <Text style={styles.stepSubtitle}>Select your role to personalize your experience</Text>
        </View>
      </StaggerItem>

      <View style={styles.roleCards}>
        {ROLE_OPTIONS.map((role, idx) => {
          const isSelected = selectedRole === role.key;
          const isLocked = LOCKED_ROLES.has(role.key);
          return (
            <StaggerItem key={role.key} anim={roleAnims[idx + 1]}>
              <Pressable
                style={[styles.roleCard, isSelected && styles.roleCardSelected, isLocked && styles.roleCardLocked]}
                onPress={isLocked ? undefined : () => handleRoleSelect(role.key)}
                disabled={isLocked}
                testID={`role-${role.key}`}
              >
                <View style={[styles.roleIconWrap, isSelected && styles.roleIconWrapSelected, isLocked && { opacity: 0.4 }]}>
                  {role.iconSet === 'ion' ? (
                    <Ionicons name={role.iconName as any} size={28} color={isSelected ? C.accent : C.textMuted} />
                  ) : (
                    <MaterialCommunityIcons name={role.iconName as any} size={28} color={isSelected ? C.accent : C.textMuted} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected, isLocked && { opacity: 0.4 }]}>{role.title}</Text>
                  <Text style={[styles.roleDesc, isLocked && { opacity: 0.4 }]}>{role.desc}</Text>
                </View>
                {isSelected && (
                  <View style={styles.roleCheck}>
                    <Ionicons name="checkmark-circle" size={22} color={C.accent} />
                  </View>
                )}
                {isLocked && (
                  <View style={styles.comingSoonBadge}>
                    <Ionicons name="lock-closed" size={12} color="#FFFFFF" />
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </Pressable>
            </StaggerItem>
          );
        })}
      </View>
    </View>
  );

  const renderSitterFollowup = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 40 }]}>
      <StaggerItem anim={sitterFollowAnims[0]}>
        <View style={styles.formHeader}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 }}>
            <MaterialCommunityIcons name="paw" size={32} color={C.accent} />
          </View>
          <Text style={styles.stepTitle}>Are you also a Pet Parent?</Text>
          <Text style={styles.stepSubtitle}>
            If you have your own pets, you can switch between your Sitter and Pet Parent views anytime.
          </Text>
        </View>
      </StaggerItem>

      <View style={{ gap: 12, marginTop: 24 }}>
        <StaggerItem anim={sitterFollowAnims[1]}>
        <Pressable
          style={[styles.roleCard, { flexDirection: 'row', alignItems: 'center', padding: 18 }]}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await setIsAlsoPetParent(true);
            await setActiveView('sitter');
            animateTransition('sitter_upsell');
          }}
          testID="sitter-also-parent-yes"
        >
          <View style={[styles.roleIconWrap, { marginRight: 14, width: 48, height: 48, borderRadius: 24 }]}>
            <Ionicons name="heart-circle" size={26} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleTitle, { fontSize: 16, marginBottom: 2 }]}>Yes, I have pets too</Text>
            <Text style={styles.roleDesc}>I'll be able to switch between views</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
        </Pressable>
        </StaggerItem>

        <StaggerItem anim={sitterFollowAnims[2]}>
        <Pressable
          style={[styles.roleCard, { flexDirection: 'row', alignItems: 'center', padding: 18 }]}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await setIsAlsoPetParent(false);
            await setActiveView('sitter');
            setSitterOnlyMode(true);
            animateTransition('paywall');
          }}
          testID="sitter-also-parent-no"
        >
          <View style={[styles.roleIconWrap, { marginRight: 14, width: 48, height: 48, borderRadius: 24 }]}>
            <MaterialCommunityIcons name="briefcase" size={24} color={C.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.roleTitle, { fontSize: 16, marginBottom: 2 }]}>No, just pet sitting</Text>
            <Text style={styles.roleDesc}>I care for other people's pets</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
        </Pressable>
        </StaggerItem>
      </View>
    </View>
  );

  const renderSitterUpsell = () => (
    <View style={[{ flex: 1, backgroundColor: '#FAF5EB' }, { paddingTop: topInset + 16 }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <StaggerItem anim={sitterUpsellAnims[0]}>
          <View style={{ alignItems: 'center', marginBottom: 8 }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="sparkles" size={28} color={C.accent} />
            </View>
          </View>

          <Text style={[introStyles.howTitle, { fontSize: 24, lineHeight: 32, marginBottom: 6, textAlign: 'center' }]}>
            Great! Let's get your{'\n'}personal pack added to
          </Text>
          <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 26, color: C.accent, textAlign: 'center', marginBottom: 4 }}>
            PetParent
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 }}>
            The #1 AI Vet Assistant & Pet Health Log app.
          </Text>
        </StaggerItem>

        <View style={[introStyles.howCardsList, { gap: 12 }]}>
          <StaggerItem anim={sitterUpsellAnims[1]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <Ionicons name="chatbubble-ellipses" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>AI Symptom Triage</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Describe what you're seeing in your pet. Get an urgent/not-urgent verdict with a clear reason why {'\u2013'} in under 30 seconds.
              </Text>
            </View>
          </StaggerItem>

          <StaggerItem anim={sitterUpsellAnims[2]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <MaterialCommunityIcons name="clipboard-text" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>Daily Logs & Health Records</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Keep daily logs of your pet's behavior, vet visits, and vaccines. Track medications for your entire pack {'\u2013'} all in one place.
              </Text>
            </View>
          </StaggerItem>

          <StaggerItem anim={sitterUpsellAnims[3]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <Ionicons name="notifications" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>Smart Reminders</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Never forget flea treatments, annual checkups, or medications again.
              </Text>
            </View>
          </StaggerItem>

          <StaggerItem anim={sitterUpsellAnims[4]}>
            <View style={[introStyles.howCard, { padding: 14 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <View style={[introStyles.howCardIconWrap, { width: 34, height: 34 }]}>
                  <MaterialCommunityIcons name="paw" size={18} color={C.accent} />
                </View>
                <Text style={[introStyles.howCardTitle, { fontSize: 15 }]}>Shareable Pet Profiles</Text>
              </View>
              <Text style={[introStyles.howCardDesc, { fontSize: 13, lineHeight: 19 }]}>
                Share your pet's health habits and medication schedule directly with your vet, pet sitter and family members.
              </Text>
            </View>
          </StaggerItem>
        </View>
      </ScrollView>

      <StaggerItem anim={sitterUpsellAnims[5]} style={[introStyles.bottomBtnWrapCream, { paddingBottom: bottomInset + 20 }]}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); animateTransition('paywall'); }}
          style={introStyles.introBtnGreen}
          testID="sitter-upsell-continue"
        >
          <Text style={introStyles.introBtnGreenText}>Continue</Text>
          <Ionicons name="arrow-forward" size={22} color="#FFFFFF" />
        </Pressable>
      </StaggerItem>
    </View>
  );

  const vetClinicValid = vetClinicName.trim().length > 0;

  const renderVetClinic = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formContainer, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <StaggerItem anim={vetClinicAnims[0]}>
          <Pressable onPress={() => animateTransition('role')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </Pressable>
        </StaggerItem>

        <StaggerItem anim={vetClinicAnims[1]}>
          <View style={styles.formHeader}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="hospital-building" size={32} color={C.accent} />
            </View>
            <Text style={styles.stepTitle}>Your Clinic Info</Text>
            <Text style={styles.stepSubtitle}>Tell us about your veterinary practice</Text>
          </View>
        </StaggerItem>

        <StaggerItem anim={vetClinicAnims[2]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clinic Name *</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="hospital-building" size={20} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={vetClinicName}
                onChangeText={setVetClinicName}
                placeholder="e.g. Happy Paws Veterinary"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Clinic Address</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={C.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={vetClinicAddress}
                onChangeText={setVetClinicAddress}
                placeholder="e.g. 123 Main St, Anytown"
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
              />
            </View>
          </View>
        </StaggerItem>

        <StaggerItem anim={vetClinicAnims[3]}>
          <Pressable
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await setClinicInfo(vetClinicName.trim(), vetClinicAddress.trim());
              animateTransition('paywall');
            }}
            disabled={!vetClinicValid}
            testID="vet-clinic-continue"
          >
            <LinearGradient
              colors={vetClinicValid ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.submitBtn}
            >
              <Text style={[styles.submitBtnText, !vetClinicValid && { color: C.textMuted }]}>Continue</Text>
              <Ionicons name="arrow-forward" size={18} color={vetClinicValid ? '#FFFFFF' : C.textMuted} />
            </LinearGradient>
          </Pressable>
        </StaggerItem>

        <StaggerItem anim={vetClinicAnims[4]}>
          <Pressable
            onPress={() => { animateTransition('paywall'); }}
            style={{ alignSelf: 'center', marginTop: 16 }}
          >
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14, color: C.textMuted }}>Skip for now</Text>
          </Pressable>
        </StaggerItem>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderPetCount = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 40 }]}>
      <StaggerItem anim={petCountAnims[0]}>
        <View style={styles.formHeader}>
          <Text style={styles.stepTitle}>How many pets are you adding?</Text>
          <Text style={styles.stepSubtitle}>You can always add more later</Text>
        </View>
      </StaggerItem>

      <StaggerItem anim={petCountAnims[1]}>
      <View style={styles.petCountContainer}>
        <Pressable
          style={styles.petCountBtn}
          onPress={() => { if (petCount > 1) { setPetCount(prev => prev - 1); Haptics.selectionAsync(); } }}
          disabled={petCount <= 1}
        >
          <Ionicons name="remove" size={28} color={petCount <= 1 ? C.textMuted : C.accent} />
        </Pressable>

        <View style={styles.petCountDisplay}>
          <Text style={styles.petCountNumber}>{petCount}</Text>
          <Text style={styles.petCountLabel}>{petCount === 1 ? 'Pet' : 'Pets'}</Text>
        </View>

        <Pressable
          style={styles.petCountBtn}
          onPress={() => {
            const maxPets = tier === 'premium' ? 10 : 1;
            if (petCount < maxPets) { setPetCount(prev => prev + 1); Haptics.selectionAsync(); }
          }}
          disabled={petCount >= (tier === 'premium' ? 10 : 1)}
        >
          <Ionicons name="add" size={28} color={petCount >= (tier === 'premium' ? 10 : 1) ? C.textMuted : C.accent} />
        </Pressable>
      </View>

      {tier === 'free' && (
        <Pressable onPress={() => animateTransition('paywall')} style={{ backgroundColor: C.warningSoft, borderRadius: 10, padding: 12, marginTop: 8, marginHorizontal: 4 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.warning, textAlign: 'center', lineHeight: 18 }}>
            Free plan allows 1 pet profile. <Text style={{ fontFamily: 'Inter_700Bold', textDecorationLine: 'underline' }}>Upgrade to Premium</Text> for unlimited pets.
          </Text>
        </Pressable>
      )}
      </StaggerItem>

      <StaggerItem anim={petCountAnims[2]}>
        <View style={styles.petDotsRow}>
          {Array.from({ length: petCount }).map((_, i) => (
            <Pressable key={`dot-${i}`} onPress={tier === 'free' ? () => animateTransition('paywall') : undefined} style={styles.petDot}>
              <Ionicons name="paw" size={16} color={C.accent} />
            </Pressable>
          ))}
        </View>
      </StaggerItem>

      <StaggerItem anim={petCountAnims[3]}>
        <View style={[styles.bottomActions, { paddingBottom: bottomInset + 16 }]}>
          <Pressable onPress={handlePetCountNext} testID="petcount-next">
            <LinearGradient colors={[C.accent, C.accentDim]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </View>
      </StaggerItem>
    </View>
  );

  const renderPetCreate = () => {
    const petValid = petName.trim() && petBreed.trim() && petWeight.trim();
    const progress = (currentPetIndex + 1) / petCount;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.formContainer, { paddingTop: topInset + 16, paddingBottom: bottomInset + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <StaggerItem anim={petCreateAnims[0]}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Pet {currentPetIndex + 1} of {petCount}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
            </View>

            <Pressable onPress={pickPetPhoto} style={styles.petAvatarSection} testID="pet-photo-picker">
              <View style={styles.petAvatarCircle}>
                {petPhotoUri ? (
                  <Image source={{ uri: petPhotoUri }} style={styles.petAvatarImage} />
                ) : (
                  <PawImage size={60} />
                )}
                <View style={styles.cameraIconBadge}>
                  <Ionicons name="camera" size={14} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.photoHintText}>Add photo (optional)</Text>
            </Pressable>
          </StaggerItem>

          <StaggerItem anim={petCreateAnims[1]}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { paddingLeft: 14 }]}
                value={petName}
                onChangeText={setPetName}
                placeholder="Pet's name"
                placeholderTextColor={C.textMuted}
                testID="pet-name"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Species</Text>
            <View style={styles.chipRow}>
              {SPECIES_OPTIONS.map(opt => (
                <Pressable
                  key={opt.key}
                  style={[styles.chip, petSpecies === opt.key && styles.chipActive]}
                  onPress={() => { Haptics.selectionAsync(); setPetSpecies(opt.key); }}
                >
                  <Ionicons name={opt.icon as any} size={14} color={petSpecies === opt.key ? C.accent : C.textMuted} />
                  <Text style={[styles.chipText, petSpecies === opt.key && styles.chipTextActive]}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Breed *</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.textInput, { paddingLeft: 14 }]}
                value={petBreed}
                onChangeText={setPetBreed}
                placeholder="e.g., Golden Retriever"
                placeholderTextColor={C.textMuted}
                testID="pet-breed"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Age / Birthday</Text>
            <View style={styles.toggleRow}>
              <Pressable
                style={[styles.toggleBtn, petAgeMode === 'date' && styles.toggleBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setPetAgeMode('date'); }}
              >
                <Text style={[styles.toggleText, petAgeMode === 'date' && styles.toggleTextActive]}>Birth Date</Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, petAgeMode === 'age' && styles.toggleBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setPetAgeMode('age'); }}
              >
                <Text style={[styles.toggleText, petAgeMode === 'age' && styles.toggleTextActive]}>Approx. Age</Text>
              </Pressable>
            </View>
            <View style={[styles.inputWrapper, { marginTop: 8 }]}>
              {petAgeMode === 'date' ? (
                <TextInput
                  style={[styles.textInput, { paddingLeft: 14 }]}
                  value={petBirthDate}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9/]/g, '');
                    if (cleaned.length <= 10) {
                      if (cleaned.length === 2 && petBirthDate.length < 2) setPetBirthDate(cleaned + '/');
                      else if (cleaned.length === 5 && petBirthDate.length < 5) setPetBirthDate(cleaned + '/');
                      else setPetBirthDate(cleaned);
                    }
                  }}
                  placeholder="MM/DD/YYYY"
                  placeholderTextColor={C.textMuted}
                  keyboardType="number-pad"
                  maxLength={10}
                  testID="pet-birth-date"
                />
              ) : (
                <TextInput
                  style={[styles.textInput, { paddingLeft: 14 }]}
                  value={petAgeYears}
                  onChangeText={(text) => setPetAgeYears(text.replace(/[^0-9]/g, ''))}
                  placeholder="e.g., 3"
                  placeholderTextColor={C.textMuted}
                  keyboardType="number-pad"
                  maxLength={2}
                  testID="pet-age-years"
                />
              )}
            </View>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 4 }}>
              {petAgeMode === 'date' ? 'Enter your pet\'s date of birth' : 'Enter your pet\'s approximate age in years'}
            </Text>
          </View>

          <View style={styles.rowFields}>
            <View style={styles.rowFieldHalf}>
              <Text style={styles.inputLabel}>Weight *</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, { paddingLeft: 14 }]}
                  value={petWeight}
                  onChangeText={setPetWeight}
                  placeholder="0"
                  placeholderTextColor={C.textMuted}
                  keyboardType="decimal-pad"
                  testID="pet-weight"
                />
              </View>
            </View>
            <View style={styles.rowFieldHalf}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleBtn, petWeightUnit === 'kg' && styles.toggleBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setPetWeightUnit('kg'); }}
                >
                  <Text style={[styles.toggleText, petWeightUnit === 'kg' && styles.toggleTextActive]}>kg</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, petWeightUnit === 'lbs' && styles.toggleBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setPetWeightUnit('lbs'); }}
                >
                  <Text style={[styles.toggleText, petWeightUnit === 'lbs' && styles.toggleTextActive]}>lbs</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.rowFields}>
            <View style={styles.rowFieldHalf}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.toggleRow}>
                <Pressable
                  style={[styles.toggleBtn, petGender === 'male' && styles.toggleBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setPetGender('male'); }}
                >
                  <Text style={[styles.toggleText, petGender === 'male' && styles.toggleTextActive]}>Male</Text>
                </Pressable>
                <Pressable
                  style={[styles.toggleBtn, petGender === 'female' && styles.toggleBtnActive]}
                  onPress={() => { Haptics.selectionAsync(); setPetGender('female'); }}
                >
                  <Text style={[styles.toggleText, petGender === 'female' && styles.toggleTextActive]}>Female</Text>
                </Pressable>
              </View>
            </View>
            <View style={styles.rowFieldHalf}>
              <Text style={styles.inputLabel}>Color</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, { paddingLeft: 14 }]}
                  value={petColor}
                  onChangeText={setPetColor}
                  placeholder="e.g., Golden"
                  placeholderTextColor={C.textMuted}
                />
              </View>
            </View>
          </View>
          </StaggerItem>

          <StaggerItem anim={petCreateAnims[2]}>
          <Pressable onPress={handleSavePet} disabled={!petValid || loading} testID="save-pet-btn">
            <LinearGradient
              colors={petValid ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
              style={styles.submitBtn}
            >
              {loading ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Text style={[styles.submitBtnText, !petValid && { color: C.textMuted }]}>
                    {currentPetIndex < petCount - 1 ? 'Save & Next' : 'Save & Finish'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={petValid ? '#FFFFFF' : C.textMuted} />
                </>
              )}
            </LinearGradient>
          </Pressable>
          </StaggerItem>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const CONFETTI_COLORS = ['#F4C542', '#E74C3C', '#3BA776', '#3498DB', '#9B59B6', '#FF6B6B', '#2ECC71', '#F39C12'];

  const renderComplete = () => (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={[styles.centeredContainer, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20, flexGrow: 1 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <StaggerItem anim={completeAnims[0]}>
          <Animated.View style={[styles.completeCheckContainer, { marginTop: 10, marginBottom: 20, transform: [{ scale: checkScale }] }]}>
            <PawImage size={140} />
          </Animated.View>
        </StaggerItem>

        <StaggerItem anim={completeAnims[1]}>
          <Text style={[styles.completeTitle, { fontSize: 26 }]}>You're All Set!</Text>
          <Text style={[styles.completeSubtitle, { marginBottom: 24 }]}>
            {selectedRole === 'vet'
              ? 'Your veterinary account is ready. Start managing client pets today.'
              : sitterOnlyMode
              ? 'Your pet sitter account is ready. Accept invite codes to start.'
              : petCount === 1
              ? 'Your pet profile is ready. Start tracking their health today.'
              : `${petCount} pet profiles created. Start tracking their health today.`}
          </Text>
        </StaggerItem>

        <StaggerItem anim={completeAnims[2]}>
          <View style={styles.completeFeaturesWrap}>
            {(selectedRole === 'vet' ? [
              { icon: 'people', label: 'Manage client pets' },
              { icon: 'medical', label: 'Track patient records' },
              { icon: 'chatbubble-ellipses', label: 'AI symptom check' },
            ] : [
              { icon: 'pulse', label: 'Log daily wellness' },
              { icon: 'medical', label: 'Track medical records' },
              { icon: 'chatbubble-ellipses', label: 'AI symptom check' },
            ]).map((f, i) => (
              <View key={i} style={styles.completeFeatureRow}>
                <View style={styles.completeFeatureIcon}>
                  <Ionicons name={f.icon as any} size={18} color={C.accent} />
                </View>
                <Text style={styles.completeFeatureText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </StaggerItem>

        <StaggerItem anim={completeAnims[3]} style={{ marginTop: 'auto', paddingTop: 20 }}>
          <Pressable onPress={handleComplete} testID="complete-btn">
            <LinearGradient colors={[C.accent, C.accentDim]} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Start Using PetParent</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </LinearGradient>
          </Pressable>
        </StaggerItem>
      </ScrollView>

      {confettiAnims.map((anim, i) => (
        <Animated.View
          key={`confetti-${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: i % 3 === 0 ? 10 : 7,
            height: i % 3 === 0 ? 10 : 7,
            borderRadius: i % 2 === 0 ? 5 : 1,
            backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            opacity: anim.opacity,
            transform: [
              { translateX: anim.x },
              { translateY: anim.y },
              { rotate: anim.rotate.interpolate({ inputRange: [0, 7], outputRange: ['0deg', '2520deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );

  const displayPetName = petName.trim() || 'your pet';

  const renderNotifications = () => (
    <View style={[{ flex: 1, backgroundColor: '#FAF5EB' }, { paddingTop: topInset + 40 }]}>
      <View style={{ flex: 1, alignItems: 'center', paddingHorizontal: 28 }}>
        <StaggerItem anim={notifAnims[0]}>
          <Image
            source={bellIcon}
            style={{ width: 80, height: 80, marginBottom: 24, alignSelf: 'center' }}
            resizeMode="contain"
          />
        </StaggerItem>

        <StaggerItem anim={notifAnims[1]}>
          <Text style={notifStyles.title}>
            Stay on top of{'\n'}{displayPetName}'s health
          </Text>
          <Text style={notifStyles.subtitle}>
            Turn on notifications so we can remind you about upcoming vet visits, medications, and annual checkups.
          </Text>
        </StaggerItem>

        <StaggerItem anim={notifAnims[2]}>
          <View style={notifStyles.previewCard}>
            <View style={notifStyles.previewHeader}>
              <View style={notifStyles.previewIconWrap}>
                <MaterialCommunityIcons name="paw" size={16} color="#FFFFFF" />
              </View>
              <Text style={notifStyles.previewAppName}>PetParent</Text>
              <Text style={notifStyles.previewTime}>now</Text>
            </View>
            <Text style={notifStyles.previewTitle}>
              {displayPetName}'s flea treatment is due
            </Text>
            <Text style={notifStyles.previewBody}>
              Nexgard was last given 30 days ago. Time to give the next dose.
            </Text>
          </View>
        </StaggerItem>
      </View>

      <StaggerItem anim={notifAnims[3]} style={{ paddingHorizontal: 28, paddingBottom: bottomInset + 20 }}>
        <Pressable
          onPress={handleAllowNotifications}
          style={notifStyles.allowBtn}
          testID="allow-notifications-btn"
        >
          <Text style={notifStyles.allowBtnText}>Allow Notifications</Text>
        </Pressable>
        <Pressable
          onPress={handleSkipNotifications}
          style={notifStyles.skipBtn}
          testID="skip-notifications-btn"
        >
          <Text style={notifStyles.skipBtnText}>Not now — I'll set reminders manually</Text>
        </Pressable>
      </StaggerItem>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'intro_welcome': return renderIntroWelcome();
      case 'intro_pack': return renderIntroPack();
      case 'intro_how': return renderIntroHow();
      case 'welcome': return renderWelcome();
      case 'signup': return renderSignup();
      case 'login': return renderLogin();
      case 'role': return renderRole();
      case 'sitter_followup': return renderSitterFollowup();
      case 'sitter_upsell': return renderSitterUpsell();
      case 'vet_clinic': return renderVetClinic();
      case 'paywall': return (
        <PaywallScreen
          onComplete={() => {
            if (sitterOnlyMode || selectedRole === 'vet') {
              animateTransition('notifications');
            } else {
              if (tier === 'free') {
                setPetCount(1);
              }
              animateTransition('petcount');
            }
          }}
          showBackButton={true}
          onBack={() => {
            if (sitterOnlyMode) {
              animateTransition('sitter_followup');
            } else if (selectedRole === 'sitter') {
              animateTransition('sitter_upsell');
            } else if (selectedRole === 'vet') {
              animateTransition('vet_clinic');
            } else {
              animateTransition('role');
            }
          }}
        />
      );
      case 'petcount': return renderPetCount();
      case 'petcreate': return renderPetCreate();
      case 'notifications': return renderNotifications();
      case 'complete': return renderComplete();
    }
  };

  return (
    <View style={styles.container}>
      {step === 'paywall' ? (
        renderStep()
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {renderStep()}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  centeredContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  formContainer: {
    paddingHorizontal: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 8,
  },
  featureList: {
    gap: 14,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: C.text,
  },

  bottomActions: {
    marginTop: 'auto',
    gap: 12,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  secondaryBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  formHeader: {
    marginBottom: 28,
  },
  stepTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: C.text,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    lineHeight: 22,
  },

  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.textSecondary,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  inputIcon: {
    paddingLeft: 14,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.text,
    paddingHorizontal: 12,
    paddingVertical: 14,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  submitBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  switchAuthText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
  },
  poweredBy: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center' as const,
    marginTop: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.dangerSoft,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.danger,
    flex: 1,
  },

  roleCards: {
    gap: 14,
    marginTop: 8,
  },
  roleCard: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  roleCardSelected: {
    borderColor: C.accent,
    backgroundColor: C.accentSoft,
  },
  roleCardLocked: {
    borderColor: C.cardBorder,
    backgroundColor: C.card,
  },
  comingSoonBadge: {
    position: 'absolute' as const,
    top: 10,
    right: 10,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  comingSoonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 0.3,
  },
  roleIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleIconWrapSelected: {
    backgroundColor: 'rgba(45, 106, 79, 0.2)',
  },
  roleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
    color: C.text,
  },
  roleTitleSelected: {
    color: C.accent,
  },
  roleDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: C.textMuted,
    marginTop: 2,
    flex: 1,
  },
  roleCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
  },

  petCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    marginTop: 48,
    marginBottom: 32,
  },
  petCountBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petCountDisplay: {
    alignItems: 'center',
  },
  petCountNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 56,
    color: C.accent,
  },
  petCountLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    color: C.textSecondary,
    marginTop: -4,
  },
  petDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  petDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },

  progressHeader: {
    marginBottom: 20,
  },
  progressLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: C.accent,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: C.card,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: C.accent,
    borderRadius: 3,
  },
  petAvatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  petAvatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: C.accentSoft,
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  petAvatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  photoHintText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.card,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  chipActive: {
    backgroundColor: C.accentSoft,
    borderColor: C.accent,
  },
  chipText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.textMuted,
  },
  chipTextActive: {
    color: C.accent,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 18,
  },
  rowFieldHalf: {
    flex: 1,
    minWidth: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  toggleBtnActive: {
    backgroundColor: C.accentSoft,
    borderColor: C.accent,
  },
  toggleText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: C.textMuted,
  },
  toggleTextActive: {
    color: C.accent,
  },

  completeCheckContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  completeCheckCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    color: C.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  completeSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: C.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  completeFeaturesWrap: {
    gap: 16,
    marginBottom: 32,
  },
  completeFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  completeFeatureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeFeatureText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: C.text,
  },
});

const introStyles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  welcomePawsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 14,
  },
  welcomeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 38,
  },
  welcomeTitleBold: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
  },
  welcomeTitleBoldAccent: {
    fontFamily: 'Inter_700Bold',
    color: '#1B2D3B',
  },
  welcomeSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 18,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(27,45,59,0.6)',
    padding: 14,
    alignItems: 'center',
    width: '80%' as any,
    position: 'relative' as const,
  },
  quoteMarkLeft: {
    position: 'absolute' as const,
    top: -6,
    left: 8,
    fontFamily: 'Inter_700Bold',
    fontSize: 38,
    color: '#1B2D3B',
    lineHeight: 38,
  },
  quoteMarkRight: {
    position: 'absolute' as const,
    bottom: 14,
    right: 8,
    fontFamily: 'Inter_700Bold',
    fontSize: 38,
    color: '#1B2D3B',
    lineHeight: 38,
  },
  testimonialTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1B2D3B',
    marginBottom: 4,
    marginTop: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 3,
    marginBottom: 6,
  },
  testimonialQuote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#E8F0E4',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 8,
  },
  testimonialAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomBtnWrap: {
    paddingHorizontal: 28,
  },
  introBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FAF5EB',
    borderRadius: 16,
    paddingVertical: 18,
  },
  introBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: C.accent,
  },
  bottomBtnWrapCream: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#FAF5EB',
  },
  introBtnGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.accent,
    borderRadius: 16,
    paddingVertical: 18,
  },
  introBtnGreenText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  packTopBanner: {
    backgroundColor: C.accent,
    borderRadius: 20,
    height: 120,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  packPawsOverlay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  packTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#1B2D3B',
    marginBottom: 6,
    lineHeight: 32,
  },
  packAnimalIcons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    marginTop: 4,
  },
  packFeaturesList: {
    gap: 24,
  },
  packFeatureItem: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  packFeatureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packFeatureTextWrap: {
    flex: 1,
    paddingTop: 2,
  },
  packFeatureTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1B2D3B',
    marginBottom: 4,
  },
  packFeatureDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7068',
    lineHeight: 21,
  },
  howTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    color: '#1B2D3B',
    marginBottom: 24,
    lineHeight: 42,
  },
  howCardsList: {
    gap: 16,
  },
  howCard: {
    backgroundColor: '#F5EDDE',
    borderRadius: 16,
    padding: 20,
  },
  howCardIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45, 106, 79, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  howCardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    color: '#1B2D3B',
    marginBottom: 0,
  },
  howCardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7068',
    lineHeight: 21,
  },
});

const notifStyles = StyleSheet.create({
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    color: '#1B2D3B',
    textAlign: 'center' as const,
    marginBottom: 12,
    lineHeight: 34,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    color: '#6B7068',
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  previewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    width: '100%' as any,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  previewHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
    gap: 8,
  },
  previewIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#2D6A4F',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  previewAppName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#1B2D3B',
    flex: 1,
  },
  previewTime: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#9CA39B',
  },
  previewTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#1B2D3B',
    marginBottom: 4,
  },
  previewBody: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    color: '#6B7068',
    lineHeight: 19,
  },
  allowBtn: {
    backgroundColor: '#2D6A4F',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  allowBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  skipBtn: {
    alignItems: 'center' as const,
    paddingVertical: 14,
  },
  skipBtnText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#9CA39B',
  },
});
