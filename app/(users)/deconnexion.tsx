import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";

export default function DeconnexionScreen() {
  const { logout, user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Oui",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await logout();
              router.dismissAll(); 
              router.replace("/(auth)/login");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de se déconnecter");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>

      {/* Avatar */}
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>
          {user?.username?.charAt(0).toUpperCase() ?? "?"}
        </Text>
      </View>

      <Text style={styles.name}>{user?.username}</Text>
      <Text style={styles.email}>{user?.email ?? ""}</Text>

      <View style={styles.separator} />

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.logoutText}>🚪 Se déconnecter</Text>
        }
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  avatarCircle: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    elevation: 4,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "bold" },
  name: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  email: { fontSize: 14, color: "#9ca3af", marginTop: 4 },
  separator: {
    width: "100%", height: 1,
    backgroundColor: "#e5e7eb", marginVertical: 30,
  },
  logoutButton: {
    width: "100%",
    backgroundColor: "#ef4444",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
