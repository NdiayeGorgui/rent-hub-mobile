import {
    View, Text, FlatList, ActivityIndicator,
    TouchableOpacity, TextInput, Alert, StyleSheet, KeyboardAvoidingView,
    Platform
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { Link, router } from "expo-router";
import {
    getMyLaunchedAuctions,
    getMyParticipatingAuctions,
    placeBid,
} from "@/src/api/auctionService";
import { fetchItemDetails } from "@/src/api/itemService";
import { fetchUserProfile } from "@/src/api/authService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AuctionsScreen() {
    const [mode, setMode] = useState<"launched" | "participating">("launched");
    const [auctions, setAuctions] = useState<any[]>([]);
    const [itemsMap, setItemsMap] = useState<Record<number, any>>({});
    const [ownersMap, setOwnersMap] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);
    const [bidAmounts, setBidAmounts] = useState<Record<number, string>>({});
    const [bidLoadingId, setBidLoadingId] = useState<number | null>(null);
    const [now, setNow] = useState(new Date());

    // ── Countdown live ────────────────────────────────────
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const getTimeLeft = (endDate: string) => {
        const diff = new Date(endDate).getTime() - now.getTime();
        if (diff <= 0) return "Terminée";
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff / 3600000) % 24);
        const m = Math.floor((diff / 60000) % 60);
        const s = Math.floor((diff / 1000) % 60);
        if (d > 0) return `${d}j ${h}h ${m}m`;
        if (h > 0) return `${h}h ${m}m ${s}s`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "OPEN": return { label: "En cours", color: "#16a34a", bg: "#f0fdf4" };
            case "CLOSED": return { label: "Terminée", color: "#6b7280", bg: "#f3f4f6" };
            case "CANCELLED_AUCTION": return { label: "Annulée", color: "#dc2626", bg: "#fef2f2" };
            case "CANCELLED": return { label: "Annulée", color: "#dc2626", bg: "#fef2f2" };
            case "RESERVE_NOT_MET": return { label: "Réserve non atteinte", color: "#ea580c", bg: "#fff7ed" };
            default: return { label: status, color: "#6b7280", bg: "#f3f4f6" };
        }
    };

    // ── Load data ─────────────────────────────────────────
    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = mode === "launched"
                ? await getMyLaunchedAuctions()
                : await getMyParticipatingAuctions();

            setAuctions(data);

            const uniqueItemIds = [...new Set(data.map((a: any) => a.itemId))];
            const itemsResults = await Promise.all(
                uniqueItemIds.map(async (itemId: any) => {
                    try { return [itemId, await fetchItemDetails(itemId)]; }
                    catch { return [itemId, null]; }
                })
            );
            setItemsMap(Object.fromEntries(itemsResults));

            // Charger owners (participating) ou winners (launched)
            const userIds = mode === "participating"
                ? [...new Set(data.map((a: any) => a.ownerId?.toString()).filter(Boolean))]
                : [...new Set(data.filter((a: any) => a.winnerId).map((a: any) => a.winnerId?.toString()))];

            const usersResults = await Promise.all(
                userIds.map(async (uid: any) => {
                    try { return [uid, await fetchUserProfile(uid)]; }
                    catch { return [uid, null]; }
                })
            );
            setOwnersMap(Object.fromEntries(usersResults));

        } catch (e) {
            console.log("Error loading auctions", e);
        } finally {
            setLoading(false);
        }
    }, [mode]);

    useEffect(() => { loadData(); }, [loadData]);

    // ── Bid ───────────────────────────────────────────────
    const handleBid = async (auctionId: number, currentPrice: number) => {
        const amount = Number(bidAmounts[auctionId]);
        if (!amount || amount <= currentPrice) {
            Alert.alert("Erreur", `L'offre doit être supérieure à ${currentPrice} $`);
            return;
        }
        Alert.alert(
            "Confirmer l'enchère",
            `Placer une offre de ${amount} $ ?`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    onPress: async () => {
                        setBidLoadingId(auctionId);
                        try {
                            await placeBid(auctionId, amount);
                            setBidAmounts(prev => ({ ...prev, [auctionId]: "" }));
                            await loadData();
                            Alert.alert("Succès", "Enchère placée !");
                        } catch (e: any) {
                            Alert.alert("Erreur", e?.message || "Erreur lors de l'enchère");
                        } finally {
                            setBidLoadingId(null);
                        }
                    }
                }
            ]
        );
    };

    // ── Render card ───────────────────────────────────────
    const renderAuction = ({ item: auction }: any) => {
        const item = itemsMap[auction.itemId];
        const owner = ownersMap[auction.ownerId?.toString()];
        const winner = ownersMap[auction.winnerId?.toString()];
        const { label, color, bg } = getStatusConfig(auction.status);
        const isOpen = auction.status === "OPEN";
        const isEnded = ["CLOSED", "RESERVE_NOT_MET"].includes(auction.status);
        const timeLeft = auction.endDate ? getTimeLeft(auction.endDate) : "—";

        return (
            <View style={styles.card}>

                {/* Header */}
                <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                            {item?.title ?? "Chargement..."}
                        </Text>
                        <Text style={styles.cardSubtitle}>Enchère #{auction.id}</Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                        {isOpen && (
                            <View style={[styles.badge, { backgroundColor: "#fef2f2" }]}>
                                <Text style={{ fontSize: 11, fontWeight: "700", color: "#dc2626" }}>
                                    ⏳ {timeLeft}
                                </Text>
                            </View>
                        )}
                        <View style={[styles.badge, { backgroundColor: bg }]}>
                            <Text style={{ fontSize: 11, fontWeight: "700", color }}>{label}</Text>
                        </View>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Prix actuel</Text>
                        <Text style={styles.statValue}>
                            {auction.currentPrice ?? auction.startPrice} $
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Prix départ</Text>
                        <Text style={[styles.statValue, { color: "#6b7280" }]}>
                            {auction.startPrice} $
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Enchérisseurs</Text>
                        <Text style={styles.statValue}>
                            👥 {auction.participantsCount ?? 0}
                            {(auction.participantsCount ?? 0) >= 5 ? " 🔥" : ""}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Intérêt</Text>
                        <Text style={[styles.statValue, { color: "#6b7280", fontSize: 12 }]}>
                            👀 {auction.views ?? 0} · ⭐ {auction.watchers ?? 0}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Réserve</Text>
                        <Text style={[styles.statValue, {
                            color: auction.reserveReached ? "#16a34a" : "#ea580c", fontSize: 12
                        }]}>
                            {auction.reserveReached ? "✅ Atteinte" : "⛔ Non atteinte"}
                        </Text>
                    </View>

                    {/* Propriétaire (participating) */}
                    {mode === "participating" && owner && (
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Propriétaire</Text>
                            <TouchableOpacity onPress={() => router.push(`/user/${auction.ownerId}` as any)}>
                                <Text style={[styles.statValue, { color: "#2563eb" }]}>
                                    @{owner.username}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Gagnant (launched, terminée) */}
                    {mode === "launched" && auction.winnerId && isEnded && winner && (
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Gagnant</Text>
                            <Link
                                href={{
                                    pathname: "/user/[id]",
                                    params: { id: winner.userId }, // ⚠️ ou winner.id selon ton backend
                                }}
                            >
                                <Text style={[styles.statValue, { color: "#16a34a" }]}>
                                    🏆 @{winner.username}
                                </Text>
                            </Link>
                        </View>
                    )}
                </View>

                {/* Actions */}
                <View style={styles.cardFooter}>

                    {/* Ligne 1 — boutons principaux */}
                    <View style={{ flexDirection: "row", gap: 8, width: "100%" }}>

                        {/* Voir l'item */}
                        <TouchableOpacity
                            style={styles.btnSecondary}
                            onPress={() => router.push(`/item/${auction.itemId}` as any)}
                        >
                            <Text style={styles.btnSecondaryText}>🔍 Voir l'item</Text>
                        </TouchableOpacity>

                        {/* Contacter propriétaire (participating) */}
                        {mode === "participating" && (
                            <TouchableOpacity
                                style={styles.btnGreen}
                                onPress={() => router.push({
                                    pathname: "/messages/chat",
                                    params: {
                                        receiverId: auction.ownerId,
                                        itemId: auction.itemId,
                                        receiverUsername: owner?.username ?? "",
                                    }
                                } as any)}
                            >
                                <Text style={styles.btnGreenText}>✉️ Contacter</Text>
                            </TouchableOpacity>
                        )}

                        {/* Contacter gagnant (launched, terminée) */}
                        {mode === "launched" && auction.winnerId && isEnded && (
                            <TouchableOpacity
                                style={styles.btnGreen}
                                onPress={() => router.push({
                                    pathname: "/messages/chat",
                                    params: {
                                        receiverId: auction.winnerId,
                                        itemId: auction.itemId,
                                        receiverUsername: winner?.username ?? "",
                                    }
                                } as any)}
                            >
                                <Text style={styles.btnGreenText}>✉️ Contacter gagnant</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Ligne 2 — enchère (séparée, pleine largeur) */}
                    {mode === "participating" && isOpen && (
                        <View style={{
                            width: "100%",
                            marginTop: 4,
                            paddingTop: 10,
                            borderTopWidth: 1,
                            borderTopColor: "#e5e7eb",
                        }}>
                            <Text style={{
                                fontSize: 11, color: "#6b7280", fontWeight: "600",
                                marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5,
                            }}>
                                Placer une offre
                            </Text>
                            <View style={{ flexDirection: "row", gap: 8 }}>
                                <TextInput
                                    value={bidAmounts[auction.id] ?? ""}
                                    onChangeText={val => setBidAmounts(prev => ({ ...prev, [auction.id]: val }))}
                                    placeholder={`Supérieur à ${auction.currentPrice ?? auction.startPrice} $`}
                                    keyboardType="numeric"
                                    style={[styles.bidInput, { flex: 1 }]}
                                />
                                <TouchableOpacity
                                    style={[
                                        styles.btnPrimary,
                                        (!bidAmounts[auction.id] ||
                                            Number(bidAmounts[auction.id]) <= (auction.currentPrice ?? auction.startPrice)) &&
                                        styles.btnDisabled
                                    ]}
                                    onPress={() => handleBid(auction.id, auction.currentPrice ?? auction.startPrice)}
                                    disabled={
                                        bidLoadingId === auction.id ||
                                        !bidAmounts[auction.id] ||
                                        Number(bidAmounts[auction.id]) <= (auction.currentPrice ?? auction.startPrice)
                                    }
                                >
                                    {bidLoadingId === auction.id
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={styles.btnPrimaryText}>💰 Enchérir</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View style={{ flex: 1 }}>

                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Enchères</Text>
                        <Text style={styles.headerSub}>Gérez vos enchères en cours et passées</Text>
                    </View>

                    {/* Toggle */}
                    <View style={styles.toggle}>
                        {[
                            { key: "launched", label: "🔥 Mes enchères" },
                            { key: "participating", label: "💰 J'enchéris sur" },
                        ].map(({ key, label }) => (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setMode(key as any)}
                                style={[styles.toggleBtn, mode === key && styles.toggleBtnActive]}
                            >
                                <Text style={[styles.toggleBtnText, mode === key && styles.toggleBtnTextActive]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Content */}
                    {loading ? (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#2563eb" />
                        </View>
                    ) : auctions.length === 0 ? (
                        <View style={styles.empty}>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>📭</Text>
                            <Text style={styles.emptyTitle}>Aucune enchère trouvée</Text>
                            <Text style={styles.emptySubtitle}>
                                {mode === "launched"
                                    ? "Vous n'avez pas encore lancé d'enchère"
                                    : "Vous ne participez à aucune enchère"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={auctions}
                            keyExtractor={(item) => item.id.toString()}
                            renderItem={renderAuction}
                            contentContainerStyle={{ padding: 15, paddingBottom: 40 }}
                            keyboardShouldPersistTaps="handled" // ← important
                        />
                    )}

                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f6f9" },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 28, fontWeight: "800", color: "#111827" },
    headerSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

    toggle: {
        flexDirection: "row", gap: 10,
        paddingHorizontal: 20, paddingBottom: 15,
    },
    toggleBtn: {
        flex: 1, paddingVertical: 10, paddingHorizontal: 12,
        borderRadius: 12, backgroundColor: "#fff",
        borderWidth: 1, borderColor: "#e5e7eb",
        alignItems: "center",
    },
    toggleBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
    toggleBtnText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
    toggleBtnTextActive: { color: "#fff" },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },
    empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 40 },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6b7280", marginBottom: 4 },
    emptySubtitle: { fontSize: 13, color: "#9ca3af", textAlign: "center" },

    card: {
        backgroundColor: "#fff",
        borderRadius: 16, marginBottom: 14,
        overflow: "hidden",
        elevation: 2,
    },
    cardHeader: {
        flexDirection: "row", alignItems: "flex-start",
        padding: 16, borderBottomWidth: 1, borderBottomColor: "#f3f4f6",
        gap: 10,
    },
    cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
    cardSubtitle: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
    badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },

    statsGrid: {
        flexDirection: "row", flexWrap: "wrap",
        padding: 12, gap: 4,
    },
    statItem: { width: "48%", padding: 8 },
    statLabel: {
        fontSize: 10, fontWeight: "600", color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2,
    },
    statValue: { fontSize: 13, fontWeight: "700", color: "#2563eb" },

    cardFooter: {
        flexDirection: "row", flexWrap: "wrap",
        padding: 12, backgroundColor: "#f9fafb",
        borderTopWidth: 1, borderTopColor: "#f3f4f6",
        gap: 8, alignItems: "center",
    },

    btnSecondary: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10, borderWidth: 1, borderColor: "#e5e7eb",
        backgroundColor: "#fff",
    },
    btnSecondaryText: { fontSize: 12, fontWeight: "600", color: "#374151" },

    btnPrimary: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10, backgroundColor: "#2563eb",
        justifyContent: "center", alignItems: "center",
    },
    btnDisabled: { backgroundColor: "#9ca3af" },
    btnPrimaryText: { fontSize: 12, fontWeight: "700", color: "#fff" },

    btnGreen: {
        paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 10, backgroundColor: "#10b981",
    },
    btnGreenText: { fontSize: 12, fontWeight: "700", color: "#fff" },

    bidInput: {
        flex: 1, backgroundColor: "#fff", borderWidth: 1,
        borderColor: "#e5e7eb", borderRadius: 10,
        paddingHorizontal: 10, paddingVertical: 8,
        fontSize: 13,
    },
});