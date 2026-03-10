import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  // 🔥 FAKE DATA pour l’instant
  const user = {
    fullName: "John Doe",
    username: "@johndoe",
    city: "Montreal",
    rating: 4.8,
    avatar:
      "https://i.pravatar.cc/150?img=12",
  };

  const handleLogout = () => {
    console.log("Logout...");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Avatar */}
      <Image source={{ uri: user.avatar }} style={styles.avatar} />

      {/* Name */}
      <Text style={styles.name}>{user.fullName}</Text>
      <Text style={styles.username}>{user.username}</Text>

      {/* Rating */}
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={18} color="#FF385C" />
        <Text style={styles.ratingText}>{user.rating}</Text>
      </View>

      {/* Location */}
      <View style={styles.infoRow}>
        <Ionicons name="location-outline" size={18} />
        <Text style={styles.infoText}>{user.city}</Text>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <ActionButton icon="cube-outline" label="My Listings" />
        <ActionButton icon="calendar-outline" label="My Rentals" />
        <ActionButton icon="card-outline" label="Premium Subscription" />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ---------- Reusable Button ---------- */

function ActionButton({ icon, label }: { icon: any; label: string }) {
  return (
    <TouchableOpacity style={styles.actionButton}>
      <Ionicons name={icon} size={22} color="#333" />
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons name="chevron-forward-outline" size={20} color="#999" />
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: "bold",
  },
  username: {
    color: "#777",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    marginLeft: 5,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  infoText: {
    marginLeft: 5,
  },
  actionsContainer: {
    width: "100%",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#FF385C",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  logoutText: {
    color: "white",
    fontWeight: "bold",
  },
});