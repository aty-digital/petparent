import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform, ActivityIndicator, Share, Image, Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import SvgQRCode from 'react-native-qrcode-svg';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import { apiRequest } from '@/lib/query-client';

const C = Colors.dark;

function getAge(birthDate: string): string {
  if (!birthDate) return 'Unknown';
  const birth = new Date(birthDate);
  const now = new Date();
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  if (years > 0) {
    if (months < 0) return `${years - 1}y ${12 + months}m`;
    return `${years}y ${months >= 0 ? months : 0}m`;
  }
  return months <= 0 ? 'Newborn' : `${months}m`;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, records, tasks, updatePet, generateInviteCode, userRole } = usePets();
  const [careTips, setCareTips] = useState<string>('');
  const [loadingTips, setLoadingTips] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generatingCode, setGeneratingCode] = useState(false);

  const pickPhoto = async (useCamera: boolean) => {
    if (!activePet) return;
    let result: ImagePicker.ImagePickerResult;

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take a photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library access is required to select a photo.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
    }

    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await updatePet({ ...activePet, photoUri: result.assets[0].uri });
    }
  };

  const handlePhotoPress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pickPhoto(false);
  };

  const petRecords = records.filter(r => r.petId === activePet?.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const vaccRecords = records.filter(r => r.petId === activePet?.id && r.type === 'vaccination');
  const totalVaccinations = vaccRecords.length;
  const vaccCompliance = totalVaccinations > 0 ? Math.min(Math.round((totalVaccinations / 5) * 100), 100) : 0;

  useEffect(() => {
    if (activePet) {
      fetchCareTips();
    }
  }, [activePet?.id]);

  const fetchCareTips = async () => {
    if (!activePet) return;
    setLoadingTips(true);
    try {
      const res = await apiRequest('POST', '/api/care-tips', {
        breed: activePet.breed,
        species: activePet.species,
        age: getAge(activePet.birthDate),
      });
      const data = await res.json();
      setCareTips(data.tips || '');
    } catch (e) {
      setCareTips('Unable to load care tips at this time. Check your connection and try again.');
    } finally {
      setLoadingTips(false);
    }
  };

  const handleShare = async () => {
    if (!activePet) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const text = `${activePet.name}'s Health Profile\nBreed: ${activePet.breed}\nAge: ${getAge(activePet.birthDate)}\nWeight: ${activePet.weight} ${activePet.weightUnit}\nVaccination Records: ${totalVaccinations}\n\nShared via PetParent`;
    try {
      await Share.share({ message: text, title: `${activePet.name}'s Profile` });
    } catch (e) {}
  };

  if (!activePet) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.emptyState}>
          <Ionicons name="paw-outline" size={40} color={C.textMuted} />
          <Text style={styles.emptyTitle}>No Pet Selected</Text>
          <Text style={styles.emptyText}>Add a pet from the Home tab to view their profile.</Text>
        </View>
      </View>
    );
  }

  const petId = `#${activePet.breed.substring(0, 4).toUpperCase()}-${new Date(activePet.birthDate).getFullYear()}-${activePet.id.substring(0, 2).toUpperCase()}`;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: 12, paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Pet Profile</Text>
          <View style={styles.headerActions}>
            <Pressable onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color={C.accent} />
            </Pressable>
            <Pressable onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/edit-pet');
            }}>
              <Ionicons name="create-outline" size={22} color={C.accent} />
            </Pressable>
          </View>
        </View>

        <View style={styles.profileCard}>
          <Pressable onPress={handlePhotoPress} style={styles.avatarWrap} testID="profile-photo">
            <View pointerEvents="none">
              {activePet.photoUri ? (
                <Image source={{ uri: activePet.photoUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarLarge}>
                  <Ionicons name="paw" size={36} color={C.accent} />
                </View>
              )}
              <View style={styles.cameraOverlay}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>
          </Pressable>
          <Text style={styles.profileName}>{activePet.name}</Text>
          <Text style={styles.profileId}>ID: {petId}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>BREED</Text>
              <Text style={styles.infoPillValue} numberOfLines={1}>{activePet.breed.length > 10 ? activePet.breed.substring(0, 10) + '.' : activePet.breed}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>AGE</Text>
              <Text style={styles.infoPillValue}>{getAge(activePet.birthDate)}</Text>
            </View>
            <View style={styles.infoPill}>
              <Text style={styles.infoPillLabel}>WEIGHT</Text>
              <Text style={styles.infoPillValue}>{activePet.weight} {activePet.weightUnit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <View style={styles.healthLeft}>
              <MaterialCommunityIcons name="shield-check" size={20} color={C.accent} />
              <Text style={styles.healthTitle}>Health Status</Text>
            </View>
            <View style={styles.secureBadge}>
              <Text style={styles.secureBadgeText}>SECURE</Text>
            </View>
          </View>
          <View style={styles.vaccRow}>
            <Text style={styles.vaccLabel}>Vaccination Compliance</Text>
            <Text style={styles.vaccPercent}>{vaccCompliance}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${vaccCompliance}%` }]} />
          </View>
          {vaccRecords.length > 0 && (
            <View style={styles.vaccNote}>
              <Ionicons name="checkmark-circle" size={14} color={C.accent} />
              <Text style={styles.vaccNoteText}>
                {vaccRecords[0].title} ({vaccRecords[0].expiresDate ? `Expires ${new Date(vaccRecords[0].expiresDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'Up to date'})
              </Text>
            </View>
          )}
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <MaterialCommunityIcons name="lightbulb-on" size={20} color={C.accent} />
            <Text style={styles.tipsTitle}>AI Care Insights</Text>
          </View>
          {loadingTips ? (
            <ActivityIndicator color={C.accent} style={{ marginVertical: 16 }} />
          ) : (
            <Text style={styles.tipsText}>{careTips || 'Tap to load breed-specific care tips for your pet.'}</Text>
          )}
          {!loadingTips && !careTips && (
            <Pressable onPress={fetchCareTips} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={16} color={C.accent} />
              <Text style={styles.refreshText}>Load Tips</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          <Pressable onPress={() => router.push('/(tabs)/records')}>
            <Text style={styles.viewAll}>View All</Text>
          </Pressable>
        </View>

        {petRecords.length === 0 ? (
          <View style={styles.emptyRecords}>
            <Text style={styles.emptyRecordsText}>No records yet</Text>
          </View>
        ) : (
          petRecords.map(r => {
            const col = r.type === 'vet_visit' ? '#3FA9D6' : r.type === 'vaccination' ? C.accent : r.type === 'triage' ? '#9333EA' : '#D97706';
            return (
              <View key={r.id} style={styles.historyItem}>
                <View style={[styles.historyDot, { backgroundColor: col }]} />
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>{r.title}</Text>
                  <Text style={styles.historyDesc} numberOfLines={1}>{r.description}</Text>
                </View>
                <Text style={styles.historyDate}>{new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
            );
          })
        )}

        <View style={styles.qrSection}>
          <Text style={styles.qrTitle}>Share with Sitter</Text>
          <Text style={styles.qrDesc}>Generate an invite code to share {activePet.name}'s profile with a pet sitter. They can enter the code in their app to access the profile.</Text>

          {inviteCode ? (
            <View style={{ alignItems: 'center', marginTop: 16 }}>
              <View style={{ backgroundColor: C.accentSoft, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginBottom: 12 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 28, color: C.accent, letterSpacing: 4, textAlign: 'center' }}>{inviteCode}</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted, textAlign: 'center' }}>Code expires in 7 days</Text>
              <Pressable
                onPress={async () => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  try {
                    await Share.share({ message: `Use this code to access ${activePet.name}'s profile in PetParent: ${inviteCode}` });
                  } catch (e) {}
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.cardBorder }}
              >
                <Ionicons name="share-outline" size={16} color={C.accent} />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: C.accent }}>Share Code</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <View style={styles.qrWrapper}>
                <SvgQRCode
                  value={`petparent://pet/${activePet.id}`}
                  size={120}
                  backgroundColor={C.card}
                  color={C.accent}
                />
              </View>
              <Pressable
                onPress={async () => {
                  setGeneratingCode(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const result = await generateInviteCode();
                  if (result) {
                    setInviteCode(result.code);
                  }
                  setGeneratingCode(false);
                }}
                disabled={generatingCode}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: C.accent }}
                testID="generate-invite-code"
              >
                {generatingCode ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="key" size={16} color="#FFFFFF" />
                    <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: '#FFFFFF' }}>Generate Invite Code</Text>
                  </>
                )}
              </Pressable>
            </View>
          )}
        </View>

        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Ionicons name="share-social" size={18} color={C.background} />
          <Text style={styles.shareBtnText}>Share Profile with Sitter or Vet</Text>
        </Pressable>

        {activePet.vetName && (
          <View style={styles.vetCard}>
            <Ionicons name="call" size={18} color={C.accent} />
            <View style={styles.vetInfo}>
              <Text style={styles.vetName}>{activePet.vetName}</Text>
              {activePet.vetClinic && <Text style={styles.vetClinic}>{activePet.vetClinic}</Text>}
              {activePet.vetPhone && <Text style={styles.vetPhone}>{activePet.vetPhone}</Text>}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 24, color: C.text },
  headerActions: { flexDirection: 'row', gap: 16 },
  profileCard: { alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder },
  avatarWrap: { position: 'relative' as const, marginBottom: 12 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentSoft, borderWidth: 3, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.accent },
  cameraOverlay: { position: 'absolute' as const, bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.card },
  profileName: { fontFamily: 'Inter_700Bold', fontSize: 22, color: C.text },
  profileId: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textMuted, marginTop: 4 },
  infoRow: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
  infoPill: { flex: 1, backgroundColor: C.surfaceElevated, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', borderWidth: 1, borderColor: C.accentBorder },
  infoPillLabel: { fontFamily: 'Inter_500Medium', fontSize: 9, color: C.accent, letterSpacing: 1, marginBottom: 4 },
  infoPillValue: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  healthCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder },
  healthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  healthLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  healthTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.text },
  secureBadge: { backgroundColor: C.accentSoft, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  secureBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, color: C.accent, letterSpacing: 1 },
  vaccRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  vaccLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary },
  vaccPercent: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.accent },
  progressBar: { height: 6, backgroundColor: C.surfaceElevated, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: 3 },
  vaccNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  vaccNoteText: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  tipsCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tipsTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.text },
  tipsText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, lineHeight: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  refreshText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.accent },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  viewAll: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.accent },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: C.cardBorder },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyInfo: { flex: 1, marginLeft: 12 },
  historyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, color: C.text },
  historyDesc: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, marginTop: 1 },
  historyDate: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted },
  qrSection: { alignItems: 'center', backgroundColor: C.card, borderRadius: 14, padding: 20, marginTop: 16, borderWidth: 1, borderColor: C.cardBorder },
  qrTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.text, marginBottom: 6 },
  qrDesc: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  qrWrapper: { padding: 12, backgroundColor: C.surfaceElevated, borderRadius: 12 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, marginTop: 16 },
  shareBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.background },
  vetCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.card, borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: C.cardBorder },
  vetInfo: { flex: 1 },
  vetName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  vetClinic: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  vetPhone: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.accent, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 100, gap: 10 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.textSecondary },
  emptyText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted },
  emptyRecords: { alignItems: 'center', paddingVertical: 20 },
  emptyRecordsText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textMuted },
});
