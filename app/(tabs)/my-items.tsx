import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
} from "react-native";
import { useEffect, useState } from "react";
import { fetchMyItems } from "../../src/api/itemService";
import { router } from "expo-router";
import { Platform } from "react-native";
import { BASE_URL } from "@/src/utils/baseURL";
import { formatPrice } from "@/src/utils/formatPrice";

export default function MyItems() {



  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadItems = async () => {
    try {
      const data = await fetchMyItems();
      setItems(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadItems();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>Mes objets</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id.toString()}

        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }

        ListEmptyComponent={
          !loading ? (
            <Text style={styles.empty}>
              Vous n'avez encore publié aucun objet.
            </Text>
          ) : null
        }

        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/my-items/[id]",
                params: { id: item.id.toString() },
              })
            }
          >

            {(item.imageUrls?.length > 0 || item.imageUrl) && (
              <Image
                source={{
                  uri: item.imageUrls
                    ? `${BASE_URL}${item.imageUrls[0]}`
                    : item.imageUrl,
                }}
                style={styles.image}
                resizeMode="contain"
              />
            )}

            <Text style={styles.titleItem}>{item.title}</Text>

            <Text style={styles.city}>{item.city}</Text>

            {item.type === "RENTAL" && (
              <Text style={styles.price}>
                {formatPrice(item.pricePerDay)}  / jour
              </Text>
            )}

            <View style={styles.badgeRow}>

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

              <Text
                style={[
                  styles.status,
                  {
                    backgroundColor:
                      item.status === "CANCELLED_AUCTION"
                        ? "#facc15"
                        : item.active
                          ? "#16a34a"
                          : "#dc2626",
                  },
                ]}
              >
                {item.status === "CANCELLED_AUCTION"
                  ? "Annulée"
                  : item.active
                    ? "Actif"
                    : "Désactivé"}
              </Text>

            </View>

          </TouchableOpacity>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f4f6f9",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#555",
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  image: {
    width: "100%",
    aspectRatio: 4 / 3,      // ← hauteur dynamique selon ratio
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#f0f0f0", // ← fond si image non carrée
  },

  titleItem: {
    fontWeight: "bold",
    fontSize: 16,
  },

  city: {
    color: "#6b7280",
    marginTop: 2,
  },

  price: {
    marginTop: 4,
    color: "#2563eb",
    fontWeight: "600",
  },

  badgeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 8,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

  auctionBadge: {
    backgroundColor: "#ef4444",
  },

  rentalBadge: {
    backgroundColor: "#2563eb",
  },

  status: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },

});