import { useEffect, useState } from "react";
import { ScrollView, View, Text, ActivityIndicator } from "react-native";
import { getAdminStats } from "@/src/api/adminService";
import StatCard from "@/src/components/admin/StatCard";

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true); // nouveau state

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            setLoading(true);
            const data = await getAdminStats();
            setStats(data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        // affiche le loader tant que les stats ne sont pas chargées
        return (
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "#f3f4f6",
                }}
            >
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={{ marginTop: 10 }}>Chargement des statistiques...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={{
                flex: 1,
                backgroundColor: "#f3f4f6",
                padding: 12,
            }}
        >
            <Text
                style={{
                    fontSize: 26,
                    fontWeight: "bold",
                    marginBottom: 10,
                }}
            >
                Admin Dashboard
            </Text>

            {/* USERS */}
            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon="people-outline"
                    color="#2563eb"
                />
                <StatCard
                    title="Active Users"
                    value={stats.activeUsers}
                    icon="person-circle-outline"
                    color="#16a34a"
                />
            </View>

            {/* ITEMS */}
            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Total Items"
                    value={stats.totalItems}
                    icon="cube-outline"
                    color="#7c3aed"
                />
                <StatCard
                    title="Published Items"
                    value={stats.publishedItems}
                    icon="checkmark-circle-outline"
                    color="#22c55e"
                />
            </View>

            {/* RENTALS */}
            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Total Rentals"
                    value={stats.totalRentals}
                    icon="repeat-outline"
                    color="#f59e0b"
                />
                <StatCard
                    title="Active Rentals"
                    value={stats.activeRentals}
                    icon="time-outline"
                    color="#ef4444"
                />
            </View>
            {/* PAYMENTS */}
            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Total Payments"
                    value={stats.paymentStats.totalPayments}
                    icon="card-outline"
                    color="#2563eb"
                />

                <StatCard
                    title="Successful Payments"
                    value={stats.paymentStats.successPayments}
                    icon="checkmark-done-outline"
                    color="#16a34a"
                />
            </View>

            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Pending Payments"
                    value={stats.paymentStats.pendingPayments}
                    icon="time-outline"
                    color="#f59e0b"
                />

                <StatCard
                    title="Failed Payments"
                    value={stats.paymentStats.failedPayments}
                    icon="close-circle-outline"
                    color="#ef4444"
                />

            </View>
            {/* REVENUE */}
            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Revenue"
                    value={`$${stats.totalRevenue}`}
                    icon="cash-outline"
                    color="#10b981"
                />
                <StatCard
                    title="Average Rating"
                    value={stats.averagePlatformRating.toFixed(2)}
                    icon="star-outline"
                    color="#facc15"
                />
            </View>

            {/* DISPUTES */}
            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Total Disputes"
                    value={stats.disputeStats.totalDisputes}
                    icon="alert-circle-outline"
                    color="#f59e0b"
                />

                <StatCard
                    title="Open Disputes"
                    value={stats.disputeStats.openDisputes}
                    icon="time-outline"
                    color="#eab308"
                />
            </View>

            <View style={{ flexDirection: "row" }}>
                <StatCard
                    title="Resolved Disputes"
                    value={stats.disputeStats.resolvedDisputes}
                    icon="checkmark-circle-outline"
                    color="#22c55e"
                />

                <StatCard
                    title="Rejected Disputes"
                    value={stats.disputeStats.rejectedDisputes}
                    icon="close-circle-outline"
                    color="#ef4444"
                />
            </View>
        </ScrollView>
    );
}