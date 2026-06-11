import { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createAuctionPayment } from "@/src/api/paymentService.web";
import { handleMobilePayment } from "@/src/api/stripeMobile";


export default function AuctionFeeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    const itemId = Number(params.itemId);
    const startPrice = Number(params.startPrice);
    const reservePrice = Number(params.reservePrice) || startPrice;
    const auctionEndDate = params.auctionEndDate as string ?? "";

    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"confirm" | "paying">("confirm");

    const formatDate = (iso: string) => {
        if (!iso) return "—";
        return new Date(iso).toLocaleDateString("fr-CA", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    };

    const handlePay = async () => {
        try {
            setLoading(true);
            setStep("paying");

            // 1. Crée le paiement Stripe
            const { clientSecret } = await createAuctionPayment(itemId);

            // 2. Confirme le paiement Stripe
            await handleMobilePayment(clientSecret);

            Alert.alert(
                "✅ Paiement réussi !",
                "Votre enchère est en cours d'activation. Elle sera visible dans quelques instants.",
                [{ text: "OK", onPress: () => router.push("/my-items") }]
            );

        } catch (err: any) {
            Alert.alert(
                "Erreur",
                err?.response?.data?.message ?? err?.message ?? "Erreur lors du paiement"
            );
            setStep("confirm");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Text style={{ fontSize: 32 }}>🔥</Text>
                </View>
                <Text style={styles.headerTitle}>Activer votre enchère</Text>
                <Text style={styles.headerSub}>
                    Un frais unique de 10$ est requis pour publier votre enchère sur la plateforme
                </Text>
            </View>

            {/* Récap */}
            <View style={styles.recap}>
                <Text style={styles.recapTitle}>Récapitulatif</Text>

                <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Item</Text>
                    <Text style={styles.recapValue}>#{itemId}</Text>
                </View>

                <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Prix de départ</Text>
                    <Text style={[styles.recapValue, { color: "#2563eb" }]}>{startPrice} $</Text>
                </View>

                {reservePrice !== startPrice && (
                    <View style={styles.recapRow}>
                        <Text style={styles.recapLabel}>Prix de réserve</Text>
                        <Text style={styles.recapValue}>{reservePrice} $</Text>
                    </View>
                )}

                <View style={styles.recapRow}>
                    <Text style={styles.recapLabel}>Date de fin</Text>
                    <Text style={styles.recapValue}>{formatDate(auctionEndDate)}</Text>
                </View>

                <View style={styles.separator} />

                <View style={styles.recapRow}>
                    <Text style={[styles.recapLabel, { fontWeight: "700", color: "#111827" }]}>
                        Frais de publication
                    </Text>
                    <Text style={styles.totalAmount}>10 $</Text>
                </View>
            </View>

            {/* Info */}
            <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                    🔒 Paiement sécurisé via Stripe
                </Text>
                <Text style={styles.infoSub}>
                    L'enchère sera visible par les utilisateurs dès activation
                </Text>
            </View>

            {/* Bouton payer */}
            <TouchableOpacity
                style={[styles.payBtn, loading && styles.payBtnDisabled]}
                onPress={handlePay}
                disabled={loading}
            >
                {loading ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        <ActivityIndicator color="#fff" size="small" />
                        <Text style={styles.payBtnText}>
                            {step === "paying" ? "Paiement en cours..." : "Traitement..."}
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.payBtnText}>💳 Payer 10$ et publier l'enchère</Text>
                )}
            </TouchableOpacity>

            {/* Retour */}
            <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
                style={styles.backBtn}
            >
                <Text style={styles.backBtnText}>← Retour</Text>
            </TouchableOpacity>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f6f9" },
    header: { alignItems: "center", paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
    iconContainer: {
        width: 72, height: 72, borderRadius: 20,
        backgroundColor: "#fff7ed", justifyContent: "center",
        alignItems: "center", marginBottom: 16,
    },
    headerTitle: { fontSize: 22, fontWeight: "800", color: "#111827", textAlign: "center", marginBottom: 8 },
    headerSub: { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 20 },
    recap: {
        backgroundColor: "#fff", marginHorizontal: 20,
        borderRadius: 20, padding: 20, marginBottom: 16,
    },
    recapTitle: {
        fontSize: 11, fontWeight: "700", color: "#9ca3af",
        textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 16,
    },
    recapRow: {
        flexDirection: "row", justifyContent: "space-between",
        alignItems: "center", marginBottom: 12,
    },
    recapLabel: { fontSize: 13, color: "#6b7280" },
    recapValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
    separator: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 12 },
    totalAmount: { fontSize: 20, fontWeight: "800", color: "#111827" },
    infoBox: {
        backgroundColor: "#f0fdf4", borderRadius: 14,
        padding: 14, marginHorizontal: 20, marginBottom: 24,
        alignItems: "center",
    },
    infoText: { fontSize: 13, color: "#15803d", fontWeight: "600", marginBottom: 4 },
    infoSub: { fontSize: 11, color: "#6b7280", textAlign: "center" },
    payBtn: {
        backgroundColor: "#f97316", marginHorizontal: 20,
        paddingVertical: 18, borderRadius: 18,
        alignItems: "center", marginBottom: 12,
    },
    payBtnDisabled: { opacity: 0.6 },
    payBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
    backBtn: { alignItems: "center", padding: 14, marginHorizontal: 20 },
    backBtnText: { color: "#6b7280", fontSize: 14 },
});
