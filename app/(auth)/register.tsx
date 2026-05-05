import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { registerUser } from "../../src/api/authService";

import {
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    city: "",
  });

  const fields = [
  { key: "username", placeholder: "Nom d'utilisateur" },
  { key: "email", placeholder: "Email" },
  { key: "password", placeholder: "Mot de passe" },
  { key: "fullName", placeholder: "Nom complet" },
  { key: "phone", placeholder: "Téléphone" },
  { key: "city", placeholder: "Ville" },
];

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const handleChange = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.username) {
      showAlert("Erreur", "Veuillez remplir les champs obligatoires");
      return;
    }

    try {
      setLoading(true);

      const response = await registerUser(form);

      console.log("REGISTER RESPONSE:", response);

      showAlert("Succès", "Compte créé avec succès");

      setTimeout(() => {
        router.replace("/(auth)/login");
      }, 800);

    } catch (error: any) {
      console.log("ERROR:", error?.response);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Erreur serveur";

      showAlert("Inscription impossible", message);
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
          padding: 25,
          paddingBottom: insets.bottom + 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>Créer un compte</Text>

       {fields.map((field) => (
  <TextInput
    key={field.key}
    placeholder={field.placeholder}
    secureTextEntry={field.key === "password"}
    style={styles.input}
    value={(form as any)[field.key]}
    onChangeText={(text) => handleChange(field.key, text)}
  />
))}

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>S'inscrire</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            Déjà un compte ? Se connecter
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#f4f6f9",
    justifyContent: "center",
    padding: 25,
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
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
    backgroundColor: "#16a34a",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
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
});