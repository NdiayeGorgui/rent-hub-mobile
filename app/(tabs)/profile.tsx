import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { fetchMyProfile } from "../../src/api/profileService";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { fetchItemDetails } from "@/src/api/itemService";
import { getAuctionByItemId } from "@/src/api/auctionService";
import { fetchMyRentals } from "@/src/api/rentalService";
import { getMyPayments } from "@/src/api/paymentService.web";

export default function Profile() {
 const { logout, user } = useAuth();
 const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [publishedItemsDetails, setPublishedItemsDetails] = useState<any[]>([]);
  const [rentedItemsDetails, setRentedItemsDetails] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
        logout().then(() => router.replace("/(auth)/login"));
      }
    } else {
      Alert.alert(
        "Déconnexion",
        "Voulez-vous vraiment vous déconnecter ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Oui",
            style: "destructive",
            onPress: async () => {
              await logout();
              router.replace("/(auth)/login");
            },
          },
        ]
      );
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await fetchMyProfile();
        setProfile(data);

        // PAIEMENTS
        const myPayments = await getMyPayments();
        setPayments(myPayments);

        // ITEMS PUBLIÉS
        if (data.publishedItems?.length) {
          const itemsWithDetails = await Promise.all(
            data.publishedItems.map(async (item: any) => {
              const details = await fetchItemDetails(item.id);

              // 🔥 garder l'id
              details.id = item.id;

              if (details.type === "AUCTION") {
                try {
                  const auction = await getAuctionByItemId(item.id);
                  details.currentPrice = auction?.currentPrice ?? null;
                  details.auctionEndDate = auction?.endDate ?? null;
                } catch (err) {
                  console.log("Erreur enchère item publié", item.id, err);
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

              // 🔥 garder l'id
              details.id = rental.itemId;

              details.startDate = rental.startDate;
              details.endDate = rental.endDate;

              if (details.type === "AUCTION") {
                try {
                  const auction = await getAuctionByItemId(details.id);
                  details.currentPrice = auction?.currentPrice ?? null;
                  details.auctionEndDate = auction?.endDate ?? null;
                } catch (err) {
                  console.log("Erreur enchère item loué", details.id, err);
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

      {/* RÉPUTATION */}
      {!isAdmin && (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Réputation</Text>
        <Text>
          Note moyenne : {profile.averageRating ? profile.averageRating.toFixed(1) : 0}
        </Text>
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
              <Text style={styles.itemTitle}>
                #{item.id} - {item.title}
              </Text>

              {item.type === "AUCTION" ? (
                <Text style={styles.itemPrice}>
                  🔥 Enchère :{" "}
                  {item.currentPrice != null
                    ? item.currentPrice
                    : "Pas encore commencé"}{" "}
                  $
                </Text>
              ) : (
                <Text style={styles.itemPrice}>
                  {item.pricePerDay} $/j
                </Text>
              )}

              <Text style={styles.itemRating}>
                ⭐ {item.averageRating ?? 0}
              </Text>

              <Text style={styles.itemDate}>
                {item.type === "AUCTION"
                  ? `${formatDate(item.createdAt)} → ${formatDate(
                    item.auctionEndDate
                  )}`
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
              <Text style={styles.itemTitle}>
                #{item.id} - {item.title}
              </Text>

              {item.type === "AUCTION" ? (
                <Text style={styles.itemPrice}>
                  🔥 Enchère :{" "}
                  {item.currentPrice != null
                    ? item.currentPrice
                    : "Pas encore commencé"}{" "}
                  $
                </Text>
              ) : (
                <Text style={styles.itemPrice}>
                  {item.pricePerDay} $/j
                </Text>
              )}

              <Text style={styles.itemRating}>
                ⭐ {item.averageRating ?? 0}
              </Text>

              <Text style={styles.itemDate}>
                {item.type === "AUCTION"
                  ? `${formatDate(item.createdAt)} → ${formatDate(
                    item.auctionEndDate
                  )}`
                  : `${formatDate(item.startDate)} → ${formatDate(
                    item.endDate
                  )}`}
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
              <Text style={styles.paymentTitle}>
                Paiement #{payment.id}
              </Text>

              <Text style={styles.paymentAmount}>
                {payment.amount} $
              </Text>

              <Text
                style={[
                  styles.paymentStatus,
                  payment.status === "SUCCESS" && { color: "green" },
                  payment.status === "PENDING" && { color: "orange" },
                  payment.status === "FAILED" && { color: "red" },
                ]}
              >
                {payment.status}
              </Text>

              <Text style={styles.paymentDate}>
                {formatDate(payment.createdAt)}
              </Text>
            </View>
          ))
        )}
      </View>
      )}
      {/* LOGOUT */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={confirmLogout}
      >
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

  premium: {
    marginTop: 5,
    color: "#f59e0b",
    fontWeight: "bold",
  },

  sectionTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },

  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  itemTitle: { flex: 2, fontWeight: "500" },

  itemPrice: {
    flex: 1,
    textAlign: "right",
    color: "#2563eb",
    fontWeight: "600",
  },

  itemRating: {
    flex: 1,
    textAlign: "right",
    fontWeight: "500",
  },

  itemDate: {
    flex: 2,
    textAlign: "right",
    color: "#555",
    fontSize: 12,
  },

  logoutButton: {
    marginTop: 30,
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  logoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  paymentRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 8,
  },

  paymentTitle: {
    fontWeight: "600",
  },

  paymentAmount: {
    color: "#2563eb",
    fontWeight: "bold",
  },

  paymentStatus: {
    fontWeight: "bold",
  },

  paymentDate: {
    fontSize: 12,
    color: "#777",
  },
});