import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useEffect, useState } from "react";
import { fetchItems, searchItems, getNearbyItems } from "../../src/api/itemService";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Image } from "react-native";
import { Platform } from "react-native";
import { getAuctionPublicByItemId } from "../../src/api/auctionService";
import * as Location from "expo-location";
import { BASE_URL } from "@/src/utils/baseURL";
import { formatPrice } from "@/src/utils/formatPrice";

export default function Home() {



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
    { id: 11, name: "Matériel de construction" },
    { id: 10, name: "Autres" },
  ];

  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionData, setAuctionData] = useState<
    Record<number, {
      currentPrice: number | null;
      startPrice: number | null;
      participants: number;
      views: number;
      watchers: number;
      endDate: string | null;
    }>
  >({});

  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [direction, setDirection] = useState("DESC");
  const [type, setType] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [radius, setRadius] = useState(10);
  const [auctionLoading, setAuctionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => [...prev]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      // 🔥 reset pagination
      setPage(0);
      setHasMore(true);

      // recharge les données
      await loadItems();

    } catch (error) {
      console.log(error);
    } finally {
      setRefreshing(false);
    }
  };

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const truncate = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
      await loadAuctionPrices(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const loadNearbyItems = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showAlert("Permission refusée", "Activez la localisation pour voir les items proches");
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      setUserLocation({ lat: latitude, lng: longitude });
      const data = await getNearbyItems(latitude, longitude, radius);
      setItems(data);
      setNearbyMode(true);
      await loadAuctionPrices(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  const getImage = (item: any) => {


    // ✅ cas tableau
    if (item.imageUrls && item.imageUrls.length > 0) {
      const url = item.imageUrls[0];
      return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    }

    // ✅ cas string
    if (item.imageUrl) {
      const url = item.imageUrl;
      return url.startsWith("http") ? url : `${BASE_URL}${url}`;
    }

    return null;
  };
  const loadMore = async () => {
    if (!hasMore || loading) return;
    try {
      const nextPage = page + 1;
      const filters: any = { page: nextPage, size: 12, sortBy, direction };
      if (keyword) filters.keyword = keyword;
      if (city) filters.city = city;
      if (categoryId !== "") filters.categoryId = Number(categoryId);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (minRating) filters.minRating = Number(minRating);
      if (type) filters.type = type;
      const data = await searchItems(filters);

      // ← seulement les nouveaux IDs pour éviter doublons
      const existingIds = new Set(items.map(i => i.id));
      const newItems = data.filter((i: any) => !existingIds.has(i.id));

      setItems(prev => [...prev, ...newItems]);
      setPage(nextPage);
      if (data.length < 10) setHasMore(false);

      // ← merge auction data
      const auctions: Record<number, any> = {};
      for (const item of newItems) {
        if (item.type === "AUCTION") {
          try {
            const auction = await getAuctionPublicByItemId(item.id);
            auctions[item.id] = {
              currentPrice: auction?.currentPrice ?? null,
              startPrice: auction?.startPrice ?? null,
              participants: auction?.participantsCount ?? 0,
              views: auction?.views ?? 0,
              watchers: auction?.watchers ?? 0,
              endDate: auction?.endDate ?? null,
            };
          } catch {
            auctions[item.id] = { currentPrice: null, startPrice: null, participants: 0, views: 0, watchers: 0, endDate: null };
          }
        }
      }
      // ← merge sans écraser l'existant
      setAuctionData(prev => ({ ...prev, ...auctions }));

    } catch (error) {
      console.log(error);
    }
  };

  const loadAuctionPrices = async (items: any[]) => {
    setAuctionLoading(true); // ← ajoute
    const auctions: Record<number, any> = {};
    for (const item of items) {
      if (item.type === "AUCTION") {
        try {
          const auction = await getAuctionPublicByItemId(item.id);
          auctions[item.id] = {
            currentPrice: auction?.currentPrice ?? null,
            startPrice: auction?.startPrice ?? null,
            participants: auction?.participantsCount ?? 0,
            views: auction?.views ?? 0,
            watchers: auction?.watchers ?? 0,
            endDate: auction?.endDate ?? null,
          };
        } catch {
          auctions[item.id] = {
            currentPrice: null, startPrice: null,
            participants: 0, views: 0, watchers: 0, endDate: null,
          };
        }
      }
    }
    setAuctionData(auctions);
    setAuctionLoading(false); // ← ajoute
  };

  const getTimeLeft = (endDate?: string | null) => {
    if (!endDate) return "";
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return "terminée";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    if (days > 0) return `${days}j ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const handleSearch = async () => {
    try {
      setShowFilters(false);
      setLoading(true);
      const filters: any = { page: 0, size: 12, sortBy, direction };
      if (keyword) filters.keyword = keyword;
      if (city) filters.city = city;
      if (categoryId !== "") filters.categoryId = Number(categoryId);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (minRating) filters.minRating = Number(minRating);
      if (type) filters.type = type;
      const data = await searchItems(filters);

      console.log("🔍 SEARCH RESULT:", JSON.stringify(data[0])); // ← ajoute ça

      setItems(data.content);
      setPage(0);
      setHasMore(!data.last);
      await loadAuctionPrices(data);

    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setKeyword("");
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating("");
    setCategoryId("");
    setType("");
    setSortBy("createdAt");
    setDirection("DESC");
    setNearbyMode(false);
    loadItems();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Chargement des items...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Toggle filtres */}
      <TouchableOpacity
        style={styles.toggleFilters}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.toggleFiltersText}>
          {showFilters ? "Masquer les filtres ▲" : "Afficher les filtres 🔎"}
        </Text>
      </TouchableOpacity>

      {/* Bouton Près de moi + sélecteur de rayon */}
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.nearbyButton, nearbyMode && styles.nearbyButtonActive]}
          onPress={nearbyMode ? () => { setNearbyMode(false); loadItems(); } : loadNearbyItems}
        >
          <Text style={styles.nearbyButtonText}>
            {nearbyMode ? "📍 Mode proximité ON" : "📍 Près de moi"}
          </Text>
        </TouchableOpacity>

        {nearbyMode && (
          <View style={styles.radiusContainer}>
            {[5, 10, 25, 50].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.radiusBtn, radius === r && styles.radiusBtnActive]}
                onPress={() => {
                  setRadius(r);
                  if (userLocation) {
                    const effectiveRadius = r === 50 ? 500 : r; // ← ajoute
                    getNearbyItems(userLocation.lat, userLocation.lng, effectiveRadius).then((data) => {
                      setItems(data);
                      loadAuctionPrices(data);
                    });
                  }
                }}
              >
                <Text style={radius === r ? { color: "#fff" } : {}}>{r === 50 ? "50 km +" : `${r} km`}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Filtres */}
      {showFilters && (
        <View style={styles.filters}>
          <TextInput
            placeholder="Rechercher (titre ou description)"
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={handleSearch}
            style={styles.input}
          />
          <TextInput
            placeholder="Ville"
            value={city}
            onChangeText={setCity}
            style={styles.input}
          />
          <View style={styles.row}>
            <TextInput
              placeholder="Prix min"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
              style={styles.inputHalf}
            />
            <TextInput
              placeholder="Prix max"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
              style={styles.inputHalf}
            />
            <TextInput
              placeholder="Note(1-5)⭐"
              keyboardType="numeric"
              value={minRating}
              onChangeText={setMinRating}
              style={styles.inputHalf}
            />
          </View>
          <View style={styles.row}>

            <View style={styles.pickerHalf}>
              <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
                <Picker.Item label="Catégorie" value="" />
                {categories.map((cat) => (
                  <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} />
                ))}
              </Picker>
            </View>
            <View style={styles.typePicker}>
              <Picker selectedValue={type} onValueChange={setType}>
                <Picker.Item label="Type" value="" />
                <Picker.Item label="Location 📦" value="RENTAL" />
                <Picker.Item label="Enchère 🔥" value="AUCTION" />
              </Picker>
            </View>
          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.sortButton} onPress={() => { setSortBy("createdAt"); setDirection("DESC"); }}>
              <Text>+ Récents</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortButton} onPress={() => { setSortBy("pricePerDay"); setDirection("ASC"); }}>
              <Text>Prix ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sortButton} onPress={() => { setSortBy("pricePerDay"); setDirection("DESC"); }}>
              <Text>Prix ↓</Text>
            </TouchableOpacity>

          </View>
          <View style={styles.row}>
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={{ color: "#fff" }}>Rechercher</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <Text>Éffacer</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {items.length === 0 ? (
        <Text style={styles.empty}>Aucun item trouvé</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item, index) => `${item.id}-${item.imageUrls?.[0] ?? index}`}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}          // 👈 AJOUT
          onRefresh={onRefresh}            // 👈 AJOUT
          renderItem={({ item }) => {

            // 🔥 FIX IMAGE ICI
            let uri: string | null = null;

            // cas 1 : tableau imageUrls
            if (item.imageUrls && item.imageUrls.length > 0) {
              const url = item.imageUrls[0];
              uri = url.startsWith("http") ? url : `${BASE_URL}${url}`;
            }

            // cas 2 : imageUrl (searchItems)
            else if (item.imageUrl) {
              const url = item.imageUrl;
              uri = url.startsWith("http") ? url : `${BASE_URL}${url}`;
            }

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/item/[id]",
                    params: { id: item.id.toString() },
                  })
                }
              >
                {/* IMAGE */}
                <View style={styles.imageContainer}>
                  {uri && (
                    <Image
                      source={{ uri }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  )}

                  {/* TYPE */}
                  <View style={styles.topBadge}>
                    <Text
                      style={[
                        styles.badge,
                        item.type === "AUCTION"
                          ? styles.auctionBadge
                          : styles.rentalBadge,
                      ]}
                    >
                      {item.type === "AUCTION"
                        ? "🔥 ENCHÈRE"
                        : "📦 LOCATION"}
                    </Text>
                  </View>

                  {/* PRIX */}
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceBadgeText}>
                      {item.type === "AUCTION"
                        ? `${formatPrice(auctionData[item.id]?.startPrice ?? 0)} `
                        : `${formatPrice(item.pricePerDay)} / jour`}
                    </Text>
                  </View>
                </View>

                {/* CONTENU */}
                <View style={styles.content}>

                  <Text numberOfLines={2} style={styles.title}>
                    {item.title}
                  </Text>

                  <Text style={styles.city}>
                    📍 {item.city},  {item.postalCode ? `${item.postalCode}` : ""}
                  </Text>

                  {item?.username && (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <Text style={styles.username}>
                        👤 {item?.username}
                      </Text>

                      <Text style={styles.ratingStars}>
                        {"★".repeat(Math.round(item.ownerRating ?? 0))}
                        {"☆".repeat(5 - Math.round(item.ownerRating ?? 0))}
                        {" "}
                        <Text style={styles.ratingText}>
                          {(item.ownerRating ?? 0).toFixed(1)} ({item.ownerReviewsCount ?? 0} avis)
                        </Text>
                      </Text>
                    </View>
                  )}

                  <Text
                    numberOfLines={2}
                    style={styles.description}
                  >
                    {item.description}
                  </Text>

                  {item.distanceLabel && (
                    <Text style={styles.distanceBadge}>
                      📍 {item.distanceLabel}
                    </Text>
                  )}

                  {/* STATS ENCHÈRE */}
                  {item.type === "AUCTION" && auctionData[item.id] && (
                    <>
                      <View style={styles.separator} />
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                        {auctionData[item.id]?.currentPrice != null && (
                          <Text style={styles.auctionInfo}>💰 {formatPrice(auctionData[item.id].currentPrice)}</Text>
                        )}
                        <Text style={styles.auctionStat}>👀 {auctionData[item.id]?.views ?? 0}</Text>
                        <Text style={styles.auctionStat}>⭐ {auctionData[item.id]?.watchers ?? 0}</Text>
                        <Text style={styles.auctionStat}>👥 {auctionData[item.id]?.participants ?? 0}</Text>
                        {auctionData[item.id]?.endDate && (
                          <Text style={styles.timer}>⏳ {getTimeLeft(auctionData[item.id].endDate)}</Text>
                        )}
                      </View>
                    </>
                  )}


                  {/* Disponibilité / Popularité */}
                  {item.type === "RENTAL" && (
                    <>
                     
                      <View style={styles.footerInfo}>
                        <Text style={styles.footerText}>
                          📅 Disponible
                        </Text>

                        <Text style={styles.footerText}>
                          {(item.rentalsCount ?? 0) > 10
                            ? "🔥 Populaire"
                            : (item.rentalsCount ?? 0) > 5
                              ? "🚀 En demande"
                              : (item.rentalsCount ?? 0) > 0
                                ? "✅ Déjà testé"
                                : "🆕 Nouvelle annonce"}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  imageContainer: {
    position: "relative",
  },

  topBadge: {
    position: "absolute",
    top: 10,
    left: 10,
  },

  priceBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },

  priceBadgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },

  content: {
    padding: 12,
  },

  city: {
    color: "#6b7280",
    marginTop: 4,
    fontSize: 13,
  },

  username: {
    color: "#6b7280",
    fontSize: 13,
    fontWeight: "600",
  },

  description: {
    color: "#9ca3af",
    marginTop: 8,
    lineHeight: 18,
    fontSize: 13,
  },

  separator: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 10,
  },

  auctionInfo: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "600",
  },

  auctionStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },

  auctionStat: {
    fontSize: 13,
    color: "#4b5563",
  },

  image: {
    width: "100%",
    height: 220,
  },

  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f9",
  },

  toggleFilters: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
  },

  toggleFiltersText: {
    color: "#fff",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  filters: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },

  inputHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 4,
    borderRadius: 8,
  },

  pickerHalf: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
  },

  row: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },

  sortButton: {
    flex: 1,                // 🔥 IMPORTANT
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 6,
    alignItems: "center",   // centre le texte
  },

  searchButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  resetButton: {
    flex: 1,
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  empty: {
    textAlign: "center",
    marginTop: 20,
    color: "#555",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },

  price: {
    marginTop: 5,
    color: "#2563eb",
    fontWeight: "600",
  },

  badgeContainer: {
    marginBottom: 8,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },

  auctionBadge: {
    backgroundColor: "#ef4444",
  },

  rentalBadge: {
    backgroundColor: "#2563eb",
  },

  typePicker: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  timer: {
    color: "#ef4444",
    fontWeight: "600",
  },
  nearbyButton: {
    backgroundColor: "#10b981",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    flex: 1,
  },
  nearbyButtonActive: {
    backgroundColor: "#059669",
  },
  nearbyButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  radiusContainer: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },
  radiusBtn: {
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 6,
  },
  radiusBtnActive: {
    backgroundColor: "#2563eb",
  },
  distanceBadge: {
    fontSize: 12,
    color: "#10b981",
    fontWeight: "600",
    marginTop: 4,
  },
  footerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },

  footerText: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  auctionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 6,
  },

  ratingStars: {
  fontSize: 11,
  color: "#eab308", // jaune comme le web (yellow-500)
  fontWeight: "600",
},
ratingText: {
  fontSize: 10,
  color: "#6b7280", // gray-500
  fontWeight: "500",
},

});