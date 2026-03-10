import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { registerUser } from "../../src/api/authService";

export default function Register() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    phone: "",
    city: "",
  });

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.logo}>Créer un compte</Text>

      {Object.keys(form).map((key) => (
        <TextInput
          key={key}
          placeholder={key}
          secureTextEntry={key === "password"}
          style={styles.input}
          value={(form as any)[key]}
          onChangeText={(text) => handleChange(key, text)}
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