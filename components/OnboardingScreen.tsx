import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView,
  KeyboardAvoidingView, Animated, Dimensions, ActivityIndicator, Alert, Image,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Colors from '@/constants/colors';
import BrandLogo, { PawImage } from '@/components/BrandLogo';
import { usePets, generateId, type UserRole } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import PaywallScreen from '@/components/PaywallScreen';
import type { Pet } from '@/lib/types';

const C = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'intro_welcome' | 'intro_pack' | 'intro_how' | 'welcome' | 'signup' | 'login' | 'role' | 'paywall' | 'petcount' | 'petcreate' | 'complete';

const testimonialAvatar = require('@/assets/images/testimonial-avatar.png');

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

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { signup, login, setUserRole, addPet, completeOnboarding } = usePets();
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

  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    if (step === 'complete') {
      Animated.spring(checkScale, { toValue: 1, friction: 3, tension: 80, useNativeDriver: true }).start();
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
    setTimeout(() => animateTransition('paywall'), 300);
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
      birthDate: new Date().toISOString().split('T')[0],
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
      animateTransition('complete');
    }
    setLoading(false);
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
        <View style={[introStyles.welcomeContainer, { paddingTop: topInset + 40 }]}>
          <View style={introStyles.welcomePawsRow}>
            <PawImage size={80} />
            <PawImage size={60} />
          </View>

          <Text style={introStyles.welcomeTitle}>
            Welcome to{'\n'}
            <Text style={introStyles.welcomeTitleBold}>Pet</Text>
            <Text style={introStyles.welcomeTitleBoldAccent}>Parent!</Text>
          </Text>
          <Text style={introStyles.welcomeSubtext}>
            You just made the best decision{'\n'}for your furry family. Let's get your{'\n'}pack set up.
          </Text>

          <View style={introStyles.testimonialCard}>
            <Text style={introStyles.quoteMarkLeft}>{'\u201D'}</Text>
            <Text style={introStyles.testimonialTitle}>Perfect</Text>
            <View style={introStyles.starsRow}>
              {[1,2,3,4,5].map(i => (
                <Ionicons key={i} name="star" size={28} color="#F4C542" />
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
        </View>

        <View style={[introStyles.bottomBtnWrap, { paddingBottom: bottomInset + 20 }]}>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animateTransition('intro_pack'); }}
            style={introStyles.introBtn}
            testID="intro-welcome-next"
          >
            <Text style={introStyles.introBtnText}>Let's Go</Text>
            <Ionicons name="arrow-forward" size={22} color={C.accent} />
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );

  const renderIntroPack = () => (
    <View style={[{ flex: 1, backgroundColor: '#FAF5EB' }, { paddingTop: topInset + 30 }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={introStyles.packTopBanner}>
          <View style={introStyles.packPawsOverlay}>
            <PawImage size={50} />
            <PawImage size={40} />
          </View>
        </View>

        <Text style={introStyles.packTitle}>
          Keep track of your{'\n'}
          <Text style={{ color: C.accent }}>entire pack</Text>
          {'  '}
        </Text>
        <View style={introStyles.packAnimalIcons}>
          <MaterialCommunityIcons name="dog" size={32} color="#C8A26A" />
          <MaterialCommunityIcons name="cat" size={32} color="#8E8E8E" />
          <MaterialCommunityIcons name="rabbit" size={32} color="#C8956A" />
        </View>

        <View style={introStyles.packFeaturesList}>
          <View style={introStyles.packFeatureItem}>
            <View style={[introStyles.packFeatureIcon, { backgroundColor: '#D6EBF2' }]}>
              <MaterialCommunityIcons name="hospital-building" size={26} color="#4A90A4" />
            </View>
            <View style={introStyles.packFeatureTextWrap}>
              <Text style={introStyles.packFeatureTitle}>Never miss a vet visit</Text>
              <Text style={introStyles.packFeatureDesc}>
                Log appointments, vaccines, & medications for every pet {'\u2013'} all in one place.
              </Text>
            </View>
          </View>

          <View style={introStyles.packFeatureItem}>
            <View style={[introStyles.packFeatureIcon, { backgroundColor: '#F8D9D9' }]}>
              <Ionicons name="warning" size={24} color="#D64545" />
            </View>
            <View style={introStyles.packFeatureTextWrap}>
              <Text style={introStyles.packFeatureTitle}>Know when it's urgent</Text>
              <Text style={introStyles.packFeatureDesc}>
                Describe your pet's symptoms, and let AI tell you if it's urgent vs. wait-and-see in seconds.
              </Text>
            </View>
          </View>

          <View style={introStyles.packFeatureItem}>
            <View style={[introStyles.packFeatureIcon, { backgroundColor: '#F8D9D9' }]}>
              <Ionicons name="heart" size={24} color="#D64545" />
            </View>
            <View style={introStyles.packFeatureTextWrap}>
              <Text style={introStyles.packFeatureTitle}>Care tailored to your breed</Text>
              <Text style={introStyles.packFeatureDesc}>
                Get breed-specific tips, feeding guides, and care reminders personalized to your pets.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[introStyles.bottomBtnWrapCream, { paddingBottom: bottomInset + 20 }]}>
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
    <View style={[{ flex: 1, backgroundColor: '#FAF5EB' }, { paddingTop: topInset + 30 }]}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Text style={introStyles.howTitle}>
          Here's how{'\n'}
          <Text style={{ color: C.accent }}>PetParent</Text> works
        </Text>

        <View style={introStyles.howCardsList}>
          <View style={introStyles.howCard}>
            <View style={introStyles.howCardIconWrap}>
              <Ionicons name="chatbubble-ellipses" size={22} color={C.accent} />
            </View>
            <Text style={introStyles.howCardTitle}>AI Symptom Triage</Text>
            <Text style={introStyles.howCardDesc}>
              Describe what you're seeing in your pet. Get an urgent/not-urgent verdict with a clear reason why {'\u2013'} in under 30 seconds.
            </Text>
          </View>

          <View style={introStyles.howCard}>
            <View style={introStyles.howCardIconWrap}>
              <MaterialCommunityIcons name="clipboard-text" size={22} color={C.accent} />
            </View>
            <Text style={introStyles.howCardTitle}>Daily Logs and Health Records</Text>
            <Text style={introStyles.howCardDesc}>
              Keep daily logs of your pet's behavior, vet visits, and vaccines. Track and manage medications for your entire pack {'\u2013'} all in one shareable place.
            </Text>
          </View>

          <View style={introStyles.howCard}>
            <View style={introStyles.howCardIconWrap}>
              <Ionicons name="notifications" size={22} color="#1B2D3B" />
            </View>
            <Text style={introStyles.howCardTitle}>Smart Reminders</Text>
            <Text style={introStyles.howCardDesc}>
              Never forget flea treatments, annual checkups, or medications again.
            </Text>
          </View>

          <View style={introStyles.howCard}>
            <View style={introStyles.howCardIconWrap}>
              <MaterialCommunityIcons name="paw" size={22} color={C.accent} />
            </View>
            <Text style={introStyles.howCardTitle}>Shareable Pet Profiles</Text>
            <Text style={introStyles.howCardDesc}>
              Your furry family is your top priority. Share your pet's health habits, and medication schedule, directly with your vet, pet sitter and family members.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[introStyles.bottomBtnWrapCream, { paddingBottom: bottomInset + 20 }]}>
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animateTransition('welcome'); }}
          style={introStyles.introBtnGreen}
          testID="intro-how-next"
        >
          <Text style={introStyles.introBtnGreenText}>Create My Profile</Text>
        </Pressable>
      </View>
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
        <Pressable onPress={() => animateTransition('welcome')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>

        <View style={styles.formHeader}>
          <Text style={styles.stepTitle}>Create Account</Text>
          <Text style={styles.stepSubtitle}>Join PetParent to start tracking your pet's health</Text>
        </View>

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

        {signupError ? (
          <View style={{ backgroundColor: C.dangerSoft, borderRadius: 10, padding: 12, marginBottom: 12, flexDirection: 'row' as const, alignItems: 'center', gap: 8 }}>
            <Ionicons name="alert-circle" size={18} color={C.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.danger }}>{signupError}</Text>
            </View>
          </View>
        ) : null}

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

        <Pressable onPress={() => { setSignupError(''); animateTransition('login'); }} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={styles.switchAuthText}>Already have an account? <Text style={{ color: C.accent }}>Log In</Text></Text>
        </Pressable>

        <Text style={styles.poweredBy}>Powered by ATY Digital</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderLogin = () => (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.formContainer, { paddingTop: topInset + 20, paddingBottom: bottomInset + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Pressable onPress={() => animateTransition('welcome')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </Pressable>

        <View style={styles.formHeader}>
          <Text style={styles.stepTitle}>Welcome Back</Text>
          <Text style={styles.stepSubtitle}>Log in to continue managing your pets</Text>
        </View>

        {loginError ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle" size={18} color={C.danger} />
            <Text style={styles.errorText}>{loginError}</Text>
          </View>
        ) : null}

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

        <Pressable onPress={() => animateTransition('signup')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={styles.switchAuthText}>New here? <Text style={{ color: C.accent }}>Create Account</Text></Text>
        </Pressable>

        <Text style={styles.poweredBy}>Powered by ATY Digital</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRole = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 20 }]}>
      <View style={styles.formHeader}>
        <Text style={styles.stepTitle}>How will you use PetParent?</Text>
        <Text style={styles.stepSubtitle}>Select your role to personalize your experience</Text>
      </View>

      <View style={styles.roleCards}>
        {ROLE_OPTIONS.map((role) => {
          const isSelected = selectedRole === role.key;
          return (
            <Pressable
              key={role.key}
              style={[styles.roleCard, isSelected && styles.roleCardSelected]}
              onPress={() => handleRoleSelect(role.key)}
              testID={`role-${role.key}`}
            >
              <View style={[styles.roleIconWrap, isSelected && styles.roleIconWrapSelected]}>
                {role.iconSet === 'ion' ? (
                  <Ionicons name={role.iconName as any} size={28} color={isSelected ? C.accent : C.textMuted} />
                ) : (
                  <MaterialCommunityIcons name={role.iconName as any} size={28} color={isSelected ? C.accent : C.textMuted} />
                )}
              </View>
              <Text style={[styles.roleTitle, isSelected && styles.roleTitleSelected]}>{role.title}</Text>
              <Text style={styles.roleDesc}>{role.desc}</Text>
              {isSelected && (
                <View style={styles.roleCheck}>
                  <Ionicons name="checkmark-circle" size={22} color={C.accent} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  const renderPetCount = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 40 }]}>
      <View style={styles.formHeader}>
        <Text style={styles.stepTitle}>How many pets are you adding?</Text>
        <Text style={styles.stepSubtitle}>You can always add more later</Text>
      </View>

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
        <View style={{ backgroundColor: C.warningSoft, borderRadius: 10, padding: 12, marginTop: 8, marginHorizontal: 4 }}>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.warning, textAlign: 'center', lineHeight: 18 }}>
            Free plan allows 1 pet profile. Upgrade to Premium for unlimited pets.
          </Text>
        </View>
      )}

      <View style={styles.petDotsRow}>
        {Array.from({ length: petCount }).map((_, i) => (
          <View key={`dot-${i}`} style={styles.petDot}>
            <Ionicons name="paw" size={16} color={C.accent} />
          </View>
        ))}
      </View>

      <View style={[styles.bottomActions, { paddingBottom: bottomInset + 16 }]}>
        <Pressable onPress={handlePetCountNext} testID="petcount-next">
          <LinearGradient colors={[C.accent, C.accentDim]} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderPetCreate = () => {
    const petValid = petName.trim() && petBreed.trim() && petWeight.trim();
    const progress = (currentPetIndex + 1) / petCount;

    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[styles.formContainer, { paddingTop: topInset + 16, paddingBottom: bottomInset + 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  const renderComplete = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 60 }]}>
      <Animated.View style={[styles.completeCheckContainer, { transform: [{ scale: checkScale }] }]}>
        <PawImage size={240} />
      </Animated.View>

      <Text style={styles.completeTitle}>You're All Set!</Text>
      <Text style={styles.completeSubtitle}>
        {petCount === 1
          ? 'Your pet profile is ready. Start tracking their health today.'
          : `${petCount} pet profiles created. Start tracking their health today.`}
      </Text>

      <View style={styles.completeFeaturesWrap}>
        {[
          { icon: 'pulse', label: 'Log daily wellness' },
          { icon: 'medical', label: 'Track medical records' },
          { icon: 'chatbubble-ellipses', label: 'AI symptom check' },
        ].map((f, i) => (
          <View key={i} style={styles.completeFeatureRow}>
            <View style={styles.completeFeatureIcon}>
              <Ionicons name={f.icon as any} size={18} color={C.accent} />
            </View>
            <Text style={styles.completeFeatureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.bottomActions, { paddingBottom: bottomInset + 16 }]}>
        <Pressable onPress={handleComplete} testID="complete-btn">
          <LinearGradient colors={[C.accent, C.accentDim]} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Start Using PetParent</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </Pressable>
      </View>
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
      case 'paywall': return (
        <PaywallScreen
          onComplete={() => {
            if (tier === 'free') {
              setPetCount(1);
            }
            animateTransition('petcount');
          }}
          showBackButton={true}
          onBack={() => animateTransition('role')}
        />
      );
      case 'petcount': return renderPetCount();
      case 'petcreate': return renderPetCreate();
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
    marginBottom: 24,
  },
  welcomeTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 42,
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
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  testimonialCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(27,45,59,0.6)',
    padding: 20,
    alignItems: 'center',
    width: '85%' as any,
    position: 'relative' as const,
  },
  quoteMarkLeft: {
    position: 'absolute' as const,
    top: -8,
    left: 10,
    fontFamily: 'Inter_700Bold',
    fontSize: 50,
    color: '#1B2D3B',
    lineHeight: 50,
  },
  quoteMarkRight: {
    position: 'absolute' as const,
    bottom: 20,
    right: 10,
    fontFamily: 'Inter_700Bold',
    fontSize: 50,
    color: '#1B2D3B',
    lineHeight: 50,
  },
  testimonialTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#1B2D3B',
    marginBottom: 6,
    marginTop: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 10,
  },
  testimonialQuote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#E8F0E4',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },
  testimonialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 3,
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
    fontSize: 30,
    color: '#1B2D3B',
    marginBottom: 6,
    lineHeight: 38,
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
    marginBottom: 6,
  },
  howCardDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: '#6B7068',
    lineHeight: 21,
  },
});
