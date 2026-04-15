import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import * as api from "../lib/api";

const PLAN_DETAILS = {
  basic: { label: "Basic Shield", tag: "Low-cost entry cover" },
  standard: { label: "Standard Guard", tag: "Balanced weekly protection" },
  pro: { label: "Pro Protect", tag: "Highest payout priority" },
};
const TIER_ORDER = ["basic", "standard", "pro"];
const TRIGGER_META = {
  heavy_rain: { icon: "rainy-outline", threshold: "Rain threshold breached" },
  severe_aqi: { icon: "cloud-outline", threshold: "AQI severe level" },
  flood: { icon: "water-outline", threshold: "Flood risk active" },
  extreme_heat: { icon: "thermometer-outline", threshold: "Extreme heat threshold" },
  curfew: { icon: "ban-outline", threshold: "Official restriction" },
};

function money(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `₹${Math.round(value)}`;
}
function normalizeTier(tier) {
  if (tier === "basic" || tier === "pro") return tier;
  return "standard";
}

export default function PolicyScreen({ navigation }) {
  const { user } = useAuth();
  const { COLORS, FONTS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS, FONTS), [COLORS, FONTS]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingPlan, setSavingPlan] = useState(false);
  const [planMessage, setPlanMessage] = useState("");
  const [currentPremium, setCurrentPremium] = useState(null);
  const [quotes, setQuotes] = useState({});
  const [nextWeekTier, setNextWeekTier] = useState("standard");
  const [triggerStatus, setTriggerStatus] = useState({});

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user?.delivery_id) {
        if (mounted) { setLoading(false); setError("Delivery partner ID is missing. Please update your profile."); }
        return;
      }
      setLoading(true);
      setError("");
      try {
        const storageKey = `gg_next_week_plan_${user.id}`;
        const savedTier = await AsyncStorage.getItem(storageKey);
        if (mounted) setNextWeekTier(normalizeTier(savedTier || user.tier));
        const [premiumRes, quoteRes, triggerRes] = await Promise.allSettled([
          api.predictPremium(user.delivery_id, user.city, normalizeTier(user.tier)),
          api.getPremiumQuotes(user.delivery_id, user.city),
          api.getTriggerStatus(),
        ]);
        if (mounted) {
          if (premiumRes.status === "fulfilled") setCurrentPremium(premiumRes.value);
          if (quoteRes.status === "fulfilled") setQuotes(quoteRes.value || {});
          if (triggerRes.status === "fulfilled") setTriggerStatus(triggerRes.value || {});
          if (premiumRes.status === "rejected" && quoteRes.status === "rejected") {
            setError("Unable to load policy data right now.");
          }
        }
      } catch {
        if (mounted) setError("Unable to load policy data right now.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  const cityTriggers = useMemo(() => {
    if (!user?.city) return [];
    return triggerStatus?.[user.city]?.triggers_fired || [];
  }, [triggerStatus, user?.city]);

  const premiumRows = useMemo(() => {
    const weekly = user?.autopay ? currentPremium?.weekly_premium_autopay : currentPremium?.weekly_premium;
    return [
      { label: "Base Prediction", value: money(currentPremium?.raw_prediction) },
      { label: "Weather Risk", value: typeof currentPremium?.weather_risk === "number" ? `${Math.round(currentPremium.weather_risk * 100)}%` : "—" },
      { label: "City Risk Multiplier", value: typeof currentPremium?.city_risk === "number" ? currentPremium.city_risk.toFixed(2) : "—" },
      { label: "AutoPay Discount", value: user?.autopay ? "−5%" : "Off", positive: !!user?.autopay },
      { label: "Final Premium", value: money(weekly), bold: true },
    ];
  }, [currentPremium, user?.autopay]);

  const currentTier = normalizeTier(user?.tier);

  const handleSchedulePlan = async (tier) => {
    if (!user?.id) return;
    setSavingPlan(true);
    setPlanMessage("");
    try {
      const storageKey = `gg_next_week_plan_${user.id}`;
      await AsyncStorage.setItem(storageKey, tier);
      setNextWeekTier(tier);
      setPlanMessage(`${PLAN_DETAILS[tier].label} scheduled for next week.`);
    } finally {
      setSavingPlan(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>Loading policy details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Policy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {!!error && (
          <View style={styles.errorCard}>
            <Ionicons name="warning-outline" size={16} color={COLORS.error} />
            <Text style={styles.errorCardText}>{error}</Text>
          </View>
        )}

        {/* Policy Hero */}
        <View style={styles.policyHero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View style={styles.heroTopLeft}>
              <Text style={styles.heroTierLabel}>ACTIVE POLICY</Text>
              <Text style={styles.heroTier}>{PLAN_DETAILS[currentTier].label}</Text>
              <Text style={styles.heroId} numberOfLines={1} ellipsizeMode="middle">{user?.id || "—"}</Text>
            </View>
            <View style={styles.activeBadge}>
              <View style={styles.activeDot} />
              <Text style={styles.activeBadgeText}>
                {user?.verification_status === "verified" ? "Protected ✓" : "Pending Verification"}
              </Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            {[
              { label: "Weekly Premium", value: money(user?.autopay ? currentPremium?.weekly_premium_autopay : currentPremium?.weekly_premium) },
              { label: "Max Payout", value: money(currentPremium?.max_payout) },
              { label: "Platforms", value: `${(user?.platforms || []).length} Active` },
            ].map((s, i) => (
              <View key={i} style={styles.heroStat}>
                <Text style={styles.heroStatLabel}>{s.label}</Text>
                <Text style={styles.heroStatValue}>{s.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Premium Breakdown */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calculator-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Premium Breakdown</Text>
          </View>
          {premiumRows.map((row, i) => (
            <View key={i} style={[styles.premiumRow, i === premiumRows.length - 1 && styles.premiumRowLast]}>
              <Text style={styles.premiumLabel}>{row.label}</Text>
              <Text style={[
                styles.premiumValue,
                row.positive && { color: COLORS.success },
                row.bold && { color: COLORS.primary, fontSize: 16 },
              ]}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Next Week Plan */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="star-outline" size={18} color={COLORS.amber} />
            <Text style={styles.sectionTitle}>Next Week Coverage Plan</Text>
          </View>
          <View style={styles.planGrid}>
            {TIER_ORDER.map((tier) => {
              const quote = quotes[tier];
              const selected = nextWeekTier === tier;
              return (
                <TouchableOpacity
                  key={tier}
                  style={[styles.planCard, selected && styles.planCardSelected]}
                  onPress={() => handleSchedulePlan(tier)}
                  disabled={savingPlan}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.planName, selected && { color: COLORS.primary }]}>{PLAN_DETAILS[tier].label}</Text>
                  <Text style={styles.planTag}>{PLAN_DETAILS[tier].tag}</Text>
                  <Text style={styles.planPremium}>{money(user?.autopay ? quote?.weekly_premium_autopay : quote?.weekly_premium)} /week</Text>
                  <Text style={styles.planPayout}>Max payout {money(quote?.max_payout)}</Text>
                  <Text style={styles.planBtnText}>{selected ? "Scheduled ✓" : "Choose for next week"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!!planMessage && <Text style={styles.planMessage}>{planMessage}</Text>}
        </View>

        {/* Coverage Triggers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Coverage Triggers</Text>
          </View>
          {cityTriggers.length === 0 && (
            <Text style={styles.emptyText}>No active disruptions for {user?.city || "your city"} right now.</Text>
          )}
          {cityTriggers.map((t, i) => (
            <View key={t.trigger_id} style={[styles.triggerRow, i < cityTriggers.length - 1 && styles.triggerBorder]}>
              <View style={styles.triggerIcon}>
                <Ionicons name={TRIGGER_META[t.trigger_type]?.icon || "warning-outline"} size={16} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.triggerLabel}>{t.description}</Text>
                <Text style={styles.triggerThreshold}>{TRIGGER_META[t.trigger_type]?.threshold || "Active trigger rule"}</Text>
              </View>
              <View style={styles.triggerBadge}>
                <Text style={styles.triggerBadgeText}>{(t.severity || "active").toUpperCase()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Policy Details */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Policy Details</Text>
          </View>
          {[
            ["Policy Number", user?.id || "—"],
            ["City", user?.city || "—"],
            ["Area / Zone", user?.area || "—"],
            ["Delivery ID", user?.delivery_id || "—"],
            ["Platforms", (user?.platforms || []).join(", ") || "—"],
            ["Verification", user?.verification_status || "pending"],
            ["AutoPay", user?.autopay ? "Enabled" : "Disabled"],
          ].map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={styles.detailValue}>{v}</Text>
            </View>
          ))}
        </View>

        {/* Pay Premium CTA */}
        <TouchableOpacity style={styles.payBtn} onPress={() => navigation.navigate("Payments")}>
          <Ionicons name="card-outline" size={18} color="#FFFDFB" />
          <Text style={styles.payBtnText}>Pay Premium for This Week</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    loaderWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
    loaderText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: SIZES.padding,
      borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 12,
      backgroundColor: COLORS.surfaceHigh, justifyContent: "center", alignItems: "center",
    },
    headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.bold, color: COLORS.white },
    scroll: { padding: SIZES.padding, paddingBottom: SIZES.padding * 3 },
    errorCard: {
      marginBottom: SIZES.padding, backgroundColor: COLORS.errorContainer, borderWidth: 1,
      borderColor: COLORS.error + "40", borderRadius: SIZES.radius,
      padding: 10, flexDirection: "row", alignItems: "center", gap: 8,
    },
    errorCardText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.error, flex: 1 },

    policyHero: {
      borderRadius: SIZES.radius * 1.5, backgroundColor: COLORS.primary,
      padding: SIZES.padding, marginBottom: SIZES.padding,
      overflow: "hidden", ...SHADOWS.button,
    },
    heroGlow: {
      position: "absolute", width: 180, height: 180, borderRadius: 90,
      backgroundColor: "#fff", opacity: 0.06, top: -60, right: -40,
    },
    heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: SIZES.padding, gap: SIZES.base },
    heroTopLeft: { flex: 1, flexShrink: 1 },
    heroTierLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: "rgba(255,255,255,0.55)", letterSpacing: 1, marginBottom: 4 },
    heroTier: { fontSize: SIZES.h2, fontFamily: FONTS.display, color: "#fff", marginBottom: 2 },
    heroId: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: "rgba(255,255,255,0.5)" },
    activeBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: COLORS.successContainer, paddingHorizontal: 12,
      paddingVertical: 6, borderRadius: SIZES.radiusFull, flexShrink: 0,
    },
    activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.success },
    activeBadgeText: { fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: COLORS.success },
    heroStats: {
      flexDirection: "row", justifyContent: "space-between",
      borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", paddingTop: SIZES.padding,
    },
    heroStat: {},
    heroStatLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: "rgba(255,255,255,0.5)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.3 },
    heroStatValue: { fontSize: 17, fontFamily: FONTS.bold, color: "#fff" },

    section: {
      backgroundColor: COLORS.surfaceContainer, borderRadius: SIZES.radius * 1.2,
      padding: SIZES.padding, marginBottom: SIZES.padding,
      borderWidth: 1, borderColor: COLORS.border,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SIZES.padding * 0.75 },
    sectionTitle: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.white },

    premiumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    premiumRowLast: { borderBottomWidth: 0 },
    premiumLabel: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted, flex: 1 },
    premiumValue: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.white },

    planGrid: { gap: 10 },
    planCard: { borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceHigh, padding: SIZES.padding * 0.7 },
    planCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryContainer },
    planName: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 2 },
    planTag: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: COLORS.textFaint, marginBottom: 6 },
    planPremium: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.white },
    planPayout: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: COLORS.textMuted, marginTop: 2 },
    planBtnText: { fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: COLORS.primary, marginTop: 8, textTransform: "uppercase", letterSpacing: 0.4 },
    planMessage: { marginTop: 10, fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.success },

    triggerRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11 },
    triggerBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    triggerIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primaryContainer, justifyContent: "center", alignItems: "center", marginRight: 12 },
    triggerLabel: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 2 },
    triggerThreshold: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: COLORS.textFaint },
    triggerBadge: { backgroundColor: COLORS.successContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.success + "30" },
    triggerBadgeText: { fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: COLORS.success },
    emptyText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted, marginBottom: SIZES.base },

    detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    detailKey: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted },
    detailValue: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.white, maxWidth: "55%", textAlign: "right" },

    payBtn: {
      height: 52, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primary,
      flexDirection: "row", justifyContent: "center", alignItems: "center",
      gap: 10, marginBottom: SIZES.padding, ...SHADOWS.button,
    },
    payBtnText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: "#FFFDFB" },
  });
