import React, { useState, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, Pressable, Platform, ScrollView, KeyboardAvoidingView, Alert, Image, ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';
import type { Pet } from '@/lib/types';

const C = Colors.dark;

export default function EditPetScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { activePet, updatePet, deletePet, pets, setActivePetId } = usePets();

  const [name, setName] = useState('');
  const [breed, setBreed] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [birthDate, setBirthDate] = useState('');
  const [color, setColor] = useState('');
  const [vetName, setVetName] = useState('');
  const [vetPhone, setVetPhone] = useState('');
  const [vetClinic, setVetClinic] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [userName, setUserNameLocal] = useState('');
  const { userName: savedUserName, setUserName } = usePets();

  useEffect(() => {
    if (activePet) {
      setName(activePet.name);
      setBreed(activePet.breed);
      setWeight(String(activePet.weight));
      setWeightUnit(activePet.weightUnit);
      setBirthDate(activePet.birthDate);
      setColor(activePet.color);
      setVetName(activePet.vetName || '');
      setVetPhone(activePet.vetPhone || '');
      setVetClinic(activePet.vetClinic || '');
      setPhotoUri(activePet.photoUri);
    }
    setUserNameLocal(savedUserName);
  }, [activePet, savedUserName]);

  const pickPhoto = async (useCamera: boolean) => {
    let result: ImagePicker.ImagePickerResult;
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera access is required to take a photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Photo library access is required.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    }
    if (!result.canceled && result.assets[0]) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePhotoPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (index) => { if (index === 1) pickPhoto(true); if (index === 2) pickPhoto(false); }
      );
    } else {
      Alert.alert('Update Photo', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => pickPhoto(true) },
        { text: 'Choose from Library', onPress: () => pickPhoto(false) },
      ]);
    }
  };

  const handleSave = async () => {
    if (!activePet || !name.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await updatePet({
      ...activePet,
      name: name.trim(),
      breed: breed.trim(),
      weight: parseFloat(weight) || 0,
      weightUnit,
      birthDate,
      color: color.trim(),
      vetName: vetName.trim() || undefined,
      vetPhone: vetPhone.trim() || undefined,
      vetClinic: vetClinic.trim() || undefined,
      photoUri,
    });

    if (userName.trim() !== savedUserName) {
      await setUserName(userName.trim());
    }

    router.back();
  };

  const handleDelete = () => {
    if (!activePet) return;
    const doDelete = async () => {
      await deletePet(activePet.id);
      router.back();
    };

    if (Platform.OS === 'web') {
      if (confirm(`Delete ${activePet.name}? This cannot be undone.`)) doDelete();
    } else {
      Alert.alert('Delete Pet', `Are you sure you want to delete ${activePet.name}? This cannot be undone.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (!activePet) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <Text style={styles.emptyText}>No pet selected</Text>
      </View>
    );
  }

  const otherPets = pets.filter(p => p.id !== activePet.id);

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: topInset + 12, paddingBottom: Platform.OS === 'web' ? 34 : insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="close" size={22} color={C.text} />
            </Pressable>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={{ width: 40 }} />
          </View>

          <Pressable onPress={handlePhotoPress} style={styles.photoSection}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="paw" size={32} color={C.accent} />
              </View>
            )}
            <View style={styles.photoCameraBtn}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </Pressable>

          <Text style={styles.sectionLabel}>Your Name</Text>
          <TextInput style={styles.input} value={userName} onChangeText={setUserNameLocal} placeholder="Your name" placeholderTextColor={C.textMuted} />

          {otherPets.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Switch Pet</Text>
              <View style={styles.petSwitcher}>
                {otherPets.map(p => (
                  <Pressable
                    key={p.id}
                    style={styles.petSwitch}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActivePetId(p.id);
                      router.back();
                    }}
                  >
                    <Ionicons name="paw" size={14} color={C.accent} />
                    <Text style={styles.petSwitchText}>{p.name}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionLabel}>Pet Details</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Breed</Text>
          <TextInput style={styles.input} value={breed} onChangeText={setBreed} placeholderTextColor={C.textMuted} />

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Weight</Text>
              <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="decimal-pad" placeholderTextColor={C.textMuted} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.unitRow}>
                <Pressable
                  style={[styles.unitBtn, weightUnit === 'kg' && styles.unitBtnActive]}
                  onPress={() => setWeightUnit('kg')}
                >
                  <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>kg</Text>
                </Pressable>
                <Pressable
                  style={[styles.unitBtn, weightUnit === 'lbs' && styles.unitBtnActive]}
                  onPress={() => setWeightUnit('lbs')}
                >
                  <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>lbs</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <Text style={styles.label}>Birth Date</Text>
          <TextInput style={styles.input} value={birthDate} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" placeholderTextColor={C.textMuted} />

          <Text style={styles.label}>Color</Text>
          <TextInput style={styles.input} value={color} onChangeText={setColor} placeholderTextColor={C.textMuted} />

          <Text style={styles.sectionLabel}>Vet Information</Text>
          <Text style={styles.label}>Vet Name</Text>
          <TextInput style={styles.input} value={vetName} onChangeText={setVetName} placeholderTextColor={C.textMuted} />
          <Text style={styles.label}>Clinic</Text>
          <TextInput style={styles.input} value={vetClinic} onChangeText={setVetClinic} placeholderTextColor={C.textMuted} />
          <Text style={styles.label}>Phone</Text>
          <TextInput style={styles.input} value={vetPhone} onChangeText={setVetPhone} keyboardType="phone-pad" placeholderTextColor={C.textMuted} />

          <Pressable onPress={handleSave}>
            <LinearGradient colors={[C.accent, C.accentDim]} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={16} color={C.danger} />
            <Text style={styles.deleteBtnText}>Delete {activePet.name}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15, color: C.text, marginTop: 20, marginBottom: 4 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textSecondary, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontFamily: 'Inter_400Regular', fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.cardBorder },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  unitRow: { flexDirection: 'row', gap: 8 },
  unitBtn: { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.cardBorder },
  unitBtnActive: { backgroundColor: C.accentSoft, borderColor: C.accent },
  unitText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.textMuted },
  unitTextActive: { color: C.accent },
  petSwitcher: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  petSwitch: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: C.cardBorder },
  petSwitchText: { fontFamily: 'Inter_500Medium', fontSize: 13, color: C.text },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16, color: C.background },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16, paddingVertical: 14 },
  deleteBtnText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.danger },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.textMuted, textAlign: 'center', marginTop: 100 },
  photoSection: { alignItems: 'center', marginBottom: 8, position: 'relative' as const },
  photoPreview: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.accent },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.accentSoft, borderWidth: 3, borderColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  photoCameraBtn: { position: 'absolute' as const, top: 54, right: '50%', marginRight: -40, width: 28, height: 28, borderRadius: 14, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.card },
  photoHint: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary, marginTop: 8 },
});
