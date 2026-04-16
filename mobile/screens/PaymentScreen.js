import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SIZES, SHADOWS } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import * as api from "../lib/api";

const STORAGE_KEY_PREFIX = "gg_payments_";

function money(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return `₹${Math.round(value)}`;
}
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatCardNumber(raw) {
  return raw.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

const METHOD_OPTIONS = [
  { id: "upi", label: "UPI", icon: "phone-portrait-outline" },
  { id: "debit", label: "Debit Card", icon: "card-outline" },
  { id: "credit", label: "Credit Card", icon: "wallet-outline" },
];

export default function PaymentScreen({ navigation }) {
  const { user, token } = useAuth();
  const { COLORS, FONTS } = useTheme();
  const styles = useMemo(() => createStyles(COLORS, FONTS), [COLORS, FONTS]);

  const [currentPremium, setCurrentPremium] = useState(null);
  const [loadingPremium, setLoadingPremium] = useState(true);
  const [payments, setPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [method, setMethod] = useState("upi");
  const [form, setForm] = useState({ upiId: "", cardNumber: "", expiry: "", cvv: "", name: "" });
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [paySuccess, setPaySuccess] = useState(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${user?.id || "guest"}`;

  const loadData = useCallback(async () => {
    // ── Premium ──────────────────────────────────────────────
    setLoadingPremium(true);
    try {
      if (user?.delivery_id && user?.city) {
        const res = await api.predictPremium(user.delivery_id, user.city, user?.tier || "standard");
        setCurrentPremium(res);
      }
    } catch {} finally {
      setLoadingPremium(false);
    }

    // ── Payment history — always prefer server ───────────────
    setLoadingHistory(true);
    setHistoryError("");
    try {
      const res = await api.getPaymentHistory(token);
      // Use server response unconditionally — it is the source of truth.
      // Server returns [] for accounts with no payments, which is correct.
      const serverPayments = res?.payments ?? [];
      setPayments(serverPayments);
      // Keep local cache in sync for offline use
      AsyncStorage.setItem(storageKey, JSON.stringify(serverPayments)).catch(() => {});
    } catch (err) {
      // Server failed — surface the real error and fall back to local cache
      const msg = err?.message || "Could not load payment history.";
      setHistoryError(msg);
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (raw) setPayments(JSON.parse(raw));
      } catch {
        setPayments([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  }, [user, token, storageKey]);

  useEffect(() => { loadData(); }, [loadData]);

  const weeklyAmount = user?.autopay ? currentPremium?.weekly_premium_autopay : currentPremium?.weekly_premium;
  const amount = weeklyAmount || currentPremium?.weekly_premium || 0;

  const paidThisWeek = payments.some((p) => {
    if (p.status !== "success") return false;
    return ((new Date() - new Date(p.timestamp)) / (1000 * 60 * 60 * 24)) < 7;
  });

  function openModal() {
    setForm({ upiId: "", cardNumber: "", expiry: "", cvv: "", name: "" });
    setPayError(""); setPaySuccess(null); setMethod("upi"); setShowModal(true);
  }
  function closeModal() { setShowModal(false); setPaySuccess(null); setPayError(""); setPaying(false); }

  function validateForm() {
    if (method === "upi") {
      if (!form.upiId.trim()) return "Enter your UPI ID.";
      if (!/^[\w.\-+]+@[\w]+$/.test(form.upiId.trim())) return "Enter a valid UPI ID (e.g. name@upi).";
    } else {
      if (form.cardNumber.replace(/\s/g, "").length !== 16) return "Enter a valid 16-digit card number.";
      if (!form.expiry || form.expiry.length < 5) return "Enter a valid expiry (MM/YY).";
      if (!form.cvv || form.cvv.length < 3) return "Enter a valid CVV.";
      if (!form.name.trim()) return "Enter the cardholder name.";
    }
    return null;
  }

  async function handlePay() {
    const err = validateForm();
    if (err) { setPayError(err); return; }
    setPaying(true); setPayError("");
    try {
      const res = await api.payPremium(token, { method, amount, tier: user?.tier || "standard", worker_id: user?.id });
      const record = {
        transaction_id: res.transaction_id, method,
        amount: res.amount ?? amount,
        tier: res.tier || user?.tier || "standard",
        status: "success",
        timestamp: res.timestamp || new Date().toISOString(),
      };
      const updated = [record, ...payments];
      setPayments(updated);
      await AsyncStorage.setItem(storageKey, JSON.stringify(updated));
      setPaySuccess(record);
    } catch (e) {
      setPayError(e.message || "Payment failed. Please try again.");
    } finally { setPaying(false); }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Pay Banner */}
        <View style={styles.payBanner}>
          <View style={styles.bannerGlow} />
          <Text style={styles.bannerLabel}>WEEKLY PREMIUM DUE</Text>
          {loadingPremium ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.bannerAmount}>{money(amount)}</Text>
          )}
          <View style={styles.bannerMeta}>
            <Text style={styles.bannerTier}>
              {(user?.tier || "standard").charAt(0).toUpperCase() + (user?.tier || "standard").slice(1)} Plan
            </Text>
            {user?.autopay && (
              <>
                <View style={styles.metaDot} />
                <Text style={styles.bannerDiscount}>5% AutoPay discount applied</Text>
              </>
            )}
          </View>
          {paidThisWeek ? (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
              <Text style={styles.paidBadgeText}>Paid this week</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.payBtn} onPress={openModal} activeOpacity={0.85}>
              <Ionicons name="card" size={18} color="#fff" />
              <Text style={styles.payBtnText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Payment History */}
        <Text style={styles.sectionTitle}>Payment History</Text>

        {!!historyError && (
          <View style={styles.historyErrorCard}>
            <Ionicons name="cloud-offline-outline" size={16} color={COLORS.error} />
            <Text style={styles.historyErrorText}>{historyError}</Text>
          </View>
        )}

        {loadingHistory ? (
          <View style={styles.historyLoading}>
            <ActivityIndicator color={COLORS.primary} size="small" />
            <Text style={styles.historyLoadingText}>Loading from server…</Text>
          </View>
        ) : payments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={32} color={COLORS.textFaint} />
            <Text style={styles.emptyText}>No payments yet.</Text>
            <Text style={styles.emptySubText}>Your payment receipts will appear here.</Text>
          </View>
        ) : (
          <View style={styles.historyCard}>
            {payments.map((p, i) => (
              <View key={p.transaction_id || i} style={[styles.historyRow, i < payments.length - 1 && styles.historyBorder]}>
                <View style={[styles.historyIcon, { backgroundColor: COLORS.successContainer }]}>
                  <Ionicons name={p.method === "upi" ? "phone-portrait-outline" : "card-outline"} size={18} color={COLORS.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyTitle}>
                    {p.method === "upi" ? "UPI" : p.method === "debit" ? "Debit Card" : "Credit Card"}
                    {" · "}
                    <Text style={styles.historyTxn}>{p.transaction_id || "—"}</Text>
                  </Text>
                  <Text style={styles.historyDate}>{formatDate(p.timestamp)}</Text>
                </View>
                <View style={styles.historyRight}>
                  <Text style={styles.historyAmount}>{money(p.amount)}</Text>
                  <Text style={styles.historyStatus}>Success</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <View style={styles.modalSheet}>
            {paySuccess ? (
              <View style={styles.successWrap}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={56} color={COLORS.success} />
                </View>
                <Text style={styles.successTitle}>Payment Successful</Text>
                <Text style={styles.successTxn}>{paySuccess.transaction_id}</Text>
                <Text style={styles.successAmount}>{money(paySuccess.amount)} paid</Text>
                <TouchableOpacity style={styles.doneBtn} onPress={closeModal}>
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Pay Premium</Text>
                  <TouchableOpacity onPress={closeModal} style={styles.modalClose}>
                    <Ionicons name="close" size={20} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalAmount}>{money(amount)}</Text>
                <Text style={styles.modalAmountLabel}>Weekly Premium</Text>
                <View style={styles.methodRow}>
                  {METHOD_OPTIONS.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.methodChip, method === m.id && styles.methodChipActive]}
                      onPress={() => { setMethod(m.id); setPayError(""); }}
                    >
                      <Ionicons name={m.icon} size={16} color={method === m.id ? COLORS.primary : COLORS.textFaint} />
                      <Text style={[styles.methodChipText, method === m.id && styles.methodChipTextActive]}>{m.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
                  {method === "upi" ? (
                    <View style={styles.field}>
                      <Text style={styles.fieldLabel}>UPI ID</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="yourname@upi"
                        placeholderTextColor={COLORS.textFaint}
                        value={form.upiId}
                        onChangeText={(t) => setForm((f) => ({ ...f, upiId: t }))}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                      <Text style={styles.inputHint}>e.g. name@okicici, name@ybl, name@paytm</Text>
                    </View>
                  ) : (
                    <>
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Cardholder Name</Text>
                        <TextInput style={styles.input} placeholder="Name on card" placeholderTextColor={COLORS.textFaint} value={form.name} onChangeText={(t) => setForm((f) => ({ ...f, name: t }))} autoCapitalize="words" />
                      </View>
                      <View style={styles.field}>
                        <Text style={styles.fieldLabel}>Card Number</Text>
                        <TextInput style={styles.input} placeholder="0000 0000 0000 0000" placeholderTextColor={COLORS.textFaint} value={form.cardNumber} onChangeText={(t) => setForm((f) => ({ ...f, cardNumber: formatCardNumber(t) }))} keyboardType="numeric" maxLength={19} />
                      </View>
                      <View style={styles.rowFields}>
                        <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                          <Text style={styles.fieldLabel}>Expiry</Text>
                          <TextInput style={styles.input} placeholder="MM/YY" placeholderTextColor={COLORS.textFaint} value={form.expiry} onChangeText={(t) => setForm((f) => ({ ...f, expiry: formatExpiry(t) }))} keyboardType="numeric" maxLength={5} />
                        </View>
                        <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                          <Text style={styles.fieldLabel}>CVV</Text>
                          <TextInput style={styles.input} placeholder="•••" placeholderTextColor={COLORS.textFaint} value={form.cvv} onChangeText={(t) => setForm((f) => ({ ...f, cvv: t.replace(/\D/g, "").slice(0, 4) }))} keyboardType="numeric" secureTextEntry maxLength={4} />
                        </View>
                      </View>
                    </>
                  )}
                  {!!payError && (
                    <View style={styles.errorBox}>
                      <Ionicons name="warning-outline" size={14} color={COLORS.error} />
                      <Text style={styles.errorText}>{payError}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.submitBtn, paying && styles.submitBtnDisabled]}
                    onPress={handlePay}
                    disabled={paying}
                    activeOpacity={0.85}
                  >
                    {paying ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="lock-closed" size={16} color="#fff" />
                        <Text style={styles.submitBtnText}>Pay {money(amount)}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <Text style={styles.secureNote}>This is a demo payment — no real transaction occurs.</Text>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (COLORS, FONTS) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.surface },
    header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: SIZES.padding, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: COLORS.surfaceHigh, justifyContent: "center", alignItems: "center" },
    headerTitle: { fontSize: SIZES.h3, fontFamily: FONTS.bold, color: COLORS.white },
    scroll: { padding: SIZES.padding, paddingBottom: SIZES.padding * 3 },

    payBanner: { borderRadius: SIZES.radius * 1.5, backgroundColor: COLORS.primary, padding: SIZES.padding, marginBottom: SIZES.padding, overflow: "hidden", alignItems: "flex-start", ...SHADOWS.button },
    bannerGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#fff", opacity: 0.06, top: -60, right: -40 },
    bannerLabel: { fontSize: SIZES.tiny, fontFamily: FONTS.bold, color: "rgba(255,255,255,0.55)", letterSpacing: 1, marginBottom: 6 },
    bannerAmount: { fontSize: 40, fontFamily: FONTS.display, color: "#fff", marginBottom: 8 },
    bannerMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: SIZES.padding },
    bannerTier: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: "rgba(255,255,255,0.7)" },
    bannerDiscount: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: "rgba(255,255,255,0.7)" },
    metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.3)" },
    payBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 20, paddingVertical: 12, borderRadius: SIZES.radiusFull, alignSelf: "flex-start", borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
    payBtnText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: "#fff" },
    paidBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.successContainer, paddingHorizontal: 14, paddingVertical: 8, borderRadius: SIZES.radiusFull },
    paidBadgeText: { fontSize: SIZES.small, fontFamily: FONTS.bold, color: COLORS.success },

    sectionTitle: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.white, marginBottom: SIZES.padding * 0.75 },
    emptyCard: { backgroundColor: COLORS.surfaceContainer, borderRadius: SIZES.radius * 1.2, borderWidth: 1, borderColor: COLORS.border, padding: SIZES.padding * 1.5, alignItems: "center", gap: 8 },
    emptyText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.textMuted },
    emptySubText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textFaint, textAlign: "center" },
    historyErrorCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.errorContainer, borderRadius: SIZES.radius, borderWidth: 1, borderColor: COLORS.error + "40", padding: 12, marginBottom: SIZES.base },
    historyErrorText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.error, flex: 1 },
    historyLoading: { flexDirection: "row", alignItems: "center", gap: 10, justifyContent: "center", paddingVertical: SIZES.padding * 1.5 },
    historyLoadingText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted },
    historyCard: { backgroundColor: COLORS.surfaceContainer, borderRadius: SIZES.radius * 1.2, borderWidth: 1, borderColor: COLORS.border },
    historyRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: SIZES.padding * 0.85 },
    historyBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
    historyIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    historyTitle: { fontSize: SIZES.small, fontFamily: FONTS.semiBold, color: COLORS.white },
    historyTxn: { fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.textFaint },
    historyDate: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: COLORS.textFaint, marginTop: 2 },
    historyRight: { alignItems: "flex-end" },
    historyAmount: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: COLORS.success },
    historyStatus: { fontSize: SIZES.tiny, fontFamily: FONTS.medium, color: COLORS.success, marginTop: 2 },

    // Modal
    modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
    modalSheet: { backgroundColor: COLORS.surfaceContainer, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SIZES.padding, paddingBottom: SIZES.padding * 2, maxHeight: "85%", borderWidth: 1, borderColor: COLORS.border },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: SIZES.padding * 0.5 },
    modalTitle: { fontSize: SIZES.h3, fontFamily: FONTS.display, color: COLORS.white },
    modalClose: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.surfaceHigh, justifyContent: "center", alignItems: "center" },
    modalAmount: { fontSize: 40, fontFamily: FONTS.display, color: COLORS.primary, marginBottom: 4 },
    modalAmountLabel: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textMuted, marginBottom: SIZES.padding },
    methodRow: { flexDirection: "row", gap: 8, marginBottom: SIZES.padding },
    methodChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.surfaceHigh, borderWidth: 1, borderColor: COLORS.border },
    methodChipActive: { backgroundColor: COLORS.primaryContainer, borderColor: COLORS.primary },
    methodChipText: { fontSize: SIZES.small, fontFamily: FONTS.semiBold, color: COLORS.textFaint },
    methodChipTextActive: { color: COLORS.primary },
    formScroll: { maxHeight: 320 },
    field: { marginBottom: SIZES.padding * 0.75 },
    fieldLabel: { fontSize: SIZES.small, fontFamily: FONTS.semiBold, color: COLORS.textMuted, marginBottom: 6 },
    input: { height: 48, backgroundColor: COLORS.surfaceHighest, borderRadius: SIZES.radius, paddingHorizontal: 14, fontSize: SIZES.body, fontFamily: FONTS.regular, color: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
    inputHint: { fontSize: 11, fontFamily: FONTS.regular, color: COLORS.textFaint, marginTop: 4 },
    rowFields: { flexDirection: "row" },
    errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.errorContainer, borderRadius: SIZES.radius, padding: 10, marginBottom: SIZES.base, borderWidth: 1, borderColor: COLORS.error + "40" },
    errorText: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.error, flex: 1 },
    submitBtn: { height: 52, borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primary, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: SIZES.base, ...SHADOWS.button },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: "#FFFDFB" },
    secureNote: { textAlign: "center", fontSize: SIZES.tiny, fontFamily: FONTS.regular, color: COLORS.textFaint, marginBottom: SIZES.base },
    successWrap: { alignItems: "center", paddingVertical: SIZES.padding * 2 },
    successIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.successContainer, justifyContent: "center", alignItems: "center", marginBottom: SIZES.padding },
    successTitle: { fontSize: SIZES.h2, fontFamily: FONTS.display, color: COLORS.white, marginBottom: 8 },
    successTxn: { fontSize: SIZES.small, fontFamily: FONTS.medium, color: COLORS.textFaint, marginBottom: 4 },
    successAmount: { fontSize: SIZES.h3, fontFamily: FONTS.bold, color: COLORS.success, marginBottom: SIZES.padding * 1.5 },
    doneBtn: { height: 52, width: "100%", borderRadius: SIZES.radiusFull, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center", ...SHADOWS.button },
    doneBtnText: { fontSize: SIZES.body, fontFamily: FONTS.bold, color: "#FFFDFB" },
  });
