import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
} from "react-native";
import { useEffect, useState } from "react";
import { Link, router, useLocalSearchParams } from "expo-router";
import { activateItem, deactivateItem, fetchItemDetails } from "../../src/api/itemService";
import { TextInput, Pressable, Alert } from "react-native";
import { createRental, getRentalStatsByItem } from "../../src/api/rentalService";
import { createAuction, getAuctionByItemId, isWatchingAuction, placeBid } from "../../src/api/auctionService";
import { getCurrentUser } from "../../src/api/authService";
import { getReviewsByItem, getReviewsByUser, getReviewsCountByItem, getAllReviewsForUser } from "@/src/api/reviewService";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { Animated } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { cancelAuctionPayment } from "@/src/api/paymentService.web";
import { handleMobilePayment } from "@/src/api/stripeMobile";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView, Platform } from "react-native";


const BASE_URL = "http://192.168.0.118:8080";

export default function ItemDetails() {
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

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
  const [reservePrice, setReservePrice] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editImages, setEditImages] = useState<any[]>([]);
  const [isWatching, setIsWatching] = useState<any[]>([]);
  const [statsVisible, setStatsVisible] = useState(false);
  const [rentalStats, setRentalStats] = useState<any>(null);
  const [step, setStep] = useState<"view" | "payment">("view");
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");

  const slideAnim = useState(new Animated.Value(0))[0];
  const statsAnim = useState(new Animated.Value(0))[0];

  const [showAllUserReviews, setShowAllUserReviews] = useState(false);
  const [showAllItemReviews, setShowAllItemReviews] = useState(false);



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

