import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

// ─── static data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "rainy-outline",
    title: "Weather-Adjusted Premiums",
    sub:  "Premiums recalculate weekly based on rain, AQI & city risk.",
  },
  {
    icon: "flash-outline",
    title: "Automatic Claim Payouts",
    sub:  "Disruption events trigger payouts directly — no forms, no waiting.",
  },
  {
    icon: "phone-portrait-outline",
    title: "Works Across All Platforms",
    sub:  "Covers Swiggy, Zomato, Blinkit, Zepto, Porter & more simultaneously.",
  },
];

// ─── component ───────────────────────────────────────────────────────────────

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { COLORS, FONTS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS, FONTS), [COLORS, FONTS]);

  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [showPwd, setShowPwd]           = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwdFocused, setPwdFocused]     = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // SafeAreaView tinted to match the hero — status bar area is teal
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >

          {/* ═══════════════════════════════════════
              HERO SECTION — teal primary background
          ═══════════════════════════════════════ */}
          <View style={styles.hero}>

            {/* Background texture orbs */}
            <View style={styles.orb1} />
            <View style={styles.orb2} />
            <View style={styles.orb3} />

            {/* Logo + wordmark */}
            <View style={styles.heroNav}>
              <View style={styles.logoCircle}>
                <Ionicons name="shield-checkmark" size={20} color="#fff" />
              </View>
              <Text style={styles.wordmark}>GigGuard</Text>
            </View>

            {/* Headline + sub */}
            <Text style={styles.headline}>
              Income protection for every delivery, every week.
            </Text>
            <Text style={styles.heroPara}>
              Weather disruptions, platform downtime & income loss covered —
              starting at ₹40/week.
            </Text>

            {/* Features glass card */}
            <View style={styles.featuresCard}>
              {FEATURES.map((f, i) => (
                <View
                  key={f.title}
                  style={[
                    styles.featureRow,
                    i < FEATURES.length - 1 && styles.featureRowBorder,
                  ]}
                >
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={f.icon} size={17} color="rgba(255,255,255,0.85)" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.featureTitle}>{f.title}</Text>
                    <Text style={styles.featureSub}>{f.sub}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Scroll hint */}
            <View style={styles.scrollHint}>
              <Ionicons name="chevron-down" size={22} color="rgba(255,255,255,0.4)" />
            </View>

            {/* Dark-bg curved arc — transitions into the form section */}
            <View style={styles.heroCurve} />
          </View>

          {/* ═══════════════════════════════════════
              FORM SECTION — near-black background
          ═══════════════════════════════════════ */}
          <View style={styles.formSection}>

            {/* Log In / Sign Up tab switcher */}
            <View style={styles.tabRow}>
              <View style={styles.tabActive}>
                <Text style={styles.tabActiveText}>Log In</Text>
              </View>
              <TouchableOpacity
                style={styles.tabInactive}
                onPress={() => navigation.navigate("SignUp")}
                activeOpacity={0.7}
              >
                <Text style={styles.tabInactiveText}>Sign Up</Text>
              </TouchableOpacity>
            </View>

            {/* Error banner */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={15} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Email field */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <View style={[styles.inputWrap, emailFocused && styles.inputWrapActive]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={emailFocused ? COLORS.primary : COLORS.textFaint}
                  style={styles.prefixIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textFaint}
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>PASSWORD</Text>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.forgotLink}>Forgot?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrap, pwdFocused && styles.inputWrapActive]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={pwdFocused ? COLORS.primary : COLORS.textFaint}
                  style={styles.prefixIcon}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textFaint}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setPwdFocused(true)}
                  onBlur={() => setPwdFocused(false)}
                  secureTextEntry={!showPwd}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardAppearance="dark"
                />
                <TouchableOpacity
                  onPress={() => setShowPwd((v) => !v)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.eyeBtn}
                >
                  <Ionicons
                    name={showPwd ? "eye-off-outline" : "eye-outline"}
                    size={18}
                    color={COLORS.textFaint}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Primary CTA */}
            <TouchableOpacity
              style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.signInBtnText}>Access Dashboard</Text>
              )}
            </TouchableOpacity>

            {/* Footer note */}
            <Text style={styles.footerNote}>
              GigGuard · IRDAI Registered · 256-bit encrypted
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ─── styles ──────────────────────────────────────────────────────────────────

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({

    // Root — teal bg so status bar area matches the hero
    safe: { flex: 1, backgroundColor: COLORS.primary },

    scroll: { flexGrow: 1 },

    // ── Hero ──────────────────────────────────────────────────
    hero: {
      backgroundColor: COLORS.primary,
      paddingTop: SIZES.padding * 1.5,
      paddingHorizontal: SIZES.padding,
      paddingBottom: 0,
      overflow: "hidden",
    },

    // Texture orbs — subtle white glows for depth
    orb1: {
      position: "absolute",
      width: 220, height: 220, borderRadius: 110,
      backgroundColor: "rgba(255,255,255,0.06)",
      top: -70, right: -60,
    },
    orb2: {
      position: "absolute",
      width: 130, height: 130, borderRadius: 65,
      backgroundColor: "rgba(255,255,255,0.04)",
      top: 100, left: -40,
    },
    orb3: {
      position: "absolute",
      width: 70, height: 70, borderRadius: 35,
      backgroundColor: "rgba(255,255,255,0.07)",
      top: 55, right: 40,
    },

    // Logo row
    heroNav: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: SIZES.padding * 2,
    },
    logoCircle: {
      width: 40, height: 40, borderRadius: 13,
      backgroundColor: "rgba(255,255,255,0.15)",
      borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
      justifyContent: "center", alignItems: "center",
    },
    wordmark: {
      fontSize: SIZES.h2,
      fontFamily: FONTS.display,
      color: "#fff",
      letterSpacing: 0.3,
    },

    // Headline
    headline: {
      fontSize: 28,
      fontFamily: FONTS.display,
      color: "#fff",
      lineHeight: 37,
      letterSpacing: -0.5,
      marginBottom: SIZES.base + 2,
    },
    heroPara: {
      fontSize: SIZES.small,
      fontFamily: FONTS.medium,
      color: "rgba(255,255,255,0.68)",
      lineHeight: 21,
      marginBottom: SIZES.padding * 1.5,
    },

    // Features glass card
    featuresCard: {
      backgroundColor: "rgba(0,0,0,0.18)",
      borderRadius: SIZES.radius * 1.5,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.13)",
      overflow: "hidden",
      marginBottom: SIZES.padding,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: SIZES.padding * 0.8,
      paddingHorizontal: SIZES.padding * 0.85,
    },
    featureRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: "rgba(255,255,255,0.09)",
    },
    featureIconWrap: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.12)",
      justifyContent: "center", alignItems: "center",
      flexShrink: 0,
    },
    featureTitle: {
      fontSize: SIZES.small,
      fontFamily: FONTS.bold,
      color: "#fff",
      marginBottom: 2,
    },
    featureSub: {
      fontSize: 12,
      fontFamily: FONTS.regular,
      color: "rgba(255,255,255,0.6)",
      lineHeight: 17,
    },

    // Scroll hint chevron
    scrollHint: {
      alignItems: "center",
      paddingTop: SIZES.padding * 0.5,
      paddingBottom: SIZES.base,
    },

    // Arc transition to form section
    heroCurve: {
      height: 34,
      backgroundColor: COLORS.background,
      borderTopLeftRadius: 30,
      borderTopRightRadius: 30,
    },

    // ── Form Section ──────────────────────────────────────────
    formSection: {
      backgroundColor: COLORS.background,
      paddingHorizontal: SIZES.padding,
      paddingTop: SIZES.padding,
      paddingBottom: SIZES.padding * 3,
    },

    // Tab switcher
    tabRow: {
      flexDirection: "row",
      backgroundColor: COLORS.surfaceHigh,
      borderRadius: SIZES.radius + 4,
      padding: 4,
      marginBottom: SIZES.padding * 1.3,
    },
    tabActive: {
      flex: 1,
      paddingVertical: 13,
      backgroundColor: COLORS.primary,
      borderRadius: SIZES.radius,
      alignItems: "center",
      ...SHADOWS.button,
    },
    tabActiveText: {
      fontSize: SIZES.body,
      fontFamily: FONTS.bold,
      color: "#fff",
    },
    tabInactive: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: SIZES.radius,
      alignItems: "center",
    },
    tabInactiveText: {
      fontSize: SIZES.body,
      fontFamily: FONTS.semiBold,
      color: COLORS.textFaint,
    },

    // Error banner
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: COLORS.errorContainer,
      borderLeftWidth: 3, borderLeftColor: COLORS.error,
      borderRadius: SIZES.radius,
      paddingHorizontal: 12, paddingVertical: 11,
      marginBottom: SIZES.padding,
    },
    errorText: {
      flex: 1,
      fontSize: SIZES.small,
      fontFamily: FONTS.medium,
      color: COLORS.error,
    },

    // Input fields
    fieldGroup: { marginBottom: SIZES.padding * 0.9 },
    label: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: COLORS.textFaint,
      letterSpacing: 1.3,
      marginBottom: 8,
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    forgotLink: {
      fontSize: SIZES.small,
      fontFamily: FONTS.bold,
      color: COLORS.primary,
    },
    inputWrap: {
      height: 54,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surfaceHigh,
      borderRadius: SIZES.radius,
      borderWidth: 1, borderColor: COLORS.border,
      paddingHorizontal: 14,
    },
    inputWrapActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.surfaceHighest,
    },
    prefixIcon: { marginRight: 10 },
    input: {
      fontSize: SIZES.body,
      fontFamily: FONTS.regular,
      color: COLORS.white,
    },
    eyeBtn: { paddingLeft: 10 },

    // CTA button
    signInBtn: {
      height: 56,
      borderRadius: SIZES.radiusFull,
      backgroundColor: COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
      marginTop: SIZES.padding * 0.5,
      marginBottom: SIZES.padding * 1.5,
      ...SHADOWS.button,
    },
    signInBtnDisabled: { opacity: 0.65 },
    signInBtnText: {
      fontSize: SIZES.h3,
      fontFamily: FONTS.bold,
      color: "#fff",
      letterSpacing: 0.2,
    },

    // Footer
    footerNote: {
      textAlign: "center",
      fontSize: 11,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
      lineHeight: 16,
    },
  });

export default LoginScreen;
