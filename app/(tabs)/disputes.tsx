import { createDispute, getMyDisputes } from "@/src/api/disputeService";
import { fetchMyRentals } from "@/src/api/rentalService";
import { fetchItemDetails } from "@/src/api/itemService";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Platform,
} from "react-native";

export default function DisputesScreen() {
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  const [disputes, setDisputes] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [selectedRental, setSelectedRental] = useState<any>(null);

  const [itemsMap, setItemsMap] = useState<Record<number, any>>({});

  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (activeTab === "list") loadDisputes();
    if (activeTab === "create") loadRentals();
  }, [activeTab]);

  // =========================
  // LOAD DISPUTES
  // =========================

  const loadDisputes = async () => {
    const data = await getMyDisputes();
    setDisputes(data);

    const uniqueItemIds = [...new Set(data.map((d: any) => d.itemId))] as number[];

    const itemsResults = await Promise.all(
      uniqueItemIds.map(async (itemId: number) => {
        try {
          const item = await fetchItemDetails(itemId);
          return [itemId, item];
        } catch {
          return [itemId, null];
        }
      })
    );

    const itemsObject = Object.fromEntries(itemsResults);
    setItemsMap(itemsObject);
  };

  // =========================
  // LOAD RENTALS
  // =========================

  const loadRentals = async () => {
    const rentalsData = await fetchMyRentals();
    const disputesData = await getMyDisputes();

    const disputedRentalIds = disputesData.map((d: any) => d.rentalId);

    const availableRentals = rentalsData.filter(
      (r: any) =>
        r.status === "ENDED" &&
        !disputedRentalIds.includes(r.id)
    );

    setRentals(availableRentals);

    const uniqueItemIds = [
      ...new Set(availableRentals.map((r: any) => r.itemId)),
    ];

    const itemsResults = await Promise.all(
      uniqueItemIds.map(async (itemId: number) => {
        try {
          const item = await fetchItemDetails(itemId);
          return [itemId, item];
        } catch {
          return [itemId, null];
        }
      })
    );

    const itemsObject = Object.fromEntries(itemsResults);
    setItemsMap(itemsObject);
  };

  // =========================
  // ALERT
  // =========================

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // =========================
  // CREATE DISPUTE
  // =========================

  const handleCreate = async () => {
    if (!selectedRental || !reason) {
      showAlert("Erreur", "Veuillez choisir une location et une raison");
      return;
    }

    try {
      await createDispute({
        rentalId: selectedRental.id,
        reason,
        description,
      });

      showAlert("Succès", "Litige créé !");

      setSelectedRental(null);
      setReason("");
      setDescription("");

      setActiveTab("list");
      loadDisputes();
    } catch (error) {
      showAlert("Erreur", "Impossible de créer le litige");
    }
  };

  // =========================
  // STATUS BADGE
  // =========================

  const renderStatusBadge = (status: string) => {
    let bg = "#ccc";

    if (status === "OPEN") bg = "#ff9800";
    if (status === "RESOLVED") bg = "#4caf50";
    if (status === "REJECTED") bg = "#f44336";

    return (
      <View style={[styles.badge, { backgroundColor: bg }]}>
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
          onPress={() => setActiveTab("list")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "list" && styles.activeTabText,
            ]}
          >
            Mes litiges
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            activeTab === "create" && styles.activeTabButton,
          ]}
          onPress={() => setActiveTab("create")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "create" && styles.activeTabText,
            ]}
          >
            Créer
          </Text>
        </TouchableOpacity>
      </View>

      {/* =========================
           LIST DISPUTES
         ========================= */}

      {activeTab === "list" && (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun litige</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    {itemsMap[item.itemId]?.title ?? "Loading..."}
                  </Text>

                  <Text style={styles.subText}>
                    Location #{item.rentalId}
                  </Text>
                </View>

                {renderStatusBadge(item.status)}
              </View>

              <Text style={styles.reason}>{item.reason}</Text>

              {item.adminDecision && (
                <Text
                  style={{
                    marginTop: 6,
                    fontStyle: "italic",
                    color: "#444",
                  }}
                >
                  Décision admin : {item.adminDecision}
                </Text>
              )}
            </View>
          )}
        />
      )}

      {/* =========================
           CREATE DISPUTE
         ========================= */}

      {activeTab === "create" && (
        <>
          {!selectedRental ? (
            <>
              <Text style={styles.sectionTitle}>
                Sélectionnez une location terminée
              </Text>

              <FlatList
                data={rentals}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    Aucune location terminée
                  </Text>
                }
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.card,
                      selectedRental?.id === item.id &&
                      styles.selectedCard,
                    ]}
                    onPress={() => setSelectedRental(item)}
                  >
                    <Text style={styles.cardTitle}>
                      {itemsMap[item.itemId]?.title ?? "Loading..."}
                    </Text>

                    <Text style={styles.subText}>
                      Location #{item.id}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </>
          ) : (
            <View style={styles.form}>
              <Text style={styles.sectionTitle}>
                Litige pour location #{selectedRental.id}
              </Text>

              <Text style={styles.subText}>
                Item: {itemsMap[selectedRental.itemId]?.title ?? "Loading..."}
              </Text>

              <TextInput
                placeholder="Raison"
                value={reason}
                onChangeText={setReason}
                style={styles.input}
              />

              <TextInput
                placeholder="Description (optionnel)"
                value={description}
                onChangeText={setDescription}
                style={[styles.input, { height: 90 }]}
                multiline
              />

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleCreate}
              >
                <Text style={styles.primaryButtonText}>
                  Envoyer le litige
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedRental(null)}
              >
                <Text style={styles.cancelText}>
                  Changer de location
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
  container: { flex: 1, padding: 20, backgroundColor: "#f5f7fa" },

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
    backgroundColor: "#1e88e5",
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
    elevation: 3,
  },

  selectedCard: {
    borderWidth: 2,
    borderColor: "#1e88e5",
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

  reason: {
    color: "#555",
  },

  subText: {
    color: "#777",
    marginTop: 4,
  },

  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "center",
  },

  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },

  form: {
    gap: 12,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  primaryButton: {
    backgroundColor: "#1e88e5",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
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

  emptyText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
  },
});