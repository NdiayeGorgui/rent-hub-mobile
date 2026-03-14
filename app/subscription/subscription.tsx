import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

import { useState, useEffect } from "react";

import { subscribeToPremium } from "@/src/api/paymentService.web";
import {
  fetchPremiumStatus,
  cancelSubscription,
} from "@/src/api/subscriptionService";

export default function SubscriptionScreen() {

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<any>(null);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 🔎 charger le statut premium
  const loadStatus = async () => {
    try {
      const data = await fetchPremiumStatus();
      setStatus(data);
    } catch (e) {
      console.log(e);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      const payment = await subscribeToPremium(9.99);

      console.log("Payment created:", payment);

      showAlert("Succès", "Paiement envoyé");

      await loadStatus();

    } catch (error) {
      console.log(error);
      showAlert("Erreur", "Impossible de créer le paiement");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);

      await cancelSubscription();

      showAlert("Succès", "Le renouvellement automatique est annulé");

      await loadStatus();

    } catch (e) {
      console.log(e);
      showAlert("Erreur", "Impossible d'annuler l'abonnement");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  const isPremium = status?.premium;
  const isGrace = status?.gracePeriod;

  return (
    <View style={styles.container}>

      {/* 🟢 Premium actif */}
      {isPremium && !isGrace && (
        <>
          <Text style={styles.title}>👑 Premium actif</Text>

          <Text style={styles.expire}>
            Expire le : {new Date(status.endDate).toLocaleDateString()}
          </Text>

          <TouchableOpacity
            style={styles.manageButton}
            onPress={handleCancel}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Annuler le renouvellement
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* 🟡 Grace period */}
      {isPremium && isGrace && (
        <>
          <Text style={styles.title}>⚠️ Paiement échoué</Text>

          <Text style={styles.description}>
            Votre abonnement reste actif jusqu'au :
          </Text>

          <Text style={styles.expire}>
            {new Date(status.endDate).toLocaleDateString()}
          </Text>

          <Text style={styles.description}>
            Veuillez mettre à jour votre moyen de paiement.
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Mettre à jour paiement
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* 🔴 Pas premium */}
      {!isPremium && (
        <>
          <Text style={styles.title}>👑 Passer au Premium</Text>

          <Text style={styles.description}>
            - Plus de visibilité{"\n"}
            - Badge Premium{"\n"}
            - Mise en avant des items
          </Text>

          <Text style={styles.price}>9.99 $ / mois</Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Payer maintenant
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    backgroundColor: "#f4f6f9",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },

  description: {
    fontSize: 16,
    marginBottom: 20,
  },

  price: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2563eb",
    marginBottom: 20,
  },

  expire: {
    fontSize: 16,
    marginBottom: 30,
    color: "#555",
  },

  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  manageButton: {
    backgroundColor: "#ef4444",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },

});