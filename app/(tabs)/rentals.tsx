import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
} from "react-native";

import {
  fetchMyRentals,
  fetchOwnerRentals,
  approveRental,
  cancelRental,
  RentalResponse,
} from "@/src/api/rentalService";

import { hasReviewedRental } from "@/src/api/reviewService";
import { fetchItemDetails } from "@/src/api/itemService";
import { fetchUserProfile } from "@/src/api/authService";

import { useRouter, useFocusEffect,Link } from "expo-router";

export default function RentalsScreen() {
  const router = useRouter();

  const [mode, setMode] = useState<"renter" | "owner">("renter");
  const [rentals, setRentals] = useState<RentalResponse[]>([]);

  const [itemsMap, setItemsMap] = useState<Record<number, any>>({});
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [reviewedMap, setReviewedMap] = useState<Record<number, boolean>>({});

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // =========================
  // LOAD DATA
  // =========================
  const loadData = async () => {
    setLoading(true);

    try {
      const data =
        mode === "renter"
          ? await fetchMyRentals()
          : await fetchOwnerRentals();

      const filtered = data.filter((r) => r.status !== "CANCELLED");

      setRentals(filtered);

      // =========================
      // LOAD ITEMS
      // =========================

      const uniqueItemIds = [...new Set(filtered.map((r) => r.itemId))];

      const itemsResults = await Promise.all(
        uniqueItemIds.map(async (itemId) => {
          try {
            const item = await fetchItemDetails(itemId);
            return [itemId, item];
          } catch {
            return [itemId, null];
          }
        })
      );

      const itemsObject = Object.fromEntries(itemsResults);
      setItemsMap(itemsObject);

      // =========================
      // LOAD USERS (renters)
      // =========================

      const renterIds = [
        ...new Set(filtered.map((r) => r.renterId).filter(Boolean)),
      ];

      const usersResults = await Promise.all(
        renterIds.map(async (userId) => {
          try {
            const user = await fetchUserProfile(userId);
            return [userId, user];
          } catch {
            return [userId, null];
          }
        })
      );

      const usersObject = Object.fromEntries(usersResults);
      setUsersMap(usersObject);

      // =========================
      // LOAD REVIEWS
      // =========================

      const reviewsResults = await Promise.all(
        filtered.map(async (rental) => {
          try {
            const already = await hasReviewedRental(rental.id);
            return [rental.id, already];
          } catch {
            return [rental.id, false];
          }
        })
      );

      const reviewsObject = Object.fromEntries(reviewsResults);
      setReviewedMap(reviewsObject);
    } catch (e) {
      console.log("❌ Error loading rentals", e);
    }

    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [mode])
  );

  // =========================
  // APPROVE
  // =========================

  const handleApprove = async (id: number) => {
    setActionLoadingId(id);

    try {
      await approveRental(id);
      await loadData();
    } catch (error) {
      console.log("❌ APPROVE ERROR:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  // =========================
  // CANCEL
  // =========================

  const handleCancel = async (id: number) => {
    setActionLoadingId(id);

    try {
      await cancelRental(id);
      await loadData();
    } catch (error) {
      console.log("❌ CANCEL ERROR:", error);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReview = (rental: RentalResponse) => {
    router.push({
      pathname: "/review/create",
      params: {
        rentalId: rental.id.toString(),
      },
    });
  };

  // =========================
  // STATUS COLOR
  // =========================

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CREATED":
        return "#f59e0b";
      case "APPROVED":
        return "#10b981";
      case "CANCELLED":
        return "#ef4444";
      case "ONGOING":
        return "#2563eb";
      case "ENDED":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  // =========================
  // RENDER ITEM
  // =========================

  const renderItem = ({ item }: { item: RentalResponse }) => {
    const itemDetails = itemsMap[item.itemId];
    const renter = usersMap[item.renterId];

    return (
      <View
        style={{
          backgroundColor: "#fff",
          padding: 16,
          borderRadius: 10,
          marginBottom: 12,
          shadowColor: "#000",
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <Text style={{ fontWeight: "bold", fontSize: 16 }}>
          #{item.itemId} - {itemDetails?.title ?? "Loading..."}
        </Text>

        <Text style={{ color: "#6b7280", marginBottom: 6 }}>
  {mode === "owner" ? (
    <Link
      href={{
        pathname: "/user/[id]",
        params: { id: renter?.userId },
      }}
      style={{ color: "#2563eb" }}
    >
      Locataire: @{renter?.username ?? "..."}
    </Link>
  ) : (
    `Propriétaire: @${itemDetails?.publisher?.username ?? "..."}`
  )}
</Text>

        <Text style={{ color: getStatusColor(item.status) }}>
          {item.status}
        </Text>

        <Text>Total: {item.totalPrice} $</Text>
        <Text>Date début: {item.startDate}</Text>
        <Text>Date fin: {item.endDate}</Text>

        {/* REVIEW */}
        {item.status === "ENDED" && reviewedMap[item.id] === false && (
          <Pressable
            onPress={() => handleReview(item)}
            style={{
              marginTop: 10,
              backgroundColor: "#f59e0b",
              padding: 8,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>
              Leave Review
            </Text>
          </Pressable>
        )}

        {/* OWNER ACTIONS */}
        {mode === "owner" && item.status === "CREATED" && (
          <View style={{ flexDirection: "row", marginTop: 10 }}>
            <Pressable
              onPress={() => handleApprove(item.id)}
              style={{
                flex: 1,
                backgroundColor: "#10b981",
                padding: 8,
                borderRadius: 6,
                marginRight: 6,
              }}
            >
              {actionLoadingId === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Approve
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => handleCancel(item.id)}
              style={{
                flex: 1,
                backgroundColor: "#ef4444",
                padding: 8,
                borderRadius: 6,
              }}
            >
              {actionLoadingId === item.id ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: "#fff", textAlign: "center" }}>
                  Cancel
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#f3f4f6" }}>
      {/* SEGMENT CONTROL */}
      <View style={{ flexDirection: "row", marginBottom: 20 }}>
        <Pressable
          onPress={() => setMode("renter")}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: mode === "renter" ? "#2563eb" : "#ddd",
            borderTopLeftRadius: 8,
            borderBottomLeftRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            My Rentals
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setMode("owner")}
          style={{
            flex: 1,
            padding: 10,
            backgroundColor: mode === "owner" ? "#2563eb" : "#ddd",
            borderTopRightRadius: 8,
            borderBottomRightRadius: 8,
          }}
        >
          <Text style={{ color: "#fff", textAlign: "center" }}>
            My Items
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={rentals}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 40 }}>
              No rentals found
            </Text>
          }
        />
      )}
    </View>
  );
}