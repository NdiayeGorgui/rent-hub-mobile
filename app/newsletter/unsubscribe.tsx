import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { API } from "@/src/api/api";

export default function NewsletterUnsubscribeScreen() {

  const { email } = useLocalSearchParams<{
    email?: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {

    if (!email) {
      setLoading(false);
      setError(true);
      return;
    }

    const unsubscribe = async () => {

      try {

        await API.get(
          `/newsletter/unsubscribe?email=${encodeURIComponent(email)}`
        );

        setSuccess(true);

      } catch (e) {

        console.log(e);

        setError(true);

      } finally {

        setLoading(false);
      }
    };

    unsubscribe();

  }, [email]);

  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.card}>

        {/* Emoji */}
        <Text style={styles.emoji}>
          {loading ? "⏳" : success ? "📭" : "❌"}
        </Text>

        {/* Title */}
        <Text style={styles.title}>
          {loading
            ? "Désabonnement..."
            : success
              ? "Vous êtes désabonné"
              : "Une erreur est survenue"}
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          {loading
            ? "Veuillez patienter quelques secondes."
            : success
              ? "Votre demande a bien été prise en compte."
              : "Impossible de traiter votre demande."}
        </Text>

        {/* Loading */}
        {loading && (
          <View style={{ marginTop: 24 }}>
            <ActivityIndicator size="large" color="#2563eb" />
          </View>
        )}

        {/* Success */}
        {!loading && success && (
          <>

            <View style={styles.successBox}>

              <Text style={styles.successTitle}>
                ✅ Désabonnement confirmé
              </Text>

              <Text style={styles.successEmail}>
                {email}
              </Text>

            </View>

            <Text style={styles.infoText}>
              Vous ne recevrez plus les newsletters
              et promotions Gonifty.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/newsletter")}
            >
              <Text style={styles.primaryButtonText}>
                Se réabonner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.secondaryButtonText}>
                Retour à l'accueil
              </Text>
            </TouchableOpacity>

          </>
        )}

        {/* Error */}
        {!loading && error && (
          <>

            <View style={styles.errorBox}>

              <Text style={styles.errorTitle}>
                ❌ Erreur
              </Text>

              <Text style={styles.errorText}>
                Le lien de désabonnement est invalide
                ou expiré.
              </Text>

            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push("/")}
            >
              <Text style={styles.primaryButtonText}>
                Retour à l'accueil
              </Text>
            </TouchableOpacity>

          </>
        )}

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f4f6f9",
    justifyContent: "center",
    padding: 20,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 28,
    padding: 28,
    alignItems: "center",
  },

  emoji: {
    fontSize: 56,
    marginBottom: 20,
  },

  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111827",
    textAlign: "center",
    marginBottom: 10,
  },

  description: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
  },

  successBox: {
    width: "100%",
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 18,
    padding: 16,
    marginTop: 28,
  },

  successTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#166534",
    marginBottom: 6,
  },

  successEmail: {
    fontSize: 13,
    color: "#15803d",
  },

  infoText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 22,
    marginBottom: 26,
  },

  primaryButton: {
    width: "100%",
    backgroundColor: "#2563eb",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  secondaryButton: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#374151",
    fontSize: 15,
    fontWeight: "700",
  },

  errorBox: {
    width: "100%",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 18,
    padding: 16,
    marginTop: 28,
    marginBottom: 26,
  },

  errorTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991b1b",
    marginBottom: 6,
  },

  errorText: {
    fontSize: 13,
    color: "#b91c1c",
    lineHeight: 20,
  },

});