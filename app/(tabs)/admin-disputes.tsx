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
    ActivityIndicator,
    KeyboardAvoidingView,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets
} from "react-native-safe-area-context";
import {
    getAllDisputesAdmin,
    resolveDisputeAdmin,
} from "@/src/api/adminDisputeService";
import { getStatusLabel } from "@/src/utils/statusUtils";
import { RefreshControl } from "react-native";

export default function AdminDisputesScreen() {
    const [activeTab, setActiveTab] = useState<"list" | "resolve">("list");
    const [disputes, setDisputes] = useState<any[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [decision, setDecision] = useState<"RESOLVED" | "REJECTED" | null>(null);
    const [adminComment, setAdminComment] = useState("");
    const [action, setAction] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [loadingData, setLoadingData] = useState(true); // ← nouveau

    const insets = useSafeAreaInsets();

    useEffect(() => {
        loadDisputes();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadDisputes();
        setRefreshing(false);
    };

    const getDecisionLabel = (value: string) => {
        const map: Record<string, string> = {
            RESOLVED: "Approuvé",
            REJECTED: "Rejeté",
            NONE: "Aucune action",
            SUSPEND_USER: "Suspendre l'utilisateur",
            DEACTIVATE_ITEM: "Désactiver l'item",
            REFUND_AUCTION_FEE: "Rembourser les frais d'enchère",
            OPEN: "Ouvert",
            IN_REVIEW: "En cours d'analyse",
            SUCCESS: "Réussi",
            FAILED: "Échec",
            PENDING: "En attente",
        };
        return map[value] ?? value;
    };

    const loadDisputes = async () => {
        try {
            setLoadingData(true); // ← démarre
            const data = await getAllDisputesAdmin();
            setDisputes(data);
        } catch {
            showAlert("Erreur", "Impossible de charger les litiges");
        } finally {
            setLoadingData(false); // ← arrête
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

    const isAuctionDispute = selectedDispute != null && selectedDispute.auctionId != null;

    // ── Loader global ──────────────────────────────────────
    if (loadingData) {
        return (
            <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#1e88e5" />
                <Text style={styles.loaderText}>Chargement des litiges...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* TABS */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "list" && styles.activeTabButton]}
                    onPress={() => { setActiveTab("list"); setSelectedDispute(null); }}
                >
                    <Text style={[styles.tabText, activeTab === "list" && styles.activeTabText]}>
                        Tous ({disputes.length})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === "resolve" && styles.activeTabButton]}
                    onPress={() => { setActiveTab("resolve"); setSelectedDispute(null); }}
                >
                    <Text style={[styles.tabText, activeTab === "resolve" && styles.activeTabText]}>
                        À résoudre ({openDisputes.length})
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ================= LIST ================= */}
            {activeTab === "list" && (
                <FlatList
                    data={disputes}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={() => (
                        <View style={styles.emptyContainer}>
                            <Text style={{ fontSize: 50 }}>⚖️</Text>
                            <Text style={styles.emptyText}>Aucun litige</Text>
                        </View>
                    )}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.cardTitle} numberOfLines={1}>
                                        {item.itemTitle ?? "Item supprimé"}
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
                            <Text style={styles.subText}>👤 Plaignant : {item.openedUsername}</Text>
                            {item.reportedUsername && (
                                <Text style={[styles.subText, { color: "#e53935" }]}>
                                    ⚠️ Accusé : {item.reportedUsername}
                                </Text>
                            )}
                            {item.adminDecision && (
                                <Text style={{ marginTop: 6, fontStyle: "italic", color: "#444" }}>
                                    Décision : {getDecisionLabel(item.adminDecision)}
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
                            <Text style={styles.sectionTitle}>
                                Sélectionnez un litige à traiter
                            </Text>
                            <FlatList
                                data={openDisputes}
                                keyExtractor={(item) => item.id.toString()}
                                contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + 20 }}
                                refreshControl={
                                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                                }
                                ListEmptyComponent={() => (
                                    <View style={styles.emptyContainer}>
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
                                            {item.itemTitle ?? "Item supprimé"}
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
                        <SafeAreaView style={{ flex: 1 }}>
                            <KeyboardAvoidingView
                                style={{ flex: 1 }}
                                behavior={Platform.OS === "ios" ? "padding" : "height"}
                                keyboardVerticalOffset={20}
                            >
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    keyboardShouldPersistTaps="handled"
                                    contentContainerStyle={{
                                        flexGrow: 1,
                                        paddingBottom: insets.bottom + 30,
                                    }}
                                >
                                    <View style={styles.form}>

                                        <Text style={styles.sectionTitle}>
                                            Résolution du litige #{selectedDispute.id}
                                        </Text>
                                        <Text style={styles.subText}>
                                            Item : {selectedDispute.itemTitle ?? "Item supprimé"}
                                        </Text>
                                        <Text style={styles.subText}>
                                            {selectedDispute.rentalId
                                                ? `📦 Location #${selectedDispute.rentalId}`
                                                : `🔥 Enchère #${selectedDispute.auctionId}`}
                                        </Text>
                                        <Text style={styles.subText}>
                                            Raison : {selectedDispute.reason}
                                        </Text>
                                        <Text style={styles.subText}>
                                            👤 Plaignant : {selectedDispute.openedUsername}
                                        </Text>
                                        {selectedDispute.reportedUsername && (
                                            <Text style={styles.subText}>
                                                ⚠️ Accusé : {selectedDispute.reportedUsername}
                                            </Text>
                                        )}

                                        {/* Décision */}
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
                                                ]}>✅ Approuver</Text>
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
                                                ]}>❌ Rejeter</Text>
                                            </TouchableOpacity>
                                        </View>

                                        {/* Actions */}
                                        {decision === "RESOLVED" && (
                                            <View style={{ gap: 8 }}>
                                                <Text style={styles.sectionTitle}>Action :</Text>
                                                {[
                                                    { key: "NONE", label: "Aucune action" },
                                                    { key: "SUSPEND_USER", label: "🔴 Suspendre l'utilisateur" },
                                                    { key: "DEACTIVATE_ITEM", label: "🚫 Désactiver l'item" },
                                                    ...(isAuctionDispute
                                                        ? [{ key: "REFUND_AUCTION_FEE", label: "💸 Rembourser owner + pénalité winner" }]
                                                        : [])
                                                ].map(({ key, label }) => (
                                                    <TouchableOpacity
                                                        key={key}
                                                        style={[styles.actionBtn, action === key && styles.actionBtnActive]}
                                                        onPress={() => setAction(key)}
                                                    >
                                                        <Text style={action === key ? styles.actionBtnActiveText : {}}>
                                                            {label}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        )}

                                        {/* Résumé */}
                                        {decision && (
                                            <View style={styles.summaryBox}>
                                                <Text style={styles.summaryText}>
                                                    Décision : <Text style={{ fontWeight: "bold" }}>{getDecisionLabel(decision)}</Text>
                                                </Text>
                                                {action && (
                                                    <Text style={styles.summaryText}>
                                                        Action : <Text style={{ fontWeight: "bold" }}>{getDecisionLabel(action)}</Text>
                                                    </Text>
                                                )}
                                            </View>
                                        )}

                                        {/* Commentaire */}
                                        <TextInput
                                            placeholder="Commentaire admin (obligatoire)"
                                            value={adminComment}
                                            onChangeText={setAdminComment}
                                            style={[styles.input, { height: 100 }]}
                                            multiline
                                        />

                                        {/* Valider */}
                                        <TouchableOpacity
                                            style={[
                                                styles.validateBtn,
                                                (submitting || !decision ||
                                                    (decision === "RESOLVED" && !action) ||
                                                    !adminComment.trim()) && styles.validateBtnDisabled
                                            ]}
                                            onPress={handleResolve}
                                            disabled={
                                                submitting || !decision ||
                                                (decision === "RESOLVED" && !action) ||
                                                !adminComment.trim()
                                            }
                                        >
                                            {submitting
                                                ? <ActivityIndicator color="#fff" />
                                                : <Text style={styles.validateBtnText}>✔ Valider la décision</Text>
                                            }
                                        </TouchableOpacity>

                                        <TouchableOpacity onPress={() => setSelectedDispute(null)}>
                                            <Text style={styles.cancelText}>Changer de litige</Text>
                                        </TouchableOpacity>

                                    </View>
                                </ScrollView>
                            </KeyboardAvoidingView>
                        </SafeAreaView>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    loaderContainer: {
        flex: 1, justifyContent: "center",
        alignItems: "center", backgroundColor: "#f5f7fa",
    },
    loaderText: { marginTop: 12, color: "#6b7280", fontSize: 14 },
    container: { flex: 1, padding: 20, backgroundColor: "#f5f7fa" },
    tabs: {
        flexDirection: "row", marginBottom: 20,
        backgroundColor: "#e0e0e0", borderRadius: 30, padding: 4,
    },
    tabButton: { flex: 1, padding: 10, borderRadius: 30, alignItems: "center" },
    activeTabButton: { backgroundColor: "#1e88e5" },
    tabText: { color: "#555", fontWeight: "600" },
    activeTabText: { color: "#fff" },
    card: {
        backgroundColor: "#fff", padding: 16,
        borderRadius: 14, marginBottom: 12, elevation: 3,
    },
    selectedCard: { borderWidth: 2, borderColor: "#1e88e5" },
    cardHeader: {
        flexDirection: "row", alignItems: "center",
        justifyContent: "space-between", marginBottom: 6,
    },
    cardTitle: { fontWeight: "bold", fontSize: 16 },
    reason: { color: "#555" },
    subText: { color: "#777", marginTop: 4 },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 12 },
    badgeText: { color: "white", fontSize: 12, fontWeight: "bold" },
    sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 6, marginTop: 8 },
    form: { gap: 10, paddingBottom: 40 },
    input: {
        backgroundColor: "#fff", padding: 12,
        borderRadius: 10, borderWidth: 1, borderColor: "#ddd",
    },
    decisionBtn: {
        flex: 1, padding: 14, borderRadius: 12,
        alignItems: "center", backgroundColor: "#eee",
        borderWidth: 1, borderColor: "#ddd",
    },
    decisionBtnApprove: { backgroundColor: "#4caf50", borderColor: "#4caf50" },
    decisionBtnReject: { backgroundColor: "#f44336", borderColor: "#f44336" },
    decisionBtnText: { fontWeight: "bold", color: "#555" },
    actionBtn: {
        backgroundColor: "#eee", padding: 12,
        borderRadius: 10, borderWidth: 1, borderColor: "#ddd",
    },
    actionBtnActive: { backgroundColor: "#e3f2fd", borderColor: "#1e88e5", borderWidth: 2 },
    actionBtnActiveText: { color: "#1e88e5", fontWeight: "bold" },
    summaryBox: {
        backgroundColor: "#fff3e0", padding: 12,
        borderRadius: 10, borderWidth: 1, borderColor: "#ff9800",
    },
    summaryText: { color: "#555", marginBottom: 2 },
    validateBtn: {
        backgroundColor: "#1e88e5", padding: 16,
        borderRadius: 12, alignItems: "center", marginTop: 8,
    },
    validateBtnDisabled: { backgroundColor: "#b0bec5" },
    validateBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
    cancelText: { textAlign: "center", marginTop: 10, color: "#888" },
    emptyContainer: { alignItems: "center", marginTop: 80 },
    emptyText: { textAlign: "center", color: "#999", marginTop: 20, fontSize: 15 },
});
