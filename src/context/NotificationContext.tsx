import { createContext, useState, useEffect, ReactNode } from "react";
import { getMyNotifications } from "@/src/api/notificationService";
import SockJS from "sockjs-client";
import Stomp from "stompjs";
import { useAuth } from "@/src/context/AuthContext";
import { Platform } from "react-native";

export const NotificationContext = createContext<any>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {

  const { user } = useAuth();
  const userId = user?.id;

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);

  const loadUnreadCount = async () => {
    try {
      const data = await getMyNotifications();
      const count = data.filter((n: any) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.log("Error loading unread count");
    }
  };

  // chargement initial
  useEffect(() => {
    loadUnreadCount();
  }, []);

  // 🔔 WebSocket pour notifications temps réel
  useEffect(() => {

    if (!userId) return;

    const baseURL =
      Platform.OS === "android"
        ? "http://10.0.2.2:8080/ws-notifications"
        : "http://localhost:8080/ws-notifications";

    const socket = new SockJS(baseURL);
    const stompClient = Stomp.over(socket);

    stompClient.connect({}, () => {

      stompClient.subscribe(
        `/topic/notifications/${userId}`,
        (message) => {

          const notif = JSON.parse(message.body);

          // ajoute en tête
          setNotifications(prev => [notif, ...prev]);

          // incrémenter la cloche
          setUnreadCount((prev: number) => prev + 1);

        }
      );

    });

    return () => {
      stompClient.disconnect(() => {
        console.log("WebSocket disconnected");
      });
    };

  }, [userId]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        loadUnreadCount,
        setUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}