import { Tabs, useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";
import { useCallback, useContext, useState } from "react";
import { NotificationContext } from "@/src/context/NotificationContext";


import { Animated } from "react-native";
import { useRef, useEffect } from "react";
import { useAuth } from "@/src/context/AuthContext";



export default function TabsContent() {

  const { user, loading } = useAuth(); // loading = true tant que le profil n'est pas chargé
  const router = useRouter();

  if (loading) {
    // On peut afficher un loader ou rien
    console.log("USER:", user);
    console.log("ROLES:", user?.roles);
    return null;
  }

  const isAdmin =
    user?.roles?.includes("ROLE_ADMIN") ||
    user?.roles?.includes("ADMIN");

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2563eb",
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <PremiumButton />
            <MessageInboxButton />
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
        }}
      />
      <Tabs.Screen
        name="rentals"
        options={{
          title: "Rentals",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="disputes"
        options={{
          title: "Litiges",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
        }}
      />

      {isAdmin && (
        <Tabs.Screen
          name="users"
          options={{
            title: "Users",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="people-outline" size={size} color={color} />
            ),
            href: isAdmin ? undefined : null, // 🔥 CACHE LA TAB SI PAS ADMIN
          }}
        />
      )}

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

function NotificationBell() {
  const router = useRouter();
  const { unreadCount, loadUnreadCount } =
    useContext(NotificationContext);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(unreadCount);

  // 🔄 Recharge le compteur quand on revient sur un écran
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();
    }, [])
  );

  // 🔔 Animation quand une nouvelle notif arrive
  useEffect(() => {
    if (unreadCount > prevCount.current) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }

    prevCount.current = unreadCount;
  }, [unreadCount]);

  return (
    <TouchableOpacity
      style={{ marginRight: 15 }}
      onPress={() => router.push("/notification/notifications")}
    >
      <View>
        <Ionicons name="notifications-outline" size={24} color="#111" />

        {unreadCount > 0 && (
          <Animated.View
            style={{
              transform: [{ scale: scaleAnim }],
              position: "absolute",
              right: -6,
              top: -4,
              backgroundColor: "red",
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 4,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 11,
                fontWeight: "bold",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Text>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PremiumButton() {
  const router = useRouter();

  return (
    <TouchableOpacity
      onPress={() => router.push("/subscription/subscription")}
      style={{
        backgroundColor: "#facc15",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 10,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Ionicons name="star" size={14} color="#111" />
      <Text
        style={{
          marginLeft: 4,
          fontSize: 12,
          fontWeight: "bold",
          color: "#111",
        }}
      >
        Premium
      </Text>
    </TouchableOpacity>
  );
}

export function MessageInboxButton() {

    const router = useRouter();

    return (
        <TouchableOpacity
            style={{ marginRight: 10 }}
            onPress={() => router.push("/messages/chat")}
        >
            <View>
                <Ionicons name="mail-outline" size={24} color="#111" />
            </View>
        </TouchableOpacity>
    );
}