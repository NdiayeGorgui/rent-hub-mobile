import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { API } from "@/src/api/api";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function PubliciteScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", website: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.message) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      await API.post("/messages/contact", {
        firstName: form.firstName, lastName: form.lastName,
        email: form.email, subject: "Publicité",
        message: `Site: ${form.website || "Non renseigné"}\n\n${form.message}`,
      });
      setSuccess(true);
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <SafeAreaView style={styles.container}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>🤝</Text>
      <Text style={styles.successTitle}>Demande envoyée !</Text>
      <Text style={styles.successDesc}>Nous vous répondrons dans les 48h ouvrables.</Text>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f6f9" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          {/* Hero */}
          <View style={styles.hero}>
            <Text style={styles.heroLabel}>Partenaires & Publicité</Text>
            <Text style={styles.heroTitle}>Développez votre visibilité</Text>
            <Text style={styles.heroDesc}>Plus d'un million de visiteurs annuels sur Gonifty.</Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            {[["1M+", "Visiteurs/an"], ["5 800+", "Membres"], ["#1", "Google QC"]].map(([v, l]) => (
              <View key={l} style={styles.statCard}>
                <Text style={styles.statValue}>{v}</Text>
                <Text style={styles.statLabel}>{l}</Text>
              </View>
            ))}
          </View>

          {/* Form */}
          <View style={{ padding: 20 }}>
            <Text style={styles.sectionTitle}>Contactez-nous</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Prénom *</Text>
                <TextInput value={form.firstName} onChangeText={v => setForm({ ...form, firstName: v })} placeholder="Jean" style={styles.input} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Nom *</Text>
                <TextInput value={form.lastName} onChangeText={v => setForm({ ...form, lastName: v })} placeholder="Tremblay" style={styles.input} />
              </View>
            </View>
            <Text style={styles.label}>Email *</Text>
            <TextInput value={form.email} onChangeText={v => setForm({ ...form, email: v })} placeholder="jean@exemple.com" keyboardType="email-address" autoCapitalize="none" style={styles.input} />
            <Text style={styles.label}>Site web <Text style={{ fontWeight: "400", color: "#9ca3af" }}>(optionnel)</Text></Text>
            <TextInput value={form.website} onChangeText={v => setForm({ ...form, website: v })} placeholder="https://votresite.com" autoCapitalize="none" style={styles.input} />
            <Text style={styles.label}>Message *</Text>
            <TextInput value={form.message} onChangeText={v => setForm({ ...form, message: v })} placeholder="Décrivez votre projet publicitaire..." multiline numberOfLines={5} style={[styles.input, { height: 120, textAlignVertical: "top" }]} />
            <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.button}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer ma demande</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", justifyContent: "center", alignItems: "center", padding: 30 },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successDesc: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  hero: { backgroundColor: "#111827", padding: 28, paddingTop: 40 },
  heroLabel: { color: "#60a5fa", fontSize: 12, fontWeight: "700", marginBottom: 8, textTransform: "uppercase" },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 8 },
  heroDesc: { color: "#9ca3af", fontSize: 14, lineHeight: 22 },
  statsRow: { flexDirection: "row", padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#2563eb", marginBottom: 2 },
  statLabel: { fontSize: 11, color: "#6b7280" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 16 },
  row: { flexDirection: "row", gap: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 12, fontSize: 14, color: "#111827" },
  button: { backgroundColor: "#111827", padding: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});