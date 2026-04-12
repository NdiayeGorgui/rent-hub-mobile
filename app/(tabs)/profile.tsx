import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { fetchMyProfile } from "../../src/api/profileService";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { fetchItemDetails } from "@/src/api/itemService";
import { getAuctionByItemId } from "@/src/api/auctionService";
import { fetchMyRentals } from "@/src/api/rentalService";
import { getMyPayments, payPenalty } from "@/src/api/paymentService.web";
import { handleWebPayment } from "@/src/api/stripeWeb";

export default function Profile() {
  const { logout, user } = useAuth();
  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishedItemsDetails, setPublishedItemsDetails] = useState<any[]>([]);
  const [rentedItemsDetails, setRentedItemsDetails] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [pendingPenalty, setPendingPenalty] = useState<any>(null);

  // ── Étapes paiement pénalité ──
  const [penaltyStep, setPenaltyStep] = useState<"idle" | "payment">("idle");
  const [payingPenalty, setPayingPenalty] = useState(false);

  // ── Formulaire carte (même pattern que SubscriptionScreen) ──
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") alert(`${title}\n\n${message}`);
    else Alert.alert(title, message);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
        logout().then(() => router.replace("/(auth)/login"));
      }
    } else {
      Alert.alert("Déconnexion", "Voulez-vous vraiment vous déconnecter ?", [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ]);
    }
  };

  // ==============================
  // CONFIRMER LE PAIEMENT PÉNALITÉ
  // ==============================
  const handleConfirmPenaltyPayment = async () => {
    try {
      setPayingPenalty(true);

      // 1. Crée le PaymentIntent côté back
      const payment = await payPenalty();
      const clientSecret = payment.clientSecret;

      if (!clientSecret) {
        throw new Error("clientSecret manquant");
      }

      // 2. Confirme via Stripe — même logique que SubscriptionScreen
      if (Platform.OS === "web") {
        await handleWebPayment(clientSecret);
      }

      // 3. Stripe webhook → handlePaymentSuccess(AUCTION_PENALTY)
      //    → kafka "auction.penalty.paid"
      //    → auth-service réactive le compte
      //    → notif-service notifie le winner

      showAlert("✅ Paiement effectué", "Votre pénalité a été payée. Votre compte sera réactivé sous peu.");

      // 4. Recharge les paiements
      const updated = await getMyPayments();
      setPayments(updated);
      setPendingPenalty(null);
      setPenaltyStep("idle");

    } catch (error: any) {
      showAlert("Erreur", error?.message ?? "Paiement échoué");
    } finally {
      setPayingPenalty(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      
      try {
        const data = await fetchMyProfile();
        setProfile(data);

        // PAIEMENTS
        const myPayments = await getMyPayments();
        setPayments(myPayments);

        // Détecte une pénalité en attente
        const penalty = myPayments.find(
          (p: any) => p.paymentType  === "AUCTION_PENALTY" && p.status === "PENDING"
        );
        console.log("PENALTY FOUND:", JSON.stringify(penalty));
console.log("ALL PAYMENTS:", JSON.stringify(myPayments));
        setPendingPenalty(penalty ?? null);
        

        // ITEMS PUBLIÉS
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
                } catch {
                  details.currentPrice = null;
                  details.auctionEndDate = null;
                }
              }
              return details;
            })
          );
          setPublishedItemsDetails(itemsWithDetails);
        }

        // ITEMS LOUÉS
        const rentals = await fetchMyRentals();
        if (rentals?.length) {
          const rentedDetails = await Promise.all(
            rentals.map(async (rental: any) => {
              const details = await fetchItemDetails(rental.itemId);
              details.id = rental.itemId;
              details.startDate = rental.startDate;
              details.endDate = rental.endDate;
              if (details.type === "AUCTION") {
                try {
                  const auction = await getAuctionByItemId(details.id);
                  details.currentPrice = auction?.currentPrice ?? null;
                  details.auctionEndDate = auction?.endDate ?? null;
                } catch {
                  details.currentPrice = null;
                  details.auctionEndDate = null;
                }
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

    loadProfile();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text>Impossible de charger le profil</Text>
      </View>
    );
  }

  // ==============================
  // ÉCRAN PAIEMENT PÉNALITÉ
  // ==============================
  if (penaltyStep === "payment") {
    return (
      <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => setPenaltyStep("idle")}>
          <Text style={styles.backLink}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.penaltyPayTitle}>💳 Paiement de la pénalité</Text>

        <View style={styles.penaltyAmountBox}>
          <Text style={styles.penaltyAmountLabel}>Montant à payer</Text>
          <Text style={styles.penaltyAmountValue}>{pendingPenalty?.amount ?? 50} $</Text>
          <Text style={styles.penaltyAmountSub}>
            Pénalité suite à refus de paiement après enchère gagnée
          </Text>
        </View>

        <Text style={{ marginBottom: 10, color: "#555" }}>
          🔒 Paiement sécurisé via Stripe
        </Text>

        <Text style={styles.label}>Numéro de carte</Text>
        <TextInput
          style={styles.input}
          value={cardNumber}
          onChangeText={setCardNumber}
          keyboardType="numeric"
          maxLength={16}
        />

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Mois</Text>
            <TextInput
              style={styles.input}
              value={expMonth}
              onChangeText={setExpMonth}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Année</Text>
            <TextInput
              style={styles.input}
              value={expYear}
              onChangeText={setExpYear}
              keyboardType="numeric"
              maxLength={2}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>CVC</Text>
            <TextInput
              style={styles.input}
              value={cvc}
              onChangeText={setCvc}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.penaltyPayButton}
          onPress={handleConfirmPenaltyPayment}
          disabled={payingPenalty}
        >
          {payingPenalty ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.penaltyPayButtonText}>
              Confirmer le paiement de {pendingPenalty?.amount ?? 50} $
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ==============================
  // PROFIL NORMAL
  // ==============================
  return (
    <ScrollView style={styles.container}>

      {/* IDENTITÉ */}
      <View style={styles.card}>
        <Text style={styles.name}>{profile.fullName}</Text>
        <Text>@{profile.username}</Text>
        <Text>{profile.city}</Text>
        {profile.premium && (
          <Text style={styles.premium}>⭐ Compte Premium</Text>
        )}
      </View>

      {/* ✅ ALERTE PÉNALITÉ EN ATTENTE */}
      {pendingPenalty && (
        <View style={styles.penaltyCard}>
          <Text style={styles.penaltyTitle}>⚠️ Pénalité en attente</Text>
          <Text style={styles.penaltyText}>
            Suite à un refus de paiement après enchère gagnée, une pénalité de{" "}
            <Text style={{ fontWeight: "bold" }}>{pendingPenalty.amount} $</Text> est due.
          </Text>
          {pendingPenalty.penaltyDeadline && (
            <Text style={styles.penaltyDeadline}>
              ⏰ À payer avant le : {formatDate(pendingPenalty.penaltyDeadline)}
            </Text>
          )}
          <Text style={styles.penaltyWarning}>
            Sans paiement dans les délais, votre compte sera suspendu.
          </Text>
          <TouchableOpacity
            style={styles.penaltyButton}
            onPress={() => setPenaltyStep("payment")}
          >
            <Text style={styles.penaltyButtonText}>
              💳 Payer {pendingPenalty.amount} $ maintenant
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* RÉPUTATION */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Réputation</Text>
          <Text>Note moyenne : {profile.averageRating ? profile.averageRating.toFixed(1) : 0}</Text>
          <Text>Avis : {profile.reviewsCount ?? 0}</Text>
          <Text>Badge : {profile.badge ?? "Aucun"}</Text>
        </View>
      )}

      {/* ITEMS PUBLIÉS */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items publiés</Text>
          {publishedItemsDetails.length === 0 ? (
            <Text>Aucun item publié</Text>
          ) : (
            publishedItemsDetails.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>#{item.id} - {item.title}</Text>
                {item.type === "AUCTION" ? (
                  <Text style={styles.itemPrice}>
                    🔥 {item.currentPrice != null ? item.currentPrice : "Pas encore commencé"} $
                  </Text>
                ) : (
                  <Text style={styles.itemPrice}>{item.pricePerDay} $/j</Text>
                )}
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

      {/* ITEMS LOUÉS */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Items loués</Text>
          {rentedItemsDetails.length === 0 ? (
            <Text>Aucun item loué</Text>
          ) : (
            rentedItemsDetails.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemTitle}>#{item.id} - {item.title}</Text>
                {item.type === "AUCTION" ? (
                  <Text style={styles.itemPrice}>
                    🔥 {item.currentPrice != null ? item.currentPrice : "Pas encore commencé"} $
                  </Text>
                ) : (
                  <Text style={styles.itemPrice}>{item.pricePerDay} $/j</Text>
                )}
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

      {/* MES PAIEMENTS */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Mes paiements</Text>
          {payments.length === 0 ? (
            <Text>Aucun paiement</Text>
          ) : (
            payments.map((payment) => (
              <View key={payment.id} style={styles.paymentRow}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={styles.paymentTitle}>
                    {payment.paymentType  === "AUCTION_PENALTY" ? "⚠️ Pénalité enchère" : `Paiement #${payment.id}`}
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
                <Text style={styles.paymentType}>{payment.paymentType }</Text>
                <Text style={styles.paymentDate}>{formatDate(payment.createdAt)}</Text>

                {/* Bouton payer inline si pénalité PENDING */}
                {payment.paymentType  === "AUCTION_PENALTY" && payment.status === "PENDING" && (
                  <TouchableOpacity
                    style={styles.inlinePayBtn}
                    onPress={() => setPenaltyStep("payment")}
                  >
                    <Text style={styles.inlinePayBtnText}>💳 Payer maintenant</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", padding: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  name: { fontSize: 20, fontWeight: "bold" },
  premium: { marginTop: 5, color: "#f59e0b", fontWeight: "bold" },
  sectionTitle: { fontWeight: "bold", marginBottom: 10 },

  // ── Alerte pénalité ──
  penaltyCard: {
    backgroundColor: "#fff3e0",
    borderWidth: 2,
    borderColor: "#ff9800",
    padding: 16,
    borderRadius: 12,
    marginBottom: 15,
    gap: 8,
  },
  penaltyTitle: { fontSize: 16, fontWeight: "bold", color: "#e65100" },
  penaltyText: { color: "#555", lineHeight: 20 },
  penaltyDeadline: { color: "#e65100", fontWeight: "600" },
  penaltyWarning: { color: "#f44336", fontSize: 12, fontStyle: "italic" },
  penaltyButton: {
    backgroundColor: "#f44336",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  penaltyButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },

  // ── Écran paiement pénalité ──
  backLink: { color: "blue", marginBottom: 15, fontSize: 16 },
  penaltyPayTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  penaltyAmountBox: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff9800",
  },
  penaltyAmountLabel: { color: "#777", marginBottom: 4 },
  penaltyAmountValue: { fontSize: 32, fontWeight: "bold", color: "#f44336" },
  penaltyAmountSub: { color: "#999", fontSize: 12, marginTop: 4, textAlign: "center" },
  label: { fontSize: 14, marginBottom: 5, fontWeight: "500" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  penaltyPayButton: {
    backgroundColor: "#f44336",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  penaltyPayButtonText: { color: "white", fontWeight: "bold", fontSize: 16 },

  // ── Items ──
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  itemTitle: { flex: 2, fontWeight: "500" },
  itemPrice: { flex: 1, textAlign: "right", color: "#2563eb", fontWeight: "600" },
  itemRating: { flex: 1, textAlign: "right", fontWeight: "500" },
  itemDate: { flex: 2, textAlign: "right", color: "#555", fontSize: 12 },

  // ── Paiements ──
  paymentRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
    gap: 2,
  },
  paymentTitle: { fontWeight: "600" },
  paymentAmount: { color: "#2563eb", fontWeight: "bold" },
  paymentType: { color: "#777", fontSize: 12 },
  paymentStatus: { fontWeight: "bold" },
  paymentDate: { fontSize: 12, color: "#777" },
  inlinePayBtn: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 6,
  },
  inlinePayBtnText: { color: "#fff", fontWeight: "bold" },

  // ── Logout ──
  logoutButton: {
    marginTop: 30,
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 40,
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
