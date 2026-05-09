import { useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    TextInput,
    Alert,
    Platform,
    ScrollView,
    ActivityIndicator
} from "react-native";

import {
    getAllDisputesAdmin,
    resolveDisputeAdmin,
} from "@/src/api/adminDisputeService";

import { fetchItemDetails } from "@/src/api/itemService";
import { getStatusLabel } from "@/src/utils/statusUtils";
import { RefreshControl } from "react-native";


export default function AdminDisputesScreen() {
    const [activeTab, setActiveTab] = useState<"list" | "resolve">("list");
    const [disputes, setDisputes] = useState<any[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [decision, setDecision] = useState<"RESOLVED" | "REJECTED" | null>(null);
    const [adminComment, setAdminComment] = useState("");
    const [itemsMap, setItemsMap] = useState<Record<number, any>>({});
    const [action, setAction] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadDisputes();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDisputes();
        setRefreshing(false);
    };

    const getDecisionLabel = (decision: string) => {
        const map: Record<string, string> = {
            RESOLVED: "Approuvé",
            REJECTED: "Rejeté",
        };

        return map[decision] ?? decision;
    };
    const loadDisputes = async () => {
        try {
            const data = await getAllDisputesAdmin();
            setDisputes(data);

            const uniqueItemIds = [...new Set(data.map((d: any) => d.itemId))] as number[];
            const itemsResults = await Promise.all(
                uniqueItemIds.map(async (itemId: number) => {
                    try { return [itemId, await fetchItemDetails(itemId)]; }
                    catch { return [itemId, null]; }
                })
            );
            setItemsMap(Object.fromEntries(itemsResults));
        } catch {
            showAlert("Erreur", "Impossible de charger les litiges");
        }
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === "web") alert(`${title}\n\n${message}`);
        else Alert.alert(title, message);
    };

    const handleResolve = async () => {
        if (!selectedDispute || !decision) {
            showAlert("Erreur", "Veuillez choisir une décision");
            return;
        }
        if (!adminComment.trim()) {
            showAlert("Erreur", "Veuillez écrire un commentaire");
            return;
        }
        if (decision === "RESOLVED" && !action) {
            showAlert("Erreur", "Veuillez choisir une action");
            return;
        }

        try {
            setSubmitting(true);

            await resolveDisputeAdmin(
                selectedDispute.id,
                decision,
                adminComment,
                action ?? "NONE"
            );

            showAlert("Succès", "Litige traité !");
            setSelectedDispute(null);
            setAdminComment("");
            setDecision(null);
            setAction(null);
            setActiveTab("list");
            loadDisputes();

        } catch {
            showAlert("Erreur", "Impossible de résoudre le litige");
        } finally {
            setSubmitting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            OPEN: "#ff9800", IN_REVIEW: "#2196f3",
            RESOLVED: "#4caf50", REJECTED: "#f44336"
        };
        return (
            <View style={[styles.badge, { backgroundColor: colors[status] ?? "#ccc" }]}>
                <Text style={styles.badgeText}>{getStatusLabel(status)}</Text>
            </View>
        );
    };

    const openDisputes = disputes.filter(
        (d) => d.status === "OPEN" || d.status === "IN_REVIEW"
    );

    // ── Détermine si c'est un litige d'enchère ──
    const isAuctionDispute = selectedDispute != null && selectedDispute.auctionId != null;

    return (
        <View style={styles.container}>

            {/* TABS */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "list" && styles.activeTabButton]}
                    onPress={() => { setActiveTab("list"); setSelectedDispute(null); }}
                >
                    <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>
                        Tous les litiges
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "resolve" && styles.activeTabButton]}
                    onPress={() => { setActiveTab("resolve"); setSelectedDispute(null); }}
                >
                    <Text style={[styles.tabText, activeTab === "resolve" && styles.activeTabText]}>
                        Résoudre
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ================= LIST ================= */}
            {activeTab === "list" && (
                <FlatList
                    data={disputes}
                    keyExtractor={(item) => item.id.toString()}

                    contentContainerStyle={{ flexGrow: 1 }}

                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                        />
                    }

                    ListEmptyComponent={() => (
                        <View style={{ alignItems: "center", marginTop: 80 }}>
                            <Text style={{ fontSize: 50 }}>⚖️</Text>
                            <Text style={styles.emptyText}>Aucun litige</Text>
                        </View>
                    )}

                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View>
                                    <Text style={styles.cardTitle}>
                                        {itemsMap[item.itemId]?.title ?? "Loading..."}
                                    </Text>
                                    <Text style={styles.subText}>
                                        {item.rentalId
                                            ? `📦 Location #${item.rentalId}`
                                            : `🔥 Enchère #${item.auctionId}`}
                                    </Text>
                                </View>
                                {renderStatusBadge(item.status)}
                            </View>

                            <Text style={styles.reason}>{item.reason}</Text>

                            {item.adminDecision && (
                                <Text style={{ marginTop: 6, fontStyle: "italic", color: "#444" }}>
                                    Décision admin : {item.adminDecision}
                                </Text>
                            )}
                        </View>
                    )}
                />
            )}

            {/* ================= RESOLVE ================= */}
            {activeTab === "resolve" && (
                <>
                    {!selectedDispute ? (
                        <>
                            <Text style={styles.sectionTitle}>Sélectionnez un litige à traiter</Text>
                            <FlatList
                                data={openDisputes}
                                keyExtractor={(item) => item.id.toString()}

                                contentContainerStyle={{ flexGrow: 1 }}

                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={onRefresh}
                                    />
                                }

                                ListEmptyComponent={() => (
                                    <View style={{ alignItems: "center", marginTop: 80 }}>
                                        <Text style={{ fontSize: 50 }}>📭</Text>
                                        <Text style={styles.emptyText}>Aucun litige à résoudre</Text>
                                    </View>
                                )}

                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.card,
                                            selectedDispute?.id === item.id && styles.selectedCard
                                        ]}
                                        onPress={() => {
                                            setSelectedDispute(item);
                                            setDecision(null);
                                            setAction(null);
                                            setAdminComment("");
                                        }}
                                    >
                                        <Text style={styles.cardTitle}>
                                            {itemsMap[item.itemId]?.title ?? "Loading..."}
                                        </Text>

                                        <Text style={styles.subText}>
                                            {item.rentalId
                                                ? `📦 Location #${item.rentalId}`
                                                : `🔥 Enchère #${item.auctionId}`}
                                        </Text>

                                        <Text style={styles.reason}>{item.reason}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    ) : (
                        // ✅ ScrollView pour que le bouton Valider soit toujours accessible
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.form}>

                                <Text style={styles.sectionTitle}>
                                    Résolution du litige #{selectedDispute.id}
                                </Text>

                                <Text style={styles.subText}>
                                    Item : {itemsMap[selectedDispute.itemId]?.title ?? "Loading..."}
                                </Text>

                                <Text style={styles.subText}>
                                    {selectedDispute.rentalId
                                        ? `📦 Location #${selectedDispute.rentalId}`
                                        : `🔥 Enchère #${selectedDispute.auctionId}`}
                                </Text>

                                <Text style={styles.subText}>
                                    Raison : {selectedDispute.reason}
                                </Text>

                                {/* ── Décision ── */}
                                <Text style={styles.sectionTitle}>Décision :</Text>
                                <View style={{ flexDirection: "row", gap: 10 }}>
                                    <TouchableOpacity
                                        style={[
                                            styles.decisionBtn,
                                            decision === "RESOLVED" && styles.decisionBtnApprove,
                                        ]}
                                        onPress={() => { setDecision("RESOLVED"); setAction(null); }}
                                    >
                                        <Text style={[
                                            styles.decisionBtnText,
                                            decision === "RESOLVED" && { color: "#fff" }
                                        ]}>
                                            ✅ Approuver
                                        </Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.decisionBtn,
                                            decision === "REJECTED" && styles.decisionBtnReject,
                                        ]}
                                        onPress={() => { setDecision("REJECTED"); setAction(null); }}
                                    >
                                        <Text style={[
                                            styles.decisionBtnText,
                                            decision === "REJECTED" && { color: "#fff" }
                                        ]}>
                                            ❌ Rejeter
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* ── Actions — uniquement si RESOLVED ── */}
                                {decision === "RESOLVED" && (
                                    <View style={{ gap: 8 }}>
                                        <Text style={styles.sectionTitle}>Action :</Text>

                                        <TouchableOpacity
                                            style={[styles.actionBtn, action === "NONE" && styles.actionBtnActive]}
                                            onPress={() => setAction("NONE")}
                                        >
                                            <Text style={action === "NONE" ? styles.actionBtnActiveText : {}}>
                                                Aucune action
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionBtn, action === "SUSPEND_USER" && styles.actionBtnActive]}
                                            onPress={() => setAction("SUSPEND_USER")}
                                        >
                                            <Text style={action === "SUSPEND_USER" ? styles.actionBtnActiveText : {}}>
                                                🔴 Suspendre l'utilisateur
                                            </Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.actionBtn, action === "DEACTIVATE_ITEM" && styles.actionBtnActive]}
                                            onPress={() => setAction("DEACTIVATE_ITEM")}
                                        >
                                            <Text style={action === "DEACTIVATE_ITEM" ? styles.actionBtnActiveText : {}}>
                                                🚫 Désactiver l'item
                                            </Text>
                                        </TouchableOpacity>

                                        {/* ✅ Visible uniquement pour les litiges d'enchère */}
                                        {isAuctionDispute && (
                                            <TouchableOpacity
                                                style={[styles.actionBtn, action === "REFUND_AUCTION_FEE" && styles.actionBtnActive]}
                                                onPress={() => setAction("REFUND_AUCTION_FEE")}
                                            >
                                                <Text style={action === "REFUND_AUCTION_FEE" ? styles.actionBtnActiveText : {}}>
                                                    💸 Rembourser le owner + pénalité winner
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                )}

                                {/* ── Résumé de la sélection ── */}
                                {decision && (
                                    <View style={styles.summaryBox}>
                                        <Text style={styles.summaryText}>
                                            Décision : <Text style={{ fontWeight: "bold" }}> {getDecisionLabel(decision)}</Text>
                                        </Text>
                                        {action && (
                                            <Text style={styles.summaryText}>
                                                Action : <Text style={{ fontWeight: "bold" }}>{action}</Text>
                                            </Text>
                                        )}
                                    </View>
                                )}

                                {/* ── Commentaire ── */}
                                <TextInput
                                    placeholder="Commentaire admin (obligatoire)"
                                    value={adminComment}
                                    onChangeText={setAdminComment}
                                    style={[styles.input, { height: 100 }]}
                                    multiline
                                />

                                {/* ✅ Bouton Valider — toujours visible grâce au ScrollView */}
                                <TouchableOpacity
                                    style={[
                                        styles.validateBtn,
                                        (
                                            submitting ||
                                            !decision ||
                                            (decision === "RESOLVED" && !action) ||
                                            !adminComment.trim()
                                        ) && styles.validateBtnDisabled
                                    ]}
                                    onPress={handleResolve}
                                    disabled={
                                        submitting ||
                                        !decision ||
                                        (decision === "RESOLVED" && !action) ||
                                        !adminComment.trim()
                                    }
                                >
                                    {submitting ? (
                                        <ActivityIndicator color="#fff" />
                                    ) : (
                                        <Text style={styles.validateBtnText}>
                                            ✔ Valider la décision
                                        </Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity onPress={() => setSelectedDispute(null)}>
                                    <Text style={styles.cancelText}>Changer de litige</Text>
                                </TouchableOpacity>

                            </View>
                        </ScrollView>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#f5f7fa" },
    tabs: {
        flexDirection: "row",
        marginBottom: 20,
        backgroundColor: "#e0e0e0",
        borderRadius: 30,
        padding: 4,
    },
    tabButton: { flex: 1, padding: 10, borderRadius: 30, alignItems: "center" },
    activeTabButton: { backgroundColor: "#1e88e5" },
    tabText: { color: "#555", fontWeight: "600" },
    activeTabText: { color: "#fff" },
    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        elevation: 3,
    },
    selectedCard: { borderWidth: 2, borderColor: "#1e88e5" },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },
    cardTitle: { fontWeight: "bold", fontSize: 16 },
    reason: { color: "#555" },
    subText: { color: "#777", marginTop: 4 },
    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: "center",
    },
    badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
    sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6, marginTop: 8 },
    form: { gap: 10, paddingBottom: 40 },
    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    // Boutons décision
    decisionBtn: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
        backgroundColor: "#eee",
        borderWidth: 1,
        borderColor: "#ddd",
    },
    decisionBtnApprove: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
    decisionBtnReject: { backgroundColor: "#f44336", borderColor: "#f44336" },
    decisionBtnText: { fontWeight: "bold", color: "#555" },
    // Boutons action
    actionBtn: {
        backgroundColor: "#eee",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },
    actionBtnActive: {
        backgroundColor: "#e3f2fd",
        borderColor: "#1e88e5",
        borderWidth: 2,
    },
    actionBtnActiveText: { color: "#1e88e5", fontWeight: "bold" },
    // Résumé
    summaryBox: {
        backgroundColor: "#fff3e0",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ff9800",
    },
    summaryText: { color: "#555", marginBottom: 2 },
    // Bouton valider
    validateBtn: {
        backgroundColor: "#1e88e5",
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 8,
    },
    validateBtnDisabled: { backgroundColor: "#b0bec5" },
    validateBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
    cancelText: { textAlign: "center", marginTop: 10, color: "#888" },
    emptyText: { textAlign: "center", color: "#999", marginTop: 20 },
});
