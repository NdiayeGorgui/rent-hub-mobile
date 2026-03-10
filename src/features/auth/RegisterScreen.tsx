import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { colors, spacing, radius } from "../../theme/theme";
import { api } from "../../services/api";

export default function RegisterScreen({ navigation }: any) {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    phone: "",
    city: "",
  });

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    try {
      setLoading(true);

      await api.post("/auth/register", form);

      navigation.navigate("Login");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm({ ...form, [key]: value });
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>Create Account 🚀</Text>

        {Object.keys(form).map((key) => (
          <TextInput
            key={key}
            placeholder={key}
            style={styles.input}
            secureTextEntry={key === "password"}
            onChangeText={(value) => updateField(key, value)}
          />
        ))}

        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.link}>
            Already have an account? Login
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: "#fff",
    padding: spacing.lg,
    borderRadius: radius.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: spacing.lg,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  link: {
    marginTop: spacing.lg,
    textAlign: "center",
    color: colors.primary,
    fontWeight: "600",
  },
});