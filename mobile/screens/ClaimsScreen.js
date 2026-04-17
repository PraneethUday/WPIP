import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import * as api from "../lib/api";

// ─── helpers ────────────────────────────────────────────────────────────────

const TRIGGER_ICONS = {
  heavy_rain: "rainy-outline",
  severe_aqi: "cloud-outline",
  flood: "water-outline",
  curfew: "ban-outline",
  extreme_heat: "thermometer-outline",
  traffic_congestion: "car-outline",
};

function money(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function mapClaimStatus(payoutStatus, claimStatus) {
  const s = (payoutStatus || claimStatus || "").toLowerCase();
  if (["paid", "approved", "success", "completed"].includes(s)) return "paid";
  if (s === "rejected") return "rejected";
  return "under-review";
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });
}

function prettyTrigger(type) {
  if (!type) return "Disruption";
  return type
    .split("_")
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1))
    .join(" ");
}

function titleCase(str) {
  if (!str) return "Standard";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function humanizeToken(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function summarizeFraudFlags(flags) {
  if (!Array.isArray(flags) || flags.length === 0) return "Risk checks failed";
  const cleanFlags = flags
    .filter((flag) => typeof flag === "string" && flag.trim().length > 0)
    .map(humanizeToken);
  if (cleanFlags.length === 0) return "Risk checks failed";
  if (cleanFlags.length <= 2) return cleanFlags.join(" · ");
  return `${cleanFlags.slice(0, 2).join(" · ")} +${cleanFlags.length - 2} more`;
}

// ─── filter options ──────────────────────────────────────────────────────────

const FILTER_KEYS = [
  { key: "all", tKey: "all" },
  { key: "paid", tKey: "settled" },
  { key: "under-review", tKey: "review" },
  { key: "rejected", tKey: "rejected" },
];

// ─── component ───────────────────────────────────────────────────────────────

export default function ClaimsScreen({ navigation }) {
  const { user, token } = useAuth();
  const { COLORS, FONTS } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(COLORS, FONTS), [COLORS, FONTS]);

  const STATUS = useMemo(
    () => ({
      paid: {
        bg: COLORS.successContainer,
        color: COLORS.success,
        label: t("settled"),
        accent: COLORS.success,
      },
      "under-review": {
        bg: COLORS.amberContainer,
        color: COLORS.amber,
        label: t("processing"),
        accent: COLORS.amber,
      },
      rejected: {
        bg: COLORS.errorContainer,
        color: COLORS.error,
        label: t("rejected"),
        accent: COLORS.error,
      },
    }),
    [COLORS, t],
  );

  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [claims, setClaims] = useState([]);

  const loadClaims = useCallback(
    async (isRefresh = false) => {
      if (!user?.delivery_id) {
        setLoading(false);
        setClaims([]);
        setError("Delivery ID missing for this account.");
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      try {
        const res = await api
          .getWorkerClaims(token, user.delivery_id)
          .catch(() => null);
        setClaims(res?.data || []);
        if (!res) setError("Unable to fetch claims right now.");
      } catch {
        setError("Unable to fetch claims right now.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, user?.delivery_id],
  );

  useEffect(() => {
    loadClaims(false);
  }, [loadClaims]);

  const normalized = useMemo(
    () =>
      claims.map((c) => ({
        ...c,
        _status: mapClaimStatus(c.payout_status, c.status),
        _icon: TRIGGER_ICONS[c.trigger_type] || "document-text-outline",
      })),
    [claims],
  );

  const filtered =
    filter === "all"
      ? normalized
      : normalized.filter((c) => c._status === filter);
  const totalReceived = normalized
    .filter((c) => c._status === "paid")
    .reduce((a, c) => a + (Number(c.payout_amount) || 0), 0);
  const paidCount = normalized.filter((c) => c._status === "paid").length;
  const reviewCount = normalized.filter(
    (c) => c._status === "under-review",
  ).length;
  const rejectedCount = normalized.filter(
    (c) => c._status === "rejected",
  ).length;
  const countFor = (k) =>
    k === "all"
      ? normalized.length
      : normalized.filter((c) => c._status === k).length;

  // ── loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("nav_claims")}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loaderWrap}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loaderText}>{t("loading_claims")}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── main view ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* ── header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("nav_claims")}</Text>
        <TouchableOpacity
          onPress={() => loadClaims(true)}
          style={styles.iconBtn}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <Ionicons name="refresh-outline" size={18} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* error banner */}
        {!!error && (
          <View style={styles.errorBanner}>
            <Ionicons name="warning-outline" size={15} color={COLORS.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* ── hero stats ── */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroEyebrow}>{t("total_received")}</Text>
              <Text style={styles.heroAmount}>{money(totalReceived)}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeNum}>{normalized.length}</Text>
              <Text style={styles.heroBadgeLabel}>{t("claims_badge")}</Text>
            </View>
          </View>
          <View style={styles.heroRow}>
            <View style={styles.heroStat}>
              <View
                style={[
                  styles.heroStatDot,
                  { backgroundColor: COLORS.success },
                ]}
              />
              <Text style={styles.heroStatNum}>{paidCount}</Text>
              <Text style={styles.heroStatLabel}>{t("settled")}</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View style={styles.heroStat}>
              <View
                style={[styles.heroStatDot, { backgroundColor: COLORS.amber }]}
              />
              <Text style={styles.heroStatNum}>{reviewCount}</Text>
              <Text style={styles.heroStatLabel}>{t("review")}</Text>
            </View>
            <View style={styles.heroStatSep} />
            <View style={styles.heroStat}>
              <View
                style={[styles.heroStatDot, { backgroundColor: COLORS.error }]}
              />
              <Text style={styles.heroStatNum}>{rejectedCount}</Text>
              <Text style={styles.heroStatLabel}>{t("rejected")}</Text>
            </View>
          </View>
        </View>

        {/* auto-claim note */}
        <View style={styles.noteRow}>
          <Ionicons
            name="shield-checkmark-outline"
            size={13}
            color={COLORS.primary}
          />
          <Text style={styles.noteText}>{t("auto_claim_note")}</Text>
        </View>

        {/* ── filter tabs ── */}
        <View style={styles.filterTabs}>
          {FILTER_KEYS.map((opt) => {
            const active = filter === opt.key;
            const count = countFor(opt.key);
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setFilter(opt.key)}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    active && styles.filterTabTextActive,
                  ]}
                >
                  {t(opt.tKey)}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.filterBadge,
                      active && styles.filterBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterBadgeText,
                        active && styles.filterBadgeTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── claims list ── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="document-text-outline"
                size={30}
                color={COLORS.textFaint}
              />
            </View>
            <Text style={styles.emptyTitle}>{t("nothing_here")}</Text>
            <Text style={styles.emptySub}>
              {filter === "all"
                ? t("no_claims_empty")
                : `${t("no_claims")} (${t(filter === "paid" ? "settled" : filter === "under-review" ? "processing" : "rejected")})`}
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {filtered.map((claim, idx) => {
              const sc = STATUS[claim._status] || STATUS["under-review"];
              const key = claim.id || claim.claim_number || idx;
              return (
                <View key={key} style={styles.card}>
                  {/* left accent stripe */}
                  <View
                    style={[styles.cardAccent, { backgroundColor: sc.accent }]}
                  />

                  <View style={styles.cardBody}>
                    {/* top: icon · type · amount + status */}
                    <View style={styles.cardHead}>
                      <View
                        style={[styles.cardIconBg, { backgroundColor: sc.bg }]}
                      >
                        <Ionicons
                          name={claim._icon}
                          size={17}
                          color={sc.color}
                        />
                      </View>

                      <View style={styles.cardHeadMid}>
                        <Text style={styles.cardType}>
                          {prettyTrigger(claim.trigger_type)}
                        </Text>
                        <Text style={styles.cardMeta}>
                          {claim.city || user?.city || "Unknown"}
                          {" · "}
                          {formatDate(claim.created_at)}
                        </Text>
                      </View>

                      <View style={styles.cardHeadRight}>
                        <Text
                          style={[
                            styles.cardAmount,
                            {
                              color:
                                claim._status === "rejected"
                                  ? COLORS.textFaint
                                  : COLORS.white,
                            },
                          ]}
                        >
                          {claim._status === "rejected"
                            ? "—"
                            : money(Number(claim.payout_amount))}
                        </Text>
                        <View
                          style={[
                            styles.statusChip,
                            { backgroundColor: sc.bg },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusChipDot,
                              { backgroundColor: sc.color },
                            ]}
                          />
                          <Text
                            style={[styles.statusChipText, { color: sc.color }]}
                          >
                            {sc.label}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* facts row */}
                    <View style={styles.factsRow}>
                      <View style={styles.fact}>
                        <Text style={styles.factLabel}>
                          {t("fact_disrupted")}
                        </Text>
                        <Text style={styles.factVal}>
                          {claim.disrupted_hours || 0} {t("hrs")}
                        </Text>
                      </View>
                      <View style={styles.factSep} />
                      <View style={[styles.fact, { flex: 1.6 }]}>
                        <Text style={styles.factLabel}>
                          {t("fact_claim_id")}
                        </Text>
                        <Text style={styles.factVal} numberOfLines={1}>
                          {claim.claim_number
                            ? `#${claim.claim_number}`
                            : claim.id
                              ? `#${claim.id}`
                              : "—"}
                        </Text>
                      </View>
                      <View style={styles.factSep} />
                      <View style={styles.fact}>
                        <Text style={styles.factLabel}>{t("fact_plan")}</Text>
                        <Text style={styles.factVal}>
                          {titleCase(claim.tier || user?.tier)}
                        </Text>
                      </View>
                    </View>

                    {/* footer strip: txn ref or rejection reason */}
                    {claim._status === "paid" && (
                      <View
                        style={[
                          styles.cardFooter,
                          { backgroundColor: COLORS.successContainer },
                        ]}
                      >
                        <Ionicons
                          name="flash-outline"
                          size={11}
                          color={COLORS.success}
                        />
                        <Text
                          style={[
                            styles.cardFooterText,
                            { color: COLORS.success },
                          ]}
                        >
                          {claim.transaction_id
                            ? `Ref: ${claim.transaction_id}`
                            : t("approved_payout_note")}
                        </Text>
                      </View>
                    )}
                    {claim._status === "rejected" && (
                      <View
                        style={[styles.cardFooter, styles.cardFooterNeutral]}
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={11}
                          color={COLORS.textMuted}
                        />
                        <Text
                          style={[
                            styles.cardFooterText,
                            styles.cardFooterTextMuted,
                          ]}
                          numberOfLines={1}
                        >
                          {summarizeFraudFlags(claim.fraud_flags)}
                        </Text>
                      </View>
                    )}
                    {claim._status === "under-review" && (
                      <View
                        style={[
                          styles.cardFooter,
                          { backgroundColor: COLORS.amberContainer },
                        ]}
                      >
                        <Ionicons
                          name="time-outline"
                          size={11}
                          color={COLORS.amber}
                        />
                        <Text
                          style={[
                            styles.cardFooterText,
                            { color: COLORS.amber },
                          ]}
                        >
                          {t("under_review_note")}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // header
    header: {
      height: 56,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: SIZES.padding,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      backgroundColor: COLORS.surface,
    },
    headerTitle: {
      fontSize: SIZES.h3,
      fontFamily: FONTS.bold,
      color: COLORS.white,
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.surfaceHigh,
      justifyContent: "center",
      alignItems: "center",
    },

    scroll: { paddingBottom: SIZES.padding * 3 },

    loaderWrap: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    loaderText: {
      fontSize: SIZES.small,
      fontFamily: FONTS.medium,
      color: COLORS.textMuted,
    },

    // error banner
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginHorizontal: SIZES.padding,
      marginTop: SIZES.padding,
      backgroundColor: COLORS.errorContainer,
      borderLeftWidth: 3,
      borderLeftColor: COLORS.error,
      borderRadius: SIZES.radius,
      padding: 12,
    },
    errorBannerText: {
      flex: 1,
      fontSize: SIZES.small,
      fontFamily: FONTS.medium,
      color: COLORS.error,
    },

    // hero card
    heroCard: {
      margin: SIZES.padding,
      marginBottom: 0,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: SIZES.radius * 1.5,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: SIZES.padding,
      overflow: "hidden",
      ...SHADOWS.card,
    },
    heroGlow: {
      position: "absolute",
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: COLORS.primary,
      opacity: 0.05,
      top: -90,
      right: -50,
    },
    heroTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: SIZES.padding,
    },
    heroEyebrow: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: COLORS.textFaint,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    heroAmount: {
      fontSize: 44,
      fontFamily: FONTS.display,
      color: COLORS.white,
      letterSpacing: -1.5,
    },
    heroBadge: {
      backgroundColor: COLORS.primaryContainer,
      borderRadius: SIZES.radius,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.borderActive,
    },
    heroBadgeNum: {
      fontSize: SIZES.h3,
      fontFamily: FONTS.bold,
      color: COLORS.primary,
    },
    heroBadgeLabel: {
      fontSize: 10,
      fontFamily: FONTS.medium,
      color: COLORS.primary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    heroRow: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceHigh,
      borderRadius: SIZES.radius,
      padding: 12,
    },
    heroStat: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    heroStatDot: { width: 6, height: 6, borderRadius: 3 },
    heroStatNum: {
      fontSize: SIZES.body,
      fontFamily: FONTS.bold,
      color: COLORS.white,
    },
    heroStatLabel: {
      fontSize: 11,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
    },
    heroStatSep: { width: 1, backgroundColor: COLORS.border },

    // note row
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: SIZES.padding,
      paddingVertical: 10,
    },
    noteText: {
      flex: 1,
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: COLORS.primary,
    },

    // filter tabs
    filterTabs: {
      flexDirection: "row",
      marginHorizontal: SIZES.padding,
      marginBottom: SIZES.padding * 0.8,
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: SIZES.radius,
      borderWidth: 1,
      borderColor: COLORS.border,
      padding: 4,
    },
    filterTab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      paddingVertical: 9,
      borderRadius: SIZES.radius - 2,
    },
    filterTabActive: { backgroundColor: COLORS.surfaceHighest },
    filterTabText: {
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      color: COLORS.textFaint,
    },
    filterTabTextActive: { color: COLORS.white },
    filterBadge: {
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: COLORS.surfaceHigh,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    filterBadgeActive: { backgroundColor: COLORS.primaryContainer },
    filterBadgeText: {
      fontSize: 9,
      fontFamily: FONTS.bold,
      color: COLORS.textFaint,
    },
    filterBadgeTextActive: { color: COLORS.primary },

    // empty state
    emptyWrap: {
      alignItems: "center",
      paddingVertical: SIZES.padding * 2.5,
      paddingHorizontal: SIZES.padding,
    },
    emptyIcon: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: COLORS.surfaceContainer,
      borderWidth: 1,
      borderColor: COLORS.border,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: SIZES.padding,
    },
    emptyTitle: {
      fontSize: SIZES.body,
      fontFamily: FONTS.bold,
      color: COLORS.white,
      marginBottom: 6,
    },
    emptySub: {
      fontSize: SIZES.small,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
      textAlign: "center",
      lineHeight: 20,
    },

    // claims list
    list: { paddingHorizontal: SIZES.padding, gap: 10 },

    // claim card
    card: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceContainer,
      borderRadius: SIZES.radius * 1.2,
      borderWidth: 1,
      borderColor: COLORS.border,
      overflow: "hidden",
      ...SHADOWS.card,
    },
    cardAccent: { width: 3 },
    cardBody: { flex: 1 },

    // card head
    cardHead: {
      flexDirection: "row",
      alignItems: "center",
      gap: 11,
      paddingTop: 13,
      paddingBottom: 12,
      paddingLeft: 11,
      paddingRight: 13,
    },
    cardIconBg: {
      width: 38,
      height: 38,
      borderRadius: 11,
      justifyContent: "center",
      alignItems: "center",
      flexShrink: 0,
    },
    cardHeadMid: { flex: 1 },
    cardType: {
      fontSize: SIZES.body,
      fontFamily: FONTS.bold,
      color: COLORS.white,
      marginBottom: 3,
    },
    cardMeta: {
      fontSize: 12,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
    },
    cardHeadRight: { alignItems: "flex-end", gap: 6 },
    cardAmount: {
      fontSize: 18,
      fontFamily: FONTS.display,
      letterSpacing: -0.5,
    },

    statusChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: SIZES.radiusFull,
    },
    statusChipDot: { width: 5, height: 5, borderRadius: 3 },
    statusChipText: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      letterSpacing: 0.2,
    },

    // facts row
    factsRow: {
      flexDirection: "row",
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: COLORS.surface,
    },
    fact: { flex: 1, alignItems: "center" },
    factLabel: {
      fontSize: 9,
      fontFamily: FONTS.bold,
      color: COLORS.textFaint,
      letterSpacing: 0.8,
      textTransform: "uppercase",
      marginBottom: 4,
    },
    factVal: {
      fontSize: SIZES.small,
      fontFamily: FONTS.semiBold,
      color: COLORS.white,
    },
    factSep: { width: 1, backgroundColor: COLORS.border },

    // footer strip
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 7,
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },
    cardFooterText: {
      flex: 1,
      fontSize: 11,
      fontFamily: FONTS.semiBold,
      lineHeight: 15,
    },
    cardFooterNeutral: { backgroundColor: COLORS.surfaceHigh },
    cardFooterTextMuted: { color: COLORS.textMuted },
  });
