import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  { icon: "flash", label: "Auto-Claims" },
  { icon: "rainy", label: "Weather Alerts" },
  { icon: "cash", label: "Instant Payouts" },
];

const PLATFORMS = ["Zomato", "Swiggy", "Amazon", "Blinkit", "Zepto"];

const LandingScreen = ({ navigation }) => {
  const { COLORS, FONTS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS, FONTS), [COLORS, FONTS]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield-checkmark" size={18} color="#FFFDFB" />
            </View>
            <Text style={styles.logoText}>WPIP</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginLink}>Login</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.heroBadge}>
            <View style={styles.activeDot} />
            <Text style={styles.heroBadgeText}>AI-Powered Protection</Text>
          </View>

          <Text style={styles.heroTitle}>Your Income.{"\n"}Protected.</Text>
          <Text style={styles.heroSubtitle}>
            Automatic payouts when rain, AQI, or curfews stop your deliveries.
            No paperwork. No waiting.
          </Text>

          <View style={styles.featureRow}>
            {FEATURES.map((f) => (
              <View key={f.label} style={styles.featurePill}>
                <Ionicons name={f.icon} size={14} color={COLORS.amber} />
                <Text style={styles.featurePillText}>{f.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Shield card */}
        <View style={styles.shieldCard}>
          <View style={styles.shieldGlow} />
          <Ionicons name="shield-checkmark" size={64} color={COLORS.primary} style={{ zIndex: 1 }} />
          <Text style={styles.shieldCardTitle}>Income Shield Active</Text>
          <View style={styles.shieldMetrics}>
            {[
              { value: "₹1,200", label: "Max Weekly Cover" },
              { value: "15 min", label: "Trigger Polling" },
              { value: "5 triggers", label: "Events Covered" },
            ].map((m, i) => (
              <React.Fragment key={m.label}>
                {i > 0 && <View style={styles.shieldMetricDivider} />}
                <View style={styles.shieldMetric}>
                  <Text style={styles.shieldMetricValue}>{m.value}</Text>
                  <Text style={styles.shieldMetricLabel}>{m.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          {[
            { n: "1", text: "Register & verify your delivery platforms" },
            { n: "2", text: "Pay ₹20–130/week based on your earnings & risk" },
            { n: "3", text: "Auto-claims fire when disruptions hit your zone" },
          ].map((step) => (
            <View key={step.n} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{step.n}</Text>
              </View>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("SignUp")}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Get Protected — Free Setup</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFDFB" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Login")}
          style={{ alignItems: "center", marginTop: SIZES.padding }}
        >
          <Text style={styles.loginHint}>
            Already insured?{" "}
            <Text style={{ color: COLORS.primary }}>Log in</Text>
          </Text>
        </TouchableOpacity>

        <View style={styles.platformRow}>
          {PLATFORMS.map((p) => (
            <View key={p} style={styles.platformPill}>
              <Text style={styles.platformText}>{p}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.footer}>
          © 2026 WPIP Technologies · IRDAI Registered
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    scroll: { paddingBottom: SIZES.padding * 3 },

    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: SIZES.padding,
      paddingTop: SIZES.padding,
      paddingBottom: SIZES.base,
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: SIZES.base },
    logoIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
    },
    logoText: {
      fontSize: 18,
      fontFamily: FONTS.display,
      color: COLORS.white,
      letterSpacing: 0.5,
    },
    loginLink: {
      fontSize: 14,
      fontFamily: FONTS.semiBold,
      color: COLORS.primary,
    },

    heroSection: {
      paddingHorizontal: SIZES.padding,
      paddingTop: SIZES.padding * 1.5,
      paddingBottom: SIZES.padding,
    },
    heroBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: COLORS.primaryContainer,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: SIZES.radiusFull,
      alignSelf: "flex-start",
      marginBottom: SIZES.padding,
      borderWidth: 1,
      borderColor: COLORS.primary + "40",
    },
    activeDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: COLORS.success,
    },
    heroBadgeText: {
      fontSize: SIZES.tiny,
      fontFamily: FONTS.semiBold,
      color: COLORS.primary,
      letterSpacing: 0.5,
    },
    heroTitle: {
      fontSize: 40,
      fontFamily: FONTS.display,
      color: COLORS.white,
      lineHeight: 48,
      marginBottom: SIZES.padding * 0.75,
      letterSpacing: -0.5,
    },
    heroSubtitle: {
      fontSize: SIZES.body,
      fontFamily: FONTS.regular,
      color: COLORS.textMuted,
      lineHeight: 24,
      marginBottom: SIZES.padding,
    },
    featureRow: { flexDirection: "row", gap: SIZES.base, flexWrap: "wrap" },
    featurePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: COLORS.surfaceHigh,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: SIZES.radiusFull,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    featurePillText: {
      fontSize: SIZES.small,
      fontFamily: FONTS.semiBold,
      color: COLORS.white,
    },

    shieldCard: {
      marginHorizontal: SIZES.padding,
      borderRadius: SIZES.radius * 1.5,
      backgroundColor: COLORS.surfaceContainer,
      padding: SIZES.padding * 1.25,
      alignItems: "center",
      marginBottom: SIZES.padding,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: COLORS.border,
      ...SHADOWS.card,
    },
    shieldGlow: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: COLORS.primary,
      opacity: 0.08,
      top: -40,
      alignSelf: "center",
    },
    shieldCardTitle: {
      fontSize: SIZES.h3,
      fontFamily: FONTS.display,
      color: COLORS.white,
      marginTop: SIZES.base,
      marginBottom: SIZES.padding,
    },
    shieldMetrics: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
      paddingTop: SIZES.padding,
    },
    shieldMetric: { flex: 1, alignItems: "center" },
    shieldMetricValue: {
      fontSize: 16,
      fontFamily: FONTS.bold,
      color: COLORS.primary,
      marginBottom: 4,
    },
    shieldMetricLabel: {
      fontSize: SIZES.tiny,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
      textAlign: "center",
    },
    shieldMetricDivider: { width: 1, backgroundColor: COLORS.border },

    section: { paddingHorizontal: SIZES.padding, marginBottom: SIZES.padding },
    sectionTitle: {
      fontSize: SIZES.h3,
      fontFamily: FONTS.display,
      color: COLORS.white,
      marginBottom: SIZES.padding,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SIZES.padding * 0.75,
      marginBottom: SIZES.padding * 0.75,
    },
    stepNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: COLORS.primaryContainer,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.primary,
    },
    stepNumText: {
      fontSize: SIZES.small,
      fontFamily: FONTS.bold,
      color: COLORS.primary,
    },
    stepText: {
      flex: 1,
      fontSize: SIZES.body,
      fontFamily: FONTS.regular,
      color: COLORS.textMuted,
      lineHeight: 22,
      paddingTop: 3,
    },

    ctaButton: {
      marginHorizontal: SIZES.padding,
      height: 56,
      borderRadius: SIZES.radiusFull,
      backgroundColor: COLORS.primary,
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 10,
      ...SHADOWS.button,
    },
    ctaText: { fontSize: 16, fontFamily: FONTS.bold, color: "#FFFDFB" },
    loginHint: {
      fontSize: SIZES.small,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
    },

    platformRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: SIZES.base,
      paddingHorizontal: SIZES.padding,
      marginTop: SIZES.padding * 1.5,
    },
    platformPill: {
      backgroundColor: COLORS.surfaceHigh,
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: SIZES.radiusFull,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    platformText: {
      fontSize: SIZES.tiny,
      fontFamily: FONTS.semiBold,
      color: COLORS.textFaint,
    },

    footer: {
      textAlign: "center",
      fontSize: 11,
      fontFamily: FONTS.regular,
      color: COLORS.textFaint,
      marginTop: SIZES.padding,
      paddingHorizontal: SIZES.padding,
    },
  });

export default LandingScreen;
