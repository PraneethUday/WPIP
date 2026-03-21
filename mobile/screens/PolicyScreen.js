import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const triggers = [
  { icon: 'rainy-outline', label: 'Heavy Rainfall', threshold: '>64.5mm/24h', active: true },
  { icon: 'cloud-outline', label: 'Air Pollution (AQI)', threshold: 'AQI > 400', active: true },
  { icon: 'ban-outline', label: 'Curfew / Sec. 144', threshold: 'Official Order', active: true },
  { icon: 'water-outline', label: 'Flood / Waterlogging', threshold: 'Zone Tagged', active: true },
  { icon: 'thermometer-outline', label: 'Extreme Heat', threshold: '>45°C', active: true },
];

const premiumRows = [
  { label: 'Base Premium (3.5% × ₹2,800)', value: '₹98' },
  { label: 'Zone Risk (Moderate)', value: '×1.05' },
  { label: 'Weather Forecast', value: '×1.10' },
  { label: 'Loyalty Discount (8wks)', value: '−8%' },
  { label: 'AutoPay Discount', value: '−5%' },
  { label: 'Final Premium', value: '₹99', bold: true },
];

export default function PolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Active Policy Card */}
        <View style={styles.policyCard}>
          <View style={styles.policyCardTop}>
            <View>
              <Text style={styles.policyCardLabel}>ACTIVE POLICY</Text>
              <Text style={styles.policyCardTier}>Standard Guard</Text>
              <Text style={styles.policyCardId}>GG-2026-44821</Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Protected ✓</Text>
            </View>
          </View>
          <View style={styles.policyStats}>
            {[
              { label: 'Weekly Premium', value: '₹99' },
              { label: 'Max Payout', value: '₹1,200' },
              { label: 'Platforms', value: '2 Active' },
            ].map((s, i) => (
              <View key={i} style={styles.policyStat}>
                <Text style={styles.policyStatLabel}>{s.label}</Text>
                <Text style={styles.policyStatValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Premium Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Premium Breakdown</Text>
          </View>
          {premiumRows.map((row, i) => (
            <View key={i} style={[styles.premiumRow, i === premiumRows.length - 1 && styles.premiumRowLast]}>
              <Text style={styles.premiumLabel}>{row.label}</Text>
              <Text style={[styles.premiumValue, row.bold && styles.premiumValueBold]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Loyalty Progress */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Loyalty Progress</Text>
          </View>
          <View style={styles.loyaltyInfo}>
            <Text style={styles.loyaltyWeeks}>8 weeks</Text>
            <Text style={styles.loyaltyDiscount}>8% discount</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '53%' }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0 wks</Text>
            <Text style={styles.progressLabel}>15 wks → 15% max</Text>
          </View>
        </View>

        {/* Coverage Triggers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Coverage Triggers</Text>
          </View>
          {triggers.map((t, i) => (
            <View key={i} style={styles.triggerRow}>
              <View style={styles.triggerIcon}>
                <Ionicons name={t.icon} size={18} color={COLORS.primary} />
              </View>
              <View style={styles.triggerInfo}>
                <Text style={styles.triggerLabel}>{t.label}</Text>
                <Text style={styles.triggerThreshold}>{t.threshold}</Text>
              </View>
              <View style={styles.triggerActiveBadge}>
                <Text style={styles.triggerActiveBadgeText}>Active</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Policy Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Policy Details</Text>
          </View>
          {[
            ['Policy Number', 'GG-2026-44821'],
            ['Coverage Start', '20 Jan 2026'],
            ['Valid Until', '31 Dec 2026'],
            ['Zone', 'Chennai South'],
            ['Platforms', 'Zomato, Amazon Flex'],
          ].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={styles.detailValue}>{v}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 60, backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.padding },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.white },
  scroll: { padding: SIZES.padding, paddingBottom: SIZES.padding * 3 },
  policyCard: { background: COLORS.secondary, borderRadius: SIZES.radius * 1.5, padding: SIZES.padding, marginBottom: SIZES.padding, overflow: 'hidden', backgroundColor: COLORS.secondary },
  policyCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SIZES.padding },
  policyCardLabel: { fontSize: 10, fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.5)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  policyCardTier: { fontSize: 20, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 2 },
  policyCardId: { fontSize: 13, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.5)' },
  activeBadge: { backgroundColor: COLORS.success, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  activeBadgeText: { fontSize: 12, fontFamily: FONTS.bold, color: COLORS.white },
  policyStats: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: SIZES.base, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  policyStat: {},
  policyStatLabel: { fontSize: 10, fontFamily: FONTS.bold, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  policyStatValue: { fontSize: 17, fontFamily: FONTS.bold, color: COLORS.white },
  section: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, padding: SIZES.padding, marginBottom: SIZES.base * 2, borderWidth: 1, borderColor: 'rgba(27,27,58,0.06)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SIZES.padding * 0.75 },
  sectionTitle: { fontSize: 16, fontFamily: FONTS.bold, color: COLORS.accent, marginLeft: 8 },
  premiumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.06)' },
  premiumRowLast: { borderBottomWidth: 0 },
  premiumLabel: { fontSize: 14, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.6)', flex: 1 },
  premiumValue: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.accent },
  premiumValueBold: { fontSize: 16, color: COLORS.primary },
  loyaltyInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SIZES.base },
  loyaltyWeeks: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.accent },
  loyaltyDiscount: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary },
  progressTrack: { height: 10, backgroundColor: 'rgba(27,27,58,0.08)', borderRadius: 100, overflow: 'hidden', marginBottom: SIZES.base },
  progressFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 100 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 11, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.4)' },
  triggerRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.05)' },
  triggerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(165,28,48,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  triggerInfo: { flex: 1 },
  triggerLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.accent },
  triggerThreshold: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.45)', marginTop: 2 },
  triggerActiveBadge: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  triggerActiveBadgeText: { fontSize: 11, fontFamily: FONTS.bold, color: '#16a34a' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.05)' },
  detailKey: { fontSize: 14, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.5)' },
  detailValue: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.accent, maxWidth: '55%', textAlign: 'right' },
});