const isAuctionClosed =
    item?.type === "AUCTION" && 
    (
        item?.status === "CANCELLED_AUCTION" ||
        auction?.status === "CLOSED"
    );

  // ── DatePickers ──────────────────────────────────────
  const openStartDatePicker = () => {
    DateTimePickerAndroid.open({
      value: startDate ? new Date(startDate) : new Date(),
      mode: "date",
      minimumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed" || !selectedDate) return;
        setStartDate(selectedDate.toISOString().split("T")[0]);
      },
    });
  };

  const openEndDatePicker = () => {
    DateTimePickerAndroid.open({
      value: endDate ? new Date(endDate) : new Date(),
      mode: "date",
      minimumDate: startDate ? new Date(startDate) : new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed" || !selectedDate) return;
        setEndDate(selectedDate.toISOString().split("T")[0]);
      },
    });
  };

  const openAuctionDatePicker = () => {
    DateTimePickerAndroid.open({
      value: endDateAuction ? new Date(endDateAuction) : new Date(),
      mode: "date",
      minimumDate: new Date(),
      onChange: (event, selectedDate) => {
        if (event.type === "dismissed" || !selectedDate) return;
        DateTimePickerAndroid.open({
          value: selectedDate,
          mode: "time",
          is24Hour: true,
          onChange: (timeEvent, timeDate) => {
            if (timeEvent.type === "dismissed" || !timeDate) return;
            setEndDateAuction(timeDate.toISOString());
          },
        });
      },
    });
  };

  // ── Load item ─────────────────────────────────────────
  useEffect(() => {
    const loadItem = async () => {
      try {
        const data = await fetchItemDetails(Number(id));

        if (data.type === "RENTAL") {
          try {
            const stats = await getRentalStatsByItem(Number(id));
            setRentalStats(stats);
          } catch { }
        }

        setItem(data);

        const user = await getCurrentUser();
        setCurrentUser(user);
        setIsOwner(user?.userId === data.publisher?.userId);

        if (data.type === "AUCTION") {
          try {
            const auctionData = await getAuctionByItemId(Number(id));
            if (auctionData) {
              setAuction({ ...auctionData });
              const watching = await isWatchingAuction(auctionData.id);
              setIsWatching(watching);
            } else {
              setAuction(null);
            }
          } catch {
            setAuction(null);
          }
        }

        try {
          setReviewsLoading(true);
          const reviewsData = await getReviewsByItem(Number(id));
          setReviews(reviewsData);
          const count = await getReviewsCountByItem(Number(id));
          setReviewsCount(count);
        } catch { } finally {
          setReviewsLoading(false);
        }

        try {
          if (data.publisher?.userId) {
            setUserReviewsLoading(true);
            const userReviewsData = await getAllReviewsForUser(data.publisher.userId);
            setUserReviews(userReviewsData);
          }
        } catch { } finally {
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

  // ── Sync edit fields ──────────────────────────────────
  useEffect(() => {
    if (item) {
      setEditTitle(item.title || "");
      setEditDescription(item.description || "");
      setEditPrice(item.pricePerDay?.toString() || "");
      setEditCategoryId(item.categoryId?.toString() || "");
      setEditCity(item.city || "");
      setEditAddress(item.address || "");
      setEditImages(item.imageUrls.map((url: string) => ({ uri: BASE_URL + url })));
    }
  }, [item]);

  // ── Countdown ─────────────────────────────────────────
  useEffect(() => {
    if (!auction?.endDate) return;
    const interval = setInterval(() => {
      const diff = new Date(auction.endDate).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Enchère terminée"); clearInterval(interval); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff / 3600000) % 24);
      const m = Math.floor((diff / 60000) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(d > 0 ? `${d}j ${h}h ${m}m ${s}s` : h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [auction]);

  // ── Helpers ───────────────────────────────────────────
  const showAlert = (title: string, message: string) => Alert.alert(title, message);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      { text: "Confirmer", onPress: onConfirm },
    ]);
  };

  const toggleEdit = () => {
    if (editMode) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: false })
        .start(() => setEditMode(false));
    } else {
      setEditMode(true);
      Animated.timing(slideAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    }
  };

  const toggleStats = () => {
    if (statsVisible) {
      Animated.timing(statsAnim, { toValue: 0, duration: 300, useNativeDriver: false })
        .start(() => setStatsVisible(false));
    } else {
      setStatsVisible(true);
      Animated.timing(statsAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    }
  };

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { showAlert("Permission refusée", "Accès aux images refusé"); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setEditImages(prev => [...prev, ...result.assets]);
    }
  };

  const removeImage = (index: number) => setEditImages(prev => prev.filter((_, i) => i !== index));

  // ── Handlers ──────────────────────────────────────────
  const handleBid = async () => {
    if (!bidAmount) { showAlert("Erreur", "Entrez un montant"); return; }
    try {
      setBidLoading(true);
      await placeBid(Number(auction.id), Number(bidAmount));
      const updatedAuction = await getAuctionByItemId(Number(id));
      setAuction(updatedAuction);
      showAlert("Succès", "Enchère placée !");
      setBidAmount("");
    } catch (error: any) {
      showAlert("Erreur", error?.response?.data?.message || "Impossible de placer l'enchère");
    } finally {
      setBidLoading(false);
    }
  };

  const handleDeactivate = () => {
    const action = item.active ? "désactiver" : "activer";
    showConfirm("Confirmation", `Voulez-vous vraiment ${action} cet item ?`, async () => {
      try {
        setDeactivateLoading(true);
        if (item.active) {
          await deactivateItem(Number(id));
          setItem({ ...item, active: false, status: "INACTIVE" });
        } else {
          await activateItem(Number(id));
          setItem({ ...item, active: true, status: "ACTIVE" });
        }
        showAlert("Succès", item.active ? "Item désactivé" : "Item activé");
      } catch {
        showAlert("Erreur", "Impossible de modifier le statut");
      } finally {
        setDeactivateLoading(false);
      }
    });
  };

  const handleRent = async () => {
    if (!startDate || !endDate) { showAlert("Erreur", "Veuillez entrer les dates"); return; }
    try {
      setRentLoading(true);
      await createRental({ itemId: Number(id), startDate, endDate });
      showAlert("Succès", "Demande de location envoyée");
      setStartDate(""); setEndDate("");
    } catch {
      showAlert("Erreur", "Impossible de créer la location");
    } finally {
      setRentLoading(false);
    }
  };

  const handleCloseAuction = () => {
    showConfirm("Annuler l'enchère", "⚠️ Cette action coûte 50$. Voulez-vous continuer ?", () => {
      setStep("payment");
    });
  };

  const handleConfirmCancel = async () => {
    try {
      setLoading(true);
      const res = await cancelAuctionPayment({
        auctionId: auction.id,
        itemId: auction.itemId,
        userId: currentUser.userId,
        amount: 50,
      });
      await handleMobilePayment(res.clientSecret);
      showAlert("Succès", "Paiement effectué !");
      setAuction(null);
      setStep("view");
      router.replace("/my-items");
    } catch (error: any) {
      showAlert("Erreur", error?.message || "Paiement échoué");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify({
        title: editTitle, description: editDescription,
        categoryId: Number(editCategoryId), city: editCity,
        address: editAddress, type: item.type,
        pricePerDay: item.type === "RENTAL" ? Number(editPrice) : null,
      }));

      editImages.forEach((img, i) => {
        if (img.uri.startsWith("file://") || img.uri.startsWith("file:///")) {
          formData.append("images", { uri: img.uri, type: "image/jpeg", name: `image_${i}.jpg` } as any);
        }
      });

      const existingUrls = editImages
        .filter(img => !img.uri.startsWith("file://") && !img.uri.startsWith("file:///"))
        .map(img => img.uri.replace(BASE_URL, ""));
      formData.append("existingImages", JSON.stringify(existingUrls));

      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`http://192.168.0.118:8080/api/items/item/${id}/with-images`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.message || "Erreur modification");
      }

      const updated = await fetchItemDetails(Number(id));
      setItem(updated);
      showAlert("Succès", "Item modifié");
      toggleEdit();
    } catch (error: any) {
      console.log("UPDATE ERROR:", error?.message);
      showAlert("Erreur", "Modification impossible");
    }
  };

  const handleCreateAuction = () => {
    if (!startPrice || !endDateAuction) { showAlert("Erreur", "Veuillez entrer le prix et la date"); return; }
    const payload = {
      itemId: Number(id),
      startPrice: Number(startPrice),
      reservePrice: Number(reservePrice) || Number(startPrice),
      endDate: endDateAuction,
    };
 showConfirm("Publier l'enchère", "⚠️ Le prix de départ est définitif.\n\nL'annulation entraînera des frais de 50$.\n\nContinuer ?", async () => {
  try {
    setAuctionLoading(true);
    await createAuction(payload);

    // ← Recharge item + auction sans redirection
    const updatedItem = await fetchItemDetails(Number(id));
    setItem(updatedItem);
    const auctionData = await getAuctionByItemId(Number(id));
    if (auctionData) setAuction(auctionData);

    setStartPrice(""); setReservePrice(""); setEndDateAuction("");
    showAlert("Succès", "Enchère créée !");
  } catch (error: any) {
    showAlert("Erreur", error?.response?.data?.message || "Erreur création");
  } finally {
    setAuctionLoading(false);
  }
});
  };

  // ── Render ────────────────────────────────────────────
  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );

  if (!item) return (
    <View style={styles.center}>
      <Text>Item introuvable</Text>
    </View>
  );

  if (step === "payment") return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>💳 Annulation sécurisée</Text>
      <Text style={{ marginBottom: 10 }}>🔒 Paiement de 50$ pour annuler l'enchère</Text>
      <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} placeholder="Numéro de carte" keyboardType="numeric" />
      <TextInput style={styles.input} value={expMonth} onChangeText={setExpMonth} placeholder="Mois" keyboardType="numeric" />
      <TextInput style={styles.input} value={expYear} onChangeText={setExpYear} placeholder="Année" keyboardType="numeric" />
      <TextInput style={styles.input} value={cvc} onChangeText={setCvc} placeholder="CVC" keyboardType="numeric" />
      <Pressable style={[styles.rentButton, { backgroundColor: "#dc2626" }]} onPress={handleConfirmCancel}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Confirmer le paiement</Text>}
      </Pressable>
      <Pressable onPress={() => setStep("view")}>
        <Text style={{ textAlign: "center", marginTop: 10 }}>Annuler</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={insets.top + 20}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: +150 }} // important 👇
        keyboardShouldPersistTaps="handled"
      >
{isAuctionClosed && (
  <View style={{
    backgroundColor: "#fef2f2", borderRadius: 10, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: "#fca5a5"
  }}>
    <Text style={{ color: "#dc2626", fontWeight: "600", textAlign: "center" }}>
      {item?.status === "CANCELLED_AUCTION" ? "❌ Enchère annulée" : "⛔ Enchère terminée"}
    </Text>
  </View>
)}

        {/* ── Management menu ── */}
        {isOwner && (
          <View style={styles.managementMenu}>

            {editMode && !isAuctionClosed && (
              <Animated.View style={[styles.editContainer, { opacity: slideAnim }]}>
                <Text style={styles.section}>✏️ Modifier l'item</Text>
                <TextInput placeholder="Titre" value={editTitle} onChangeText={setEditTitle} style={styles.input} />
                <TextInput placeholder="Description" value={editDescription} onChangeText={setEditDescription} style={styles.input} multiline />

                <View style={{ marginTop: 10 }}>
                  <Text>Type</Text>
                  <Text style={{ fontWeight: "bold" }}>{item.type === "RENTAL" ? "📦 Location" : "🔥 Enchère"}</Text>
                </View>

                <Text style={styles.section}>Catégorie</Text>
                <View style={styles.pickerContainer}>
                  {categories.map((cat) => (
                    <Pressable key={cat.id} onPress={() => setEditCategoryId(String(cat.id))}
                      style={[styles.categoryButton, editCategoryId === String(cat.id) && styles.categoryButtonActive]}>
                      <Text style={styles.categoryText}>{cat.name}</Text>
                    </Pressable>
                  ))}
                </View>

                {item.type === "RENTAL" && (
                  <TextInput placeholder="Prix / jour" value={editPrice} onChangeText={setEditPrice} keyboardType="numeric" style={styles.input} />
                )}
                <TextInput placeholder="Ville" value={editCity} onChangeText={setEditCity} style={styles.input} />
                <TextInput placeholder="Adresse" value={editAddress} onChangeText={setEditAddress} style={styles.input} />

                <Text style={styles.section}>Images</Text>
                <Pressable style={styles.imageButton} onPress={pickImages}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Choisir des images</Text>
                </Pressable>

                <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 10 }}>
                  {editImages.map((img, index) => (
                    <View key={index} style={{ position: "relative", marginRight: 8, marginBottom: 8 }}>
                      <Image source={{ uri: img.uri }} style={{ width: 90, height: 90, borderRadius: 8 }} />
                      <Pressable onPress={() => removeImage(index)}
                        style={{ position: "absolute", top: -6, right: -6, backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 12, width: 22, height: 22, justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: "#fff", fontSize: 14, fontWeight: "bold" }}>×</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>

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

            {!isAuctionClosed && (
              <Pressable
                style={({ pressed }) => [
                  styles.manageCard,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
                onPress={toggleEdit}
              >
                <Text style={styles.manageIcon}>✏️</Text>
                <Text style={styles.manageLabel}>Modifier</Text>
              </Pressable>
            )}

            {item?.type === "AUCTION" ? (
              auction &&
              auction.status === "OPEN" &&
              !isAuctionClosed && (
                <Pressable style={[styles.manageCard, styles.deactivateCard]} onPress={handleCloseAuction}>
                  <Text style={styles.manageIcon}>❌</Text>
                  <Text style={styles.manageLabel}>Annuler l'enchère</Text>
                </Pressable>
              )
            ) : (
              !isAuctionClosed && (
                <Pressable
                  style={[styles.manageCard, item.active ? styles.deactivateCard : styles.activateCard]}
                  onPress={handleDeactivate}
                  disabled={deactivateLoading}
                >
                  <Text style={styles.manageIcon}>{item.active ? "🚫" : "✅"}</Text>
                  <Text style={styles.manageLabel}>{item.active ? "Désactiver" : "Activer"}</Text>
                </Pressable>
              )
            )}

            <Pressable style={styles.manageCard} onPress={toggleStats}>
              <Text style={styles.manageIcon}>📊</Text>
              <Text style={styles.manageLabel}>Statistiques</Text>
            </Pressable>

            {statsVisible && (
              <Animated.View style={[styles.statsContainer, {
                maxHeight: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 300] }),
                opacity: statsAnim,
              }]}>
                <Text style={styles.section}>📊 Statistiques</Text>
                {item.type === "AUCTION" ? (
                  auction ? (
                    <>
                      <Text>👀 Vues : {auction.views ?? 0}</Text>
                      <Text>⭐ Suivis : {auction.watchers ?? 0}</Text>
                      <Text>👥 {auction.participantsCount ?? 0} enchérisseur(s)</Text>
                      <Text>💰 Prix initial : {auction.startPrice} $</Text>
                      <Text>📈 Prix actuel : {auction.currentPrice ?? auction.startPrice} $</Text>
                      {auction.reserveReached
                        ? <Text style={{ color: "#16a34a", fontWeight: "600" }}>✅ Prix de réserve atteint</Text>
                        : <Text style={{ color: "#dc2626", fontWeight: "600" }}>⛔ Prix de réserve non atteint</Text>}
                    </>
                  ) : <Text>Aucune enchère active</Text>
                ) : item.type === "RENTAL" && rentalStats ? (
                  <>
                    <Text>📦 {rentalStats.rentalsCount} locations</Text>
                    <Text>💰 {rentalStats.totalRevenue} $ générés</Text>
                    <Text>📅 {rentalStats.totalDaysRented} jours loués</Text>
                    {rentalStats.rentalsCount > 5 && <Text style={{ color: "#16a34a" }}>🔥 Très demandé</Text>}
                  </>
                ) : <Text>Aucune statistique disponible</Text>}
              </Animated.View>
            )}
          </View>
        )}

        {/* ── Item info ── */}
        <Text style={styles.title}>{item.title}</Text>

        {item.type === "AUCTION" && auction && (
          <View style={styles.auctionHeader}>
            <Text style={styles.currentPrice}>💰 Prix actuel</Text>
            <Text style={styles.priceValue}>{auction?.currentPrice ?? auction?.startPrice} $</Text>
            <Text style={styles.timer}>⏳ Temps restant : {timeLeft}</Text>
          </View>
        )}

        {item.imageUrls?.length > 0
          ? item.imageUrls.map((url: string, index: number) => (
            <Image key={index} source={{ uri: `${BASE_URL}${url}` }} style={styles.image} resizeMode="contain" />
          ))
          : <Text>Aucune image</Text>}

        {item.type === "RENTAL" && <Text style={styles.price}>{item.pricePerDay} $/jour</Text>}
        <Text style={styles.description}>{item.description}</Text>

        <Text style={styles.section}>📍 Localisation</Text>
        <Text>{item.city}</Text>
        <Text>{item.address}</Text>


        <Text style={styles.section}>👤 Propriétaire</Text>
        <Text style={styles.ownerName}>{item.publisher?.fullName}</Text>
        <Link href={{ pathname: "/user/[id]", params: { id: item.publisher?.userId } }} style={styles.profileLink}>
          Voir le profil →
        </Link>
        <Text>@{item.publisher?.username}</Text>
        <Text>{item.publisher?.city}</Text>
         <Text style={styles.rating}>
                            {item.publisher?.averageRating
                              ? `${Number(item.publisher.averageRating).toFixed(1)} ⭐ (${item.publisher.reviewsCount ?? 0} avis)`
                              : "Aucune note"}
                          </Text>
        {item.publisher?.badge && <Text>🏅 Badge : {item.publisher.badge}</Text>}

        <Text style={styles.section}>⭐ Avis sur ce propriétaire ({userReviews.length})</Text>
        {userReviewsLoading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : userReviews.length === 0 ? (
          <Text>Aucun avis</Text>
        ) : (
          <>
            {(showAllUserReviews
              ? userReviews
              : userReviews.slice(0, 3)
            ).map((r) => (
              <View key={r.id} style={{ marginTop: 10 }}>
                <Text>⭐ {r.rating}</Text>
                <Text>{r.comment}</Text>
                <Text style={{ fontSize: 12, color: "gray" }}>
                  Par {r.reviewerUsername}
                </Text>
              </View>
            ))}

            {userReviews.length > 3 && (
              <Pressable
                onPress={() => setShowAllUserReviews(!showAllUserReviews)}
              >
                <Text
                  style={{
                    color: "#2563eb",
                    fontWeight: "600",
                    marginTop: 10,
                  }}
                >
                  {showAllUserReviews ? "Voir moins" : "Voir plus"}
                </Text>
              </Pressable>
            )}
          </>
        )}

        <Text style={styles.section}>⭐ Avis sur cet article ({reviewsCount})</Text>
        {reviewsLoading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : reviews.length === 0 ? (
          <Text>Aucun avis</Text>
        ) : (
          <>
            {(showAllItemReviews
              ? reviews
              : reviews.slice(0, 3)
            ).map((r) => (
              <View key={r.id} style={{ marginTop: 10 }}>
                <Text>⭐ {r.rating}</Text>
                <Text>{r.comment}</Text>
                <Text style={{ fontSize: 12, color: "gray" }}>
                  Par {r.reviewerUsername}
                </Text>
              </View>
            ))}

            {reviews.length > 3 && (
              <Pressable
                onPress={() => setShowAllItemReviews(!showAllItemReviews)}
              >
                <Text
                  style={{
                    color: "#2563eb",
                    fontWeight: "600",
                    marginTop: 10,
                  }}
                >
                  {showAllItemReviews ? "Voir moins" : "Voir plus"}
                </Text>
              </Pressable>
            )}
          </>
        )}

        {/* ── Bid ── */}
        {item.type === "AUCTION" && !isOwner && !isAuctionClosed && currentUser?.premium && (
          <>
            <Text style={styles.section}>💰 Placer une enchère</Text>
            <Text>Prix actuel : {auction?.currentPrice ?? auction?.startPrice ?? "Pas encore d'enchère"} $</Text>
            <TextInput placeholder="Votre offre" value={bidAmount} onChangeText={setBidAmount} keyboardType="numeric" style={styles.input} />
            <Pressable onPress={handleBid} style={styles.rentButton} disabled={bidLoading}>
              <Text style={styles.buttonText}>{bidLoading ? "Envoi..." : "Faire une offre"}</Text>
            </Pressable>
          </>
        )}

        {item.type === "AUCTION" && !isOwner && !currentUser?.premium && !isAuctionClosed && (
          <Text style={{ color: "orange", marginTop: 15 }}>⭐ Vous devez être Premium pour participer aux enchères.</Text>
        )}

        {/* ── Location ── */}
        {item.type === "RENTAL" && !isOwner && (
          <>
            <Text style={styles.section}>📅 Louer cet item</Text>
            <Pressable style={styles.input} onPress={openStartDatePicker}>
              <Text>{startDate || "Date début"}</Text>
            </Pressable>
            <Pressable style={styles.input} onPress={openEndDatePicker}>
              <Text>{endDate || "Date fin"}</Text>
            </Pressable>
            <Pressable onPress={handleRent} style={styles.rentButton} disabled={rentLoading}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
                {rentLoading ? "Envoi..." : "Louer maintenant"}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Publier enchère ── */}
        {item.type === "AUCTION" && isOwner && !auction && !isAuctionClosed && (
          <>
            <Text style={styles.section}>🔥 Publier l'enchère</Text>
            <TextInput placeholder="Prix initial" value={startPrice} onChangeText={setStartPrice} keyboardType="numeric" style={styles.input} />
            <TextInput placeholder="Prix de réserve" value={reservePrice} onChangeText={setReservePrice} keyboardType="numeric" style={styles.input} />
            <Pressable style={styles.input} onPress={openAuctionDatePicker}>
              <Text>{endDateAuction ? new Date(endDateAuction).toLocaleString() : "Date fin enchère"}</Text>
            </Pressable>
            <Pressable onPress={handleCreateAuction} style={styles.rentButton} disabled={auctionLoading}>
              <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
                {auctionLoading ? "Publication..." : "Publier l'enchère"}
              </Text>
            </Pressable>
          </>
        )}

        {/* ── Info enchère owner ── */}
        {item.type === "AUCTION" && isOwner && auction?.status === "OPEN" && (
          <>
            <Text style={styles.section}>📊 Votre enchère</Text>
            <Text>Prix actuel : {auction?.currentPrice ?? auction?.startPrice ?? "Pas encore d'enchère"} $</Text>
            <Text>Date de fin : {auction?.endDate}</Text>
          </>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", padding: 15 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  image: {
    width: "100%",
    height: 250, // 👈 hauteur fixe
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#f0f0f0",
  },
  price: { fontSize: 18, fontWeight: "600", color: "#2563eb", marginVertical: 10 },
  description: { marginBottom: 15 },
  section: { marginTop: 15, fontWeight: "bold" },
  ownerName: { fontSize: 16, fontWeight: "600", marginBottom: 4 },
  input: { backgroundColor: "#fff", padding: 10, borderRadius: 8, marginTop: 10 },
  rentButton: { backgroundColor: "#2563eb", padding: 12, borderRadius: 8, marginTop: 12, marginBottom: 30 },
  buttonText: { color: "#fff", textAlign: "center", fontWeight: "600" },
  auctionHeader: { backgroundColor: "#fff", padding: 20, borderRadius: 14, marginBottom: 15, alignItems: "center", elevation: 3 },
  currentPrice: { fontSize: 16, color: "#666" },
  priceValue: { fontSize: 34, fontWeight: "bold", color: "#2563eb", marginVertical: 6 },
  timer: { fontSize: 16, color: "#dc2626", fontWeight: "600" },
  profileLink: { color: "#2563eb", marginTop: 5, marginBottom: 10, fontWeight: "600" },
  managementMenu: { marginBottom: 20, gap: 12 },
  manageCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    elevation: 3,

    // 👇 AJOUT IMPORTANT
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  manageIcon: { fontSize: 20, marginRight: 12 },
  manageLabel: { fontSize: 16, fontWeight: "600" },
  deactivateCard: { backgroundColor: "#fee2e2" },
  activateCard: { backgroundColor: "#dcfce7" },
  editContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginBottom: 15, overflow: "hidden" },
  saveButton: { flex: 1, backgroundColor: "#16a34a", padding: 12, borderRadius: 8, alignItems: "center" },
  cancelButton: { flex: 1, backgroundColor: "#6b7280", padding: 12, borderRadius: 8, alignItems: "center" },
  pickerContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  categoryButton: { padding: 10, backgroundColor: "#ddd", borderRadius: 8, margin: 4 },
  categoryButtonActive: { backgroundColor: "#2563eb" },
  categoryText: { color: "#fff" },
  imageButton: { backgroundColor: "#16a34a", padding: 12, borderRadius: 8, alignItems: "center", marginTop: 10 },
  statsContainer: { backgroundColor: "#fff", borderRadius: 12, padding: 15, marginTop: 10, overflow: "hidden" },
  deactivateButton: { backgroundColor: "#dc2626", padding: 12, borderRadius: 8, marginTop: 15 },
   rating: {
    color: "#374151",
    marginTop: 4,
  },
});