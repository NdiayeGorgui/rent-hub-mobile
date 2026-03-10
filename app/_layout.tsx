import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";
import { NotificationProvider } from "@/src/context/NotificationContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Stack />
      </NotificationProvider>
    </AuthProvider>
  );
}