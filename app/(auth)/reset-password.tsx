import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, ActivityIndicator, Alert, Platform,
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { resetPassword } from "../../src/api/authService";

export default function ResetPassword() {
    const [token, setToken] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const showAlert = (title: string, message: string) => {
        if (Platform.OS === "web") {
            window.alert(`${title}\n\n${message}`);
        } else {
            Alert.alert(title, message);
        }
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
            const message =
                error?.response?.data?.message ||
                "Token invalide ou expiré";
            showAlert("Erreur", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.logo}>🏠 RentHub</Text>
            <Text style={styles.subtitle}>Nouveau mot de passe</Text>

            <TextInput
                placeholder="Token reçu par email"
                style={styles.input}
                value={token}
                onChangeText={setToken}
                autoCapitalize="none"
            />
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
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Réinitialiser</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.link}>Retour à la connexion</Text>
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
        fontSize: 16,
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