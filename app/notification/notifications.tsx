import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  RefreshControl,
} from "react-native";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/src/api/notificationService";
import { useFocusEffect } from "expo-router";
import dayjs, { formatNotificationDate } from "@/src/utils/date";

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tick, setTick] = useState(0);

  const loadNotifications = async () => {
    try {
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.log("Error loading notifications:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 60000); // 60 secondes

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);

      // update local state instantly
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.log("Error marking as read:", error);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsAsRead();

      setNotifications((prev) =>
        prev.map((notif) => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.log("Error marking all:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 🔵 Bouton tout marquer comme lu */}
      {notifications.some((n) => !n.read) && (
        <Pressable onPress={handleMarkAll} style={styles.markAllButton}>
          <Text style={{ color: "#fff", fontWeight: "600" }}>
            Tout marquer comme lu
          </Text>
        </Pressable>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => !item.read && handleMarkAsRead(item.id)}
            style={[
              styles.card,
              { backgroundColor: item.read ? "#fff" : "#e0f2fe" },
            ]}
          >
            <Text style={{ fontWeight: item.read ? "400" : "600" }}>
              {item.message}
            </Text>


            {/* 🕒 Temps relatif */}
            {item.createdAt && (
              <Text style={{ fontSize: 12, color: "gray", marginTop: 5 }}>
                {formatNotificationDate(item.createdAt)}
              </Text>
            )}

            <Text style={styles.type}>{item.type}</Text>

            {!item.read && <View style={styles.unreadDot} />}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 40 }}>
            Aucune notification
          </Text>
        }
      />
    </View>
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
  card: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    position: "relative",
  },
  type: {
    fontSize: 12,
    color: "gray",
    marginTop: 5,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    position: "absolute",
    right: 10,
    top: 10,
  },
  markAllButton: {
    backgroundColor: "#2563eb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
});