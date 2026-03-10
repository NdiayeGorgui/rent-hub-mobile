import { useRouter } from "expo-router";
import { TouchableOpacity, View, Text, Animated } from "react-native";
import { useCallback, useContext, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { NotificationContext } from "@/src/context/NotificationContext";

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