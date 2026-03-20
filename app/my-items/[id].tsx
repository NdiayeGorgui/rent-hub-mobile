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
import { Link, router, useLocalSearchParams } from "expo-router";
import { activateItem, deactivateItem, fetchItemDetails, updateItem } from "../../src/api/itemService";
import { TextInput, Pressable, Alert } from "react-native";
import { createRental, getRentalStatsByItem } from "../../src/api/rentalService";
import { closeAuction, createAuction, getAuctionByItemId, isWatchingAuction, placeBid } from "../../src/api/auctionService";
import { getCurrentUser } from "../../src/api/authService";
import { getReviewsByItem, getReviewsByUser, getReviewsCountByItem } from "@/src/api/reviewService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Animated } from "react-native";
import * as ImagePicker from "expo-image-picker";


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
  const [reservePrice, setReservePrice] = useState("");

  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(item?.title);
  const [editDescription, setEditDescription] = useState(item?.description);
  const [editPrice, setEditPrice] = useState(item?.pricePerDay?.toString() || "");

  const slideAnim = useState(new Animated.Value(0))[0];

  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [isWatching, setIsWatching] = useState<any[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsAnim = useState(new Animated.Value(0))[0];

  const [rentalStats, setRentalStats] = useState<any>(null);


  const categories = [
    { id: 1, name: "Électronique" },
    { id: 2, name: "Électroménager" },
    { id: 3, name: "Événements" },
    { id: 4, name: "Véhicules" },
    { id: 5, name: "Bébé & Enfants" },
    { id: 6, name: "Sport & Loisirs" },
    { id: 7, name: "Maison & Meubles" },
    { id: 8, name: "Mode & Vêtements" },
    { id: 9, name: "Outils & Bricolage" },
    { id: 10, name: "Autres" },
  ];
  const [editImages, setEditImages] = useState<any[]>([]);

  const baseURL =
    Platform.OS === "android"
      ? "http://10.0.2.2:8080"
      : "http://localhost:8080";


  useEffect(() => {
    if (item) {
      setEditImages(
        item.imageUrls.map((url: string) => ({
          uri: baseURL + url
        }))
      );
    }
  }, [item]);


  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await fetchItemDetails(Number(id));
        if (data.type === "RENTAL") {
  try {
    const stats = await getRentalStatsByItem(Number(id));
    setRentalStats(stats);
  } catch (e) {
    console.log("Error loading rental stats", e);
  }
}
        console.log("ITEM DATA 👉", data);
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
            if (auctionData) {
              setAuction({ ...auctionData });
              const watching = await isWatchingAuction(auctionData.id);
              setIsWatching(watching);
            } else {
              setAuction(null); // pas encore d'enchère active
            }
          } catch (err) {
            console.log("Error loading auction:", err);
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

  // 🔥 FIX: sync quand item chargé
  useEffect(() => {
    if (item) {
      setEditTitle(item.title || "");
      setEditDescription(item.description || "");
      setEditPrice(item.pricePerDay?.toString() || "");
      setEditCategoryId(item.categoryId?.toString() || "");
      setEditCity(item.city || "");
      setEditAddress(item.address || "");
    }
  }, [item]);

  const toggleStats = () => {
  if (statsVisible) {
    Animated.timing(statsAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setStatsVisible(false));
  } else {
    setStatsVisible(true);
    Animated.timing(statsAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }
};

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission refusée", "Accès aux images refusé");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      // ✅ on AJOUTE sans écraser
      setEditImages(prev => [...prev, ...result.assets]);
    }
  };

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

  const toggleEdit = () => {
    if (editMode) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setEditMode(false));
    } else {
      setEditMode(true);
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
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

  // ===============================
  // ✅ ACTIVATE / DEACTIVATE FIX
  // ===============================
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
            setItem({
              ...item,
              active: false,
              status: "INACTIVE",
            });
          } else {
            await activateItem(Number(id));
            setItem({
              ...item,
              active: true,
              status: "ACTIVE",
            });
          }

          showAlert(
            "Succès",
            item.active ? "Item désactivé" : "Item activé"
          );
        } catch (error) {
          showAlert(
            "Erreur",
            "Impossible de modifier le statut (paiement ou règles métier)"
          );
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

  const handleCloseAuction = () => {

    showConfirm(
      "Fermer l'enchère",
      "Voulez-vous vraiment fermer cette enchère maintenant ?",
      async () => {
        try {

          await closeAuction(auction.id);

          showAlert("Succès", "Enchère fermée");

          setAuction(null);

        } catch (error) {

          showAlert("Erreur", "Impossible de fermer l'enchère");

        }
      }
    );
  };

  const handleUpdate = async () => {
    try {
      if (item.status === "ACTIVE") {
        showAlert(
          "Attention",
          "Modifier cet item peut impacter sa visibilité"
        );
      }

      await updateItem(
        Number(id),
        {
          title: editTitle,
          description: editDescription,
          categoryId: Number(editCategoryId),
          city: editCity,
          address: editAddress,
          type: item.type,
          pricePerDay:
            item.type === "RENTAL" ? Number(editPrice) : null,
        },
        editImages // ✅ on envoie TOUT
      );

      // 🔥 reload depuis backend (IMPORTANT)
      const updated = await fetchItemDetails(Number(id));
      setItem(updated);

      showAlert("Succès", "Item modifié");

      toggleEdit();

    } catch (error) {
      console.log(error);
      showAlert("Erreur", "Modification impossible");
    }
  };
  const removeImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
  };

  // ===============================
  // ✅ CREATE AUCTION FIX
  // ===============================
  const handleCreateAuction = async () => {



    if (!startPrice || !endDateAuction) {
      showAlert("Erreur", "Veuillez entrer le prix et la date");
      return;
    }

    try {
      setAuctionLoading(true);

      await createAuction({
        itemId: Number(id),
        startPrice: Number(startPrice),
        reservePrice: Number(reservePrice) || Number(startPrice),
        endDate: endDateAuction,
      });

      showAlert("Succès", "Enchère créée !");

      // 🔥 IMPORTANT: redirection (comme ton flow backend)
      router.replace("/my-items");

      setStartPrice("");
      setReservePrice("");
      setEndDateAuction("");

    } catch (error: any) {
      console.log("Create auction error:", error?.response?.data);
      showAlert("Erreur", error?.response?.data?.message || "Erreur création");
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
          {editMode && (
            <Animated.View
              style={[
                styles.editContainer,
                {
                  maxHeight: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 700],
                  }),
                  opacity: slideAnim,
                },
              ]}
            >
              <Text style={styles.section}>✏️ Modifier l'item</Text>

              <TextInput
                placeholder="Titre"
                value={editTitle}
                onChangeText={setEditTitle}
                style={styles.input}
              />

              <TextInput
                placeholder="Description"
                value={editDescription}
                onChangeText={setEditDescription}
                style={styles.input}
                multiline
              />

              {/* TYPE READ ONLY */}
              <View style={{ marginTop: 10 }}>
                <Text>Type</Text>
                <Text style={{ fontWeight: "bold" }}>
                  {item.type === "RENTAL" ? "📦 Location" : "🔥 Enchère"}
                </Text>
              </View>

              <Text style={styles.section}>Catégorie</Text>

              <View style={styles.pickerContainer}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    onPress={() => setEditCategoryId(String(cat.id))}
                    style={[
                      styles.categoryButton,
                      editCategoryId === String(cat.id) &&
                      styles.categoryButtonActive,
                    ]}
                  >
                    <Text style={styles.categoryText}>{cat.name}</Text>
                  </Pressable>
                ))}
              </View>

              {item.type === "RENTAL" && (
                <TextInput
                  placeholder="Prix / jour"
                  value={editPrice}
                  onChangeText={setEditPrice}
                  keyboardType="numeric"
                  style={styles.input}
                />
              )}

              <TextInput
                placeholder="Ville"
                value={editCity}
                onChangeText={setEditCity}
                style={styles.input}
              />

              <TextInput
                placeholder="Adresse"
                value={editAddress}
                onChangeText={setEditAddress}
                style={styles.input}
              />

              <Text style={styles.section}>Images</Text>

              <Pressable style={styles.imageButton} onPress={pickImages}>
                <Text style={{ color: "#fff", fontWeight: "bold" }}>
                  Choisir des images
                </Text>
              </Pressable>

           <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
  {editImages.map((img, index) => (
    <View
      key={index}
      style={{
        position: "relative",
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {/* IMAGE */}
      <Image
        source={{ uri: img.uri }}
        style={{
          width: 90,
          height: 90,
          borderRadius: 8,
        }}
      />

      {/* CROIX */}
      <Pressable
        onPress={() => removeImage(index)}
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          backgroundColor: "rgba(0,0,0,0.7)",
          borderRadius: 12,
          width: 22,
          height: 22,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>
          ×
        </Text>
      </Pressable>
    </View>
  ))}
</View>

              {/* ACTIONS */}
              <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
                <Pressable style={styles.saveButton} onPress={handleUpdate}>
                  <Text style={styles.buttonText}>💾 Enregistrer</Text>
                </Pressable>

                <Pressable style={styles.cancelButton} onPress={toggleEdit}>
                  <Text style={styles.buttonText}>Annuler</Text>
                </Pressable>
              </View>
            </Animated.View>
          )}
          <Pressable style={styles.manageCard} onPress={toggleEdit}>
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

        <Pressable style={styles.manageCard} onPress={toggleStats}>
  <Text style={styles.manageIcon}>📊</Text>
  <Text style={styles.manageLabel}>Statistiques</Text>
