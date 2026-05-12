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
import { formatNotificationDate } from "@/src/utils/date";

const getTypeConfig = (type: string) => {
  switch (type) {
    case "CREATED":
      return { icon: "📦", label: "Demande de location" };

    case "APPROVED":
      return { icon: "✅", label: "Location approuvée" };

    case "STARTED":
      return { icon: "⏰", label: "Location démarrée" };

    case "CANCELLED":
      return { icon: "❌", label: "Location annulée" };

    case "ENDED":
      return { icon: "⏰", label: "Location terminée" };

    case "NEW_BID":
      return { icon: "🔥", label: "Nouvelle enchère" };

    case "AUCTION_WON":
      return { icon: "🏆", label: "Enchère gagnée" };

    case "AUCTION_FINISHED":
      return { icon: "⏰", label: "Enchère terminée" };

    case "AUCTION_RESERVE_NOT_MET":
      return { icon: "🔥", label: "Prix de réserve non atteint" };

    case "AUCTION_REFUNDED":
      return { icon: "💳", label: "Remboursement enchère" };

    case "AUCTION_PENALTY":
      return { icon: "💳", label: "Pénalité" };

    case "NEW_MESSAGE":
      return { icon: "💬", label: "Nouveau message" };

    case "NEW_REVIEW":
      return { icon: "⭐", label: "Nouvel avis" };

    case "PAYMENT_SUCCESS":
      return { icon: "💳", label: "Paiement réussi" };

    case "DISPUTE_OPENED":
      return { icon: "⚖️", label: "Litige ouvert" };
      case "AUCTION_CANCELLED": return { icon: "❌", label: "Enchère annulée" };

    case "DISPUTE_RESOLVED":
      return { icon: "✅", label: "Litige résolu" };

    case "ACCOUNT_REACTIVATED":
      return { icon: "✅", label: "Compte réactivé" };

    case "AUCTION_STRIKE":
      return { icon: "⚠️", label: "Avertissement" };

    case "REVIEW":
      return { icon: "⭐", label: "Avis" };

    case "REVIEW_USER":
      return { icon: "⭐", label: "Avis utilisateur" };

    case "REVIEW_ITEM":
      return { icon: "⭐", label: "Avis article" };

    case "SUBSCRIPTION_RENEWED":
      return { icon: "🔄", label: "Renouvellement abonnement" };

    default:
      return { icon: "🔔", label: type };
  }
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      loadNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markNotificationAsRead(id);

      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id
            ? { ...notif, read: true }
            : notif
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
        prev.map((notif) => ({
          ...notif,
          read: true,
        }))
      );
    } catch (error) {
      console.log("Error marking all:", error);
    }
  };

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>

          <Text style={styles.subtitle}>
            {unread.length > 0
              ? `${unread.length} non lue(s)`
              : "Tout est à jour"}
          </Text>
        </View>

        {unread.length > 0 && (
          <Pressable
            onPress={handleMarkAll}
            style={styles.markAllButton}
          >
            <Text style={styles.markAllText}>
              ✓ Tout lire
            </Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={[...unread, ...read]}
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
        contentContainerStyle={{
          paddingBottom: 30,
        }}
        renderItem={({ item }) => {
          const { icon, label } = getTypeConfig(item.type);

          return (
            <Pressable
              onPress={() =>
                !item.read &&
                handleMarkAsRead(item.id)
              }
              style={[
                styles.card,
                item.read
                  ? styles.readCard
                  : styles.unreadCard,
              ]}
            >
              <View style={styles.cardContent}>

                {/* Icône */}
                <View
                  style={[
                    styles.iconContainer,
                    item.read && {
                      opacity: 0.6,
                    },
                  ]}
                >
                  <Text style={styles.icon}>
                    {icon}
                  </Text>
                </View>

                {/* Contenu */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.message,
                      item.read && {
                        color: "#6b7280",
                        fontWeight: "400",
                      },
                    ]}
                  >
                    {item.message}
                  </Text>

                  <View style={styles.metaRow}>
                    <Text style={styles.label}>
                      {label}
                    </Text>

                    <Text style={styles.separator}>
                      •
                    </Text>

                    <Text style={styles.date}>
                      {item.createdAt
                        ? formatNotificationDate(
                            item.createdAt
                          )
                        : ""}
                    </Text>
                  </View>
                </View>

                {/* Point bleu */}
                {!item.read && (
                  <View style={styles.unreadDot} />
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🔔
            </Text>

            <Text style={styles.emptyTitle}>
              Aucune notification
            </Text>

            <Text style={styles.emptySubtitle}>
              Vous êtes à jour !
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    paddingHorizontal: 15,
    paddingTop: 15,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#111827",
  },

  subtitle: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 14,
  },

  markAllButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  markAllText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },

  card: {
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },

  unreadCard: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },

  readCard: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },

  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },

  icon: {
    fontSize: 20,
  },

  message: {
    fontSize: 14,
    lineHeight: 20,
    color: "#111827",
    fontWeight: "600",
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
    flexWrap: "wrap",
  },

  label: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "600",
  },

  separator: {
    color: "#d1d5db",
    fontSize: 12,
  },

  date: {
    fontSize: 12,
    color: "#9ca3af",
  },

  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2563eb",
    marginTop: 4,
  },

  emptyContainer: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyIcon: {
    fontSize: 50,
    marginBottom: 12,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },

  emptySubtitle: {
    marginTop: 4,
    color: "#9ca3af",
    fontSize: 14,
  },
});