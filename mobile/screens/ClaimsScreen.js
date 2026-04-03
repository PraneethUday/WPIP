import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../constants/theme';

const BACKEND_URL = 'http://localhost:8000'; // Target FastAPI backend

const statusConfig = {
  paid: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a', label: 'Paid', icon: 'checkmark-circle' },
  approved: { bg: 'rgba(34,197,94,0.12)', color: '#16a34a', label: 'Approved', icon: 'checkmark-circle' },
  'under_review': { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Under Review', icon: 'time' },
  pending: { bg: 'rgba(245,158,11,0.12)', color: '#d97706', label: 'Pending', icon: 'time' },
  rejected: { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', label: 'Rejected', icon: 'close-circle' },
  auto_initiated: { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', label: 'Initiated', icon: 'flash' },
};

export default function ClaimsScreen({ route, navigation }) {
  const [filter, setFilter] = useState('all');
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fallback to a mock worker ID if not passed mapping to the test data
  const workerId = route?.params?.userId || 'w_sw_001';

  React.useEffect(() => {
    fetchClaims();
  }, [workerId]);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/claims/worker/${workerId}`);
      const data = await res.json();
      if (data && data.data) {
        setClaims(data.data);
      }
    } catch (e) {
      console.log('Error fetching claims:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? claims : claims.filter(c => c.payout_status === filter || c.status === filter);

  const totalPaid = claims.filter(c => c.payout_status === 'paid').reduce((a, c) => a + c.payout_amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claims</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{claims.length}</Text>
            <Text style={styles.summaryLabel}>Total Claims</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#4ade80' }]}>₹{totalPaid}</Text>
            <Text style={styles.summaryLabel}>Total Received</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{claims.filter(c => c.payout_status === 'paid' || c.payout_status === 'approved').length}</Text>
            <Text style={styles.summaryLabel}>Approved</Text>
          </View>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={18} color={COLORS.info} style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>All claims are triggered automatically — no filing required</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          {['all', 'paid', 'pending'].map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === 'all' ? 'All' : f === 'paid' ? '✓ Paid' : '⏳ Review'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Claims List */}
        <View style={styles.claimsList}>
          {loading ? (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading claims...</Text>
          ) : filtered.map((claim, i) => {
            const sc = statusConfig[claim.status] || statusConfig['auto_initiated'];
            const claimDate = new Date(claim.created_at).toLocaleDateString();
            return (
              <View key={claim.id} style={styles.claimCard}>
                <View style={styles.claimTop}>
                  <View style={styles.claimIconWrap}>
                    <Ionicons name={sc.icon} size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.claimInfo}>
                    <Text style={styles.claimType}>{claim.trigger_type.replace('_', ' ')}</Text>
                    <Text style={styles.claimDate}>{claimDate} · {claim.city}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
                  </View>
                </View>
                <View style={styles.claimBottom}>
                  <View style={styles.claimDetail}>
                    <Text style={styles.claimDetailLabel}>Disrupted</Text>
                    <Text style={styles.claimDetailValue}>{claim.disrupted_hours} hours</Text>
                  </View>
                  <View style={styles.claimDetail}>
                    <Text style={styles.claimDetailLabel}>Claim ID</Text>
                    <Text style={styles.claimDetailValue}>{claim.claim_number}</Text>
                  </View>
                  <View style={styles.claimDetail}>
                    <Text style={styles.claimDetailLabel}>Payout</Text>
                    <Text style={[styles.claimDetailValue, styles.claimAmount]}>₹{claim.payout_amount}</Text>
                  </View>
                </View>
              </View>
            );
          })}
          {filtered.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyStateText}>No claims for this filter</Text>
            </View>
          )}
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
  summaryBanner: { backgroundColor: COLORS.secondary, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: SIZES.padding, paddingHorizontal: SIZES.padding },
  summaryItem: { alignItems: 'center' },
  summaryValue: { fontSize: 22, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 2 },
  summaryLabel: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(255,255,255,0.55)' },
  summaryDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59,130,246,0.08)', borderBottomWidth: 1, borderBottomColor: 'rgba(59,130,246,0.15)', padding: SIZES.padding * 0.6, paddingHorizontal: SIZES.padding },
  infoText: { flex: 1, fontSize: 13, fontFamily: FONTS.medium, color: '#2563eb', lineHeight: 18 },
  filterRow: { flexDirection: 'row', padding: SIZES.padding, gap: 10 },
  filterTab: { flex: 1, paddingVertical: 9, borderRadius: 100, backgroundColor: COLORS.surface, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(27,27,58,0.1)' },
  filterTabActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterTabText: { fontSize: 13, fontFamily: FONTS.bold, color: 'rgba(27,27,58,0.5)' },
  filterTabTextActive: { color: COLORS.white },
  claimsList: { paddingHorizontal: SIZES.padding, paddingBottom: SIZES.padding * 3 },
  claimCard: { backgroundColor: COLORS.surface, borderRadius: SIZES.radius, borderWidth: 1, borderColor: 'rgba(27,27,58,0.07)', marginBottom: SIZES.base * 1.5, overflow: 'hidden' },
  claimTop: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding * 0.75, borderBottomWidth: 1, borderBottomColor: 'rgba(27,27,58,0.05)' },
  claimIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(165,28,48,0.08)', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  claimInfo: { flex: 1 },
  claimType: { fontSize: 15, fontFamily: FONTS.bold, color: COLORS.accent },
  claimDate: { fontSize: 12, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.45)', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusBadgeText: { fontSize: 11, fontFamily: FONTS.bold },
  claimBottom: { flexDirection: 'row', justifyContent: 'space-between', padding: SIZES.padding * 0.75 },
  claimDetail: { alignItems: 'center' },
  claimDetailLabel: { fontSize: 10, fontFamily: FONTS.bold, color: 'rgba(27,27,58,0.4)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  claimDetailValue: { fontSize: 14, fontFamily: FONTS.bold, color: COLORS.accent },
  claimAmount: { color: '#16a34a' },
  emptyState: { alignItems: 'center', padding: SIZES.padding * 2, gap: 12 },
  emptyStateText: { fontSize: 16, fontFamily: FONTS.medium, color: 'rgba(27,27,58,0.4)' },
});
