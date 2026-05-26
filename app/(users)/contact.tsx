import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { API } from "@/src/api/api";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const subjects = ["Laisser un avis", "Déclarer une mauvaise expérience", "Assistance technique", "Demande générale"];

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.subject || !form.message) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    try {
      await API.post("/messages/contact", form);
      setSuccess(true);
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <SafeAreaView style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <Text style={{ fontSize: 56, marginBottom: 16 }}>✅</Text>
        <Text style={styles.successTitle}>Message envoyé !</Text>
        <Text style={styles.successDesc}>Nous vous répondrons sous 24 à 48h ouvrables.</Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f6f9" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Contactez-nous</Text>
          <Text style={styles.subtitle}>Notre équipe vous répond sous 24–48h.</Text>

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

          <Text style={styles.label}>Sujet *</Text>
          <TouchableOpacity onPress={() => setSubjectOpen(!subjectOpen)} style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
            <Text style={{ color: form.subject ? "#111827" : "#9ca3af", fontSize: 14 }}>
              {form.subject || "Choisissez un sujet"}
            </Text>
            <Text style={{ color: "#6b7280" }}>{subjectOpen ? "▲" : "▼"}</Text>
          </TouchableOpacity>
          {subjectOpen && (
            <View style={styles.dropdown}>
              {subjects.map(s => (
                <TouchableOpacity key={s} onPress={() => { setForm({ ...form, subject: s }); setSubjectOpen(false); }}
                  style={[styles.dropdownItem, form.subject === s && { backgroundColor: "#eff6ff" }]}>
                  <Text style={{ color: form.subject === s ? "#2563eb" : "#374151", fontSize: 14 }}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.label}>Message *</Text>
          <TextInput value={form.message} onChangeText={v => setForm({ ...form, message: v })} placeholder="Décrivez votre demande..." multiline numberOfLines={5} style={[styles.input, { height: 120, textAlignVertical: "top" }]} />

          <TouchableOpacity onPress={handleSubmit} disabled={loading} style={styles.button}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer le message</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", justifyContent: "center", alignItems: "center", padding: 30 },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#6b7280", marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successDesc: { fontSize: 14, color: "#6b7280", textAlign: "center" },
  row: { flexDirection: "row", gap: 10 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 12, fontSize: 14, color: "#111827" },
  dropdown: { backgroundColor: "#fff", borderRadius: 12, marginTop: 4, overflow: "hidden" },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  button: { backgroundColor: "#2563eb", padding: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});