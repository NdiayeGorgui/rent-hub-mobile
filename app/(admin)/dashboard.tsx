import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { getAdminStats } from "@/src/api/adminService";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { formatPrice } from "@/src/utils/formatPrice";

function StatCard({ title, value, icon, color }: {
    title: string; value: any; icon: string; color: string;
}) {
    return (
        <View style={[styles.statCard]}>
            <View style={[styles.statIcon, { backgroundColor: color + "20" }]}>
                <Ionicons name={icon as any} size={18} color={color} />
            </View>
            <Text style={styles.statValue}>{value ?? "0"}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <View style={styles.grid}>{children}</View>
        </View>
    );
}

export default function AdminDashboard() {
    const insets = useSafeAreaInsets();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadStats(); }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getAdminStats();
            setStats(data);
        } catch (err) {
            console.log("Dashboard error:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#7c3aed" />
            <Text style={{ marginTop: 10, color: "#6b7280" }}>Chargement...</Text>
        </View>
    );

    if (!stats) return (
        <View style={styles.center}>
            <Text style={{ color: "#ef4444" }}>Impossible de charger les statistiques</Text>
        </View>
    );

    // ← Destructure avec valeurs par défaut pour éviter les crashes
    const {
        totalUsers = 0,
        activeUsers = 0,
        inactiveUsers = 0,
        newUsersLast30Days=0,
        itemStats = { totalItems: 0, publishedItems: 0,inactiveItems: 0,newItems: 0 },
        rentalStats = { totalRentals: 0, activeRentals: 0, pendingRentals: 0, completedRentals: 0 },
        reviewStats = { totalReviews: 0, averageRating: 0 },
        auctionStats = {
            totalAuctions: 0, openAuctions: 0, closedAuctions: 0,
            cancelledAuctions: 0, reserveNotMetAuctions: 0,
            auctionsWithWinner: 0, auctionsWithoutBid: 0, avgWinningPrice: 0,
        },
        subscriptionStats = {
            totalSubscriptions: 0, activeSubscriptions: 0,
            expiredSubscriptions: 0, autoRenewEnabled: 0,
        },
        paymentStats = {
            totalPayments: 0, successPayments: 0, refundPayments: 0,
            pendingPayments: 0, failedPayments: 0, totalAmount: 0,
        },
        disputeStats = {
            totalDisputes: 0, openDisputes: 0,
            resolvedDisputes: 0, rejectedDisputes: 0,
        },
    } = stats;

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        >
            <View style={styles.header}>
                <Text style={styles.headerTitle}>📊 Tableau de bord</Text>
                <Text style={styles.headerSub}>Vue d'ensemble de la plateforme</Text>
            </View>

            <Section title="👥 Utilisateurs">
                <StatCard title="Total" value={totalUsers} icon="people-outline" color="#2563eb" />
                <StatCard title="Actifs" value={activeUsers} icon="person-circle-outline" color="#16a34a" />
                <StatCard title="Inactifs" value={inactiveUsers} icon="person-remove-outline" color="#ef4444" />
                <StatCard title="Nouveaux" value={newUsersLast30Days} icon="person-add-outline" color="#7c3aed" />
            </Section>

            <Section title="💎 Abonnements">
                <StatCard title="Total" value={subscriptionStats.totalSubscriptions} icon="diamond-outline" color="#7c3aed" />
                <StatCard title="Actifs" value={subscriptionStats.activeSubscriptions} icon="checkmark-circle-outline" color="#22c55e" />
                <StatCard title="Expirés" value={subscriptionStats.expiredSubscriptions} icon="time-outline" color="#ef4444" />
                <StatCard title="Auto renew" value={subscriptionStats.autoRenewEnabled} icon="refresh-outline" color="#2563eb" />
            </Section>

            <Section title="📦 Items">
                <StatCard title="Total" value={itemStats.totalItems} icon="cube-outline" color="#7c3aed" />
                <StatCard title="Actifs" value={itemStats.publishedItems} icon="checkmark-circle-outline" color="#22c55e" />
                <StatCard title="Inactifs" value={itemStats.inactiveItems} icon="ban-outline" color="#ef4444" />
                <StatCard title="Nouveaux" value={itemStats.newItems} icon="sparkles-outline" color="#22c55e" />
            </Section>

            <Section title="🔁 Locations">
                <StatCard title="Total" value={rentalStats.totalRentals} icon="repeat-outline" color="#f59e0b" />
                <StatCard title="Actives" value={rentalStats.activeRentals} icon="time-outline" color="#ef4444" />
                <StatCard title="En attentes" value={rentalStats.pendingRentals} icon="hourglass-outline" color="#f59e0b" />
                <StatCard title="Terminées" value={rentalStats.completedRentals} icon="checkmark-done-outline" color="#22c55e" />
            </Section>

            <Section title="🔨 Enchères">
                <StatCard title="Total" value={auctionStats.totalAuctions} icon="hammer-outline" color="#7c3aed" />
                <StatCard title="Ouvertes" value={auctionStats.openAuctions} icon="radio-button-on-outline" color="#22c55e" />
                <StatCard title="Fermées" value={auctionStats.closedAuctions} icon="lock-closed-outline" color="#ef4444" />
                <StatCard title="Annulées" value={auctionStats.cancelledAuctions} icon="close-circle-outline" color="#dc2626" />
                <StatCard title="Réserve non atteinte" value={auctionStats.reserveNotMetAuctions} icon="alert-circle-outline" color="#f59e0b" />
                <StatCard title="Avec gagnant" value={auctionStats.auctionsWithWinner} icon="trophy-outline" color="#10b981" />
                <StatCard title="Sans offre" value={auctionStats.auctionsWithoutBid} icon="ban-outline" color="#6b7280" />
                <StatCard title="Prix moyen" value={`${formatPrice((auctionStats.avgWinningPrice ?? 0).toFixed(2))} `} icon="cash-outline" color="#10b981" />
            </Section>

            <Section title="💳 Paiements">
                <StatCard title="Total" value={paymentStats.totalPayments} icon="card-outline" color="#2563eb" />
                <StatCard title="Réussis" value={paymentStats.successPayments} icon="checkmark-done-outline" color="#16a34a" />
                <StatCard title="En attente" value={paymentStats.pendingPayments} icon="time-outline" color="#f59e0b" />
                <StatCard title="Échoués" value={paymentStats.failedPayments} icon="close-circle-outline" color="#ef4444" />
            </Section>

            <Section title="💰 Revenus & Avis">
                <StatCard title="Revenus bruts" value={`${formatPrice((paymentStats.totalAmount ?? 0).toFixed(2))} `} icon="cash-outline" color="#10b981" />
                <StatCard title="Remboursements" value={`${formatPrice((paymentStats.refundPayments ?? 0).toFixed(2))} `} icon="wallet-outline" color="#10b981" />
                <StatCard title="Note moyenne" value={(reviewStats.averageRating ?? 0).toFixed(1)} icon="star-outline" color="#facc15" />
                <StatCard title="Note moyenne" value={(reviewStats.totalReviews ?? 0)} icon="chatbubble-ellipses-outline" color="#facc15" />
            </Section>

            <Section title="⚖️ Litiges">
                <StatCard title="Total" value={disputeStats.totalDisputes} icon="alert-circle-outline" color="#f59e0b" />
                <StatCard title="Ouverts" value={disputeStats.openDisputes} icon="time-outline" color="#eab308" />
                <StatCard title="Résolus" value={disputeStats.resolvedDisputes} icon="checkmark-circle-outline" color="#22c55e" />
                <StatCard title="Rejetés" value={disputeStats.rejectedDisputes} icon="close-circle-outline" color="#ef4444" />
            </Section>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f4f6f9" },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f4f6f9" },
    header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    headerTitle: { fontSize: 26, fontWeight: "800", color: "#111827" },
    headerSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },
    section: { paddingHorizontal: 16, marginBottom: 20 },
    sectionTitle: {
        fontSize: 12, fontWeight: "700", color: "#6b7280",
        textTransform: "uppercase", letterSpacing: 0.8,
        marginBottom: 10, marginTop: 10,
    },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    statCard: {
        backgroundColor: "#fff",
        borderRadius: 16,
        padding: 14,
        width: "47%",
        alignItems: "flex-start",
    },
    statIcon: {
        width: 36, height: 36, borderRadius: 10,
        justifyContent: "center", alignItems: "center",
        marginBottom: 10,
    },
    statValue: { fontSize: 22, fontWeight: "800", color: "#111827", marginBottom: 2 },
    statTitle: { fontSize: 12, color: "#9ca3af" },
});