import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { resetPassword } from "../../src/api/authService";
import * as Linking from "expo-linking";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [tokenFromLink, setTokenFromLink] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ← Récupère le token depuis le deep link
  useEffect(() => {
    const getToken = async () => {
      // Vérifie si l'app a été ouverte via un lien
      const url = await Linking.getInitialURL();
      if (url) {
        const parsed = Linking.parse(url);
        const tokenParam = parsed.queryParams?.token;
        if (tokenParam && typeof tokenParam === "string") {
          setToken(tokenParam);
          setTokenFromLink(true);
        }
      }
    };
    getToken();

    // Écoute les liens pendant que l'app est ouverte
    const subscription = Linking.addEventListener("url", ({ url }) => {
      const parsed = Linking.parse(url);
      const tokenParam = parsed.queryParams?.token;
      if (tokenParam && typeof tokenParam === "string") {
        setToken(tokenParam);
        setTokenFromLink(true);
      }
    });

    return () => subscription.remove();
  }, []);

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleReset = async () => {
    if (!token || !newPassword || !confirmPassword) {
      showAlert("Erreur", "Tous les champs sont obligatoires");
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert("Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (newPassword.length < 6) {
      showAlert("Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    try {
      setLoading(true);
      await resetPassword(token, newPassword);
      showAlert("Succès", "Mot de passe réinitialisé avec succès");
      router.replace("/(auth)/login");
    } catch (error: any) {
      showAlert("Erreur", error?.response?.data?.message || "Token invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🏠 Gonifty</Text>
      <Text style={styles.subtitle}>Nouveau mot de passe</Text>

      {/* Token — masqué si vient du lien */}
      {tokenFromLink ? (
        <View style={styles.tokenSuccess}>
          <Text style={styles.tokenSuccessText}>
            ✅ Token récupéré automatiquement
          </Text>
        </View>
      ) : (
        <TextInput
          placeholder="Token reçu par email"
          style={styles.input}
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
        />
      )}

      <TextInput
        placeholder="Nouveau mot de passe"
        secureTextEntry
        style={styles.input}
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        placeholder="Confirmer le mot de passe"
        secureTextEntry
        style={styles.input}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleReset}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.buttonText}>Réinitialiser</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.link}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f9", justifyContent: "center", paddingHorizontal: 30 },
  logo: { fontSize: 32, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subtitle: { textAlign: "center", marginBottom: 30, color: "#555", fontSize: 16 },
  input: { backgroundColor: "#fff", padding: 15, borderRadius: 12, marginBottom: 15, fontSize: 16, elevation: 2 },
  button: { backgroundColor: "#2563eb", padding: 15, borderRadius: 12, alignItems: "center", marginBottom: 15 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { textAlign: "center", color: "#2563eb", fontWeight: "600" },
  tokenSuccess: {
    backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#86efac",
    borderRadius: 12, padding: 14, marginBottom: 15, alignItems: "center",
  },
  tokenSuccessText: { color: "#16a34a", fontWeight: "600" },
});