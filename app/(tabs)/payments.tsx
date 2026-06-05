import { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, FlatList,
  Alert, StyleSheet, ActivityIndicator, ScrollView,
  TextInput,
} from "react-native";
import { getAllPayments, refundAuctionFee, refundSimple } from "@/src/api/paymentService.web";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<"list" | "refund">("list");
  const [payments, setPayments] = useState<any[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const getTypeConfig = (type: string) => {
    switch (type) {

      case "AUCTION_PENALTY": return { label: "Pénalité" };
      case "AUCTION_CANCELLED": return { label: "Enchère annulée" };
      case "AUCTION_FEE": return { label: "Frais enchère" };
      case "AUCTION_REFUND": return { label: "Remboursement" };
      case "FAILED": return { icon: "❌", label: "Échec" };
      case "PENDING": return { icon: "🔄", label: "En attente" };
      case "SUCCESS": return { icon: "✅", label: "Réussi" };
      case "SUBSCRIPTION": return { label: "Abonnement" };
      default: return { label: type };
    }
  };

  useEffect(() => {
    loadAllPayments();
    setSelectedPayment(null);
  }, [activeTab]);

  const loadAllPayments = async () => {
    setLoadingData(true);
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les paiements");
    } finally {
      setLoadingData(false);
    }
  };

  const handleRefundSimple = async () => {
    if (!selectedPayment) return;
    setLoading(true);
    try {
      await refundSimple(selectedPayment.paymentIntentId);
      alert("Remboursement effectué ✅");
      setSelectedPayment(null);
      loadAllPayments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Erreur lors du remboursement");
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      SUCCESS: "#16a34a",
      FAILED: "#dc2626",
      PENDING: "#d97706",
    };

    const config = getTypeConfig(status);

    return (
      <View
        style={[
          styles.badge,
          { backgroundColor: colors[status] ?? "#9ca3af" },
        ]}
      >
        <Text style={styles.badgeText}>
          {config.icon} {config.label}
        </Text>
      </View>
    );
  };

  // ✅ Filtre les AUCTION_FEE qui ont un AUCTION_REFUND correspondant
  // par même userId + même auctionId
  const refundedItemIds = new Set(
    payments
      .filter(p => p.paymentType === "AUCTION_REFUND")
      .map(p => `${p.userId}_${p.itemId}`)
  );

  const refundable = payments.filter(p =>
    p.status === "SUCCESS" &&
    p.paymentType === "AUCTION_FEE" &&
    !refundedItemIds.has(`${p.userId}_${p.itemId}`)
  );

  const [search, setSearch] = useState("");

  const filteredPayments = payments.filter(p =>
    p.userFullName?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const filteredRefundable = refundable.filter(p =>
    p.userFullName?.toLowerCase().includes(search.toLowerCase()) ||
    String(p.id).includes(search)
  );

  const renderPaymentCard = (item: any, selectable = false) => (
    <TouchableOpacity
      key={item.id}
      style={[styles.card, selectable && selectedPayment?.id === item.id && styles.selectedCard]}
      onPress={selectable ? () => setSelectedPayment(item) : undefined}
      activeOpacity={selectable ? 0.7 : 1}
    >
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>Paiement #{item.id}</Text>
          <Text style={styles.subText}>{item.userFullName || "Utilisateur inconnu"}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          {item.alreadyRefunded && (
            <View style={{ backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
              <Text style={{ fontSize: 11, color: "#9ca3af" }}>Déjà remboursé</Text>
            </View>
          )}
          {statusBadge(item.status)}

        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.infoRow}>
          <Ionicons name="card-outline" size={14} color="#16a34a" />
          <Text style={styles.amount}>
            {item.amount}
            {" $"}
          </Text>
        </View>
        {item.paymentType && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {getTypeConfig(item.paymentType).label}
            </Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Ionicons name="calendar-outline" size={13} color="#9ca3af" />
          <Text style={styles.dateText}>
            {new Date(item.createdAt).toLocaleDateString("fr-CA")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f6f9" }}>

      <View style={{ padding: 20, paddingBottom: 0 }}>
        <Text style={styles.pageTitle}>💳 Paiements</Text>
        <Text style={styles.pageSubtitle}>Historique & remboursements</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          {[
            { key: "list", label: `📋 Tous (${payments.length})` },
            { key: "refund", label: `↩️ Remboursements (${refundable.length})` },
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.tabBtn, activeTab === key && styles.tabBtnActive]}
              onPress={() => { setActiveTab(key as any); setSelectedPayment(null); }}
            >
              <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={16} color="#9ca3af" style={{ marginRight: 8 }} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Nom ou numéro de paiement..."
            placeholderTextColor="#9ca3af"
            style={styles.searchInput}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loadingData ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <>
          {/* ── Liste tous ── */}
          {activeTab === "list" && (
            <FlatList
              data={filteredPayments}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>💳</Text>
                  <Text style={styles.emptyText}>Aucun paiement trouvé</Text>
                </View>
              }
              renderItem={({ item }) => renderPaymentCard(item, false)}
            />
          )}

          {/* ── Remboursements ── */}
          {activeTab === "refund" && !selectedPayment && (
            <FlatList
              data={filteredRefundable}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>✅</Text>
                  <Text style={styles.emptyText}>Aucun paiement à rembourser</Text>
                  <Text style={styles.emptySubText}>
                    Seuls les frais d'enchère (AUCTION_FEE) peuvent être remboursés.
                  </Text>
                </View>
              }
              renderItem={({ item }) => renderPaymentCard(item, true)}
            />
          )}

          {/* ── Confirmation remboursement ── */}
          {activeTab === "refund" && selectedPayment && (
            <ScrollView
              contentContainerStyle={{
                padding: 20,
                paddingBottom: insets.bottom + 40,
              }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.confirmCard}>

                <View style={{ padding: 20 }}>
                  <View style={styles.confirmCard}>
                    <Text style={styles.confirmTitle}>↩️ Confirmer le remboursement</Text>
                    <Text style={styles.confirmSubtitle}>Cette action est irréversible.</Text>

                    <View style={styles.confirmDetails}>
                      {[
                        { label: "Paiement", value: `#${selectedPayment.id}` },
                        { label: "Utilisateur", value: selectedPayment.userFullName },
                        { label: "Montant", value: `${selectedPayment.amount} $` },
                        {
                          label: "Type",
                          value: getTypeConfig(selectedPayment.paymentType).label
                        },
                      ].map(({ label, value }) => (
                        <View key={label} style={styles.detailRow}>
                          <Text style={styles.detailLabel}>{label}</Text>
                          <Text style={[styles.detailValue, label === "Montant" && { color: "#16a34a", fontWeight: "700" }]}>
                            {value}
                          </Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={styles.refundBtn}
                      onPress={handleRefundSimple}
                      disabled={loading}
                    >
                      {loading
                        ? <ActivityIndicator color="#fff" />
                        : <Text style={styles.refundBtnText}>Rembourser</Text>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setSelectedPayment(null)}
                    >
                      <Text style={styles.cancelBtnText}>← Retour à la liste</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageTitle: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 2 },
  pageSubtitle: { fontSize: 13, color: "#9ca3af", marginBottom: 16 },
  tabs: { flexDirection: "row", gap: 8, marginBottom: 4 },
  tabBtn: {
    flex: 1, paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 14, backgroundColor: "#fff",
    alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb",
  },
  tabBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  tabText: { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: "#f3f4f6",
  },
  selectedCard: { borderColor: "#2563eb", borderWidth: 2 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  cardTitle: { fontWeight: "700", fontSize: 15, color: "#111827" },
  subText: { color: "#9ca3af", fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  cardFooter: { flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  amount: { fontSize: 15, fontWeight: "700", color: "#16a34a", flexShrink: 0, },
  typeBadge: { backgroundColor: "#f3f4f6", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  typeText: { fontSize: 11, color: "#6b7280" },
  dateText: { fontSize: 12, color: "#9ca3af" },
  emptyContainer: { alignItems: "center", paddingVertical: 40 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 15, fontWeight: "600", color: "#6b7280", marginBottom: 6 },
  emptySubText: { fontSize: 12, color: "#9ca3af", textAlign: "center", lineHeight: 18 },
  confirmCard: {
    backgroundColor: "#fff", borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: "#f3f4f6",
  },
  confirmTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  confirmSubtitle: { fontSize: 13, color: "#9ca3af", marginBottom: 20 },
  confirmDetails: { backgroundColor: "#f9fafb", borderRadius: 14, padding: 16, marginBottom: 20, gap: 12 },
  detailRow: { flexDirection: "row", justifyContent: "space-between" },
  detailLabel: { fontSize: 13, color: "#6b7280" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  refundBtn: {
    backgroundColor: "#dc2626", padding: 16, borderRadius: 14,
    alignItems: "center", marginBottom: 12,
  },
  refundBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  cancelBtn: { alignItems: "center", padding: 10 },
  cancelBtnText: { color: "#6b7280", fontSize: 14 },
  // Dans les styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111827",
  },
});