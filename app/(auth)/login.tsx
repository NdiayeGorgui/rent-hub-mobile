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
import { forgotPassword, loginUser } from "../../src/api/authService";
import { useAuth } from "@/src/context/AuthContext";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState("");
    const [forgotLoading, setForgotLoading] = useState(false);

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

    const handleForgotPassword = async () => {
    if (!forgotEmail) {
        showAlert("Erreur", "Veuillez entrer votre email");
        return;
    }
    try {
        setForgotLoading(true);
        await forgotPassword(forgotEmail);
        showAlert(
            "Email envoyé",
            "Si cet email existe, vous recevrez un token de réinitialisation."
        );
        setShowForgot(false);
        // Redirige vers la page reset
        router.push("/(auth)/reset-password");
    } catch (error: any) {
        showAlert("Erreur", "Une erreur est survenue");
    } finally {
        setForgotLoading(false);
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
            {/* Lien mot de passe oublié */}
<TouchableOpacity onPress={() => setShowForgot(!showForgot)}>
    <Text style={styles.link}>Mot de passe oublié ?</Text>
</TouchableOpacity>

{/* Formulaire inline mot de passe oublié */}
{showForgot && (
    <View style={styles.forgotContainer}>
        <Text style={styles.forgotTitle}>Réinitialiser le mot de passe</Text>
        <TextInput
            placeholder="Votre email"
            style={styles.input}
            value={forgotEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onChangeText={setForgotEmail}
        />
        <TouchableOpacity
            style={styles.forgotButton}
            onPress={handleForgotPassword}
            disabled={forgotLoading}
        >
            {forgotLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.buttonText}>Envoyer le token</Text>
            )}
        </TouchableOpacity>
    </View>
)}

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