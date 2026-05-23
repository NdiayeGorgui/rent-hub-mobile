import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { forgotPassword, loginUser } from "../../src/api/authService";
import { useAuth } from "@/src/context/AuthContext";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import PasswordInput from "@/components/PasswordInput";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);



  const { login } = useAuth();
  const insets = useSafeAreaInsets();

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleLogin = async () => {
    try {
      setLoading(true);

      const response = await loginUser({
        email,
        password,
      });

      if (!response?.token) {
        throw new Error("Token non reçu");
      }

      await login(response.token);

      router.replace("/(tabs)/home");

    } catch (error: any) {
      console.log("LOGIN ERROR:", error?.response || error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur serveur";

      showAlert("Connexion impossible", message);
    } finally {
      setLoading(false);
    }
  };



  return (

    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={20}
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
          <Text style={styles.subtitle}>Connexion</Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setEmail}
          />

          <PasswordInput value={password} onChangeText={setPassword} />

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Mot de passe oublié */}

          <TouchableOpacity onPress={() => router.push("/(auth)/forgot-password")}>
            <Text style={styles.link}>Mot de passe oublié ?</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.link}>Créer un compte</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  logo: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 30,
    color: "#555",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    elevation: 2,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  link: {
    textAlign: "center",
    color: "#2563eb",
    fontWeight: "600",
  },
  forgotContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
    elevation: 2,
  },
  forgotTitle: {
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  forgotButton: {
    backgroundColor: "#10b981",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 5,
  },
});