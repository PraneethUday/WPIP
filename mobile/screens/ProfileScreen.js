import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";

function labelTier(tier) {
  if (tier === "basic") return "Basic Shield";
  if (tier === "pro") return "Pro Protect";
  return "Standard Guard";
}

const Row = ({ label, value, icon, onPress, COLORS, FONTS }) => (
  <TouchableOpacity onPress={onPress} style={rowStyle(COLORS)} activeOpacity={onPress ? 0.7 : 1}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
      <View style={{
        width: 32, height: 32, borderRadius: 10,
        backgroundColor: COLORS.primaryContainer,
        justifyContent: "center", alignItems: "center",
      }}>
        <Ionicons name={icon} size={16} color={COLORS.primary} />
      </View>
      <Text style={{ fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.white }}>{label}</Text>
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      <Text style={{ fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textFaint, maxWidth: 140, textAlign: "right" }}>{value}</Text>
      {onPress && <Ionicons name="chevron-forward" size={14} color={COLORS.textFaint} />}
    </View>
  </TouchableOpacity>
);

const rowStyle = (COLORS) => ({
  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  padding: SIZES.padding * 0.7, borderBottomWidth: 1, borderBottomColor: COLORS.border,
});

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { COLORS, FONTS, isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage, languages } = useLanguage();
  const styles = useMemo(() => createStyles(COLORS, FONTS), [COLORS, FONTS]);
  const [refreshing, setRefreshing] = useState(false);

  const initials = useMemo(() => {
    if (!user?.name) return "GG";
    const parts = user.name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }, [user?.name]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await refreshUser(); } finally { setRefreshing(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: "Landing" }] });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("profile")}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarGlow} />
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.name || "WPIP User"}</Text>
          <Text style={styles.zone}>{user?.city || "Unknown City"} · {labelTier(user?.tier)}</Text>
          <View style={styles.protectedBadge}>
            <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
            <Text style={styles.protectedText}>
              {user?.verification_status === "verified" ? t("income_protected") : t("verification_pending")}
            </Text>
          </View>
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("section_personal")}</Text>
          <Row icon="person-outline" label={t("row_name")} value={user?.name || "—"} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="call-outline" label={t("row_phone")} value={user?.phone || "—"} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="mail-outline" label={t("row_email")} value={user?.email || "—"} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="location-outline" label={t("row_city")} value={user?.city || "—"} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="map-outline" label={t("row_area")} value={user?.area || "—"} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="card-outline" label={t("row_delivery_id")} value={user?.delivery_id || "—"} COLORS={COLORS} FONTS={FONTS} />
        </View>

        {/* Connected Platforms */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("section_platforms")}</Text>
          {(user?.platforms || []).length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>{t("no_platforms")}</Text>
            </View>
          )}
          {(user?.platforms || []).map((platform) => (
            <View key={platform} style={styles.platformCard}>
              <View style={styles.platformLeft}>
                <View style={styles.platformIconWrap}>
                  <Text style={styles.platformInitial}>{platform[0]?.toUpperCase() || "P"}</Text>
                </View>
                <View>
                  <Text style={styles.platformName}>{platform}</Text>
                  <Text style={styles.platformId}>{t("delivery_id_label")}: {user?.delivery_id || "—"}</Text>
                </View>
              </View>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>
                  {user?.verification_status === "verified" ? t("verified") : t("pending")}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Coverage Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("section_coverage")}</Text>
          <Row icon="shield-outline" label={t("row_plan")} value={labelTier(user?.tier)} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="repeat-outline" label={t("row_autopay")} value={user?.autopay ? t("autopay_on") : t("autopay_off")} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="checkmark-done-outline" label={t("row_verification")} value={user?.verification_status || "pending"} COLORS={COLORS} FONTS={FONTS} />
          <Row icon="wallet-outline" label={t("row_upi")} value={user?.upi || "—"} COLORS={COLORS} FONTS={FONTS} />
        </View>

        {/* Appearance — Theme Toggle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("section_appearance")}</Text>
          <View style={styles.themeRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flex: 1 }}>
              <View style={[styles.themeIconWrap, { backgroundColor: isDark ? COLORS.primaryContainer : COLORS.amberContainer }]}>
                <Ionicons
                  name={isDark ? "moon" : "sunny"}
                  size={18}
                  color={isDark ? COLORS.primary : COLORS.amber}
                />
              </View>
              <View>
                <Text style={styles.themeLabel}>{isDark ? t("dark_mode") : t("light_mode")}</Text>
                <Text style={styles.themeSubLabel}>{isDark ? t("theme_dark_sub") : t("theme_light_sub")}</Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ true: COLORS.primary, false: COLORS.amber }}
              thumbColor={"#FFFDFB"}
              ios_backgroundColor={COLORS.surfaceHighest}
            />
          </View>
          <TouchableOpacity
            style={[styles.themeToggleBtn, { backgroundColor: isDark ? COLORS.primaryContainer : COLORS.amberContainer, borderColor: isDark ? COLORS.primary + "40" : COLORS.amber + "40" }]}
            onPress={toggleTheme}
            activeOpacity={0.8}
          >
            <Ionicons
              name={isDark ? "sunny-outline" : "moon-outline"}
              size={18}
              color={isDark ? COLORS.primary : COLORS.amber}
            />
            <Text style={[styles.themeToggleBtnText, { color: isDark ? COLORS.primary : COLORS.amber }]}>
              {isDark ? t("switch_to_light") : t("switch_to_dark")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Language ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("section_language")}</Text>
          <View style={styles.langGrid}>
            {languages.map((lang) => {
              const active = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.langBtn,
                    active && { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
                  ]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.langNative, active && { color: COLORS.primary }]}>
                    {lang.native}
                  </Text>
                  <Text style={[styles.langLabel, active && { color: COLORS.primary }]}>
                    {lang.label}
                  </Text>
                  {active && (
                    <View style={styles.langCheck}>
                      <Ionicons name="checkmark-circle" size={14} color={COLORS.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <TouchableOpacity style={styles.refreshProfileBtn} onPress={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <ActivityIndicator color="#FFFDFB" size="small" />
          ) : (
            <Ionicons name="refresh" size={18} color="#FFFDFB" />
          )}
          <Text style={styles.refreshProfileText}>{t("refresh_profile")}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
          <Text style={styles.logoutText}>{t("sign_out")}</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>WPIP v1.0.0 · IRDAI Registered</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    header: {
      height: 56, flexDirection: "row", alignItems: "center",
      justifyContent: "space-between", paddingHorizontal: SIZES.padding,
      borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceHigh, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.bold, color: COLORS.white },
    scroll: { paddingBottom: SIZES.padding * 3 },

    avatarSection: {
      alignItems: "center", paddingVertical: SIZES.padding * 1.5,
      backgroundColor: COLORS.surfaceContainer, borderBottomWidth: 1,
      borderBottomColor: COLORS.border, position: "relative", overflow: "hidden",
    },
    avatarGlow: { position: "absolute", width: 160, height: 160, borderRadius: 80, backgroundColor: COLORS.primary, opacity: 0.06, top: -40 },
    avatar: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: COLORS.primaryContainer, justifyContent: "center",
      alignItems: "center", marginBottom: 12, borderWidth: 2, borderColor: COLORS.primary + "50",
    },
    avatarText: { fontSize: 24, fontFamily: FONTS.bold, color: COLORS.primary },
    name: { fontSize: SIZES.h2, fontFamily: FONTS.display, color: COLORS.white, marginBottom: 4 },
    zone: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted, marginBottom: 12 },
    protectedBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      backgroundColor: COLORS.successContainer, paddingHorizontal: 14,
      paddingVertical: 6, borderRadius: SIZES.radiusFull,
      borderWidth: 1, borderColor: COLORS.success + "30",
    },
    protectedText: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.success },

    section: {
      marginHorizontal: SIZES.padding, marginTop: SIZES.padding,
      borderRadius: SIZES.radius * 1.2, backgroundColor: COLORS.surfaceContainer,
      borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
    },
    sectionTitle: {
      fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: COLORS.textFaint,
      textTransform: "uppercase", letterSpacing: 1,
      padding: SIZES.padding * 0.75, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },

    platformCard: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      padding: SIZES.padding * 0.75, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    platformLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    platformIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.primaryContainer, justifyContent: "center", alignItems: "center" },
    platformInitial: { fontSize: 18, fontFamily: FONTS.bold, color: COLORS.primary },
    platformName: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.white },
    platformId: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: COLORS.textFaint, marginTop: 1 },
    verifiedBadge: { backgroundColor: COLORS.successContainer, paddingHorizontal: 10, paddingVertical: 4, borderRadius: SIZES.radiusFull, borderWidth: 1, borderColor: COLORS.success + "30" },
    verifiedText: { fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: COLORS.success },
    emptyCard: { padding: SIZES.padding * 0.8 },
    emptyText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted },

    // Theme toggle
    themeRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      padding: SIZES.padding * 0.7, borderBottomWidth: 1, borderBottomColor: COLORS.border,
    },
    themeIconWrap: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    themeLabel: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.white },
    themeSubLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.textFaint, marginTop: 1 },
    themeToggleBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, margin: SIZES.padding * 0.75, height: 40,
      borderRadius: SIZES.radiusFull, borderWidth: 1,
    },
    themeToggleBtnText: { fontSize: SIZES.small, fontFamily: FONTS.bold },

    refreshProfileBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 8, marginHorizontal: SIZES.padding, marginTop: SIZES.padding * 1.2,
      height: 48, borderRadius: SIZES.radius, backgroundColor: COLORS.primary, ...SHADOWS.button,
    },
    refreshProfileText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: "#FFFDFB" },

    logoutBtn: {
      flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 10, margin: SIZES.padding, marginTop: SIZES.padding * 1.5,
      height: 52, borderRadius: SIZES.radius, borderWidth: 1,
      borderColor: COLORS.error + "40", backgroundColor: COLORS.errorContainer,
    },
    logoutText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.error },
    footer: { textAlign: "center", fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textFaint, paddingBottom: SIZES.padding },

    // Language picker
    langGrid: {
      flexDirection: "row", flexWrap: "wrap", gap: 8,
      padding: SIZES.padding * 0.75,
    },
    langBtn: {
      flex: 1, minWidth: "44%", position: "relative",
      borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.border,
      backgroundColor: COLORS.surfaceHigh,
      paddingVertical: 12, paddingHorizontal: 10,
      alignItems: "center",
    },
    langNative: {
      fontSize: 16, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: 2,
    },
    langLabel: {
      fontSize: 10, fontFamily: FONTS.medium, color: COLORS.textFaint,
      textTransform: "uppercase", letterSpacing: 0.5,
    },
    langCheck: {
      position: "absolute", top: 6, right: 6,
    },
  });
