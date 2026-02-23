import React, { useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, TextInput,
  Alert, KeyboardAvoidingView, Linking,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import { useSubscription } from '@/lib/subscription-context';
import PaywallScreen from '@/components/PaywallScreen';

const C = Colors.dark;

const ROLE_LABELS: Record<string, string> = {
  pet_parent: 'Pet Parent',
  sitter: 'Pet Sitter',
  vet: 'Veterinarian',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const {
    userName, setUserName, userEmail, userRole,
    updateEmail, updatePassword, logout, deleteAccount, pets,
    isAlsoPetParent, activeView, setActiveView,
  } = usePets();
  const { tier, triageUsedThisMonth, maxFreeTriagePerMonth, restorePurchases } = useSubscription();

  const [showPaywall, setShowPaywall] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [editingEmail, setEditingEmail] = useState(false);
  const [nameValue, setNameValue] = useState(userName);
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
      'Are you sure you want to log out? Your data will be kept on this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            if (router.canGoBack()) router.back();
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data, including all pet profiles, medical records, wellness logs, and health tasks. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              `You have ${pets.length} pet${pets.length !== 1 ? 's' : ''} and all their data will be permanently removed.`,
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
          contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: bottomInset + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              hitSlop={12}
              testID="settings-back"
            >
              <Ionicons name="chevron-back" size={26} color={C.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={{ width: 26 }} />
          </View>

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
                        testID="settings-name-input"
                      />
                    ) : (
                      <Text style={styles.rowValue}>{userName}</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (editingName) {
                      handleSaveName();
                    } else {
                      setNameValue(userName);
                      setEditingName(true);
                    }
                  }}
                  hitSlop={8}
                  testID="settings-edit-name"
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
                        testID="settings-email-input"
                      />
                    ) : (
                      <Text style={styles.rowValue}>{userEmail || 'Not set'}</Text>
                    )}
                  </View>
                </View>
                <Pressable
                  onPress={() => {
                    if (editingEmail) {
                      handleSaveEmail();
                    } else {
                      setEmailValue(userEmail);
                      setEditingEmail(true);
                    }
                  }}
                  hitSlop={8}
                  testID="settings-edit-email"
                >
                  <Ionicons name={editingEmail ? 'checkmark' : 'create-outline'} size={20} color={C.accent} />
                </Pressable>
              </View>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <MaterialCommunityIcons name="account-group" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Role</Text>
                    <Text style={styles.rowValue}>{userRole ? ROLE_LABELS[userRole] || userRole : 'Not set'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {userRole === 'sitter' && isAlsoPetParent && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>ACTIVE VIEW</Text>
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', gap: 8, padding: 4 }}>
                  <Pressable
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 12,
                      borderRadius: 10,
                      backgroundColor: activeView === 'sitter' ? C.accentSoft : 'transparent',
                    }}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await setActiveView('sitter');
                    }}
                    testID="switch-sitter-view"
                  >
                    <MaterialCommunityIcons name="paw" size={18} color={activeView === 'sitter' ? C.accent : C.textMuted} />
                    <Text style={{
                      fontFamily: activeView === 'sitter' ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      fontSize: 14,
                      color: activeView === 'sitter' ? C.accent : C.textMuted,
                    }}>
                      Pet Sitter
                    </Text>
                  </Pressable>
                  <Pressable
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      paddingVertical: 12,
                      borderRadius: 10,
                      backgroundColor: activeView === 'parent' ? C.accentSoft : 'transparent',
                    }}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      await setActiveView('parent');
                    }}
                    testID="switch-parent-view"
                  >
                    <Ionicons name="heart-circle" size={18} color={activeView === 'parent' ? C.accent : C.textMuted} />
                    <Text style={{
                      fontFamily: activeView === 'parent' ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      fontSize: 14,
                      color: activeView === 'parent' ? C.accent : C.textMuted,
                    }}>
                      Pet Parent
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, tier === 'premium' && { backgroundColor: 'rgba(224, 159, 62, 0.12)' }]}>
                    <Ionicons name={tier === 'premium' ? 'shield-checkmark' : 'shield-outline'} size={18} color={tier === 'premium' ? C.warning : C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Current Plan</Text>
                    <Text style={[styles.rowValue, tier === 'premium' && { color: C.warning }]}>
                      {tier === 'premium' ? 'Premium' : 'Free'}
                    </Text>
                  </View>
                </View>
                {tier === 'free' && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowPaywall(true);
                    }}
                    style={{
                      backgroundColor: C.accent,
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                    }}
                    testID="settings-upgrade"
                  >
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' }}>Upgrade</Text>
                  </Pressable>
                )}
              </View>

              {tier === 'free' && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="paw" size={18} color={C.accent} />
                      </View>
                      <View style={styles.rowContent}>
                        <Text style={styles.rowLabel}>Pet Profiles</Text>
                        <Text style={styles.rowValue}>{pets.length} / 1</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.row}>
                    <View style={styles.rowLeft}>
                      <View style={styles.iconCircle}>
                        <MaterialCommunityIcons name="stethoscope" size={18} color={C.accent} />
                      </View>
                      <View style={styles.rowContent}>
                        <Text style={styles.rowLabel}>AI Triage Sessions (this month)</Text>
                        <Text style={styles.rowValue}>{triageUsedThisMonth} / {maxFreeTriagePerMonth}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.divider} />
              <Pressable
                style={styles.row}
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const success = await restorePurchases();
                  if (success) {
                    Alert.alert('Restored', 'Your premium subscription has been restored.');
                  } else {
                    Alert.alert('No Subscription Found', 'We could not find an active subscription to restore.');
                  }
                }}
                testID="settings-restore"
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="refresh" size={18} color={C.accent} />
                  </View>
                  <Text style={styles.rowActionText}>Restore Purchases</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SECURITY</Text>
            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowPasswordChange(!showPasswordChange);
                }}
                testID="settings-change-password"
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="lock-closed" size={18} color={C.accent} />
                  </View>
                  <Text style={styles.rowActionText}>Change Password</Text>
                </View>
                <Ionicons name={showPasswordChange ? 'chevron-up' : 'chevron-forward'} size={18} color={C.textMuted} />
              </Pressable>

              {showPasswordChange && (
                <View style={styles.passwordSection}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Current password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    testID="settings-current-password"
                  />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="New password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    testID="settings-new-password"
                  />
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={C.textMuted}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    testID="settings-confirm-password"
                  />
                  <Pressable style={styles.passwordSaveBtn} onPress={handleChangePassword} testID="settings-save-password">
                    <Text style={styles.passwordSaveBtnText}>Update Password</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ABOUT</Text>
            <View style={styles.card}>
              <Pressable
                style={styles.row}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/privacy-policy');
                }}
                testID="settings-privacy"
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="shield-checkmark" size={18} color={C.accent} />
                  </View>
                  <Text style={styles.rowActionText}>Privacy Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.row}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push('/terms-of-service');
                }}
                testID="settings-terms"
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="document-text" size={18} color={C.accent} />
                  </View>
                  <Text style={styles.rowActionText}>Terms of Service</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <Pressable
                style={styles.row}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  Linking.openURL('mailto:hello@atydigital.com?subject=PetParent%20Support%20Request');
                }}
                testID="settings-support"
              >
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="help-circle" size={18} color={C.accent} />
                  </View>
                  <Text style={styles.rowActionText}>Support & Feedback</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
              </Pressable>

              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="information-circle" size={18} color={C.accent} />
                  </View>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowLabel}>Version</Text>
                    <Text style={styles.rowValue}>1.0.0</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <Pressable style={styles.logoutBtn} onPress={handleLogout} testID="settings-logout">
            <Feather name="log-out" size={18} color={C.accent} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </Pressable>

          <Pressable style={styles.deleteBtn} onPress={handleDeleteAccount} testID="settings-delete-account">
            <Ionicons name="trash" size={18} color={C.danger} />
            <Text style={styles.deleteBtnText}>Delete Account</Text>
          </Pressable>

          <Text style={styles.deleteNote}>
            Deleting your account will permanently remove all your data including pet profiles, medical records, wellness logs, and health tasks.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  headerTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    color: C.text,
  },
  section: { marginBottom: 24 },
  sectionLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: C.textMuted,
    letterSpacing: 1.2,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.cardBorder,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1 },
  rowLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: C.textMuted,
    marginBottom: 2,
  },
  rowValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: C.text,
  },
  rowActionText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: C.text,
  },
  editInput: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: C.text,
    borderBottomWidth: 1.5,
    borderBottomColor: C.accent,
    paddingVertical: 2,
    paddingHorizontal: 0,
    minWidth: 120,
  },
  divider: {
    height: 1,
    backgroundColor: C.cardBorder,
    marginLeft: 64,
  },
  passwordSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  passwordInput: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    color: C.text,
    backgroundColor: C.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  passwordSaveBtn: {
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  passwordSaveBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.card,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: C.cardBorder,
    marginBottom: 12,
  },
  logoutBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: C.accent,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.dangerSoft,
    borderRadius: 14,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(214, 69, 69, 0.15)',
    marginBottom: 8,
  },
  deleteBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: C.danger,
  },
  deleteNote: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
