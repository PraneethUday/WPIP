import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

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
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.container}>

          {/* back arrow */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* logo + heading */}
          <View style={styles.logoRow}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield-checkmark" size={22} color="#fff" />
            </View>
          </View>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subheading}>Sign in to your WPIP account</Text>

          {/* error */}
          {!!error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle-outline" size={15} color={COLORS.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>EMAIL</Text>
            <View style={[styles.inputWrap, emailFocused && styles.inputWrapActive]}>
              <Ionicons
                name="mail-outline"
                size={18}
                color={emailFocused ? COLORS.primary : COLORS.textFaint}
                style={styles.prefixIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
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

          {/* password */}
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
                placeholder="Enter your password"
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

          {/* sign in button */}
          <TouchableOpacity
            style={[styles.signInBtn, loading && styles.signInBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.signInBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>new here?</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* register */}
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => navigation.navigate("SignUp")}
            activeOpacity={0.8}
          >
            <Text style={styles.registerBtnText}>Create an account</Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    kav:  { flex: 1 },

    container: {
      flex: 1,
      paddingHorizontal: SIZES.padding + 4,
      justifyContent: "center",
    },

    backBtn: {
      position: "absolute",
      top: SIZES.padding,
      left: SIZES.padding,
      width: 40, height: 40,
      borderRadius: 12,
      backgroundColor: COLORS.surfaceHigh,
      justifyContent: "center",
      alignItems: "center",
    },

    logoRow: { alignItems: "center", marginBottom: SIZES.padding },
    logoIcon: {
      width: 58, height: 58, borderRadius: 18,
      backgroundColor: COLORS.primary,
      justifyContent: "center", alignItems: "center",
      ...SHADOWS.button,
    },

    heading: {
      fontSize: SIZES.h1,
      fontFamily: FONTS.display,
      color: COLORS.white,
      textAlign: "center",
      marginBottom: 6,
    },
    subheading: {
      fontSize: SIZES.small,
      fontFamily: FONTS.regular,
      color: COLORS.textFaint,
      textAlign: "center",
      marginBottom: SIZES.padding * 1.5,
    },

    errorBanner: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: COLORS.errorContainer,
      borderWidth: 1, borderColor: COLORS.error + "35",
      borderRadius: SIZES.radius,
      paddingHorizontal: 12, paddingVertical: 10,
      marginBottom: SIZES.padding,
    },
    errorText: {
      flex: 1, fontSize: SIZES.small,
      fontFamily: FONTS.medium, color: COLORS.error,
    },

    fieldGroup: { marginBottom: SIZES.padding },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    label: {
      fontSize: 10,
      fontFamily: FONTS.bold,
      color: COLORS.textFaint,
      letterSpacing: 1.2,
      marginBottom: 8,
    },
    forgotLink: {
      fontSize: SIZES.small,
      fontFamily: FONTS.bold,
      color: COLORS.primary,
    },
    inputWrap: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surfaceHigh,
      borderRadius: SIZES.radius,
      borderWidth: 1,
      borderColor: COLORS.border,
      paddingHorizontal: 14,
    },
    inputWrapActive: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.surfaceHighest,
    },
    prefixIcon: { marginRight: 10 },
    input: {
      flex: 1,
      fontSize: SIZES.body,
      fontFamily: FONTS.regular,
      color: COLORS.white,
    },
    eyeBtn: { paddingLeft: 10 },

    signInBtn: {
      height: 54,
      borderRadius: SIZES.radiusFull,
      backgroundColor: COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
      marginTop: SIZES.base,
      ...SHADOWS.button,
    },
    signInBtnDisabled: { opacity: 0.65 },
    signInBtnText: {
      fontSize: SIZES.body,
      fontFamily: FONTS.bold,
      color: "#fff",
    },

    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginVertical: SIZES.padding,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
    dividerText: {
      fontSize: SIZES.tiny,
      fontFamily: FONTS.medium,
      color: COLORS.textFaint,
    },

    registerBtn: {
      height: 50,
      borderRadius: SIZES.radiusFull,
      borderWidth: 1,
      borderColor: COLORS.borderActive,
      justifyContent: "center",
      alignItems: "center",
    },
    registerBtnText: {
      fontSize: SIZES.body,
      fontFamily: FONTS.semiBold,
      color: COLORS.primary,
    },
  });

export default LoginScreen;
