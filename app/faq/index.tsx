// app/faq.tsx
import { useEffect, useState } from "react";
import { View, Text, TextInput, FlatList, Pressable, StyleSheet } from "react-native";
import { getAllFaqs } from "@/src/api/faqService";
import { FaqItem } from "@/components/faq/FaqItem";

export default function FaqScreen() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState("Tous");
  const [openId, setOpenId] = useState<number | null>(null);

  const themes = ["Tous", "Paiement", "Location", "Enchères", "Compte", "Sécurité"];

  useEffect(() => { loadFaqs(); }, []);

  const loadFaqs = async () => {
    const data = await getAllFaqs();
    setFaqs(data);
    setFilteredFaqs(data);
  };

  useEffect(() => {
    let result = faqs;
    if (selectedTheme !== "Tous") result = result.filter(f => f.theme === selectedTheme);
    if (search) result = result.filter(f =>
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredFaqs(result);
  }, [search, selectedTheme, faqs]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>❓ Centre d'aide</Text>
      <TextInput
        placeholder="Rechercher une question..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />
      <View style={styles.themes}>
        {themes.map(theme => (
          <Pressable key={theme} onPress={() => setSelectedTheme(theme)}
            style={[styles.chip, selectedTheme === theme && styles.chipActive]}>
            <Text style={styles.chipText}>{theme}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={filteredFaqs}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <FaqItem item={item} isOpen={openId === item.id} onToggle={() => setOpenId(openId === item.id ? null : item.id)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", padding: 15 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  search: { backgroundColor: "#fff", padding: 12, borderRadius: 12, marginBottom: 10 },
  themes: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  chip: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: "#ddd", borderRadius: 20, marginRight: 6, marginBottom: 6 },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { color: "#fff", fontWeight: "600" },
});