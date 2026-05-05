import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";

import {
  getAllFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
} from "../../src/api/faqService";

export default function AdminFaqScreen() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: null,
    theme: "",
    question: "",
    answer: "",
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFaqs();
  }, []);

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

    } catch (e) {
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
        onPress: async () => {
          await deleteFaq(id);
          loadFaqs();
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Gestion FAQ</Text>

      {/* FORM */}
      <View style={styles.card}>
        <TextInput
          placeholder="Thème (ex: Paiement)"
          value={form.theme}
          onChangeText={(v) => setForm({ ...form, theme: v })}
          style={styles.input}
        />

        <TextInput
          placeholder="Question"
          value={form.question}
          onChangeText={(v) => setForm({ ...form, question: v })}
          style={styles.input}
        />

        <TextInput
          placeholder="Réponse"
          value={form.answer}
          onChangeText={(v) => setForm({ ...form, answer: v })}
          style={[styles.input, { height: 80 }]}
          multiline
        />

        <Pressable style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.btnText}>
            {form.id ? "✏️ Modifier" : "➕ Ajouter"}
          </Text>
        </Pressable>
      </View>

      {/* LIST */}
      {faqs.map((faq) => (
        <View key={faq.id} style={styles.faqCard}>
          <Text style={styles.theme}>{faq.theme}</Text>
          <Text style={styles.question}>{faq.question}</Text>
          <Text style={styles.answer}>{faq.answer}</Text>

          <View style={styles.actions}>
            <Pressable
              style={styles.editBtn}
              onPress={() => handleEdit(faq)}
            >
              <Text>✏️</Text>
            </Pressable>

            <Pressable
              style={styles.deleteBtn}
              onPress={() => handleDelete(faq.id)}
            >
              <Text>🗑️</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    padding: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#f1f5f9",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  faqCard: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  theme: {
    fontWeight: "bold",
    color: "#2563eb",
  },
  question: {
    marginTop: 5,
    fontWeight: "600",
  },
  answer: {
    marginTop: 5,
    color: "#555",
  },
  actions: {
    flexDirection: "row",
    marginTop: 10,
    gap: 10,
  },
  editBtn: {
    backgroundColor: "#fde68a",
    padding: 8,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: "#fecaca",
    padding: 8,
    borderRadius: 6,
  },
});