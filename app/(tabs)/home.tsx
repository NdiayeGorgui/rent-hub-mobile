import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useEffect, useState } from "react";
import { fetchItems, searchItems } from "../../src/api/itemService";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Image } from "react-native";
import { Platform } from "react-native";
import { getAuctionByItemId } from "../../src/api/auctionService";

export default function Home() {



  const baseURL =
    Platform.OS === "android"
      ? "http://10.0.2.2:8080"
      : "http://localhost:8080";

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

  const [showFilters, setShowFilters] = useState(false);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [auctionData, setAuctionData] = useState<
    Record<number, { price: number | null; endDate: string | null }>
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


  useEffect(() => {
    loadItems();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setItems((prev) => [...prev]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const truncate = (text: string, maxLength: number) => {
    if (!text) return "";
    return text.length > maxLength ? text.slice(0, maxLength) + "…" : text;
  };

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);

      // Charger les prix des enchères
      await loadAuctionPrices(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;

    try {
      const nextPage = page + 1;

      const filters: any = {
        page: nextPage,
        size: 10,
        sortBy,
        direction,
      };
      if (keyword) filters.keyword = keyword;
      if (city) filters.city = city;
      if (categoryId !== "") filters.categoryId = Number(categoryId);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (minRating) filters.minRating = Number(minRating);
      if (type) filters.type = type;

      const data = await searchItems(filters);

      setItems((prev) => [...prev, ...data]);
      setPage(nextPage);

      if (data.length < 10) {
        setHasMore(false);
      }

    } catch (error) {
      console.log(error);
    }
  };

  const loadAuctionPrices = async (items: any[]) => {
    const auctions: Record<number, { price: number | null; endDate: string | null }> = {};

    for (const item of items) {
      if (item.type === "AUCTION") {
        try {
          const auction = await getAuctionByItemId(item.id);

          auctions[item.id] = {
            price: auction?.currentPrice ?? auction?.startPrice ?? null,
            endDate: auction?.endDate ?? null,
          };

        } catch (err) {
          auctions[item.id] = {
            price: null,
            endDate: null,
          };
        }
      }
    }

    setAuctionData(auctions);
  };

  const getTimeLeft = (endDate?: string | null) => {

    if (!endDate) return "";

    const now = new Date().getTime();
    const end = new Date(endDate).getTime();

    const diff = end - now;

    if (diff <= 0) return "terminée";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    if (days > 0) {
      return `${days}j ${hours}h ${minutes}m ${seconds}s`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }

    return `${seconds}s`;
  };

  const handleSearch = async () => {
    try {
      setLoading(true);

      const filters: any = {
        page: 0,
        size: 10,
        sortBy,
        direction,
      };
      if (keyword) filters.keyword = keyword;
      if (city) filters.city = city;
      if (categoryId !== "") filters.categoryId = Number(categoryId);
      if (minPrice) filters.minPrice = Number(minPrice);
      if (maxPrice) filters.maxPrice = Number(maxPrice);
      if (minRating) filters.minRating = Number(minRating);
      if (type) filters.type = type;

      const data = await searchItems(filters); console.log("Filters:", filters);

      setItems(data);
      setPage(0);
      setHasMore(data.length === 10); // s'il y a 10 items, il y a peut-être une autre page

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

      <TouchableOpacity
        style={styles.toggleFilters}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.toggleFiltersText}>
          {showFilters ? "Masquer les filtres ▲" : "Afficher les filtres 🔎"}
        </Text>
      </TouchableOpacity>

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
          </View>

          <View style={styles.row}>

            <TextInput
              placeholder="Note min (1-5) ⭐"
              keyboardType="numeric"
              value={minRating}
              onChangeText={setMinRating}
              style={styles.inputHalf}
            />

            {/* SELECT CATEGORIE */}
            <View style={styles.pickerHalf}>
              <Picker
                selectedValue={categoryId}
                onValueChange={(itemValue) => setCategoryId(itemValue)}
              >
                <Picker.Item label="Catégorie" value="" />

                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.id}
                    label={cat.name}
                    value={String(cat.id)}
                  />
                ))}
              </Picker>
            </View>

          </View>

          <View style={styles.row}>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                setSortBy("createdAt");
                setDirection("DESC");
              }}
            >
              <Text>Plus récents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                setSortBy("pricePerDay");
                setDirection("ASC");
              }}
            >
              <Text>Prix ↑</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sortButton}
              onPress={() => {
                setSortBy("pricePerDay");
                setDirection("DESC");
              }}
            >
              <Text>Prix ↓</Text>
            </TouchableOpacity>

            {/* TYPE */}
            <View style={styles.typePicker}>
              <Picker
                selectedValue={type}
                onValueChange={(value) => setType(value)}
              >
                <Picker.Item label="Type" value="" />
                <Picker.Item label="Location 📦" value="RENTAL" />
                <Picker.Item label="Enchère 🔥" value="AUCTION" />
              </Picker>
            </View>

          </View>

          <View style={styles.row}>

            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearch}
            >
              <Text style={{ color: "#fff" }}>Rechercher</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetFilters}
            >
              <Text>Reset</Text>
            </TouchableOpacity>

          </View>

        </View>
      )}

      {items.length === 0 ? (
        <Text style={styles.empty}>
          Aucun item trouvé
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}

          onEndReached={loadMore}
          onEndReachedThreshold={0.5}

          ListFooterComponent={
            hasMore ? <ActivityIndicator style={{ margin: 10 }} /> : null
          }

          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/item/[id]",
                  params: { id: item.id.toString() },
                })
              }
            >

              {(item.imageUrls?.length > 0 || item.imageUrl) && (
                <Image
                  source={{
                    uri: item.imageUrls
                      ? `${baseURL}${item.imageUrls[0]}`
                      : item.imageUrl,
                  }}
                  style={styles.image}
                />
              )}

              <View style={styles.badgeContainer}>
                <Text
                  style={[
                    styles.badge,
                    item.type === "AUCTION"
                      ? styles.auctionBadge
                      : styles.rentalBadge,
                  ]}
                >
                  {item.type === "AUCTION" ? "🔥 ENCHÈRE" : "📦 LOCATION"}
                </Text>
              </View>

              <Text style={styles.title}>{item.title}</Text>
              <Text>{truncate(item.description, 120)}</Text>

              {/* Affiche le prix  pour les locations */}
              {item.type !== "AUCTION" && item.pricePerDay != null && (
                <Text style={styles.price}>
                  {item.pricePerDay} $/jour
                </Text>
              )}

              {/* Affiche le prix pour les enchères */}
              {item.type === "AUCTION" && (
                <>
                  <Text style={styles.price}>
                    {auctionData[item.id]?.price != null
                      ? `Prix actuel : ${auctionData[item.id].price} $`
                      : "Enchère pas encore commencée"}
                  </Text>

                  {auctionData[item.id]?.endDate && (
                    <Text style={styles.timer}>
                      ⏳ {getTimeLeft(auctionData[item.id].endDate)}
                    </Text>
                  )}
                </>
              )}

            </TouchableOpacity>
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({

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
    padding: 10,
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
    backgroundColor: "#eee",
    padding: 8,
    borderRadius: 6,
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
  image: {
    width: "100%",
    height: 160,
    borderRadius: 10,
    marginBottom: 10,
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
    marginTop: 3,
    color: "#ef4444",
    fontWeight: "600",
  }
});