import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { deactivateItem, fetchItemDetails } from "../../src/api/itemService";
import { TextInput, Pressable, Alert } from "react-native";
import { createRental } from "../../src/api/rentalService";
import { createAuction, getAuctionByItemId, isWatchingAuction, placeBid, watchAuction } from "../../src/api/auctionService";
import { getCurrentUser } from "../../src/api/authService";
import { getReviewsByItem, getReviewsByUser, getReviewsCountByItem, getAllReviewsForUser } from "@/src/api/reviewService";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { ScrollView as HorizontalScroll, Dimensions } from "react-native";



export default function ItemDetails() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rentLoading, setRentLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const insets = useSafeAreaInsets();

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
  const [isWatching, setIsWatching] = useState(false);
  const [reservePrice, setReservePrice] = useState("");
  const { width } = Dimensions.get("window");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [showAllUserReviews, setShowAllUserReviews] = useState(false);
  const [showAllItemReviews, setShowAllItemReviews] = useState(false);

  const isAuctionFinished =
    item?.type === "AUCTION" &&
    (item?.status === "CANCELLED_AUCTION" || item?.active === false);



  const router = useRouter();


  const baseURL = Platform.OS === "android"
    ? "http://192.168.0.118:8080"  // Android (émulateur ET vrai téléphone)
    : "http://192.168.0.118:8080"; // 


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
              views: auctionData.views ?? 0,
              watchers: auctionData.watchers ?? 0,
              currentPrice:
                auctionData?.currentPrice ??
                auctionData?.startPrice ??
                null,
            });
            // 🔥 Vérifier si l’utilisateur suit déjà cette enchère
            if (user?.userId) {
              const watching = await isWatchingAuction(auctionData.id);
              setIsWatching(watching);
            }
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

            const userReviewsData = await getAllReviewsForUser(
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

  const formatLocalDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
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

  const handleBid = async () => {
    if (!bidAmount) {
      showAlert("Erreur", "Entrez un montant");
      return;
    }

    if (Platform.OS === "web") {
      // 🔹 Sur le web, on utilise confirm()
      if (!confirm(
        "Engagement d'enchère\n\nPlacer une enchère constitue un engagement d'achat. Si vous gagnez et ne payez pas, votre compte pourra être suspendu."
      )) {
        return; // l'utilisateur a annulé
      }
    } else {
      // 🔹 Sur mobile, on utilise Alert.alert avec deux boutons
      let proceed = false;
      await new Promise<void>((resolve) => {
        Alert.alert(
          "Engagement d'enchère",
          "Placer une enchère constitue un engagement d'achat. Si vous gagnez et ne payez pas, votre compte pourra être suspendu.",
          [
            { text: "Annuler", style: "cancel", onPress: () => resolve() },
            {
              text: "Confirmer",
              onPress: () => {
                proceed = true;
                resolve();
              }
            },
          ]
        );
      });
      if (!proceed) return; // utilisateur a annulé
    }

    // 🔹 Placer l'enchère après confirmation
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
    <SafeAreaView style={{ flex: 1 }}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={insets.top + 20}
      >

        {/* 🔥 Permet de fermer clavier en cliquant ailleurs */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>

          <ScrollView
            style={styles.container}
            contentContainerStyle={{
              paddingBottom: insets.bottom + 120 // 🔥 important
            }}
            keyboardShouldPersistTaps="handled"
          >
            <SafeAreaView style={{ flex: 1 }}>

              <ScrollView
                style={styles.container}
                contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
              >
                <Text style={styles.title}>{item.title}</Text>


                {item.type === "AUCTION" && auction && (
                  <View style={styles.auctionHeader}>

                    <Text style={styles.currentPrice}>
                      💰 Prix actuel
                    </Text>

                    <Text style={styles.priceValue}>
                      {auction.currentPrice ?? auction.startPrice} $
                    </Text>

                    {/* 🔥 AJOUTER ICI */}
                    {auction.reserveReached ? (
                      <Text style={styles.reserveReached}>
                        ✅ Prix de réserve atteint
                      </Text>
                    ) : (
                      <Text style={styles.reserveNotReached}>
                        ⛔ Prix de réserve non atteint
                      </Text>
                    )}

                    <Text>
                      Prix initial : {auction.startPrice} $
                    </Text>

                    <Text>
                      👀 {auction?.views ?? 0} personnes regardent
                    </Text>

                    <Text>
                      ⭐ {auction?.watchers ?? 0} suivent cette enchère
                    </Text>
                    <Text>
                      👥 {auction?.participantsCount ?? 0}{" "}
                      {(auction?.participantsCount ?? 0) > 1
                        ? "enchérisseurs"
                        : "enchérisseur"}{" "}
                      {(auction?.participantsCount ?? 0) >= 5 && "🔥 Compétition active"}
                    </Text>

                    <Text style={styles.timer}>
                      ⏳ Temps restant : {timeLeft}
                    </Text>

                  </View>
                )}

                {item.imageUrls?.length > 0 ? (
                  <View style={{ marginBottom: 10 }}>
                    {/* Carousel */}
                    <HorizontalScroll
                      horizontal
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      onScroll={(e) => {
                        const index = Math.round(e.nativeEvent.contentOffset.x / width);
                        setActiveImageIndex(index);
                      }}
                      scrollEventThrottle={16}
                      style={{ width: width - 30 }} // ← 30 = padding horizontal du container
                    >
                      {item.imageUrls.map((url: string, index: number) => (
                        <View key={index} style={{ width: width - 30, aspectRatio: 4 / 3, backgroundColor: "#f0f0f0", borderRadius: 12 }}>
                          <Image
                            source={{ uri: `${baseURL}${url}` }}
                            style={{ width: "100%", height: "100%", borderRadius: 12 }}
                            resizeMode="contain"
                          />
                        </View>
                      ))}
                    </HorizontalScroll>

                    {/* Dots */}
                    {item.imageUrls.length > 1 && (
                      <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 8, gap: 6 }}>
                        {item.imageUrls.map((_: any, index: number) => (
                          <View
                            key={index}
                            style={{
                              width: activeImageIndex === index ? 18 : 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: activeImageIndex === index ? "#2563eb" : "#d1d5db",
                            }}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                ) : <Text>Aucune image</Text>}

                {item.type === "RENTAL" && (
                  <Text style={styles.price}>{item.pricePerDay} $/jour</Text>
                )}
                <Text style={styles.description}>{item.description}</Text>

                <Text style={styles.section}>📍 Localisation</Text>
                <Text>{item.city}</Text>
                <Text>{item.address}</Text>

                {/* ── Propriétaire ── */}
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>👤 Propriétaire</Text>

                  <Text style={styles.ownerName}>
                    {item.publisher?.fullName}
                  </Text>

                  <Text style={styles.username}>
                    @{item.publisher?.username}
                  </Text>

                  <Text style={styles.city}>
                    {item.publisher?.city}
                  </Text>

                  <Text style={styles.rating}>
                    {item.publisher?.averageRating
                      ? `${Number(item.publisher.averageRating).toFixed(1)} ⭐ (${item.publisher.reviewsCount ?? 0} avis)`
                      : "Aucune note"}
                  </Text>

                  {item.publisher?.badge && (
                    <Text style={styles.badge}>
                      🏅 {item.publisher.badge}
                    </Text>
                  )}

                  <Link
                    href={{
                      pathname: "/user/[id]",
                      params: { id: item.publisher?.userId }
                    }}
                    style={styles.profileLink}
                  >
                    Voir le profil →
                  </Link>

                  {/* Avis propriétaire */}
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>
                      ⭐ Avis sur ce propriétaire ({userReviews.length})
                    </Text>

                    {userReviews.length === 0 ? (
                      <Text style={styles.emptyText}>
                        Aucun avis pour le moment
                      </Text>
                    ) : (
                      <>
                        {(showAllUserReviews
                          ? userReviews
                          : userReviews.slice(0, 3)
                        ).map((review) => (
                          <View key={review.id} style={styles.reviewItem}>
                            <Text>⭐ {review.rating}</Text>

                            <Text style={styles.reviewComment}>
                              {review.comment}
                            </Text>

                            <Text style={styles.reviewUser}>
                              Par {review.reviewerUsername}
                            </Text>
                          </View>
                        ))}

                        {/* 🔥 BOUTON VOIR PLUS */}
                        {userReviews.length > 3 && (
                          <Pressable
                            onPress={() =>
                              setShowAllUserReviews(!showAllUserReviews)
                            }
                            style={styles.showMoreButton}
                          >
                            <Text style={styles.showMoreText}>
                              {showAllUserReviews
                                ? "Voir moins"
                                : "Voir plus"}
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </View>

                  {/* Avis item */}
                  <View style={styles.reviewSection}>
                    <Text style={styles.reviewTitle}>
                      ⭐ Avis sur cet article ({reviewsCount})
                    </Text>

                    {reviews.length === 0 ? (
                      <Text style={styles.emptyText}>
                        Aucun avis pour le moment
                      </Text>
                    ) : (
                      <>
                        {(showAllItemReviews
                          ? reviews
                          : reviews.slice(0, 3)
                        ).map((review) => (
                          <View key={review.id} style={styles.reviewItem}>
                            <Text>⭐ {review.rating}</Text>

                            <Text style={styles.reviewComment}>
                              {review.comment}
                            </Text>

                            <Text style={styles.reviewUser}>
                              Par {review.reviewerUsername}
                            </Text>
                          </View>
                        ))}

                        {/* 🔥 Voir plus */}
                        {reviews.length > 3 && (
                          <Pressable
                            onPress={() =>
                              setShowAllItemReviews(!showAllItemReviews)
                            }
                            style={styles.showMoreButton}
                          >
                            <Text style={styles.showMoreText}>
                              {showAllItemReviews
                                ? "Voir moins"
                                : "Voir plus"}
                            </Text>
                          </Pressable>
                        )}
                      </>
                    )}
                  </View>
                </View>

                {/* ── Message propriétaire ── */}
                {!isOwner && (
                  <Pressable
                    style={styles.messageButton}
                    onPress={() => router.push({
                      pathname: "/messages/chat",
                      params: {
                        receiverId: item.publisher?.userId,
                        itemId: String(id),
                        receiverUsername: item.publisher?.username,
                      },
                    })}
                  >
                    <Text style={styles.buttonText}>✉️ Écrire au propriétaire</Text>
                  </Pressable>
                )}


                {/* ── Bannière enchère terminée / annulée ── */}
                {isAuctionFinished && (
                  <View style={{
                    backgroundColor: "#fef2f2", borderRadius: 10, padding: 14,
                    marginTop: 10, marginBottom: 10, borderWidth: 1, borderColor: "#fca5a5"
                  }}>
                    <Text style={{ color: "#dc2626", fontWeight: "600", textAlign: "center" }}>
                      {item.status === "CANCELLED_AUCTION" ? "❌ Enchère annulée" : "⛔ Enchère terminée — Les offres sont closes"}
                    </Text>
                  </View>
                )}

                {/* ── Suivre enchère (seulement si active) ── */}
                {item.type === "AUCTION" && auction && !isOwner && !isAuctionFinished && (
                  <Pressable
                    style={[styles.rentButton, isWatching && { backgroundColor: "#9ca3af" }]}
                    disabled={isWatching}
                    onPress={async () => {
                      try {
                        const updated = await watchAuction(auction.id);
                        setAuction(updated);
                        setIsWatching(true);
                        showAlert("Succès", "⭐ Vous suivez maintenant cette enchère");
                      } catch {
                        showAlert("Erreur", "Impossible de suivre l'enchère");
                      }
                    }}
                  >
                    <Text style={styles.buttonText}>
                      {isWatching ? "⭐ Enchère suivie" : "⭐ Suivre l'enchère"}
                    </Text>
                  </Pressable>
                )}

                {/* ── Bid (non-owner, premium, enchère active) ── */}
                {item.type === "AUCTION" && !isOwner && !isAuctionFinished && currentUser?.premium && (
                  <>
                    <Text style={styles.section}>💰 Placer une enchère</Text>
                    <Text>Prix actuel : {auction?.currentPrice ?? auction?.startPrice ?? "Pas encore d'enchère"} $</Text>
                    <TextInput
                      placeholder="Votre offre"
                      value={bidAmount}
                      onChangeText={setBidAmount}
                      keyboardType="numeric"
                      style={styles.input}
                    />
                    <Pressable
                      onPress={handleBid}
                      disabled={
                        bidLoading ||
                        !bidAmount ||
                        Number(bidAmount) <=
                        (auction?.currentPrice ?? auction?.startPrice)
                      }
                      style={[
                        styles.rentButton,
                        (
                          bidLoading ||
                          !bidAmount ||
                          Number(bidAmount) <=
                          (auction?.currentPrice ?? auction?.startPrice)
                        ) && {
                          opacity: 0.5,
                        },
                      ]}
                    >
                      <Text style={styles.buttonText}>{bidLoading ? "Envoi..." : "Faire une offre"}</Text>
                    </Pressable>
                  </>
                )}

                {/* Premium requis (seulement si enchère active) */}
                {item.type === "AUCTION" && !isOwner && !currentUser?.premium && !isAuctionFinished && (
                  <Text style={{ color: "orange", marginTop: 15 }}>
                    ⭐ Vous devez être Premium pour participer aux enchères.
                  </Text>
                )}

                {/* ── Location (item actif seulement) ── */}
                {item.type === "RENTAL" && !isOwner && item.active !== false && (
                  <>
                    <Text style={styles.section}>📅 Louer cet item</Text>

                    {/* ── Date début ── */}
                    <Pressable
                      style={styles.input}
                      onPress={() => setShowStartPicker(true)}
                    >
                      <Text>
                        {startDate || "Date début"}
                      </Text>
                    </Pressable>

                    {showStartPicker && (
                      <DateTimePicker
                        value={startDate ? new Date(startDate) : new Date()}
                        mode="date"
                        display="default"
                        minimumDate={new Date()} // ← aujourd’hui minimum
                        onChange={(event, selectedDate) => {
                          setShowStartPicker(false);

                          if (selectedDate) {
                            const formatted =
                              formatLocalDate(selectedDate)

                            setStartDate(formatted);

                            // 🔥 Reset endDate si invalide
                            if (endDate && endDate <= formatted) {
                              setEndDate("");
                            }
                          }
                        }}
                      />
                    )}

                    {/* ── Date fin ── */}
                    <Pressable
                      style={styles.input}
                      onPress={() => {
                        if (!startDate) {
                          showAlert(
                            "Date début requise",
                            "Veuillez choisir une date de début d'abord"
                          );
                          return;
                        }

                        setShowEndPicker(true);
                      }}
                    >
                      <Text>
                        {endDate || "Date fin"}
                      </Text>
                    </Pressable>

                    {showEndPicker && (
                      <DateTimePicker
                        value={
                          endDate
                            ? new Date(endDate)
                            : (() => {
                              const d = new Date(startDate);
                              d.setDate(d.getDate() + 1);
                              return d;
                            })()
                        }
                        mode="date"
                        display="default"
                        minimumDate={
                          (() => {
                            const d = new Date(startDate);
                            d.setDate(d.getDate() + 1); // ← lendemain obligatoire
                            return d;
                          })()
                        }
                        onChange={(event, selectedDate) => {
                          setShowEndPicker(false);

                          if (selectedDate) {
                            setEndDate(
                              formatLocalDate(selectedDate)
                            );
                          }
                        }}
                      />
                    )}

                    <Pressable
                      onPress={handleRent}
                      disabled={
                        rentLoading ||
                        !startDate ||
                        !endDate
                      }
                      style={[
                        styles.rentButton,
                        (
                          rentLoading ||
                          !startDate ||
                          !endDate
                        ) && {
                          opacity: 0.5,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          textAlign: "center",
                          fontWeight: "600",
                        }}
                      >
                        {rentLoading ? "Envoi..." : "Louer maintenant"}
                      </Text>
                    </Pressable>
                  </>
                )}

                {/* Item désactivé */}
                {item.type === "RENTAL" && !isOwner && item.active === false && (
                  <View style={{
                    backgroundColor: "#f3f4f6", borderRadius: 10, padding: 14,
                    marginTop: 15, borderWidth: 1, borderColor: "#d1d5db"
                  }}>
                    <Text style={{ color: "#6b7280", fontWeight: "600", textAlign: "center" }}>
                      ⛔ Cet item n'est plus disponible à la location
                    </Text>
                  </View>
                )}

                {/* ── Owner : aller dans mes items pour publier ── */}
                {item.type === "AUCTION" && isOwner && !auction && !isAuctionFinished && (
                  <View style={{
                    backgroundColor: "#fff7ed", borderRadius: 10, padding: 14,
                    marginTop: 15, borderWidth: 1, borderColor: "#fed7aa"
                  }}>
                    <Text style={{ color: "#ea580c", fontWeight: "600", textAlign: "center" }}>
                      ℹ️ Allez dans "Mes items" pour publier l'enchère
                    </Text>
                  </View>
                )}

                {/* ── Info enchère owner (active) ── */}
                {item.type === "AUCTION" && isOwner && auction && !isAuctionFinished && (
                  <>
                    <Text style={styles.section}>📊 Votre enchère</Text>
                    <Text>Prix actuel : {auction?.currentPrice ?? auction?.startPrice ?? "Pas encore d'enchère"} $</Text>
                    <Text>Date de fin : {auction?.endDate}</Text>
                  </>
                )}

              </ScrollView>
            </SafeAreaView>
          </ScrollView>

        </TouchableWithoutFeedback>

      </KeyboardAvoidingView>

    </SafeAreaView>
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
    aspectRatio: 4 / 3,      // ← hauteur dynamique selon ratio
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#f0f0f0", // ← fond si image non carrée
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
  messageButton: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },

  reserveReached: {
    marginTop: 6,
    fontWeight: "600",
    color: "#16a34a",
  },

  reserveNotReached: {
    marginTop: 6,
    fontWeight: "600",
    color: "#dc2626",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },

  sectionTitle: {
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 10,
  },

  username: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },

  city: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },

  rating: {
    color: "#374151",
    marginTop: 4,
  },

  badge: {
    marginTop: 4,
    fontSize: 13,
  },

  reviewSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  reviewTitle: {
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },

  reviewItem: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  reviewComment: {
    color: "#374151",
    marginTop: 2,
  },

  reviewUser: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 2,
  },

  emptyText: {
    color: "#9ca3af",
    fontSize: 13,
  },
  showMoreButton: {
    marginTop: 12,
    alignSelf: "flex-start",
  },

  showMoreText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});