import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView,
  KeyboardAvoidingView, Animated, Dimensions, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets, generateId, type UserRole } from '@/lib/pet-context';
import type { Pet } from '@/lib/types';

const C = Colors.dark;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Step = 'welcome' | 'signup' | 'login' | 'role' | 'petcount' | 'petcreate' | 'complete';

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

  const [step, setStep] = useState<Step>('welcome');

  const [signName, setSignName] = useState('');
  const [signEmail, setSignEmail] = useState('');
  const [signPassword, setSignPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

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

  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step === 'welcome') {
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
    try {
      await signup(signName.trim(), signEmail.trim(), signPassword);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      animateTransition('role');
    } catch (e) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
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
    setTimeout(() => animateTransition('petcount'), 300);
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

  const renderWelcome = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 40 }]}>
      <Animated.View style={[styles.logoContainer, { transform: [{ scale: Animated.multiply(logoScale, pulseAnim) }], opacity: logoOpacity }]}>
        <LinearGradient colors={['rgba(0,230,118,0.2)', 'rgba(0,230,118,0.05)']} style={styles.logoGlow}>
          <View style={styles.logoInner}>
            <Ionicons name="paw" size={48} color={C.accent} />
          </View>
        </LinearGradient>
      </Animated.View>

      <Text style={styles.brandTitle}>PawGuard</Text>
      <Text style={styles.brandSubtitle}>Your pet's health companion</Text>

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
            <Ionicons name="arrow-forward" size={20} color={C.background} />
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
          <Text style={styles.stepSubtitle}>Join PawGuard to start tracking your pet's health</Text>
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

        <Pressable onPress={handleSignup} disabled={loading || !signName.trim() || !signEmail.trim() || !signPassword.trim()} testID="signup-submit">
          <LinearGradient
            colors={(signName.trim() && signEmail.trim() && signPassword.trim()) ? [C.accent, C.accentDim] : [C.surfaceElevated, C.surfaceElevated]}
            style={styles.submitBtn}
          >
            {loading ? <ActivityIndicator color={C.background} /> : (
              <>
                <Text style={[styles.submitBtnText, !(signName.trim() && signEmail.trim() && signPassword.trim()) && { color: C.textMuted }]}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color={(signName.trim() && signEmail.trim() && signPassword.trim()) ? C.background : C.textMuted} />
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => animateTransition('login')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={styles.switchAuthText}>Already have an account? <Text style={{ color: C.accent }}>Log In</Text></Text>
        </Pressable>
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
            {loading ? <ActivityIndicator color={C.background} /> : (
              <>
                <Text style={[styles.submitBtnText, !(loginEmail.trim() && loginPassword.trim()) && { color: C.textMuted }]}>Log In</Text>
                <Ionicons name="arrow-forward" size={18} color={(loginEmail.trim() && loginPassword.trim()) ? C.background : C.textMuted} />
              </>
            )}
          </LinearGradient>
        </Pressable>

        <Pressable onPress={() => animateTransition('signup')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={styles.switchAuthText}>New here? <Text style={{ color: C.accent }}>Create Account</Text></Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderRole = () => (
    <View style={[styles.centeredContainer, { paddingTop: topInset + 20 }]}>
      <View style={styles.formHeader}>
        <Text style={styles.stepTitle}>How will you use PawGuard?</Text>
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
          onPress={() => { if (petCount < 10) { setPetCount(prev => prev + 1); Haptics.selectionAsync(); } }}
          disabled={petCount >= 10}
        >
          <Ionicons name="add" size={28} color={petCount >= 10 ? C.textMuted : C.accent} />
        </Pressable>
      </View>

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
            <Ionicons name="arrow-forward" size={20} color={C.background} />
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

          <View style={styles.petAvatarSection}>
            <View style={styles.petAvatarCircle}>
              <Ionicons name="paw" size={28} color={C.accent} />
            </View>
          </View>

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
            <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
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
            <View style={{ flex: 1 }}>
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
              {loading ? <ActivityIndicator color={C.background} /> : (
                <>
                  <Text style={[styles.submitBtnText, !petValid && { color: C.textMuted }]}>
                    {currentPetIndex < petCount - 1 ? 'Save & Next' : 'Save & Finish'}
                  </Text>
                  <Ionicons name="arrow-forward" size={18} color={petValid ? C.background : C.textMuted} />
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
        <LinearGradient colors={[C.accent, C.accentDim]} style={styles.completeCheckCircle}>
          <Ionicons name="checkmark" size={48} color={C.background} />
        </LinearGradient>
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
            <Text style={styles.primaryBtnText}>Start Using PawGuard</Text>
            <Ionicons name="arrow-forward" size={20} color={C.background} />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );

  const renderStep = () => {
    switch (step) {
      case 'welcome': return renderWelcome();
      case 'signup': return renderSignup();
      case 'login': return renderLogin();
      case 'role': return renderRole();
      case 'petcount': return renderPetCount();
      case 'petcreate': return renderPetCreate();
      case 'complete': return renderComplete();
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {renderStep()}
      </Animated.View>
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
    marginTop: 40,
    marginBottom: 24,
  },
  logoGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.accentSoft,
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    color: C.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  brandSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 16,
    color: C.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
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
    color: C.background,
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
    color: C.background,
  },
  switchAuthText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.textSecondary,
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
    backgroundColor: 'rgba(0,230,118,0.2)',
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.accentSoft,
    borderWidth: 2,
    borderColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
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
