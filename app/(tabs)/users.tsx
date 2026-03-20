import { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Switch,
  StyleSheet,
  Alert,
  RefreshControl,
  Platform,
  TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";
import {
  getAllUsers,
  suspendUser,
  activateUser,
  strikeUser,
} from "@/src/api/adminService";

interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string;
  city: string;
  enabled: boolean;
  roles: string[];
  subscription: string;
  auctionStrikes?: number;
  auctionRestricted?: boolean;
}

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      Alert.alert("Erreur", "Impossible de charger les utilisateurs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const toggleUser = (user: User, newValue: boolean) => {
    const actionText = newValue
      ? "Activer cet utilisateur ?"
      : "Suspendre cet utilisateur ?";

    if (Platform.OS === "web") {
      const confirmed = confirm(`${actionText}\n${user.username}`);

      if (confirmed) {
        handleToggle(user, newValue);
      }
    } else {
      Alert.alert(actionText, user.username, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Confirmer",
          style: "destructive",
          onPress: () => handleToggle(user, newValue),
        },
      ]);
    }
  };

  const handleStrike = (user: User) => {

  const message =
    "Ajouter un strike à cet utilisateur ?\n\n" +
    "3 strikes = interdiction de participer aux enchères.";

  if (Platform.OS === "web") {
    if (confirm(message)) {
      applyStrike(user);
    }
  } else {
    Alert.alert("Strike utilisateur", message, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Confirmer",
        style: "destructive",
        onPress: () => applyStrike(user),
      },
    ]);
  }
};

const applyStrike = async (user: User) => {
  try {

    const res = await strikeUser(user.id);

    setUsers(prev =>
      prev.map(u =>
        u.id === user.id
          ? {
              ...u,
              auctionStrikes: res.auctionStrikes,
              auctionRestricted: res.auctionRestricted
            }
          : u
      )
    );

  } catch (err) {
    console.log(err);
    alert("Erreur lors du strike");
  }
};

  const handleToggle = async (user: User, newValue: boolean) => {
    try {
      if (newValue) {
        await activateUser(user.id);
      } else {
        await suspendUser(user.id);
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, enabled: newValue } : u
        )
      );
    } catch (error) {
      console.log("Toggle error:", error);
      alert("Erreur lors de la mise à jour");
    }
  };

  const filteredUsers = users.filter((u) => {
    const s = search.toLowerCase();

    return (
      u.username?.toLowerCase().includes(s) ||
      u.fullName?.toLowerCase().includes(s) ||
      u.email?.toLowerCase().includes(s) ||
      u.subscription?.toLowerCase().includes(s) ||
      (s === "admin" && u.roles.includes("ROLE_ADMIN")) ||
      (s === "actif" && u.enabled) ||
      (s === "suspendu" && !u.enabled)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestion des utilisateurs</Text>

      <TextInput
        placeholder="Rechercher utilisateur..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={{ flex: 1 }}>
              <Text style={styles.username}>{item.fullName}</Text>

              <Text style={styles.email}>@{item.username}</Text>

              <Text style={styles.infoText}>{item.email}</Text>

              <Text style={styles.infoText}>
                📞 {item.phone ?? "Non renseigné"}
              </Text>

              <Text style={styles.infoText}>
                📍 {item.city ?? "Non renseignée"}
              </Text>

              <View style={styles.metaRow}>
                {item.auctionStrikes !== undefined && (
  <Text style={styles.strikes}>
    ⚠ Strikes : {item.auctionStrikes}/3
  </Text>
)}
                <Text
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: item.enabled
                        ? "#16a34a"
                        : "#dc2626",
                    },
                  ]}
                >
                  {item.enabled ? "Actif" : "Suspendu"}
                </Text>

                {item.roles.includes("ROLE_ADMIN") && (
                  <Text style={styles.adminBadge}>ADMIN</Text>
                )}

                {/* 👇 BADGE PREMIUM / STANDARD */}
                <Text
                  style={[
                    styles.subscriptionBadge,
                    {
                      backgroundColor:
                        item.subscription === "PREMIUM"
                          ? "#f59e0b"
                          : "#64748b",
                    },
                  ]}
                >
                  {item.subscription}
                </Text>
              </View>
            </View>

<View style={styles.actions}>

  <Switch
    value={Boolean(item.enabled)}
    onValueChange={(newValue) => toggleUser(item, newValue)}
  />

  {item.subscription === "PREMIUM" && (
    <Text
      style={styles.strikeButton}
      onPress={() => handleStrike(item)}
    >
      ⚠ Strike
    </Text>
  )}

</View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f1f5f9" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },

  search: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 3,
  },

  username: { fontSize: 16, fontWeight: "bold" },
  email: { fontSize: 13, color: "#6b7280", marginTop: 2 },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },

  adminBadge: {
    backgroundColor: "#111827",
    color: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontSize: 11,
    fontWeight: "bold",
  },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  infoText: {
    fontSize: 13,
    color: "#374151",
    marginTop: 2,
  },
  subscriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
strikeButton: {
  backgroundColor: "#f59e0b",
  color: "white",
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: 6,
  fontSize: 12,
  fontWeight: "bold",
  marginTop: 8,
},

strikes: {
  marginTop: 6,
  fontSize: 12,
  color: "#dc2626",
  fontWeight: "600",
},
actions: {
  alignItems: "center",
  marginLeft: 10,
},
});