import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TextInput,
} from "react-native";

import {
  getAllPayments,
  refundAuctionFee,
} from "@/src/api/paymentService.web";
import { Ionicons } from "@expo/vector-icons";

export default function PaymentScreen() {

  // 🔥 seulement 2 tabs maintenant
  const [activeTab, setActiveTab] = useState<"list" | "refund">("list");

  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 🔥 step pour formulaire
  const [step, setStep] = useState<"list" | "form">("list");

  // 🔥 formulaire simulé
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {
    loadAllPayments();
  }, [activeTab]);

  const loadAllPayments = async () => {
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch {
      showAlert("Erreur", "Impossible de charger les paiements");
    }
  };

  // 👉 étape 1 : ouvrir formulaire
  const handleStartRefund = () => {
    setStep("form");
  };

  // 👉 étape 2 : refund réel
  const handleConfirmRefund = async () => {
    if (!selectedPayment) return;

    try {
      setLoading(true);

      await refundAuctionFee(selectedPayment.paymentIntentId);

      showAlert("Succès", "Refund effectué");

      setSelectedPayment(null);
      setStep("list");
      loadAllPayments();

    } catch (error) {
      showAlert("Erreur", "Impossible de faire le refund");
    } finally {
      setLoading(false);
    }
  };

  const renderStatus = (status: string) => {
    let color = "#ccc";

    if (status === "SUCCESS") color = "#4caf50";
    if (status === "FAILED") color = "#f44336";
    if (status === "PENDING") color = "#ff9800";

    return (
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>

      {/* TABS */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "list" && styles.activeTabButton,
          ]}
          onPress={() => {
            setActiveTab("list");
            setSelectedPayment(null);
            setStep("list");
          }}
        >
          <Text style={[
            styles.tabText,
            activeTab === "list" && styles.activeTabText
          ]}>
            Tous les paiements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "refund" && styles.activeTabButton,
          ]}
          onPress={() => {
            setActiveTab("refund");
            setSelectedPayment(null);
            setStep("list");
          }}
        >
          <Text style={[
            styles.tabText,
            activeTab === "refund" && styles.activeTabText
          ]}>
            Refund
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🟢 LISTE */}
      {activeTab === "list" && (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>
                  Paiement #{item.id}
                </Text>
                {renderStatus(item.status)}
              </View>

              <Text style={styles.subText}>
                {item.userFullName || "Utilisateur inconnu"}
              </Text>

              <Text style={styles.subText}>
                ${item.amount}
              </Text>
            </View>
          )}
        />
      )}

      {/* 🔴 REFUND */}
      {activeTab === "refund" && step === "list" && (
        <>
          {!selectedPayment ? (
            <FlatList
              data={payments.filter(
                (p) =>
                  p.status === "SUCCESS" &&
                  p.paymentType === "AUCTION_FEE"
              )}
              keyExtractor={(item) => item.id.toString()}
             renderItem={({ item }) => (

  <TouchableOpacity
    style={[
      styles.card,
      selectedPayment?.id === item.id && styles.selectedCard,
    ]}
    onPress={() => setSelectedPayment(item)}
  >

    <View style={styles.cardHeader}>
      <Text style={styles.cardTitle}>
        Paiement #{item.id}
      </Text>

      {renderStatus(item.status)}
    </View>

    <View style={styles.infoRow}>
      <Ionicons name="person-outline" size={14} color="#374151" />
      <Text style={styles.userText}>
        {item.userFullName || "Utilisateur inconnu"}
      </Text>
    </View>

    <View style={styles.infoRow}>
      <Ionicons name="card-outline" size={14} color="#16a34a" />
      <Text style={styles.subText}>
        ${item.amount}
      </Text>
    </View>

  </TouchableOpacity>
)}
            />
          ) : (
            <View>
              <Text style={styles.sectionTitle}>
                Refund paiement #{selectedPayment.id}
              </Text>

              <Text>
                Montant : ${selectedPayment.amount}
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleStartRefund}
              >
                <Text style={styles.primaryButtonText}>
                  Continuer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedPayment(null)}
              >
                <Text style={styles.cancelText}>
                  Choisir un autre paiement
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* 💳 FORMULAIRE */}
      {activeTab === "refund" && step === "form" && (
        <View>

          <TouchableOpacity onPress={() => setStep("list")}>
            <Text style={{ color: "blue", marginBottom: 10 }}>
              ← Retour
            </Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>
            💳 Confirmation Refund
          </Text>

          <Text style={{ marginBottom: 10 }}>
            🔒 Vérification sécurisée...
          </Text>

          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
            placeholder="Numéro carte"
          />

          <TextInput
            style={styles.input}
            value={expMonth}
            onChangeText={setExpMonth}
            placeholder="Mois"
          />

          <TextInput
            style={styles.input}
            value={expYear}
            onChangeText={setExpYear}
            placeholder="Année"
          />

          <TextInput
            style={styles.input}
            value={cvc}
            onChangeText={setCvc}
            placeholder="CVC"
          />

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: "#dc2626" }]}
            onPress={handleConfirmRefund}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                Confirmer Refund
              </Text>
            )}
          </TouchableOpacity>

        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f3f4f6",
  },

  tabs: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#e0e0e0",
    borderRadius: 30,
    padding: 4,
  },

  tabButton: {
    flex: 1,
    padding: 10,
    borderRadius: 30,
    alignItems: "center",
  },

  activeTabButton: {
    backgroundColor: "#2563eb",
  },

  tabText: {
    color: "#555",
    fontWeight: "600",
  },

  activeTabText: {
    color: "#fff",
  },

  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontWeight: "bold",
  },

  subText: {
    color: "#777",
  },

  badge: {
    paddingHorizontal: 6,
    borderRadius: 10,
  },

  badgeText: {
    color: "white",
    fontSize: 12,
  },

  primaryButton: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },

  primaryButtonText: {
    color: "white",
    fontWeight: "bold",
  },

  cancelText: {
    textAlign: "center",
    marginTop: 10,
    color: "#888",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  selectedCard: {
  borderWidth: 2,
  borderColor: "#2563eb",
},

infoRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
  marginTop: 4,
},

userText: {
  fontWeight: "600",
  color: "#333",
},
});