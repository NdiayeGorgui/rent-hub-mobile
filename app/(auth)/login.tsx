import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { loginUser } from "../../src/api/authService";
import { useAuth } from "@/src/context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === "web") {
            window.alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message);
        }
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

            //showAlert("Succès", "Connexion réussie");

            router.replace("/(tabs)/home");

        } catch (error: any) {

            console.log("ERROR:", error?.response);

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
        <View style={styles.container}>
            <Text style={styles.logo}>🏠 RentHub</Text>
            <Text style={styles.subtitle}>Connexion</Text>

            <TextInput
                placeholder="Email"
                style={styles.input}
                value={email}
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
            />

            <TextInput
                placeholder="Mot de passe"
                secureTextEntry
                style={styles.input}
                value={password}
                onChangeText={setPassword}
            />

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

            <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
                <Text style={styles.link}>Créer un compte</Text>
            </TouchableOpacity>
        </View>
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
});