import { createAuctionDispute, createDispute, getMyDisputes } from "@/src/api/disputeService";
import { fetchMyRentals } from "@/src/api/rentalService";
import { fetchItemDetails } from "@/src/api/itemService";
import { getMyWonAuctions, getMyClosedAuctionsAsOwner } from "@/src/api/auctionService";

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

  // Type de litige
  const [disputeType, setDisputeType] = useState<"rental" | "auction">("rental");

  // Enchères
  const [wonAuctions, setWonAuctions] = useState<any[]>([]);       // je suis le winner
  const [ownerAuctions, setOwnerAuctions] = useState<any[]>([]);   // je suis le owner
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [auctionRole, setAuctionRole] = useState<"winner" | "owner">("winner");

  useEffect(() => {
    if (activeTab === "list") loadDisputes();
    if (activeTab === "create") loadRentals();
  }, [activeTab]);

  const loadDisputes = async () => {
    const data = await getMyDisputes();
    setDisputes(data);
    const uniqueItemIds = [...new Set(data.map((d: any) => d.itemId))] as number[];
    const itemsResults = await Promise.all(
      uniqueItemIds.map(async (itemId: number) => {
        try { return [itemId, await fetchItemDetails(itemId)]; }
        catch { return [itemId, null]; }
      })
    );
    setItemsMap(Object.fromEntries(itemsResults));
  };

  const loadRentals = async () => {
    const rentalsData = await fetchMyRentals();
    const disputesData = await getMyDisputes();

    const disputedAuctionIds = disputesData
      .filter((d: any) => d.auctionId != null)
      .map((d: any) => d.auctionId);

    // ── Locations disponibles ──
    const disputedRentalIds = disputesData
      .filter((d: any) => d.rentalId != null)
      .map((d: any) => d.rentalId);
    const availableRentals = rentalsData.filter(
      (r: any) => r.status === "ENDED" && !disputedRentalIds.includes(r.id)
    );
    setRentals(availableRentals);

    // ── Enchères gagnées (je suis le winner → litige contre owner) ──
    let availableWonAuctions: any[] = [];
    try {
      availableWonAuctions = (await getMyWonAuctions()).filter(
        (a: any) => !disputedAuctionIds.includes(a.id)
      );
      setWonAuctions(availableWonAuctions);
    } catch { console.log("Pas d'enchères gagnées"); }

    // ── Enchères vendues (je suis le owner → litige contre winner) ──
    let availableOwnerAuctions: any[] = [];
    try {
      availableOwnerAuctions = (await getMyClosedAuctionsAsOwner()).filter(
        (a: any) => !disputedAuctionIds.includes(a.id)
      );
      setOwnerAuctions(availableOwnerAuctions);
    } catch { console.log("Pas d'enchères vendues"); }

    // ── Charge les items ──
    const allItemIds = [...new Set([
      ...availableRentals.map((r: any) => r.itemId),
      ...availableWonAuctions.map((a: any) => a.itemId),
      ...availableOwnerAuctions.map((a: any) => a.itemId),
    ])] as number[];

    const itemsResults = await Promise.all(
      allItemIds.map(async (itemId: number) => {
        try { return [itemId, await fetchItemDetails(itemId)]; }
        catch { return [itemId, null]; }
      })
    );
    setItemsMap(Object.fromEntries(itemsResults));
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const handleCreate = async () => {
    if (!selectedRental || !reason) {
      showAlert("Erreur", "Veuillez choisir une location et une raison");
      return;
    }
    try {
      await createDispute({ rentalId: selectedRental.id, reason, description });
      showAlert("Succès", "Litige créé !");
      setSelectedRental(null); setReason(""); setDescription("");
      setActiveTab("list"); loadDisputes();
    } catch { showAlert("Erreur", "Impossible de créer le litige"); }
  };

  const handleCreateAuctionDispute = async () => {
    if (!selectedAuction || !reason) {
      showAlert("Erreur", "La raison est obligatoire");
      return;
    }
    try {
      await createAuctionDispute({
        auctionId: selectedAuction.id,
        // winner → signale le owner (ne livre pas)
        // owner  → signale le winner (refuse de payer)
        reportedUserId: auctionRole === "winner"
          ? selectedAuction.ownerId
          : selectedAuction.winnerId,
        reason,
        description,
      });
      showAlert("Succès", "Litige créé !");
      setSelectedAuction(null); setReason(""); setDescription("");
      setActiveTab("list"); loadDisputes();
    } catch { showAlert("Erreur", "Impossible de créer le litige"); }
  };

  const renderStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      OPEN: "#ff9800", IN_REVIEW: "#2196f3", RESOLVED: "#4caf50", REJECTED: "#f44336"
    };
    return (
      <View style={[styles.badge, { backgroundColor: colors[status] ?? "#ccc" }]}>
        <Text style={styles.badgeText}>{status}</Text>
      </View>
    );
  };

  const currentAuctions = auctionRole === "winner" ? wonAuctions : ownerAuctions;

  return (
    <View style={styles.container}>

      {/* TABS PRINCIPAUX */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "list" && styles.activeTabButton]}
          onPress={() => setActiveTab("list")}
        >
          <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>Mes litiges</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === "create" && styles.activeTabButton]}
          onPress={() => setActiveTab("create")}
        >
          <Text style={[styles.tabText, activeTab === "create" && styles.activeTabText]}>Créer</Text>
        </TouchableOpacity>
      </View>

      {/* ========================= LIST ========================= */}
      {activeTab === "list" && (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id.toString()}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucun litige</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>
                    {itemsMap[item.itemId]?.title ?? "Loading..."}
                  </Text>
                  <Text style={styles.subText}>
                    {item.rentalId ? `📦 Location #${item.rentalId}` : `🔥 Enchère #${item.auctionId}`}
                  </Text>
                </View>
                {renderStatusBadge(item.status)}
              </View>
              <Text style={styles.reason}>{item.reason}</Text>
              {item.adminDecision && (
                <Text style={{ marginTop: 6, fontStyle: "italic", color: "#444" }}>
                  Décision admin : {item.adminDecision}
                </Text>
              )}
            </View>
          )}
        />
      )}

      {/* ========================= CREATE ========================= */}
      {activeTab === "create" && (
        <>
          {/* Switch Location / Enchère */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tabButton, disputeType === "rental" && styles.activeTabButton]}
              onPress={() => {
                setDisputeType("rental");
                setSelectedRental(null); setSelectedAuction(null);
                setReason(""); setDescription("");
              }}
            >
              <Text style={[styles.tabText, disputeType === "rental" && styles.activeTabText]}>
                📦 Location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabButton, disputeType === "auction" && styles.activeTabButton]}
              onPress={() => {
                setDisputeType("auction");
                setSelectedRental(null); setSelectedAuction(null);
                setReason(""); setDescription("");
              }}
            >
              <Text style={[styles.tabText, disputeType === "auction" && styles.activeTabText]}>
                🔥 Enchère
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Litige LOCATION ── */}
          {disputeType === "rental" && (
            <>
              {!selectedRental ? (
                <>
                  <Text style={styles.sectionTitle}>Sélectionnez une location terminée</Text>
                  <FlatList
                    data={rentals}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<Text style={styles.emptyText}>Aucune location terminée</Text>}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.card, selectedRental?.id === item.id && styles.selectedCard]}
                        onPress={() => setSelectedRental(item)}
                      >
                        <Text style={styles.cardTitle}>{itemsMap[item.itemId]?.title ?? "Loading..."}</Text>
                        <Text style={styles.subText}>Location #{item.id}</Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              ) : (
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Litige pour location #{selectedRental.id}</Text>
                  <Text style={styles.subText}>Item : {itemsMap[selectedRental.itemId]?.title ?? "Loading..."}</Text>
                  <TextInput placeholder="Raison" value={reason} onChangeText={setReason} style={styles.input} />
                  <TextInput
                    placeholder="Description (optionnel)" value={description}
                    onChangeText={setDescription} style={[styles.input, { height: 90 }]} multiline
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
                    <Text style={styles.primaryButtonText}>Envoyer le litige</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedRental(null)}>
                    <Text style={styles.cancelText}>Changer de location</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {/* ── Litige ENCHÈRE ── */}
          {disputeType === "auction" && (
            <>
              {/* Switch rôle : J'ai gagné / Je suis le vendeur */}
              <View style={styles.tabs}>
                <TouchableOpacity
                  style={[styles.tabButton, auctionRole === "winner" && styles.activeTabButton]}
                  onPress={() => { setAuctionRole("winner"); setSelectedAuction(null); setReason(""); setDescription(""); }}
                >
                  <Text style={[styles.tabText, auctionRole === "winner" && styles.activeTabText]}>
                    🏆 J'ai gagné
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabButton, auctionRole === "owner" && styles.activeTabButton]}
                  onPress={() => { setAuctionRole("owner"); setSelectedAuction(null); setReason(""); setDescription(""); }}
                >
                  <Text style={[styles.tabText, auctionRole === "owner" && styles.activeTabText]}>
                    📦 Je suis le vendeur
                  </Text>
                </TouchableOpacity>
              </View>

              {!selectedAuction ? (
                <>
                  <Text style={styles.sectionTitle}>
                    {auctionRole === "winner" ? "Sélectionnez une enchère gagnée" : "Sélectionnez une enchère vendue"}
                  </Text>
                  <FlatList
                    data={currentAuctions}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                      <Text style={styles.emptyText}>
                        {auctionRole === "winner" ? "Aucune enchère gagnée disponible" : "Aucune enchère vendue disponible"}
                      </Text>
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.card, selectedAuction?.id === item.id && styles.selectedCard]}
                        onPress={() => setSelectedAuction(item)}
                      >
                        <Text style={styles.cardTitle}>{itemsMap[item.itemId]?.title ?? "Loading..."}</Text>
                        <Text style={styles.subText}>Enchère #{item.id} — {item.currentPrice} $</Text>
                        <Text style={[styles.subText, { color: "#e53935" }]}>
                          {auctionRole === "winner" ? "⚠️ Le vendeur ne livre pas" : "⚠️ Le gagnant refuse de payer"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </>
              ) : (
                <View style={styles.form}>
                  <Text style={styles.sectionTitle}>Litige pour enchère #{selectedAuction.id}</Text>
                  <Text style={styles.subText}>Item : {itemsMap[selectedAuction.itemId]?.title ?? "Loading..."}</Text>
                  <TextInput
                    placeholder={auctionRole === "winner" ? "Raison (ex: le vendeur ne livre pas)" : "Raison (ex: le gagnant refuse de payer)"}
                    value={reason} onChangeText={setReason} style={styles.input}
                  />
                  <TextInput
                    placeholder="Description (optionnel)" value={description}
                    onChangeText={setDescription} style={[styles.input, { height: 90 }]} multiline
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={handleCreateAuctionDispute}>
                    <Text style={styles.primaryButtonText}>Envoyer le litige</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setSelectedAuction(null)}>
                    <Text style={styles.cancelText}>Changer d'enchère</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f5f7fa" },
  tabs: { flexDirection: "row", marginBottom: 20, backgroundColor: "#e0e0e0", borderRadius: 30, padding: 4 },
  tabButton: { flex: 1, padding: 10, borderRadius: 30, alignItems: "center" },
  activeTabButton: { backgroundColor: "#1e88e5" },
  tabText: { color: "#555", fontWeight: "600" },
  activeTabText: { color: "#fff" },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 14, marginBottom: 12, elevation: 3 },
  selectedCard: { borderWidth: 2, borderColor: "#1e88e5" },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  cardTitle: { fontWeight: "bold", fontSize: 16 },
  reason: { color: "#555" },
  subText: { color: "#777", marginTop: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12, alignSelf: "center" },
  badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  form: { gap: 12 },
  input: { backgroundColor: "#fff", padding: 12, borderRadius: 10, borderWidth: 1, borderColor: "#ddd" },
  primaryButton: { backgroundColor: "#1e88e5", padding: 14, borderRadius: 12, alignItems: "center" },
  primaryButtonText: { color: "white", fontWeight: "bold" },
  cancelText: { textAlign: "center", marginTop: 10, color: "#888" },
  emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
});
