import { useRouter } from "expo-router";
import { TouchableOpacity, View, Text, Animated } from "react-native";
import { useCallback, useContext, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { NotificationContext } from "@/src/context/NotificationContext";
import { MessageContext } from "@/src/context/MessageContext";

// 🔔 NotificationBell
export function NotificationBell() {
    const router = useRouter();
    const { unreadCount, loadUnreadCount } = useContext(NotificationContext);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const prevCount = useRef(unreadCount);

    // Recharge le compteur à chaque retour sur l’écran
    useFocusEffect(
        useCallback(() => {
            loadUnreadCount();
        }, [])
    );

    // Animation à l’arrivée de nouvelles notifications
    useEffect(() => {
        if (unreadCount > prevCount.current) {
            Animated.sequence([
                Animated.timing(scaleAnim, {
                    toValue: 1.4,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        prevCount.current = unreadCount;
    }, [unreadCount]);

    return (
        <TouchableOpacity
            style={{ marginRight: 15 }}
            onPress={() => router.push("/notification/notifications")}
        >
            <View>
                <Ionicons name="notifications-outline" size={24} color="#111" />
                {unreadCount > 0 && (
                    <Animated.View
                        style={{
                            transform: [{ scale: scaleAnim }],
                            position: "absolute",
                            right: -6,
                            top: -4,
                            backgroundColor: "red",
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            justifyContent: "center",
                            alignItems: "center",
                            paddingHorizontal: 4,
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontSize: 11,
                                fontWeight: "bold",
                            }}
                        >
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </Text>
                    </Animated.View>
                )}
            </View>
        </TouchableOpacity>
    );
}

// ⭐ PremiumButton
export function PremiumButton() {
    const router = useRouter();

    return (

        
        <TouchableOpacity
            onPress={() => router.push("/subscription/subscription")}
            style={{
                backgroundColor: "#facc15",
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 20,
                marginRight: 10,
                flexDirection: "row",
                alignItems: "center",
            }}
        >
            <Ionicons name="star" size={14} color="#111" />
            <Text
                style={{
                    marginLeft: 4,
                    fontSize: 12,
                    fontWeight: "bold",
                    color: "#111",
                }}
            >
                Premium
            </Text>
        </TouchableOpacity>
    );
}

export function MessageInboxButton() {

    const router = useRouter();
    const { unreadMessages, loadUnreadMessages } = useContext(MessageContext);

     useFocusEffect(
        useCallback(() => {
            loadUnreadMessages();
        }, [])
    );

    return (
        <TouchableOpacity
            style={{ marginRight: 10 }}
            onPress={() => router.push("/messages/inbox")}
        >
            <View>

                <Ionicons name="mail-outline" size={24} color="#111" />

                {unreadMessages > 0 && (
                    <View
                        style={{
                            position: "absolute",
                            right: -6,
                            top: -4,
                            backgroundColor: "red",
                            borderRadius: 10,
                            minWidth: 18,
                            height: 18,
                            justifyContent: "center",
                            alignItems: "center",
                            paddingHorizontal: 4,
                        }}
                    >
                        <Text
                            style={{
                                color: "white",
                                fontSize: 11,
                                fontWeight: "bold",
                            }}
                        >
                            {unreadMessages > 99 ? "99+" : unreadMessages}
                        </Text>
                    </View>
                )}

            </View>
        </TouchableOpacity>
    );
}

export function SupportButton() {

    const router = useRouter();

    return (
        <TouchableOpacity
            style={{ marginRight: 10 }}
            onPress={() =>
                router.push({
                    pathname: "/messages/chat",
                    params: {
                        // ⚠️ PAS de conversationId → il sera créé automatiquement
                        receiverId: "SUPPORT", // flag spécial
                        itemId: "SUPPORT",
                        receiverUsername: "Support"
                    }
                })
            }
        >
            <Ionicons name="help-circle-outline" size={24} color="#111" />
        </TouchableOpacity>
    );
}