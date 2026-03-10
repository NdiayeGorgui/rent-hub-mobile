import { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  Platform
} from "react-native";

import {
  confirmPayment,
  getAllPayments,
  getPendingPayments,
} from "@/src/api/paymentService.web";
import { Ionicons } from "@expo/vector-icons";

export default function ConfirmPaymentScreen() {

  const [activeTab, setActiveTab] = useState<"list" | "confirm">("list");
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  useEffect(() => {

    if (activeTab === "list") {
      loadAllPayments();
    }

    if (activeTab === "confirm") {
      loadPendingPayments();
    }

  }, [activeTab]);

  const loadAllPayments = async () => {

    try {

      const data = await getAllPayments();
      setPayments(data);

    } catch {

      showAlert("Erreur", "Impossible de charger les paiements");

    }

  };

  const loadPendingPayments = async () => {

    try {

      const data = await getPendingPayments();
      setPayments(data);

    } catch {

      showAlert("Erreur", "Impossible de charger les paiements");

    }

  };

  const handleConfirm = async () => {

    if (!selectedPayment) return;

    try {

      setLoading(true);

      await confirmPayment(selectedPayment.paymentIntentId);

      showAlert("Succès", "Paiement confirmé");

      setSelectedPayment(null);

      loadPendingPayments();

    } catch (error) {

      console.log(error);

      showAlert(
        "Erreur",
        "Impossible de confirmer le paiement"
      );

    } finally {

      setLoading(false);

    }

  };

  

const renderStatus = (status: string) => {

  let color = "#ccc";
  let label = status;

  if (status === "SUCCESS") {
    color = "#4caf50";
    label = "SUCCESS";
  }

  if (status === "FAILED") {
    color = "#f44336";
    label = "FAILED";
  }

  if (status === "PENDING") {
    color = "#ff9800";
    label = "PENDING";
  }

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.badgeText}>{label}</Text>
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
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "list" && styles.activeTabText,
            ]}
          >
            Tous les paiements
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "confirm" && styles.activeTabButton,
          ]}
          onPress={() => {
            setActiveTab("confirm");
            setSelectedPayment(null);
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "confirm" && styles.activeTabText,
            ]}
          >
            Confirmer
          </Text>
        </TouchableOpacity>

      </View>

      {/* LISTE DES PAYEMENTS */}

      {activeTab === "list" && (

        <FlatList
          data={payments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (

<View style={styles.card}>

<View style={styles.cardHeader}>

  <View>
    <Text style={styles.cardTitle}>
      Paiement #{item.id}
    </Text>

    <Text style={styles.subText}>
      {item.userFullName || "Utilisateur inconnu"}
    </Text>
  </View>

  {renderStatus(item.status)}

</View>

  <View style={styles.infoRow}>
    <Ionicons name="card-outline" size={14} color="#16a34a" />
    <Text style={styles.infoText}>
      ${item.amount}
    </Text>
  </View>

  <View style={styles.infoRow}>
    <Ionicons name="calendar-outline" size={14} color="#6b7280" />
    <Text style={styles.infoText}>
      {new Date(item.createdAt).toLocaleDateString()}
    </Text>
  </View>

</View>

          )}
        />

      )}

      {/* CONFIRMATION */}

      {activeTab === "confirm" && (

        <>
          {!selectedPayment ? (

            <FlatList
              data={payments}
              keyExtractor={(item) => item.id.toString()}
              ListEmptyComponent={
                <Text style={styles.empty}>
                  Aucun paiement à confirmer
                </Text>
              }
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
                Confirmer paiement #{selectedPayment.id}
              </Text>

              <Text style={styles.subText}>
                Montant : ${selectedPayment.amount}
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Confirmation..." : "Confirmer paiement"}
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

  selectedCard: {
    borderWidth: 2,
    borderColor: "#2563eb",
  },

cardHeader: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 6,
},

  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },

  subText: {
    color: "#777",
    marginTop: 4,
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
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

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#888",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  userText: {
    fontWeight: "600",
    color: "#333",

  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },

  infoText: {
    fontSize: 13,
    color: "#374151",
  },
});