import { createContext, useState, useEffect, ReactNode } from "react";
import { getMyNotifications } from "@/src/api/notificationService";

export const NotificationContext = createContext<any>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

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
    loadUnreadCount();
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, loadUnreadCount }}
    >
      {children}
    </NotificationContext.Provider>
  );
}