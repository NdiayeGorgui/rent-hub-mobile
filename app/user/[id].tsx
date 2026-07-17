import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/src/api/profileService";
import { getAuctionAllByItemId, getAuctionPublicByItemId } from "@/src/api/auctionService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function UserProfile() {
    const { id } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const insets = useSafeAreaInsets();


    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getUserProfile(String(id));
            // ← supprime setUser(data) ici

            if (data.publishedItems?.length) {
                const enriched = await Promise.all(
                    data.publishedItems.map(async (item: any) => {
                        if (item.type === "AUCTION") {
                            try {
                                const auction = await getAuctionAllByItemId(item.id);
                                return { ...item, currentPrice: auction?.currentPrice ?? null };
                            } catch {
                                return { ...item, currentPrice: null };
                            }
                        }
                        return item;
                    })
                );
                setUser({ ...data, publishedItems: enriched });
            } else {
                setUser(data);
            }
        } catch (err) {
            console.log("Error loading profile", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <ActivityIndicator size="large" />;
    }

    if (!user) {
        return <Text>Utilisateur introuvable</Text>;
    }

    return (
        <ScrollView
            contentContainerStyle={{
                paddingBottom: insets.bottom + 80,
                paddingHorizontal: 16,
            }}
        >
            <View
                style={{
                    backgroundColor: "#fff",
                    borderRadius: 18,
                    padding: 18,
                    marginBottom: 20,
                    shadowColor: "#000",
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 3,
                }}
            >
                {/* Avatar + nom */}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 15,
                    }}
                >
                    <View
                        style={{
                            width: 58,
                            height: 58,
                            borderRadius: 29,
                            backgroundColor: "#2563eb",
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 14,
                        }}
                    >
                        <Text
                            style={{
                                color: "#fff",
                                fontSize: 24,
                                fontWeight: "bold",
                            }}
                        >
                            {user.fullName?.charAt(0).toUpperCase()}
                        </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                        <Text
                            style={{
                                fontSize: 22,
                                fontWeight: "700",
                                color: "#111827",
                            }}
                        >
                            {user.fullName}
                        </Text>

                        <Text
                            style={{
                                color: "#6b7280",
                                marginTop: 2,
                            }}
                        >
                            @{user.username}
                        </Text>
                    </View>
                </View>

                {/* Ville */}
                <Text
                    style={{
                        color: "#6b7280",
                        marginBottom: 12,
                    }}
                >
                    📍 {user.city}
                </Text>

                {/* Notes */}
                <View
                    style={{
                        backgroundColor: "#f9fafb",
                        borderRadius: 12,
                        padding: 12,
                    }}
                >
                    <Text
                        style={{
                            fontWeight: "600",
                            color: "#111827",
                            marginBottom: 8,
                        }}
                    >
                        ⭐ Réputation
                    </Text>

                    <Text
                        style={{
                            color: "#374151",
                            marginBottom: 4,
                        }}
                    >
                        ⭐ {Number(user.ownerRating ?? 0).toFixed(1)}
                        {" "}
                        comme propriétaire
                        {" "}
                        ({user.ownerReviewsCount ?? 0} avis)
                    </Text>

                    <Text
                        style={{
                            color: "#374151",
                        }}
                    >
                        ⭐ {Number(user.averageRating ?? 0).toFixed(1)}
                        {" "}
                        comme locataire
                        {" "}
                        ({user.reviewsCount ?? 0} avis)
                    </Text>
                </View>

                {/* Badges */}
                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        marginTop: 15,
                    }}
                >
                    {user.premium && (
                        <View
                            style={{
                                backgroundColor: "#FEF3C7",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                                marginRight: 8,
                                marginBottom: 8,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#92400E",
                                    fontWeight: "600",
                                }}
                            >
                                💎 Premium
                            </Text>
                        </View>
                    )}

                    {user.badge && (
                        <View
                            style={{
                                backgroundColor: "#EEF2FF",
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                            }}
                        >
                            <Text
                                style={{
                                    color: "#4338CA",
                                    fontWeight: "600",
                                }}
                            >
                                🏅 {user.badge}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            <Text style={{ marginTop: 20, fontWeight: "bold" }}>
                📦 Articles publiés
            </Text>
            {user.publishedItems && user.publishedItems.length > 0 ? (
                user.publishedItems.map((item: any, index: number) => (
                    <View key={`${item.id}-${index}`} style={{
                        marginBottom: 12, padding: 10,
                        backgroundColor: "#fff", borderRadius: 8
                    }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={{ fontWeight: "600", flex: 1 }}>{item.title}</Text>
                            <Text style={{ color: "#2563eb", fontWeight: "600" }}>
                                {item.type === "AUCTION"
                                    ? `🔥 ${item.currentPrice ?? "—"} $`
                                    : item.pricePerDay ? `${item.pricePerDay} $/j` : ""}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: "gray", marginTop: 3 }}>
                            {item.type === "AUCTION"
                                ? "🔥 Enchère"
                                : `📅 Publié le ${new Date(item.createdAt).toLocaleDateString()}`}
                        </Text>
                    </View>
                ))
            ) : (
                <Text style={{ color: "gray" }}>Aucun article publié</Text>
            )}
            <Text style={{ marginTop: 20, fontWeight: "bold" }}>
                🔁 Historique de location
            </Text>
            {user.rentedItems && user.rentedItems.length > 0 ? (
                user.rentedItems.map((item: any, index: number) => (
                    <View key={`${item.id}-${index}`} style={{ marginBottom: 10 }}>
                        <Text>
                            {item.title} ({item.pricePerDay ?? "—"} $/jour)
                        </Text>

                        <Text style={{ fontSize: 12, color: "gray" }}>
                            📅 Du {new Date(item.startDate).toLocaleDateString()}
                            {" "}au{" "}
                            {new Date(item.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                ))
            ) : (
                <Text>Aucun article loué</Text>
            )}
        </ScrollView>
    );
}