</Pressable>
{statsVisible && (
<Animated.View
  style={[
    styles.statsContainer,
    {
      maxHeight: statsAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 300],
      }),
      opacity: statsAnim,
    },
  ]}
>
  <Text style={styles.section}>📊 Statistiques</Text>

  {item.type === "AUCTION" ? (
    auction ? (
      <>
        <Text>👀 Vues : {auction.views ?? 0}</Text>
        <Text>⭐ Suivis : {auction.watchers ?? 0}</Text>
        <Text>
          👥 {auction.participantsCount ?? 0}{" "}
          {(auction.participantsCount ?? 0) > 1 ? "enchérisseurs" : "enchérisseur"}
        </Text>
        <Text style={{ marginTop: 10 }}>💰 Prix initial : {auction.startPrice} $</Text>
        <Text>📈 Prix actuel : {auction.currentPrice ?? auction.startPrice} $</Text>
        {auction.reserveReached ? (
          <Text style={{ color: "#16a34a", fontWeight: "600" }}>✅ Prix de réserve atteint</Text>
        ) : (
          <Text style={{ color: "#dc2626", fontWeight: "600" }}>⛔ Prix de réserve non atteint</Text>
        )}
      </>
    ) : (
      <Text>Aucune enchère active</Text>
    )
  ) : item.type === "RENTAL" && rentalStats ? (
    <>
      <Text>📦 {rentalStats.rentalsCount} locations</Text>
      <Text>💰 {rentalStats.totalRevenue} $ générés</Text>
      <Text>📅 {rentalStats.totalDaysRented} jours loués</Text>
      {rentalStats.rentalsCount > 5 && (
        <Text style={{ color: "#16a34a" }}>🔥 Très demandé</Text>
      )}
    </>
  ) : (
    <Text>Aucune statistique disponible</Text>
  )}
</Animated.View>
)}

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
          <TextInput
            placeholder="Prix de réserve"
            value={reservePrice}
            onChangeText={setReservePrice}
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

      {item.type === "AUCTION" &&
        isOwner &&
        auction &&
        auction.status === "OPEN" && (
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

            {/* 🔥 BOUTON FERMER */}
            <Pressable
              onPress={handleCloseAuction}
              style={styles.closeAuctionButton}
            >
              <Text style={styles.buttonText}>
                🔒 Fermer l'enchère
              </Text>
            </Pressable>
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

  closeAuctionButton: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  editContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    overflow: "hidden",
  },

  saveButton: {
    flex: 1,
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },

  cancelButton: {
    flex: 1,
    backgroundColor: "#6b7280",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },

  categoryButton: {
    padding: 10,
    backgroundColor: "#ddd",
    borderRadius: 8,
    margin: 4,
  },

  categoryButtonActive: {
    backgroundColor: "#2563eb",
  },

  categoryText: {
    color: "#fff",
  },

  imageButton: {
    backgroundColor: "#16a34a",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  statsContainer: {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 15,
  marginTop: 10,
  overflow: "hidden",
},
});