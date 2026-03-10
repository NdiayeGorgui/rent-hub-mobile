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
} from "react-native";

import {
    getAllDisputesAdmin,
    resolveDisputeAdmin,
} from "@/src/api/adminDisputeService";

import { fetchItemDetails } from "@/src/api/itemService";

export default function AdminDisputesScreen() {
    const [activeTab, setActiveTab] = useState<"list" | "resolve">("list");
    const [disputes, setDisputes] = useState<any[]>([]);
    const [selectedDispute, setSelectedDispute] = useState<any>(null);
    const [decision, setDecision] = useState<"RESOLVED" | "REJECTED" | null>(null);
    const [adminComment, setAdminComment] = useState("");

    const [itemsMap, setItemsMap] = useState<Record<number, any>>({});

    useEffect(() => {
        loadDisputes();
    }, []);

    // =========================
    // LOAD DISPUTES + ITEMS
    // =========================

    const loadDisputes = async () => {
        try {
            const data = await getAllDisputesAdmin();
            setDisputes(data);

            const uniqueItemIds = [...new Set(data.map((d: any) => d.itemId))] as number[];

            const itemsResults = await Promise.all(
                uniqueItemIds.map(async (itemId: number) => {
                    try {
                        const item = await fetchItemDetails(itemId);
                        return [itemId, item];
                    } catch {
                        return [itemId, null];
                    }
                })
            );

            const itemsObject = Object.fromEntries(itemsResults);
            setItemsMap(itemsObject);

        } catch (error) {
            showAlert("Erreur", "Impossible de charger les litiges");
        }
    };

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === "web") {
            alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message);
        }
    };

    const handleResolve = async () => {
        if (!selectedDispute) return;

        if (!decision) {
            showAlert("Erreur", "Veuillez choisir Approuver ou Rejeter");
            return;
        }

        if (!adminComment.trim()) {
            showAlert("Erreur", "Veuillez écrire un commentaire");
            return;
        }

        try {
            await resolveDisputeAdmin(
                selectedDispute.id,
                decision,
                adminComment
            );

            showAlert("Succès", "Litige traité !");
            setSelectedDispute(null);
            setAdminComment("");
            setDecision(null);
            setActiveTab("list");
            loadDisputes();

        } catch (error) {
            showAlert("Erreur", "Impossible de résoudre le litige");
        }
    };

    // =========================
    // STATUS BADGE
    // =========================

    const renderStatusBadge = (status: string) => {
        let bg = "#ccc";

        if (status === "OPEN") bg = "#ff9800";
        if (status === "IN_REVIEW") bg = "#2196f3";
        if (status === "RESOLVED") bg = "#4caf50";
        if (status === "REJECTED") bg = "#f44336";

        return (
            <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={styles.badgeText}>{status}</Text>
            </View>
        );
    };

    const openDisputes = disputes.filter(
        (d) => d.status === "OPEN" || d.status === "IN_REVIEW"
    );

    return (
        <View style={styles.container}>

            {/* TABS */}

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === "list" && styles.activeTabButton,
                    ]}
                    onPress={() => {
                        setActiveTab("list");
                        setSelectedDispute(null);
                    }}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "list" && styles.activeTabText,
                        ]}
                    >
                        Tous les litiges
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === "resolve" && styles.activeTabButton,
                    ]}
                    onPress={() => {
                        setActiveTab("resolve");
                        setSelectedDispute(null);
                    }}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === "resolve" && styles.activeTabText,
                        ]}
                    >
                        Résoudre
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ================= LIST ================= */}

            {activeTab === "list" && (
                <FlatList
                    data={disputes}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Aucun litige</Text>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.card}>

                            <View style={styles.cardHeader}>

                                <View>
                                    <Text style={styles.cardTitle}>
                                        {itemsMap[item.itemId]?.title ?? "Loading..."}
                                    </Text>

                                    <Text style={styles.subText}>
                                        Location #{item.rentalId}
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
                            <Text style={styles.sectionTitle}>
                                Sélectionnez un litige à traiter
                            </Text>

                            <FlatList
                                data={openDisputes}
                                keyExtractor={(item) => item.id.toString()}
                                ListEmptyComponent={
                                    <Text style={styles.emptyText}>
                                        Aucun litige à résoudre
                                    </Text>
                                }
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={[
                                            styles.card,
                                            selectedDispute?.id === item.id && styles.selectedCard,
                                        ]}
                                        onPress={() => setSelectedDispute(item)}
                                    >

                                        <Text style={styles.cardTitle}>
                                            {itemsMap[item.itemId]?.title ?? "Loading..."}
                                        </Text>

                                        <Text style={styles.subText}>
                                            Location #{item.rentalId}
                                        </Text>

                                        <Text style={styles.reason}>{item.reason}</Text>

                                    </TouchableOpacity>
                                )}
                            />
                        </>

                    ) : (

                        <View style={styles.form}>

                            <Text style={styles.sectionTitle}>
                                Résolution du litige #{selectedDispute.id}
                            </Text>

                            <Text style={styles.subText}>
                                Item : {itemsMap[selectedDispute.itemId]?.title ?? "Loading..."}
                            </Text>

                            <Text style={styles.subText}>
                                Location #{selectedDispute.rentalId}
                            </Text>

                            <View style={{ flexDirection: "row", gap: 10 }}>

                                <TouchableOpacity
                                    style={[
                                        styles.primaryButton,
                                        decision === "RESOLVED" && { backgroundColor: "#4caf50" },
                                    ]}
                                    onPress={() => setDecision("RESOLVED")}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        Approuver
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.primaryButton, { backgroundColor: "#f44336" }]}
                                    onPress={() => setDecision("REJECTED")}
                                >
                                    <Text style={styles.primaryButtonText}>
                                        Rejeter
                                    </Text>
                                </TouchableOpacity>

                            </View>

                            <TextInput
                                placeholder="Commentaire admin"
                                value={adminComment}
                                onChangeText={setAdminComment}
                                style={[styles.input, { height: 100 }]}
                                multiline
                            />

                            <TouchableOpacity
                                style={styles.primaryButton}
                                onPress={handleResolve}
                            >
                                <Text style={styles.primaryButtonText}>
                                    Valider la décision
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setSelectedDispute(null)}
                            >
                                <Text style={styles.cancelText}>
                                    Changer de litige
                                </Text>
                            </TouchableOpacity>

                        </View>
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f7fa",
    },

    tabs: {
        flexDirection: "row",
        marginBottom: 20,
        backgroundColor: "#e0e0e0",
        borderRadius: 30,
        padding: 4,
    },

    tabButton: {
        flex: 1,
        padding: 10,
        borderRadius: 30,
        alignItems: "center",
    },

    activeTabButton: {
        backgroundColor: "#1e88e5",
    },

    tabText: {
        color: "#555",
        fontWeight: "600",
    },

    activeTabText: {
        color: "#fff",
    },

    card: {
        backgroundColor: "#fff",
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        elevation: 3,
    },

    selectedCard: {
        borderWidth: 2,
        borderColor: "#1e88e5",
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 6,
    },

    cardTitle: {
        fontWeight: "bold",
        fontSize: 16,
    },

    subText: {
        color: "#777",
        marginTop: 4,
    },

    reason: {
        color: "#555",
    },

    badge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        alignSelf: "center",
    },

    badgeText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
    },

    sectionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 10,
    },

    form: {
        gap: 12,
    },

    input: {
        backgroundColor: "#fff",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
    },

    primaryButton: {
        backgroundColor: "#1e88e5",
        padding: 14,
        borderRadius: 12,
        alignItems: "center",
    },

    primaryButtonText: {
        color: "white",
        fontWeight: "bold",
    },

    cancelText: {
        textAlign: "center",
        marginTop: 10,
        color: "#888",
    },

    emptyText: {
        textAlign: "center",
        color: "#999",
        marginTop: 20,
    },
});