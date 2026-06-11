import { Stack } from "expo-router";
import { AuthProvider } from "@/src/context/AuthContext";
import { NotificationProvider } from "@/src/context/NotificationContext";
import { MessageProvider } from "@/src/context/MessageContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <MessageProvider>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(admin)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)/login" options={{ title: "Connexion" }} />
            <Stack.Screen name="(auth)/forgot-password" options={{ title: "Mot de passe oublié" }} />
            <Stack.Screen name="(auth)/register" options={{ title: "Inscription" }} />
            <Stack.Screen name="(auth)/reset-password" options={{ title: "Réinitialisation" }} />
            <Stack.Screen name="(admin)/admin-faq" options={{ title: "Gestion FAQ" }} />
            <Stack.Screen name="(admin)/admin-newsletter" options={{ title: "Infolettre" }} />
            <Stack.Screen name="(admin)/dashboard" options={{ title: "Dashboard" }} />
            <Stack.Screen name="(users)/disputes" options={{ title: "Litiges" }} />
            <Stack.Screen name="(users)/contact" options={{ title: "Contact" }} />
            <Stack.Screen name="(users)/newsletter" options={{ title: "Infolettre" }} />
            <Stack.Screen name="(users)/publicite" options={{ title: "Régie publicitaire" }} />
            <Stack.Screen name="(users)/profile" options={{ title: "Profil" }} />
            <Stack.Screen name="(users)/deconnexion" options={{ title: "Déconnexion" }} />
            <Stack.Screen name="item/[id]" options={{ title: "Détails" }} />
            <Stack.Screen name="my-items/[id]" options={{ title: "Mon item" }} />
            <Stack.Screen name="messages/chat" options={{ title: "Chat" }} />
            <Stack.Screen name="messages/inbox" options={{ title: "Messages" }} />
            <Stack.Screen name="notification/notifications" options={{ title: "Notifications" }} />
            <Stack.Screen name="review/create" options={{ title: "Laisser un avis" }} />
            <Stack.Screen name="user/[id]" options={{ title: "Profil" }} />
            <Stack.Screen name="subscription/subscription" options={{ title: "Premium" }} />
            <Stack.Screen name="auction-fee" options={{ title: "Paiement enchère" }} />
            <Stack.Screen name="faq/index" options={{ title: "Aide" }} />
            <Stack.Screen name="auction-fee/[itemId]" options={{ title: "Frais d'enchère" }} />
          </Stack>
        </MessageProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}