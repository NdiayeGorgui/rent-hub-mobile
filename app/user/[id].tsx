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
                                const auction = await getAuctionAllByItemId (item.id);
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
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                {user.fullName}
            </Text>

            <Text>@{user.username}</Text>

            <Text style={{ marginTop: 10 }}>
                Ville : {user.city}
            </Text>

            <Text>
                {user.averageRating
                    ? `${user.averageRating.toFixed(1)} ⭐ (${user.reviewsCount ?? 0} avis)`
                    : "Aucune note"}
            </Text>

            {user.premium && (
                <Text style={{ color: "#f59e0b" }}>
                    💎 Premium
                </Text>
            )}

            {user.badge && (
                <Text>🏅 Badge : {user.badge}</Text>
            )}

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