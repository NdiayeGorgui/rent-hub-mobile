import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { getUserProfile } from "@/src/api/profileService";

export default function UserProfile() {
    const { id } = useLocalSearchParams();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await getUserProfile(String(id));
            setUser(data);
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
        <ScrollView style={{ padding: 15 }}>
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>
                {user.fullName}
            </Text>

            <Text>@{user.username}</Text>

            <Text style={{ marginTop: 10 }}>
                Ville : {user.city}
            </Text>

            <Text>
                ⭐ Note : {user.averageRating.toFixed(1)} ({user.reviewsCount} avis)
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
              user.publishedItems.map((item: any) => (
    <View key={item.id} style={{ marginBottom: 10 }}>
        <Text>
            {item.title} ({item.pricePerDay ?? "—"} $/jour)
        </Text>

        <Text style={{ fontSize: 12, color: "gray" }}>
            📅 Publié le : {new Date(item.createdAt).toLocaleDateString()}
        </Text>
    </View>
))
            ) : (
                <Text>Aucun article publié</Text>
            )}

            <Text style={{ marginTop: 20, fontWeight: "bold" }}>
                🔁 Historique de location
            </Text>
            {user.rentedItems && user.rentedItems.length > 0 ? (
               user.rentedItems.map((item: any) => (
    <View key={item.id} style={{ marginBottom: 10 }}>
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