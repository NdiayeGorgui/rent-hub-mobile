import { useState, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Switch,
    StyleSheet,
    Alert,
    RefreshControl,
    ActivityIndicator,
    Platform,
    TextInput,
} from "react-native";
import { useFocusEffect } from "expo-router";

import {
    getAllItemsAdmin,
    activateItemAdmin,
    deactivateItemAdmin,
} from "@/src/api/adminItemService";

import { fetchItemDetails } from "@/src/api/itemService";
import { getAuctionByItemId } from "@/src/api/auctionService";
import { Ionicons } from "@expo/vector-icons";

interface Item {
    id: number;
    title: string;
    description: string;
    city: string;
    pricePerDay: number;
    active: boolean;
    type: "RENTAL" | "AUCTION";
    publisher?: {
        userId: string;
        username: string;
    };
    currentPrice?: number | null;
}

export default function AdminItemsScreen() {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState("");

    // =========================
    // LOAD ITEMS
    // =========================

    const filteredItems = items.filter((i) => {
        const s = search.toLowerCase();

        const typeLabel =
            i.type === "AUCTION"
                ? ["auction", "enchere", "enchère"]
                : ["rental", "rent", "location", "louer"];

        return (
            i.title?.toLowerCase().includes(s) ||
            i.publisher?.username?.toLowerCase().includes(s) ||
            typeLabel.some((t) => t.includes(s))
        );
    });


    const loadItems = async () => {
        setLoading(true);

        try {
            const data = await getAllItemsAdmin();

            const itemsWithDetails: Item[] = await Promise.all(
                data.map(async (item: Item) => {
                    const details = await fetchItemDetails(item.id);

                    // AUCTION PRICE
                    if (details.type === "AUCTION") {
                        try {
                            const auction = await getAuctionByItemId(item.id);
                            details.currentPrice = auction?.currentPrice ?? null;
                        } catch {
                            details.currentPrice = null;
                        }
                    }

                    return {
                        ...details,
                        id: item.id,
                    };
                })
            );

            setItems(itemsWithDetails);
        } catch (e) {
            console.log(e);
            Alert.alert("Erreur", "Impossible de charger les items");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadItems();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadItems();
    };

    // =========================
    // ACTIVATE / DEACTIVATE
    // =========================

    const toggleItem = (item: Item, newValue: boolean) => {
        const actionText = newValue
            ? "Activer cet objet ?"
            : "Désactiver cet objet ?";

        if (Platform.OS === "web") {
            if (confirm(`${actionText}\n${item.title}`)) {
                handleToggle(item, newValue);
            }
        } else {
            Alert.alert(actionText, item.title, [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    style: "destructive",
                    onPress: () => handleToggle(item, newValue),
                },
            ]);
        }
    };

    const handleToggle = async (item: Item, newValue: boolean) => {
        try {
            if (newValue) {
                await activateItemAdmin(item.id);
            } else {
                await deactivateItemAdmin(item.id);
            }

            setItems((prev) =>
                prev.map((i) => (i.id === item.id ? { ...i, active: newValue } : i))
            );
        } catch (error) {
            console.log(error);
            alert("Erreur lors de la mise à jour");
        }
    };

    // =========================
    // LOADING
    // =========================

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#2563eb" />
            </View>
        );
    }

    // =========================
    // RENDER
    // =========================

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Gestion des objets</Text>
            <TextInput
                placeholder="Rechercher utilisateur..."
                value={search}
                onChangeText={setSearch}
                style={styles.search}
            />

            <FlatList
                data={filteredItems}
                keyExtractor={(item) => item.id.toString()}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (

                    <View style={styles.card}>
                        <View style={{ flex: 1 }}>

                            <Text style={styles.titleItem}>
                                #{item.id} - {item.title}
                            </Text>

                            <View style={styles.infoRow}>
                                <Ionicons name="person-outline" size={14} color="#374151" />
                                <Text style={styles.owner}>
                                    @{item.publisher?.username ?? "..."}
                                </Text>
                            </View>

                            <View style={styles.infoRow}>
                                <Ionicons name="location-outline" size={14} color="#6b7280" />
                                <Text style={styles.city}>{item.city}</Text>
                            </View>
                            {item.type === "AUCTION" ? (
                                <Text style={styles.price}>
                                    🔥 Enchère :{" "}
                                    {item.currentPrice != null
                                        ? `${item.currentPrice} $`
                                        : "Enchère pas disponible"}
                                </Text>
                            ) : (
                                <Text style={styles.price}>{item.pricePerDay} $/j</Text>
                            )}

                            <Text
                                style={[
                                    styles.status,
                                    { backgroundColor: item.active ? "#16a34a" : "#dc2626" },
                                ]}
                            >
                                {item.active ? "Actif" : "Désactivé"}
                            </Text>
                        </View>

                        <Switch
                            value={Boolean(item.active)}
                            onValueChange={(newValue) => toggleItem(item, newValue)}
                            trackColor={{ false: "#e5e7eb", true: "#93c5fd" }}
                            thumbColor={item.active ? "#2563eb" : "#9ca3af"}
                        />
                    </View>
                )}
            />
        </View>
    );
}

// =========================
// STYLES
// =========================

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#f1f5f9" },
    title: { fontSize: 22, fontWeight: "bold", marginBottom: 16 },
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

    titleItem: { fontSize: 16, fontWeight: "bold" },

    owner: {
        fontSize: 13,
        color: "#374151",
        marginTop: 2,
    },

    city: { fontSize: 13, color: "#6b7280" },

    price: {
        marginTop: 4,
        fontWeight: "600",
    },

    status: {
        marginTop: 6,
        alignSelf: "flex-start",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        color: "white",
        fontSize: 11,
        fontWeight: "bold",
    },

    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 2,
    },

});