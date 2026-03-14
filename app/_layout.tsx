import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";
import { NotificationProvider } from "@/src/context/NotificationContext";
import { MessageProvider } from "@/src/context/MessageContext";

export default function RootLayout() {
  return (
   <AuthProvider>
  <NotificationProvider>
    <MessageProvider>
      <Stack />
    </MessageProvider>
  </NotificationProvider>
</AuthProvider>
  );
}