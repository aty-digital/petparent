import React from 'react';
import {
  StyleSheet, Text, View, ScrollView, Pressable, Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { usePets } from '@/lib/pet-context';

const C = Colors.dark;

export default function TriageResultScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;
  const { resultId } = useLocalSearchParams<{ resultId: string }>();
  const { triageResults, activePet } = usePets();

  const result = triageResults.find(r => r.id === resultId);

  if (!result) {
    return (
      <View style={[styles.container, { paddingTop: topInset }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Triage Result</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Result not found</Text>
        </View>
      </View>
    );
  }

  const urgencyConfig = {
    urgent: { color: C.danger, bg: C.dangerSoft, icon: 'warning' as const, iconColor: C.danger },
    moderate: { color: C.warning, bg: C.warningSoft, icon: 'alert-circle' as const, iconColor: C.warning },
    low: { color: C.success, bg: C.successSoft, icon: 'checkmark-circle' as const, iconColor: C.success },
  };

  const uc = urgencyConfig[result.urgency] || urgencyConfig.low;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 12, paddingBottom: bottomInset + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Symptom Triage</Text>
          <View style={{ width: 40 }} />
        </View>

        {activePet && (
          <View style={styles.petBadge}>
            <View style={styles.petBadgeAvatar}>
              <Ionicons name="paw" size={16} color={C.accent} />
            </View>
            <View>
              <Text style={styles.petBadgeName}>{activePet.name}</Text>
              <Text style={styles.petBadgeBreed}>{activePet.breed}</Text>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: uc.bg }]}>
              <Text style={[styles.activeBadgeText, { color: uc.color }]}>ACTIVE CASE</Text>
            </View>
          </View>
        )}

        <View style={[styles.urgencyCard, { borderColor: uc.color + '40' }]}>
          <Ionicons name={uc.icon} size={32} color={uc.color} />
          <Text style={[styles.urgencyLabel, { color: uc.color }]}>{result.urgencyLabel}</Text>
          <Text style={styles.urgencyMessage}>{result.urgencyMessage}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionBar}>
            <View style={[styles.sectionBarLine, { backgroundColor: uc.color }]} />
            <Text style={styles.sectionTitle}>Analysis Summary</Text>
          </View>
          <View style={styles.analysisCard}>
            <Text style={styles.analysisText}>{result.analysisSummary}</Text>
            {result.keyFindings.map((finding, i) => (
              <View key={i} style={styles.findingRow}>
                <Ionicons name="checkmark-circle" size={16} color={C.accent} />
                <Text style={styles.findingText}>{finding}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Immediate Action Steps</Text>
          {result.actionSteps.map((step, i) => (
            <View key={i} style={styles.stepCard}>
              <View style={[styles.stepNumber, { backgroundColor: uc.color }]}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.descSection}>
          <Text style={styles.descLabel}>YOUR DESCRIPTION</Text>
          <Text style={styles.descText}>"{result.description}"</Text>
        </View>

        <Text style={styles.disclaimerText}>{result.disclaimer}</Text>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 12 }]}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="home" size={18} color={C.accent} />
          <Text style={styles.actionBtnText}>Done</Text>
        </Pressable>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.back();
          }}
        >
          <Text style={styles.primaryBtnText}>Save & Close</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scroll: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, color: C.text },
  petBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.card, borderRadius: 12, padding: 12, marginBottom: 20, borderWidth: 1, borderColor: C.cardBorder },
  petBadgeAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.accentSoft, alignItems: 'center', justifyContent: 'center' },
  petBadgeName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.text },
  petBadgeBreed: { fontFamily: 'Inter_400Regular', fontSize: 12, color: C.textSecondary },
  activeBadge: { marginLeft: 'auto', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  activeBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1 },
  urgencyCard: { alignItems: 'center', backgroundColor: C.card, borderRadius: 16, padding: 24, marginBottom: 24, borderWidth: 1 },
  urgencyLabel: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 12 },
  urgencyMessage: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  section: { marginBottom: 20 },
  sectionBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionBarLine: { width: 3, height: 18, borderRadius: 2 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 16, color: C.text },
  analysisCard: { backgroundColor: C.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: C.cardBorder },
  analysisText: { fontFamily: 'Inter_400Regular', fontSize: 14, color: C.textSecondary, lineHeight: 22, marginBottom: 12 },
  findingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  findingText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 18 },
  stepCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: C.card, borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: C.cardBorder },
  stepNumber: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontFamily: 'Inter_700Bold', fontSize: 12, color: '#fff' },
  stepText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, flex: 1, lineHeight: 18 },
  descSection: { backgroundColor: C.card, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.cardBorder },
  descLabel: { fontFamily: 'Inter_500Medium', fontSize: 10, color: C.textMuted, letterSpacing: 1, marginBottom: 8 },
  descText: { fontFamily: 'Inter_400Regular', fontSize: 13, color: C.textSecondary, fontStyle: 'italic', lineHeight: 18 },
  disclaimerText: { fontFamily: 'Inter_400Regular', fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 16, marginBottom: 20 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 12, backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.cardBorder },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.card, borderRadius: 14, paddingVertical: 14, borderWidth: 1, borderColor: C.cardBorder },
  actionBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.accent },
  primaryBtn: { flex: 1, backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, color: C.background },
  emptyState: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontFamily: 'Inter_500Medium', fontSize: 14, color: C.textMuted },
});
