// NotificationContext.tsx
import { createContext, useState, useEffect, ReactNode } from "react";
import { getMyNotifications } from "@/src/api/notificationService";
import { useAuth } from "@/src/context/AuthContext";

export const NotificationContext = createContext<any>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth(); // ← ajoute ça

  const loadUnreadCount = async () => {
    try {
      const data = await getMyNotifications();
      const count = data.filter((n: any) => !n.read).length;
      setUnreadCount(count);
    } catch (err) {
      console.log("Error loading unread count");
    }
  };

  useEffect(() => {
    if (!user) return; // ← ne charge pas si pas connecté
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user]); // ← relance quand user change

  return (
    <NotificationContext.Provider value={{ unreadCount, loadUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}