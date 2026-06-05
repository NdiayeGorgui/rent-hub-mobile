import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from "../../src/api/faqService";

const THEMES = [
  "Paiement",
  "Location",
  "Enchère",
  "Compte",
  "Remboursement",
  "Sécurité",
  "Abonnement",
  "Autre",
];

export default function AdminFaqScreen() {
  const insets = useSafeAreaInsets();
  const [faqs, setFaqs] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: null as number | null,
    theme: "",
    question: "",
    answer: "",
  });
  const [loading, setLoading] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  useEffect(() => { loadFaqs(); }, []);

  const loadFaqs = async () => {
    const data = await getAllFaqs();
    setFaqs(data);
  };

  const handleSave = async () => {
    if (!form.theme || !form.question || !form.answer) {
      Alert.alert("Erreur", "Tous les champs sont obligatoires");
      return;
    }
    try {
      setLoading(true);
      if (form.id) {
        await updateFaq(form.id, form);
      } else {
        await createFaq(form);
      }
      setForm({ id: null, theme: "", question: "", answer: "" });
      loadFaqs();
    } catch {
      Alert.alert("Erreur", "Opération impossible");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faq: any) => {
    setForm(faq);
  };

  const handleDelete = (id: number) => {
    Alert.alert("Confirmation", "Supprimer cette FAQ ?", [
      { text: "Annuler" },
      {
        text: "Oui",
        style: "destructive",
        onPress: async () => {
          await deleteFaq(id);
          loadFaqs();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} // ← espace bas
    >
      <Text style={styles.title}>⚙️ Gestion FAQ</Text>

      {/* FORM */}
      <View style={styles.card}>

        {/* Select Thème */}
        <Text style={styles.label}>Thème *</Text>
        <TouchableOpacity
          onPress={() => setThemeOpen(!themeOpen)}
          style={[styles.input, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}
        >
          <Text style={{ color: form.theme ? "#111827" : "#9ca3af", fontSize: 14 }}>
            {form.theme || "Choisir un thème"}
          </Text>
          <Text style={{ color: "#6b7280" }}>{themeOpen ? "▲" : "▼"}</Text>
        </TouchableOpacity>

        {/* Dropdown thèmes */}
        {themeOpen && (
          <View style={styles.dropdown}>
            {THEMES.map(theme => (
              <TouchableOpacity
                key={theme}
                onPress={() => { setForm({ ...form, theme }); setThemeOpen(false); }}
                style={[styles.dropdownItem, form.theme === theme && styles.dropdownItemActive]}
              >
                <Text style={{ color: form.theme === theme ? "#2563eb" : "#374151", fontSize: 14 }}>
                  {theme}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 10 }} />

        <Text style={styles.label}>Question *</Text>
        <TextInput
          placeholder="Entrez la question"
          value={form.question}
          onChangeText={(v) => setForm({ ...form, question: v })}
          style={styles.input}
        />

        <View style={{ height: 10 }} />

        <Text style={styles.label}>Réponse *</Text>
        <TextInput
          placeholder="Entrez la réponse"
          value={form.answer}
          onChangeText={(v) => setForm({ ...form, answer: v })}
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          multiline
        />

        <Pressable
          style={[styles.saveBtn, loading && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {form.id ? "✏️ Modifier" : "➕ Ajouter"}
          </Text>
        </Pressable>

        {/* Bouton annuler édition */}
        {form.id && (
          <Pressable
            style={styles.cancelBtn}
            onPress={() => setForm({ id: null, theme: "", question: "", answer: "" })}
          >
            <Text style={styles.cancelBtnText}>✕ Annuler la modification</Text>
          </Pressable>
        )}
      </View>

      {/* LIST */}
      {faqs.map((faq) => (
        <View key={faq.id} style={styles.faqCard}>
          <View style={styles.faqHeader}>
            <View style={styles.themeBadge}>
              <Text style={styles.themeBadgeText}>{faq.theme}</Text>
            </View>
            <View style={styles.actions}>
              <Pressable style={styles.editBtn} onPress={() => handleEdit(faq)}>
                <Text>✏️</Text>
              </Pressable>
              <Pressable style={styles.deleteBtn} onPress={() => handleDelete(faq.id)}>
                <Text>🗑️</Text>
              </Pressable>
            </View>
          </View>
          <Text style={styles.question}>{faq.question}</Text>
          <Text style={styles.answer}>{faq.answer}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", padding: 15 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 15 },
  label: { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  card: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 20 },
  input: {
    backgroundColor: "#f1f5f9", padding: 12,
    borderRadius: 10, fontSize: 14, color: "#111827",
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dropdownItemActive: { backgroundColor: "#eff6ff" },
  saveBtn: {
    backgroundColor: "#2563eb", padding: 13,
    borderRadius: 10, marginTop: 14,
  },
  btnText: { color: "#fff", textAlign: "center", fontWeight: "700" },
  cancelBtn: {
    padding: 10, borderRadius: 10, marginTop: 8,
    backgroundColor: "#f3f4f6", alignItems: "center",
  },
  cancelBtnText: { color: "#6b7280", fontWeight: "600", fontSize: 13 },
  faqCard: {
    backgroundColor: "#fff", padding: 14,
    borderRadius: 12, marginBottom: 10,
  },
  faqHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  themeBadge: {
    backgroundColor: "#eff6ff", paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  themeBadgeText: { color: "#2563eb", fontWeight: "700", fontSize: 12 },
  question: { fontWeight: "600", color: "#111827", marginBottom: 4 },
  answer: { color: "#6b7280", fontSize: 13, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8 },
  editBtn: { backgroundColor: "#fde68a", padding: 8, borderRadius: 8 },
  deleteBtn: { backgroundColor: "#fecaca", padding: 8, borderRadius: 8 },
});
