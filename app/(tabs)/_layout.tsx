import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { View } from "react-native";
import { NotificationBell, PremiumButton } from "../TopBarButtons";


export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN");
  return (
    <Tabs
    //  key={user?.id || "guest"}
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2563eb",
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <PremiumButton />
            <NotificationBell />
          </View>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Accueil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="create"
        options={{
          title: "Poster",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
          href: !isAdmin ? "/create" : null,
        }}
      />

      <Tabs.Screen
        name="rentals"
        options={{
          title: "Locations",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
          href: !isAdmin ? "/rentals" : null,
        }}
      />

      <Tabs.Screen
        name="disputes"
        options={{
          title: "Litiges",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
          href: !isAdmin ? "/disputes" : null,
        }}
      />

      {/* 👇 TOUJOURS déclarer la route */}
      <Tabs.Screen
        name="items"
        options={{
          title: "Gérer Produits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/items" : null,
        }}
      />
      {/* 👇 TOUJOURS déclarer la route */}
      <Tabs.Screen
        name="users"
        options={{
          title: "Gérer Utilisateurs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/users" : null,
        }}
      />

      <Tabs.Screen
        name="admin-disputes"
        options={{
          title: "Gérer litiges",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/admin-disputes" : null,
        }}
      />

      <Tabs.Screen
        name="confirm-payment"
        options={{
          title: "Gérer payments",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/confirm-payment" : null,
        }}
      />

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Tableau de bord",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/dashboard" : null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

