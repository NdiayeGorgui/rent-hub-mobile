import React, { createContext, useState, useEffect } from "react";
import { getUnreadMessagesCount } from "@/src/api/messageService";

type MessageContextType = {
  unreadMessages: number;
  loadUnreadMessages: () => Promise<void>;
};

export const MessageContext = createContext<MessageContextType>({
  unreadMessages: 0,
  loadUnreadMessages: async () => {},
});

export const MessageProvider = ({ children }: any) => {

  const [unreadMessages, setUnreadMessages] = useState(0);

  const loadUnreadMessages = async () => {

    try {

      const count = await getUnreadMessagesCount();

      setUnreadMessages(count);

    } catch (error) {

      console.log("Error loading unread messages:", error);

    }

  };

  useEffect(() => {

    loadUnreadMessages();

    // ⭐ refresh automatique
    const interval = setInterval(() => {
      loadUnreadMessages();
    }, 10000);

    return () => clearInterval(interval);

  }, []);

  return (
    <MessageContext.Provider
      value={{
        unreadMessages,
        loadUnreadMessages,
      }}
    >
      {children}
    </MessageContext.Provider>
  );
};