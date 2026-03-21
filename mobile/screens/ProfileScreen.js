import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const PLATFORMS = [
  { name: 'Zomato', id: 'ZOM-4829134', earnings: '₹1,600/wk avg', verified: true },
  { name: 'Amazon Flex', id: 'AMZ-7821039', earnings: '₹1,200/wk avg', verified: true },
];

const Row = ({ label, value, icon, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={onPress ? 0.7 : 1}>
    <View style={styles.rowLeft}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <Text style={styles.rowLabel}>{label}</Text>
    </View>
    <View style={styles.rowRight}>
      <Text style={styles.rowValue}>{value}</Text>
      {onPress && <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />}
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen({ navigation }) {
  const [autopay, setAutopay] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [gpsConsent, setGpsConsent] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar + Name */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>RK</Text>
          </View>
          <Text style={styles.name}>Ravi Kumar</Text>
          <Text style={styles.zone}>Chennai South · 8 weeks active</Text>
          <View style={styles.protectedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
            <Text style={styles.protectedText}>Income Protected</Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <Row icon="person-outline" label="Full Name" value="Ravi Kumar" />
          <Row icon="call-outline" label="Phone" value="+91 98765 43210" />
          <Row icon="mail-outline" label="Email" value="ravi@gmail.com" />
          <Row icon="calendar-outline" label="Age" value="28" />
          <Row icon="location-outline" label="Service Zone" value="Chennai South" />
          <Row icon="card-outline" label="PAN Card" value="ABCDE1234F" />
          <Row icon="finger-print-outline" label="Aadhaar" value="XXXX XXXX 4567" />
        </View>

        {/* Connected Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Connected Platforms</Text>
          {PLATFORMS.map(p => (
            <View key={p.name} style={styles.platformCard}>
              <View style={styles.platformLeft}>
                <View style={styles.platformIconWrap}>
                  <Text style={styles.platformInitial}>{p.name[0]}</Text>
                </View>
                <View>
                  <Text style={styles.platformName}>{p.name}</Text>
                  <Text style={styles.platformId}>{p.id}</Text>
                  <Text style={styles.platformEarnings}>{p.earnings}</Text>
                </View>
              </View>
              {p.verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>Verified ✓</Text>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={styles.addPlatformBtn}>
            <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.addPlatformText}>Add Another Platform</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Settings</Text>
          <Row icon="wallet-outline" label="UPI ID" value="ravi@upi" />
          <Row icon="business-outline" label="Bank Account" value="SBI ••••4321" />
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="repeat-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.toggleLabel}>AutoPay</Text>
                <Text style={styles.toggleSub}>5% discount applied</Text>
              </View>
            </View>
            <Switch value={autopay} onValueChange={setAutopay} trackColor={{ true: COLORS.success }} thumbColor={COLORS.white} />
          </View>
        </View>

        {/* Notifications & Consent */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications & Privacy</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="notifications-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.toggleLabel}>Claim Notifications</Text>
                <Text style={styles.toggleSub}>Alerts when a claim is processed</Text>
              </View>
            </View>
            <Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.success }} thumbColor={COLORS.white} />
          </View>
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={styles.rowIcon}>
                <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.toggleLabel}>GPS Validation Consent</Text>
                <Text style={styles.toggleSub}>Required for claim fraud prevention</Text>
              </View>
            </View>
            <Switch value={gpsConsent} onValueChange={setGpsConsent} trackColor={{ true: COLORS.success }} thumbColor={COLORS.white} />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.navigate('Landing')}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.primary} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>GigGuard v1.0.0 · IRDAI Registered</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { height: 60, backgroundColor: COLORS.secondary, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SIZES.padding },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.white },
  scroll: { paddingBottom: SIZES.padding * 3 },
  avatarSection: { alignItems: 'center', paddingVertical: SIZES.padding * 1.5, backgroundColor: COLORS.secondary },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  avatarText: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.white },
  name: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 4 },
  zone: { fontSize: 14, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.55)', marginBottom: 12 },
  protectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.15)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100 },
  protectedText: { fontSize: 13, fontFamily: FONTS.bold, color: COLORS.success },
  section: { backgroundColor: COLORS.surface, marginHorizontal: SIZES.padding, marginTop: SIZES.padding, borderRadius: SIZES.radius, borderWidth: 1, borderColor: 'rgba(27,27,58,0.06)', overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontFamily: FONTS.bold, color: 'rgba(27,27,58,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: SIZES.padding * 0.75, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.05)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.padding * 0.6, paddingHorizontal: SIZES.padding * 0.75, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.04)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(165,28,48,0.07)', justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 14, fontFamily: FONTS.medium, color: COLORS.text },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { fontSize: 13, fontFamily: FONTS.bold, color: 'rgba(27,27,58,0.5)', maxWidth: 140, textAlign: 'right' },
  platformCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.padding * 0.75, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.04)' },
  platformLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platformIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(165,28,48,0.08)', justifyContent: 'center', alignItems: 'center' },
  platformInitial: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.primary },
  platformName: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.accent },
  platformId: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.4)', marginTop: 1 },
  platformEarnings: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.4)' },
  verifiedBadge: { backgroundColor: 'rgba(34,197,94,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  verifiedText: { fontSize: 11, fontFamily: FONTS.bold, color: '#16a34a' },
  addPlatformBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: SIZES.padding * 0.75, borderTopWidth: 1, borderTopColor: 'rgba(27,27,58,0.05)' },
  addPlatformText: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.primary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SIZES.padding * 0.75, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.04)' },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleLabel: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.text },
  toggleSub: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.4)', marginTop: 1 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: SIZES.padding, marginTop: SIZES.padding * 1.5, height: 52, borderRadius: SIZES.radius, borderWidth: 1.5, borderColor: 'rgba(165,28,48,0.2)', backgroundColor: 'rgba(165,28,48,0.04)' },
  logoutText: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.primary },
  footer: { textAlign: 'center', fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.3)', paddingBottom: SIZES.padding },
});
