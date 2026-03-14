import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { Link, useLocalSearchParams } from "expo-router";
import { activateItem, deactivateItem, fetchItemDetails } from "../../src/api/itemService";
import { TextInput, Pressable, Alert } from "react-native";
import { createRental } from "../../src/api/rentalService";
import { createAuction, getAuctionByItemId, placeBid } from "../../src/api/auctionService";
import { getCurrentUser } from "../../src/api/authService";
import { getReviewsByItem, getReviewsByUser, getReviewsCountByItem } from "@/src/api/reviewService";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function ItemDetails() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentLoading, setRentLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  const [isOwner, setIsOwner] = useState(false);
  const [startPrice, setStartPrice] = useState("");
  const [endDateAuction, setEndDateAuction] = useState("");
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const [bidAmount, setBidAmount] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [auction, setAuction] = useState<any>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsCount, setReviewsCount] = useState<number>(0);

  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [userReviewsLoading, setUserReviewsLoading] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showAuctionPicker, setShowAuctionPicker] = useState(false);

  const baseURL =
    Platform.OS === "android"
      ? "http://10.0.2.2:8080"
      : "http://localhost:8080";



  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await fetchItemDetails(Number(id));
        setItem(data);

        const user = await getCurrentUser();
        setCurrentUser(user);

        console.log("ITEM DATA:", data);
        console.log("IMAGE URLS:", data.imageUrls);

        if (user?.userId && data.publisher?.userId) {
          setIsOwner(user.userId === data.publisher.userId);
        } else {
          setIsOwner(false);
        }

        // 🔥 Charger l'enchère si AUCTION
        if (data.type === "AUCTION") {
          try {
            const auctionData = await getAuctionByItemId(Number(id));

            setAuction({
              ...auctionData,
              currentPrice:
                auctionData?.currentPrice ??
                auctionData?.startPrice ??
                null,
            });
          } catch (err) {
            console.log("No auction yet for this item");
            setAuction(null);
          }
        }

        // 🔥 Charger les reviews
        try {
          setReviewsLoading(true);
          const reviewsData = await getReviewsByItem(Number(id));
          setReviews(reviewsData);

          const count = await getReviewsCountByItem(Number(id));
          setReviewsCount(count);
        } catch (error) {
          console.log("Error loading reviews:", error);
        } finally {
          setReviewsLoading(false);
        }

        // 🔥 Charger les reviews du propriétaire
        try {
          if (data.publisher?.userId) {
            setUserReviewsLoading(true);

            const userReviewsData = await getReviewsByUser(
              data.publisher.userId
            );

            setUserReviews(userReviewsData);
          }
        } catch (error) {
          console.log("Error loading user reviews:", error);
        } finally {
          setUserReviewsLoading(false);
        }
      } catch (error) {
        console.log("Error fetching item details:", error);
      } finally {
        setLoading(false);
      }
    };

    loadItem();
  }, [id]);

  useEffect(() => {
    if (!auction?.endDate) return;

    const interval = setInterval(() => {

      const now = new Date().getTime();
      const end = new Date(auction.endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Enchère terminée");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      let timeString = "";

      if (days > 0) {
        timeString = `${days}j ${hours}h ${minutes}m ${seconds}s`;
      }
      else if (hours > 0) {
        timeString = `${hours}h ${minutes}m ${seconds}s`;
      }
      else if (minutes > 0) {
        timeString = `${minutes}m ${seconds}s`;
      }
      else {
        timeString = `${seconds}s`;
      }

      setTimeLeft(timeString);

    }, 1000);

    return () => clearInterval(interval);

  }, [auction]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    if (Platform.OS === "web") {
      if (confirm(`${title}\n\n${message}`)) {
        onConfirm();
      }
    } else {
      Alert.alert(title, message, [
        { text: "Annuler", style: "cancel" },
        { text: "Confirmer", onPress: onConfirm },
      ]);
    }
  };


  const handleBid = async () => {
    if (!bidAmount) {
      showAlert("Erreur", "Entrez un montant");
      return;
    }

    try {
      setBidLoading(true);

      await placeBid(Number(auction.id), Number(bidAmount));
      const updatedAuction = await getAuctionByItemId(Number(id));
      setAuction(updatedAuction);

      showAlert("Succès", "Enchère placée !");
      setBidAmount("");

    } catch (error: any) {
      console.log("Bid error:", error?.response?.data);

      showAlert(
        "Erreur",
        error?.response?.data?.message || "Impossible de placer l'enchère"
      );
    } finally {
      setBidLoading(false);
    }
  };

const handleDeactivate = () => {

  const action = item.active ? "désactiver" : "activer";

  showConfirm(
    "Confirmation",
    `Voulez-vous vraiment ${action} cet item ?`,
    async () => {
      try {
        setDeactivateLoading(true);

        if (item.active) {
          await deactivateItem(Number(id));
        } else {
          await activateItem(Number(id));
        }

        setItem({ ...item, active: !item.active });

        showAlert(
          "Succès",
          item.active ? "Item désactivé" : "Item activé"
        );

      } catch (error) {
        showAlert("Erreur", "Impossible de modifier le statut");
      } finally {
        setDeactivateLoading(false);
      }
    }
  );
};

  const handleRent = async () => {
    if (!startDate || !endDate) {
      showAlert("Erreur", "Veuillez entrer les dates");
      return;
    }

    try {
      setRentLoading(true);

      await createRental({
        itemId: Number(id),
        startDate,
        endDate,
      });

      showAlert("Succès", "Demande de location envoyée");
      setStartDate("");
      setEndDate("");
    } catch (error: any) {
      console.log("Create rental error:", error?.response?.data);
      showAlert("Erreur", "Impossible de créer la location");
    } finally {
      setRentLoading(false);
    }
  };

  const handleCreateAuction = async () => {
    if (!startPrice || !endDateAuction) {
      showAlert("Erreur", "Veuillez entrer le prix de départ et la date de fin");
      return;
    }

    try {
      setAuctionLoading(true);

      await createAuction({
        itemId: Number(id),
        startPrice: Number(startPrice),
        endDate: endDateAuction,
      });

      showAlert("Succès", "Enchère créée !");
      setStartPrice("");
      setEndDateAuction("");
    } catch (error: any) {
      console.log("Create auction error:", error?.response?.data);
      showAlert("Erreur", "Impossible de créer l'enchère");
    } finally {
      setAuctionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text>Item introuvable</Text>
      </View>
    );
  }

  return (


    <ScrollView style={styles.container}>
{isOwner && (
  <View style={styles.managementMenu}>

    <Pressable style={styles.manageCard}>
      <Text style={styles.manageIcon}>✏️</Text>
      <Text style={styles.manageLabel}>Modifier</Text>
    </Pressable>

    <Pressable
      style={[
        styles.manageCard,
        item.active ? styles.deactivateCard : styles.activateCard
      ]}
      onPress={handleDeactivate}
      disabled={deactivateLoading}
    >
      <Text style={styles.manageIcon}>
        {item.active ? "🚫" : "✅"}
      </Text>

      <Text style={styles.manageLabel}>
        {item.active ? "Désactiver" : "Activer"}
      </Text>
    </Pressable>

    <Pressable style={styles.manageCard}>
      <Text style={styles.manageIcon}>📊</Text>
      <Text style={styles.manageLabel}>Statistiques</Text>
    </Pressable>

  </View>
)}
      <Text style={styles.title}>{item.title}</Text>


      {item.type === "AUCTION" && auction && (
        <View style={styles.auctionHeader}>
          <Text style={styles.currentPrice}>
            💰 Prix actuel
          </Text>

          <Text style={styles.priceValue}>
            {auction?.currentPrice ?? auction?.startPrice} $
          </Text>

          <Text style={styles.timer}>
            ⏳ Temps restant : {timeLeft}
          </Text>
        </View>
      )}

      {item.imageUrls?.length > 0 ? (
        item?.imageUrls?.map((url: string, index: number) => (
          <Image
            key={index}
            source={{ uri: `${baseURL}${url}` }}
            style={styles.image}
            resizeMode="cover"
          />
        ))
      ) : (
        <Text>Aucune image</Text>
      )}

      {item.type === "RENTAL" && (
        <Text style={styles.price}>{item.pricePerDay} $/jour</Text>
      )}
      <Text style={styles.description}>{item.description}</Text>

      <Text style={styles.section}>📍 Localisation</Text>
      <Text>{item.city}</Text>
      <Text>{item.address}</Text>

      <Text style={styles.section}>⭐ Note moyenne sur le produit</Text>
      <Text>{item.averageRating ?? "Aucune note"}</Text>

      <Text style={styles.section}>👤 Propriétaire</Text>

      <Text style={styles.ownerName}>
        {item.publisher?.fullName}
      </Text>

      <Link
        href={{
          pathname: "/user/[id]",
          params: { id: item.publisher?.userId },
        }}
        style={styles.profileLink}
      >
        Voir mon profil →
      </Link>

      <Text>Pseudo : @{item.publisher?.username}</Text>
      <Text>Ville : {item.publisher?.city}</Text>
      <Text style={styles.section}>
        ⭐ Avis sur ce propriétaire ({userReviews.length})
      </Text>

      {userReviewsLoading ? (
        <ActivityIndicator size="small" color="#2563eb" />
      ) : userReviews.length === 0 ? (
        <Text>Aucun avis pour le moment</Text>
      ) : (
        userReviews.map((review) => (
          <View key={review.id} style={{ marginTop: 10 }}>
            <Text>⭐ {review.rating}</Text>
            <Text>{review.comment}</Text>
            <Text style={{ fontSize: 12, color: "gray" }}>
              Par {review.reviewerUsername}
            </Text>
          </View>
        ))
      )}

      {/*  <Text>
        ⭐ {item.publisher?.averageRating ?? 0}
        ({item.publisher?.reviewsCount ?? 0} avis)
      </Text> */}

      {item.type && (
        <>
          <Text style={styles.section}>
            ⭐ Avis sur cet article ({reviewsCount})
          </Text>

          {reviewsLoading ? (
            <ActivityIndicator size="small" color="#2563eb" />
          ) : reviews.length === 0 ? (
            <Text>Aucun avis pour le moment</Text>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={{ marginTop: 10 }}>
                <Text>⭐ {review.rating}</Text>
                <Text>{review.comment}</Text>
                <Text style={{ fontSize: 12, color: "gray" }}>
                  Par {review.reviewerUsername}
                </Text>
              </View>
            ))
          )}
        </>
      )}

      {item.publisher?.badge && (
        <Text>🏅 Badge : {item.publisher.badge}</Text>

      )}

      {/* ======== BID (Non-owner & Premium uniquement) ======== */}
      {item.type === "AUCTION" &&
        !isOwner &&
        item.active !== false &&
        currentUser?.premium && (
          <>
            <Text style={styles.section}>💰 Placer une enchère</Text>

            <Text>
              Prix actuel : {
                auction?.currentPrice != null
                  ? auction.currentPrice
                  : auction?.startPrice != null
                    ? auction.startPrice
                    : "Pas encore d'enchère"
              } $
            </Text>

            <TextInput
              placeholder="Votre offre"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            <Pressable
              onPress={handleBid}
              style={styles.rentButton}
              disabled={bidLoading}
            >
              <Text style={styles.buttonText}>
                {bidLoading ? "Envoi..." : "Faire une offre"}
              </Text>
            </Pressable>
          </>
        )}

      {item.type === "AUCTION" &&
        !isOwner &&
        !currentUser?.premium && (
          <Text style={{ color: "orange", marginTop: 15 }}>
            ⭐ Vous devez être Premium pour participer aux enchères.
          </Text>
        )}

      {/* ======== LOCATION (Visible seulement si RENTAL et PAS owner) ======== */}
      {item.type === "RENTAL" && !isOwner && (
        <>
          <Text style={styles.section}>📅 Louer cet item</Text>

          {Platform.OS === "web" ? (
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #ccc",
                padding: 8,
                width: "100%",
              }}
            />
          ) : (
            <>
              <Pressable
                style={styles.input}
                onPress={() => setShowStartPicker(true)}
              >
                <Text>{startDate || "Date début"}</Text>
              </Pressable>

              {showStartPicker && (
                <DateTimePicker
                  value={new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartPicker(false);
                    if (selectedDate) {
                      const formatted = selectedDate.toISOString().split("T")[0];
                      setStartDate(formatted);
                    }
                  }}
                />
              )}
            </>
          )}

          {Platform.OS === "web" ? (
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #ccc",
                padding: 8,
                width: "100%",
              }}
            />
          ) : (
            <>
              <Pressable
                style={styles.input}
                onPress={() => setShowEndPicker(true)}
              >
                <Text>{endDate || "Date fin"}</Text>
              </Pressable>

              {showEndPicker && (
                <DateTimePicker
                  value={endDate ? new Date(endDate) : new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowEndPicker(false);

                    if (selectedDate) {
                      const formatted = selectedDate
                        .toISOString()
                        .split("T")[0];

                      setEndDate(formatted);
                    }
                  }}
                />
              )}
            </>
          )}

          <Pressable
            onPress={handleRent}
            style={styles.rentButton}
            disabled={rentLoading}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              {rentLoading ? "Envoi..." : "Louer maintenant"}
            </Text>
          </Pressable>
        </>
      )}

      {/* ======== ENCHÈRE (Visible seulement si AUCTION et owner) ======== */}
      {item.type === "AUCTION" && isOwner && !auction && (
        <>

          <Text style={styles.section}>🔥 Publier l'enchère</Text>

          <TextInput
            placeholder="Prix initial"
            value={startPrice}
            onChangeText={setStartPrice}
            keyboardType="numeric"
            style={styles.input}
          />

          {Platform.OS === "web" ? (
            <input
              type="datetime-local"
              value={endDateAuction}
              onChange={(e) => setEndDateAuction(e.target.value)}
              style={{
                height: 40,
                borderRadius: 8,
                border: "1px solid #ccc",
                padding: 8,
                width: "100%",
              }}
            />
          ) : (
            <DateTimePicker
              value={new Date()}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setEndDateAuction(selectedDate.toISOString());
                }
              }}
            />
          )}

          <Pressable
            onPress={handleCreateAuction}
            style={styles.rentButton}
            disabled={auctionLoading}
          >
            <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
              {auctionLoading ? "Publication..." : "Publier l'enchère"}
            </Text>
          </Pressable>
        </>
      )}

      {item.type === "AUCTION" && isOwner && auction && (
        <>
          <Text style={styles.section}>📊 Votre enchère</Text>

          <Text>
            Prix actuel : {
              auction?.currentPrice != null
                ? auction.currentPrice
                : auction?.startPrice != null
                  ? auction.startPrice
                  : "Pas encore d'enchère"
            } $
          </Text>

          <Text>Date de fin : {auction?.endDate}</Text>
        </>
      )}

    </ScrollView>

  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    marginBottom: 10,
  },
  price: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2563eb",
    marginVertical: 10,
  },
  description: {
    marginBottom: 15,
  },
  section: {
    marginTop: 15,
    fontWeight: "bold",
  },

  ownerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },

  rentButton: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    marginBottom: 30,
  },
  deactivateButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  auctionHeader: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 14,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  currentPrice: {
    fontSize: 16,
    color: "#666",
  },

  priceValue: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#2563eb",
    marginVertical: 6,
  },

  timer: {
    fontSize: 16,
    color: "#dc2626",
    fontWeight: "600",
  },
  profileLink: {
    color: "#2563eb",
    marginTop: 5,
    marginBottom: 10,
    fontWeight: "600",
  },


  manageButton: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
  },

  manageText: {
    color: "#fff",
    fontWeight: "600",
  },
  managementMenu: {
  marginBottom: 20,
  gap: 12,
},

manageCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#fff",
  padding: 16,
  borderRadius: 12,
  elevation: 2,
},

manageIcon: {
  fontSize: 20,
  marginRight: 12,
},

manageLabel: {
  fontSize: 16,
  fontWeight: "600",
},

deactivateCard: {
  backgroundColor: "#fee2e2",
},

activateCard: {
  backgroundColor: "#dcfce7",
},
});