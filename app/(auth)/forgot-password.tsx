import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { forgotPassword } from "../../src/api/authService";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSend = async () => {
    if (!email) {
      Alert.alert("Erreur", "Veuillez entrer votre email");
      return;
    }
    try {
      setLoading(true);
      await forgotPassword(email);
      setSent(true);
    } catch {
      Alert.alert("Erreur", "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (sent) return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 30 }}>
        <Text style={{ fontSize: 48, textAlign: "center", marginBottom: 16 }}>📧</Text>
        <Text style={styles.logo}>Email envoyé !</Text>
        <Text style={{ textAlign: "center", color: "#6b7280", marginBottom: 30, lineHeight: 22 }}>
          Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("/(auth)/reset-password")}
        >
          <Text style={styles.buttonText}>Réinitialiser mon mot de passe</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Retour à la connexion</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 30,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.logo}>🏠 Gonifty</Text>
          <Text style={styles.subtitle}>Mot de passe oublié</Text>
          <Text style={{ textAlign: "center", color: "#6b7280", marginBottom: 24, lineHeight: 20 }}>
            Entrez votre email — vous recevrez un lien de réinitialisation.
          </Text>

          <TextInput
            placeholder="Votre email"
            style={styles.input}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleSend}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Envoyer le lien</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>← Retour</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9" },
  logo: { fontSize: 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subtitle: { textAlign: "center", marginBottom: 16, color: "#555", fontSize: 16 },
  input: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, elevation: 2 },
  button: { backgroundColor: "#2563eb", padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { textAlign: "center", color: "#2563eb", fontWeight: "600", marginTop: 5 },
});