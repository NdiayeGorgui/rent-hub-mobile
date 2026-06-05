import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { API } from "@/src/api/api";

export default function AdminNewsletterScreen() {
  const insets = useSafeAreaInsets();

  const [subscribers, setSubscribers] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const [loadingSubs, setLoadingSubs] = useState(true);
  const [sending, setSending] = useState(false);

  const [activeTab, setActiveTab] = useState<"compose" | "subscribers">("compose");
  const [search, setSearch] = useState("");

  // ─────────────────────────────────────────────
  // Charger les abonnés
  // ─────────────────────────────────────────────
  const loadSubscribers = async () => {
    setLoadingSubs(true);

    try {
      const res = await API.get("/newsletter/subscribers");
      setSubscribers(res.data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les abonnés");
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  // ─────────────────────────────────────────────
  // Envoyer newsletter
  // ─────────────────────────────────────────────
  const handleSend = () => {
    if (!subject || !body) {
      Alert.alert("Erreur", "Sujet et contenu obligatoires");
      return;
    }

    Alert.alert(
      "Confirmation",
      `Envoyer cette newsletter à ${subscribers.length} abonnés ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          onPress: async () => {
            try {
              setSending(true);

              await API.post("/newsletter/send", {
                subject,
                body,
              });

              Alert.alert(
                "Succès",
                `Newsletter envoyée à ${subscribers.length} abonnés`
              );

              setSubject("");
              setBody("");
            } catch {
              Alert.alert("Erreur", "Erreur lors de l'envoi");
            } finally {
              setSending(false);
            }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────
  // Désabonner
  // ─────────────────────────────────────────────
  const handleRemove = (email: string) => {
    Alert.alert(
      "Désabonner",
      `Désabonner ${email} ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: async () => {
            try {
              await API.get(
                `/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
              );

              setSubscribers(prev =>
                prev.filter(e => e !== email)
              );
            } catch {
              Alert.alert("Erreur", "Impossible de désabonner");
            }
          },
        },
      ]
    );
  };

  // ─────────────────────────────────────────────
  // Recherche abonnés
  // ─────────────────────────────────────────────
  const filtered = subscribers.filter(email =>
    email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 40,
            flexGrow: 1,
          }}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>📧 Newsletter</Text>
            <Text style={styles.headerDesc}>
              Gérez vos abonnés et envoyez vos newsletters
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{subscribers.length}</Text>
              <Text style={styles.statLabel}>Abonnés</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: "#16a34a" }]}>
                100%
              </Text>
              <Text style={styles.statLabel}>Opt-in</Text>
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              onPress={() => setActiveTab("compose")}
              style={[
                styles.tabBtn,
                activeTab === "compose" && styles.activeTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "compose" && styles.activeTabText,
                ]}
              >
                ✏️ Rédiger
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("subscribers")}
              style={[
                styles.tabBtn,
                activeTab === "subscribers" && styles.activeTab,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "subscribers" && styles.activeTabText,
                ]}
              >
                👥 Abonnés
              </Text>
            </TouchableOpacity>
          </View>

          {/* ───────────────────────────── */}
          {/* COMPOSE */}
          {/* ───────────────────────────── */}
          {activeTab === "compose" && (
            <View style={styles.card}>
              <Text style={styles.label}>Sujet *</Text>

              <TextInput
                value={subject}
                onChangeText={setSubject}
                placeholder="Ex: Nouveautés Gonifty"
                placeholderTextColor="#9ca3af"
                style={styles.input}
              />

              <View style={{ height: 18 }} />

              <View style={styles.rowBetween}>
                <Text style={styles.label}>Contenu *</Text>
                <Text style={styles.counter}>
                  {body.length} caractères
                </Text>
              </View>

              <TextInput
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                placeholder="Bonjour,

Voici les nouveautés de cette semaine sur Gonifty..."
                placeholderTextColor="#9ca3af"
                style={styles.textarea}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  📨 Envoyé à{" "}
                  <Text style={{ fontWeight: "800", color: "#111827" }}>
                    {subscribers.length} abonnés
                  </Text>
                </Text>

                <Text style={styles.infoSub}>
                  Désabonnement automatique inclus
                </Text>
              </View>

              <TouchableOpacity
                disabled={sending || subscribers.length === 0}
                onPress={handleSend}
                style={[
                  styles.sendBtn,
                  (sending || subscribers.length === 0) && {
                    opacity: 0.6,
                  },
                ]}
              >
                {sending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.sendBtnText}>
                    📤 Envoyer la newsletter
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ───────────────────────────── */}
          {/* SUBSCRIBERS */}
          {/* ───────────────────────────── */}
          {activeTab === "subscribers" && (
            <View style={styles.card}>
              <View style={styles.searchRow}>
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Rechercher un email..."
                  placeholderTextColor="#9ca3af"
                  style={styles.searchInput}
                />

                <TouchableOpacity
                  onPress={loadSubscribers}
                  style={styles.refreshBtn}
                >
                  <Text style={styles.refreshText}>🔄</Text>
                </TouchableOpacity>
              </View>

              {loadingSubs ? (
                <View style={{ paddingVertical: 40 }}>
                  <ActivityIndicator size="large" color="#2563eb" />
                </View>
              ) : filtered.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyEmoji}>📭</Text>
                  <Text style={styles.emptyText}>
                    Aucun abonné trouvé
                  </Text>
                </View>
              ) : (
                <View>
                  {filtered.map((email, index) => (
                    <View key={index} style={styles.subscriberRow}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {email[0].toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={styles.emailText}>
                          {email}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemove(email)}
                      >
                        <Text style={styles.removeText}>
                          Supprimer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f6f9",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
  },

  headerDesc: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },

  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 18,
  },

  statValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2563eb",
  },

  statLabel: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 4,
  },

  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: 24,
    gap: 10,
  },

  tabBtn: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },

  activeTab: {
    backgroundColor: "#2563eb",
  },

  tabText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },

  activeTabText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 22,
    padding: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },

  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    color: "#111827",
  },

  textarea: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 180,
    fontSize: 14,
    color: "#111827",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  counter: {
    fontSize: 12,
    color: "#9ca3af",
  },

  infoBox: {
    backgroundColor: "#f3f4f6",
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
    marginBottom: 18,
  },

  infoText: {
    fontSize: 13,
    color: "#374151",
  },

  infoSub: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },

  sendBtn: {
    backgroundColor: "#2563eb",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },

  sendBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  searchRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },

  searchInput: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#111827",
  },

  refreshBtn: {
    width: 48,
    height: 48,
    backgroundColor: "#f3f4f6",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  refreshText: {
    fontSize: 18,
  },

  empty: {
    alignItems: "center",
    paddingVertical: 50,
  },

  emptyEmoji: {
    fontSize: 42,
    marginBottom: 10,
  },

  emptyText: {
    fontSize: 14,
    color: "#6b7280",
  },

  subscriberRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#dbeafe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#2563eb",
    fontWeight: "800",
    fontSize: 14,
  },

  emailText: {
    fontSize: 14,
    color: "#111827",
  },

  removeText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "700",
  },
});