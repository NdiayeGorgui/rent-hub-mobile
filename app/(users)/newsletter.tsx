import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { API } from "@/src/api/api";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewsletterScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Erreur", "Veuillez entrer une adresse email valide");
      return;
    }
    setLoading(true);
    try {
      await API.post("/newsletter/subscribe", { email });
      setSuccess(true);
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.successCard}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🎉</Text>
        <Text style={styles.successTitle}>Vous êtes inscrit !</Text>
        <Text style={styles.successDesc}>
          Bienvenue dans la communauté Gonifty. Vérifiez votre boîte mail.
        </Text>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f6f9" }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.badge}>📬 Newsletter Gonifty</Text>
          <Text style={styles.heroTitle}>Restez dans la boucle</Text>
          <Text style={styles.heroDesc}>
            Les meilleures annonces, conseils et nouveautés chaque semaine.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="votre@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.emailInput}
              placeholderTextColor="#93c5fd"
            />
            <TouchableOpacity onPress={handleSubscribe} disabled={loading} style={styles.subscribeBtn}>
              {loading ? <ActivityIndicator color="#2563eb" size="small" /> : <Text style={styles.subscribeBtnText}>OK</Text>}
            </TouchableOpacity>
          </View>
          <Text style={styles.heroNote}>Gratuit · Désabonnement en un clic · Aucun spam</Text>
        </View>

        {/* Ce que vous recevez */}
        <View style={{ padding: 20 }}>
          <Text style={styles.sectionTitle}>Ce que vous recevrez</Text>
          {[
            { icon: "🏆", title: "Meilleures annonces", desc: "Les items les plus populaires et enchères à ne pas manquer." },
            { icon: "💡", title: "Conseils & astuces", desc: "Comment louer efficacement et maximiser vos revenus." },
            { icon: "🔔", title: "Nouveautés Gonifty", desc: "Nouvelles fonctionnalités et mises à jour de la plateforme." },
            { icon: "🎁", title: "Offres exclusives", desc: "Promotions réservées aux abonnés et événements spéciaux." },
          ].map(({ icon, title, desc }) => (
            <View key={title} style={styles.featureCard}>
              <Text style={{ fontSize: 28, marginRight: 14 }}>{icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{title}</Text>
                <Text style={styles.featureDesc}>{desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", justifyContent: "center", alignItems: "center", padding: 30 },
  successCard: { alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 8 },
  successDesc: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 22 },
  hero: { backgroundColor: "#2563eb", padding: 28, paddingTop: 40 },
  badge: { color: "#bfdbfe", fontSize: 13, fontWeight: "600", marginBottom: 10 },
  heroTitle: { color: "#fff", fontSize: 28, fontWeight: "800", marginBottom: 8, lineHeight: 34 },
  heroDesc: { color: "#bfdbfe", fontSize: 14, lineHeight: 22, marginBottom: 20 },
  inputRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  emailInput: {
    flex: 1, backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 12, color: "#fff", fontSize: 14,
  },
  subscribeBtn: {
    backgroundColor: "#fff", paddingHorizontal: 18,
    borderRadius: 12, justifyContent: "center", alignItems: "center",
  },
  subscribeBtnText: { color: "#2563eb", fontWeight: "800", fontSize: 14 },
  heroNote: { color: "#93c5fd", fontSize: 11, textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 16 },
  featureCard: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: "#fff", borderRadius: 16,
    padding: 16, marginBottom: 12,
  },
  featureTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 },
  featureDesc: { fontSize: 13, color: "#6b7280", lineHeight: 20 },
});