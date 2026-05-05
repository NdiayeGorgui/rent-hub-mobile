import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/src/context/AuthContext";
import { View, Text, Pressable, Modal, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { NotificationBell, PremiumButton, MessageInboxButton, FaqButton } from "../../components/TopBarButtons";
import { router } from "expo-router";

function AdminMenu() {
  const [visible, setVisible] = useState(false);

  const menuItems = [
    { label: "FAQ",           icon: "help-circle-outline",  route: "/admin-faq" },
    { label: "Tableau de bord",     icon: "speedometer-outline",  route: "/dashboard" },
    { label: "Déconnexion", icon: "log-out-outline", route: "/deconnexion" }
  ];

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={styles.menuBtn}
      >
        <Ionicons name="menu-outline" size={24} color="#111" />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Menu Admin</Text>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.dropdownItem}
                onPress={() => {
                  setVisible(false);
                  router.push(item.route as any);
                }}
              >
                <Ionicons name={item.icon as any} size={20} color="#2563eb" />
                <Text style={styles.dropdownLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color="#9ca3af" style={{ marginLeft: "auto" }} />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function UserMenu() {
  const [visible, setVisible] = useState(false);

  const menuItems = [
    { label: "Centre d'aides", icon: "alert-circle-outline", route: "/faq" },
    { label: "Locations", icon: "calendar-outline", route: "/rentals" },
    { label: "Enchères", icon: "flame-outline", route: "/auctions" },
    { label: "Litiges", icon: "alert-circle-outline", route: "/disputes" },
    { label: "Déconnexion", icon: "log-out-outline", route: "/deconnexion" }
  ];

  return (
    <>
      <Pressable onPress={() => setVisible(true)} style={styles.menuBtn}>
        <Ionicons name="menu-outline" size={24} color="#111" />
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.dropdown}>
            <Text style={styles.dropdownTitle}>Menu</Text>

            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.route}
                style={styles.dropdownItem}
                onPress={() => {
                  setVisible(false);
                  router.push(item.route as any);
                }}
              >
                <Ionicons name={item.icon as any} size={20} color="#2563eb" />
                <Text style={styles.dropdownLabel}>{item.label}</Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color="#9ca3af"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export default function TabsLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;

  const isAdmin = user?.roles?.includes("ROLE_ADMIN");

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: "#2563eb",
        headerRight: () => (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {!isAdmin && (
              <>
                <PremiumButton />
               
                <MessageInboxButton />
                
              </>
            )}
            <NotificationBell />
              {!isAdmin && <UserMenu />}
            {isAdmin && <AdminMenu />}
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
        name="my-items"
        options={{
          title: "Mes items",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
          href: !isAdmin ? "/my-items" : null,
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
        name="auctions"
        options={{
          title: "Enchères",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame-outline" size={size} color={color} />
          ),
          href: !isAdmin ? "/auctions" : null,
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
      <Tabs.Screen
        name="deconnexion"
        options={{
          title: "Déconnexion",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: "Produits",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/items" : null,
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Utilisateurs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/users" : null,
        }}
      />
      <Tabs.Screen
        name="admin-disputes"
        options={{
          title: "Litiges",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="alert-circle-outline" size={size} color={color} />
          ),
          href: isAdmin ? "/admin-disputes" : null,
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

const styles = StyleSheet.create({
  menuBtn: {
    marginRight: 12,
    padding: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 55,
    paddingRight: 10,
  },
  dropdown: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 8,
    minWidth: 200,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 10,
  },
  dropdownLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111827",
  },
});