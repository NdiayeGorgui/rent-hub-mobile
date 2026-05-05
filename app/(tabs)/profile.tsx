import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TouchableOpacity, Alert, TextInput, RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import { fetchMyProfile } from "../../src/api/profileService";
import { useAuth } from "@/src/context/AuthContext";
import { fetchItemDetails } from "@/src/api/itemService";
import { getAuctionByItemId } from "@/src/api/auctionService";
import { fetchMyRentals } from "@/src/api/rentalService";
import { getMyPayments, payPenalty } from "@/src/api/paymentService.web";
import { handleMobilePayment } from "@/src/api/stripeMobile";

export default function Profile() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishedItemsDetails, setPublishedItemsDetails] = useState<any[]>([]);
  const [rentedItemsDetails, setRentedItemsDetails] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingPenalty, setPendingPenalty] = useState<any>(null);
  const [penaltyStep, setPenaltyStep] = useState<"idle" | "payment">("idle");
  const [payingPenalty, setPayingPenalty] = useState(false);
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");
  const [refreshing, setRefreshing] = useState(false);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const handleConfirmPenaltyPayment = async () => {
    try {
      setPayingPenalty(true);
      const payment = await payPenalty();
      if (!payment.clientSecret) throw new Error("clientSecret manquant");
      await handleMobilePayment(payment.clientSecret);
      Alert.alert("✅ Succès", "Votre pénalité a été payée. Votre compte sera réactivé sous peu.");
      const updated = await getMyPayments();
      setPayments(updated);
      setPendingPenalty(null);
      setPenaltyStep("idle");
    } catch (error: any) {
      Alert.alert("Erreur", error?.message ?? "Paiement échoué");
    } finally {
      setPayingPenalty(false);
    }
  };

  useEffect(() => { loadProfile(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const loadProfile = async () => {
    try {
      const data = await fetchMyProfile();
      setProfile(data);

      const myPayments = await getMyPayments();
      setPayments(myPayments);
      const penalty = myPayments.find(
        (p: any) => p.paymentType === "AUCTION_PENALTY" && p.status === "PENDING"
      );
      setPendingPenalty(penalty ?? null);

      if (data.publishedItems?.length) {
        const itemsWithDetails = await Promise.all(
          data.publishedItems.map(async (item: any) => {
            const details = await fetchItemDetails(item.id);
            details.id = item.id;
            if (details.type === "AUCTION") {
              try {
                const auction = await getAuctionByItemId(item.id);
                details.currentPrice = auction?.currentPrice ?? null;
                details.auctionEndDate = auction?.endDate ?? null;
              } catch { }
            }
            return details;
          })
        );
        setPublishedItemsDetails(itemsWithDetails);
      }

      const rentals = await fetchMyRentals();
      const confirmedRentals = rentals.filter((r: any) =>
        ["APPROVED", "ONGOING", "ENDED"].includes(r.status)
      );
      if (confirmedRentals?.length) {
        const rentedDetails = await Promise.all(
          confirmedRentals.map(async (rental: any) => {
            const details = await fetchItemDetails(rental.itemId);
            details.id = rental.itemId;
            details.startDate = rental.startDate;
            details.endDate = rental.endDate;
            if (details.type === "AUCTION") {
              try {
                const auction = await getAuctionByItemId(details.id);
                details.currentPrice = auction?.currentPrice ?? null;
                details.auctionEndDate = auction?.endDate ?? null;
              } catch { }
            }
            return details;
          })
        );
        setRentedItemsDetails(rentedDetails);
      }
    } catch (error) {
      console.log("PROFILE ERROR:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  if (!profile) return (
    <View style={styles.center}>
      <Text>Impossible de charger le profil</Text>
    </View>
  );

  if (penaltyStep === "payment") return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => setPenaltyStep("idle")}>
        <Text style={styles.backLink}>← Retour</Text>
      </TouchableOpacity>
      <Text style={styles.penaltyPayTitle}>💳 Paiement de la pénalité</Text>
      <View style={styles.penaltyAmountBox}>
        <Text style={styles.penaltyAmountLabel}>Montant à payer</Text>
        <Text style={styles.penaltyAmountValue}>{pendingPenalty?.amount ?? 50} $</Text>
        <Text style={styles.penaltyAmountSub}>Pénalité suite à refus de paiement après enchère gagnée</Text>
      </View>
      <Text style={{ marginBottom: 10, color: "#555" }}>🔒 Paiement sécurisé via Stripe</Text>
      <Text style={styles.label}>Numéro de carte</Text>
      <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" maxLength={16} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Mois</Text>
          <TextInput style={styles.input} value={expMonth} onChangeText={setExpMonth} keyboardType="numeric" maxLength={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Année</Text>
          <TextInput style={styles.input} value={expYear} onChangeText={setExpYear} keyboardType="numeric" maxLength={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>CVC</Text>
          <TextInput style={styles.input} value={cvc} onChangeText={setCvc} keyboardType="numeric" maxLength={3} />
        </View>
      </View>
      <TouchableOpacity style={styles.penaltyPayButton} onPress={handleConfirmPenaltyPayment} disabled={payingPenalty}>
        {payingPenalty ? <ActivityIndicator color="#fff" /> : (
          <Text style={styles.penaltyPayButtonText}>Confirmer le paiement de {pendingPenalty?.amount ?? 50} $</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* ── Identité ── */}
      <View style={styles.card}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>
            {profile.fullName?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        <Text style={styles.city}>{profile.city}</Text>
        {profile.premium && <Text style={styles.premium}>⭐ Compte Premium</Text>}
      </View>

      {/* ── Pénalité ── */}
      {pendingPenalty && (
        <View style={styles.penaltyCard}>
          <Text style={styles.penaltyTitle}>⚠️ Pénalité en attente</Text>
          <Text style={styles.penaltyText}>
            Suite à un refus de paiement après enchère gagnée, une pénalité de{" "}
            <Text style={{ fontWeight: "bold" }}>{pendingPenalty.amount} $</Text> est due.
          </Text>
          {pendingPenalty.penaltyDeadline && (
            <Text style={styles.penaltyDeadline}>⏰ À payer avant le : {formatDate(pendingPenalty.penaltyDeadline)}</Text>
          )}
          <Text style={styles.penaltyWarning}>Sans paiement dans les délais, votre compte sera suspendu.</Text>
          <TouchableOpacity style={styles.penaltyButton} onPress={() => setPenaltyStep("payment")}>
            <Text style={styles.penaltyButtonText}>💳 Payer {pendingPenalty.amount} $ maintenant</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Réputation ── */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Réputation</Text>
          <Text>Note moyenne : {profile.averageRating ? profile.averageRating.toFixed(1) : 0}</Text>
          <Text>Avis : {profile.reviewsCount ?? 0}</Text>
          <Text>Badge : {profile.badge ?? "Aucun"}</Text>
        </View>
      )}

      {/* ── Items publiés ── */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items publiés</Text>
          {publishedItemsDetails.length === 0 ? <Text>Aucun item publié</Text> : (
            publishedItemsDetails.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>#{item.id} - {item.title}</Text>
                {item.type === "AUCTION"
                  ? <Text style={styles.itemPrice}>🔥 {item.currentPrice ?? "—"} $</Text>
                  : <Text style={styles.itemPrice}>{item.pricePerDay} $/j</Text>}
                <Text style={styles.itemRating}>⭐ {item.averageRating ?? 0}</Text>
                <Text style={styles.itemDate}>
                  {item.type === "AUCTION"
                    ? `${formatDate(item.createdAt)} → ${formatDate(item.auctionEndDate)}`
                    : formatDate(item.createdAt)}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* ── Items loués ── */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items loués</Text>
          {rentedItemsDetails.length === 0 ? <Text>Aucun item loué</Text> : (
            rentedItemsDetails.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>#{item.id} - {item.title}</Text>
                {item.type === "AUCTION"
                  ? <Text style={styles.itemPrice}>🔥 {item.currentPrice ?? "—"} $</Text>
                  : <Text style={styles.itemPrice}>{item.pricePerDay} $/j</Text>}
                <Text style={styles.itemRating}>⭐ {item.averageRating ?? 0}</Text>
                <Text style={styles.itemDate}>
                  {item.type === "AUCTION"
                    ? `${formatDate(item.createdAt)} → ${formatDate(item.auctionEndDate)}`
                    : `${formatDate(item.startDate)} → ${formatDate(item.endDate)}`}
                </Text>
              </View>
            ))
          )}
        </View>
      )}

      {/* ── Paiements ── */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mes paiements</Text>
          {payments.length === 0 ? <Text>Aucun paiement</Text> : (
            payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.paymentTitle}>
                    {payment.paymentType === "AUCTION_PENALTY" ? "⚠️ Pénalité enchère" : `Paiement #${payment.id}`}
                  </Text>
                  <Text style={[
                    styles.paymentStatus,
                    payment.status === "SUCCESS" && { color: "green" },
                    payment.status === "PENDING" && { color: "orange" },
                    payment.status === "FAILED" && { color: "red" },
                    payment.status === "EXPIRED" && { color: "#9e9e9e" },
                  ]}>
                    {payment.status}
                  </Text>
                </View>
                <Text style={styles.paymentAmount}>{payment.amount} $</Text>
                <Text style={styles.paymentType}>{payment.paymentType}</Text>
                <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>
                {payment.paymentType === "AUCTION_PENALTY" && payment.status === "PENDING" && (
                  <TouchableOpacity style={styles.inlinePayBtn} onPress={() => setPenaltyStep("payment")}>
                    <Text style={styles.inlinePayBtnText}>💳 Payer maintenant</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", padding: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 15, alignItems: "center" },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#2563eb", justifyContent: "center",
    alignItems: "center", marginBottom: 10,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  name: { fontSize: 20, fontWeight: "bold" },
  username: { color: "#6b7280", fontSize: 14, marginTop: 2 },
  city: { color: "#9ca3af", fontSize: 13, marginTop: 2 },
  premium: { marginTop: 8, color: "#f59e0b", fontWeight: "bold" },

  sectionTitle: { fontWeight: "bold", marginBottom: 10, alignSelf: "flex-start" },

  penaltyCard: { backgroundColor: "#fff3e0", borderWidth: 2, borderColor: "#ff9800", padding: 16, borderRadius: 12, marginBottom: 15, gap: 8 },
  penaltyTitle: { fontSize: 16, fontWeight: "bold", color: "#e65100" },
  penaltyText: { color: "#555", lineHeight: 20 },
  penaltyDeadline: { color: "#e65100", fontWeight: "600" },
  penaltyWarning: { color: "#f44336", fontSize: 12, fontStyle: "italic" },
  penaltyButton: { backgroundColor: "#f44336", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 4 },
  penaltyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  backLink: { color: "blue", marginBottom: 15, fontSize: 16 },
  penaltyPayTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  penaltyAmountBox: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 20, alignItems: "center", borderWidth: 1, borderColor: "#ff9800" },
  penaltyAmountLabel: { color: "#777", marginBottom: 4 },
  penaltyAmountValue: { fontSize: 32, fontWeight: "bold", color: "#f44336" },
  penaltyAmountSub: { color: "#999", fontSize: 12, marginTop: 4, textAlign: "center" },
  label: { fontSize: 14, marginBottom: 5, fontWeight: "500" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, borderRadius: 8, marginBottom: 15, backgroundColor: "#fff" },
  penaltyPayButton: { backgroundColor: "#f44336", padding: 15, borderRadius: 12, alignItems: "center", marginTop: 10 },
  penaltyPayButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, width: "100%" },
  itemTitle: { flex: 2, fontWeight: "500" },
  itemPrice: { flex: 1, textAlign: "right", color: "#2563eb", fontWeight: "600" },
  itemRating: { flex: 1, textAlign: "right", fontWeight: "500" },
  itemDate: { flex: 2, textAlign: "right", color: "#555", fontSize: 12 },

  paymentRow: { borderBottomWidth: 1, borderBottomColor: "#eee", paddingVertical: 10, gap: 2, width: "100%" },
  paymentTitle: { fontWeight: "600" },
  paymentAmount: { color: "#2563eb", fontWeight: "bold" },
  paymentType: { color: "#777", fontSize: 12 },
  paymentStatus: { fontWeight: "bold" },
  paymentDate: { fontSize: 12, color: "#777" },
  inlinePayBtn: { backgroundColor: "#f44336", padding: 10, borderRadius: 8, alignItems: "center", marginTop: 6 },
  inlinePayBtnText: { color: "#fff", fontWeight: "bold" },
});
