import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput,
  Alert, KeyboardAvoidingView, Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import PaywallScreen from '@/components/PaywallScreen';

const C = Colors.dark;

export default function SitterProfileScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const {
    userName, setUserName, userEmail, userRole,
    updateEmail, updatePassword, logout, deleteAccount,
    isAlsoPetParent, setIsAlsoPetParent, activeView, setActiveView,
    sharedPets,
  } = usePets();
  const { tier, restorePurchases } = useSubscription();

  const [showPaywall, setShowPaywall] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(userName);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailValue, setEmailValue] = useState(userEmail);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveName = async () => {
    if (nameValue.trim()) {
      await setUserName(nameValue.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingName(false);
  };

  const handleSaveEmail = async () => {
    if (emailValue.trim()) {
      await updateEmail(emailValue.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Mismatch', 'New passwords do not match.');
      return;
    }
    const success = await updatePassword(currentPassword, newPassword);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Updated', 'Your password has been changed.');
      setShowPasswordChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Incorrect', 'Current password is incorrect.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'All data will be permanently removed.',
              [
                { text: 'Keep My Account', style: 'cancel' },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    router.replace('/');
                    await deleteAccount();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleBecomePetParent = () => {
    Alert.alert(
      'Become a Pet Parent',
      'This will enable Pet Parent mode so you can add and manage your own pets alongside your sitting duties.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Enable',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await setIsAlsoPetParent(true);
            await setActiveView('parent');
            Alert.alert('Welcome!', 'You\'re now also a Pet Parent. You can switch between views anytime in Settings.');
          },
        },
      ]
    );
  };

  if (showPaywall) {
    return (
      <PaywallScreen
        onComplete={() => setShowPaywall(false)}
        showBackButton={true}
        onBack={() => setShowPaywall(false)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: 12, paddingBottom: bottomInset + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.headerTitle}>Profile</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="person" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Name</Text>
                    {editingName ? (
                      <TextInput
                        style={styles.editInput}
                        value={nameValue}
                        onChangeText={setNameValue}
                        autoFocus
                        onBlur={handleSaveName}
                        onSubmitEditing={handleSaveName}
                        returnKeyType="done"
                      />
                    ) : (
                      <Text style={styles.rowValue}>{userName}</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (editingName) handleSaveName();
                    else { setNameValue(userName); setEditingName(true); }
                  }}
                  hitSlop={8}
                >
                  <Ionicons name={editingName ? 'checkmark' : 'create-outline'} size={20} color={C.accent} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="mail" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Email</Text>
                    {editingEmail ? (
                      <TextInput
                        style={styles.editInput}
                        value={emailValue}
                        onChangeText={setEmailValue}
                        autoFocus
                        onBlur={handleSaveEmail}
                        onSubmitEditing={handleSaveEmail}
                        returnKeyType="done"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    ) : (
                      <Text style={styles.rowValue}>{userEmail || 'Not set'}</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (editingEmail) handleSaveEmail();
                    else { setEmailValue(userEmail); setEditingEmail(true); }
                  }}
                  hitSlop={8}
                >
                  <Ionicons name={editingEmail ? 'checkmark' : 'create-outline'} size={20} color={C.accent} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="paw" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Role</Text>
                    <Text style={styles.rowValue}>Pet Sitter</Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="dog" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Pets in Care</Text>
                    <Text style={styles.rowValue}>{sharedPets.length} shared</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {isAlsoPetParent && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACTIVE VIEW</Text>
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 8, padding: 4 }}>
                  <Pressable
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, paddingVertical: 12, borderRadius: 10,
                      backgroundColor: activeView === 'sitter' ? C.accentSoft : 'transparent',
                    }}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await setActiveView('sitter');
                    }}
                    testID="sitter-profile-switch-sitter"
                  >
                    <MaterialCommunityIcons name="paw" size={18} color={activeView === 'sitter' ? C.accent : C.textMuted} />
                    <Text style={{
                      fontFamily: activeView === 'sitter' ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      fontSize: 14, color: activeView === 'sitter' ? C.accent : C.textMuted,
                    }}>Pet Sitter</Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                      gap: 8, paddingVertical: 12, borderRadius: 10,
                      backgroundColor: activeView === 'parent' ? C.accentSoft : 'transparent',
                    }}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await setActiveView('parent');
                    }}
                    testID="sitter-profile-switch-parent"
                  >
                    <Ionicons name="heart-circle" size={18} color={activeView === 'parent' ? C.accent : C.textMuted} />
                    <Text style={{
                      fontFamily: activeView === 'parent' ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      fontSize: 14, color: activeView === 'parent' ? C.accent : C.textMuted,
                    }}>Pet Parent</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
            <View style={styles.card}>
              <Pressable style={styles.row} onPress={() => setShowPaywall(true)}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="diamond" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Current Plan</Text>
                    <Text style={styles.rowValue}>{tier === 'premium' ? 'Premium' : 'Free'}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: C.accent }}>
                    {tier === 'premium' ? 'Manage' : 'Upgrade'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={C.accent} />
                </View>
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.row} onPress={restorePurchases}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="refresh" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Restore Purchases</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {!isAlsoPetParent && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>PET PARENT</Text>
              <View style={styles.card}>
                <Pressable style={styles.row} onPress={handleBecomePetParent}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: '#FDE8C8' }]}>
                      <Ionicons name="heart-circle" size={18} color="#D97706" />
                    </View>
                    <View style={styles.rowContent}>
                      <Text style={styles.rowLabel}>Got a pet of your own?</Text>
                      <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted }}>
                        Enable Pet Parent mode to track your own pets
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={C.accent} />
                </Pressable>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SECURITY</Text>
            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => setShowPasswordChange(!showPasswordChange)}
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Change Password</Text>
                  </View>
                </View>
                <Ionicons name={showPasswordChange ? 'chevron-up' : 'chevron-forward'} size={18} color={C.textMuted} />
              </Pressable>

              {showPasswordChange && (
                <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Current password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                  />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <Pressable style={styles.changePasswordBtn} onPress={handleChangePassword}>
                    <Text style={styles.changePasswordText}>Update Password</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>LEGAL</Text>
            <View style={styles.card}>
              <Pressable style={styles.row} onPress={() => router.push('/privacy-policy')}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="shield-checkmark" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Privacy Policy</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable style={styles.row} onPress={() => router.push('/terms-of-service')}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="document-text" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Terms of Service</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={[styles.section, { marginTop: 8 }]}>
            <Pressable style={styles.dangerRow} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#D64545" />
              <Text style={styles.dangerText}>Log Out</Text>
            </Pressable>
            <Pressable style={[styles.dangerRow, { marginTop: 8 }]} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color="#D64545" />
              <Text style={styles.dangerText}>Delete Account</Text>
            </Pressable>
          </View>

          <Text style={styles.versionText}>PetParent v1.0.0{'\n'}Powered by ATY Digital</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text, marginBottom: 16 },
  section: { marginBottom: 20 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, color: C.textMuted, letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.cardBorder, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowContent: { flex: 1 },
  rowLabel: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.text },
  rowValue: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, marginTop: 1 },
  editInput: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, borderBottomWidth: 1, borderBottomColor: C.accent, paddingVertical: 4, marginTop: 2, minWidth: 120 },
  divider: { height: 1, backgroundColor: C.cardBorder, marginHorizontal: 14 },
  passwordInput: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, backgroundColor: C.surfaceElevated, borderRadius: 10, padding: 12, marginTop: 8 },
  changePasswordBtn: { backgroundColor: C.accent, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 12 },
  changePasswordText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#D6454512', padding: 14, borderRadius: 12 },
  dangerText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: '#D64545' },
  versionText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 20, lineHeight: 18 },
});
