import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
} from "react-native";

import { useState, useEffect } from "react";

import { subscribeToPremium } from "@/src/api/paymentService.web";
import {
  fetchPremiumStatus,
  cancelSubscription,
} from "@/src/api/subscriptionService";
import { handleWebPayment } from "@/src/api/stripeWeb";

export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState<any>(null);

  // 🔥 gestion des étapes
  const [step, setStep] = useState<"home" | "payment">("home");

  // 🔥 formulaire (simulation)
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  // 🔎 charger statut
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

  // 👉 étape 1 : aller au paiement
  const handleSubscribe = () => {
    setStep("payment");
  };

  // 👉 étape 2 : paiement réel
  const handleConfirmPayment = async () => {
    try {
      setLoading(true);

      const payment = await subscribeToPremium(9.99);
      const clientSecret = payment.clientSecret;

      if (!clientSecret) {
        throw new Error("clientSecret manquant");
      }

      if (Platform.OS === "web") {
        await handleWebPayment(clientSecret);
      }

      showAlert("Succès", "Paiement effectué 🎉");

      await loadStatus();
      setStep("home");

    } catch (error: any) {
      showAlert("Erreur", error?.message || "Paiement échoué");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setLoading(true);

      await cancelSubscription();

      showAlert("Succès", "Renouvellement annulé");
      await loadStatus();

    } catch (e) {
      showAlert("Erreur", "Impossible d'annuler");
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
          >
            <Text style={styles.buttonText}>
              Annuler l'abonnement
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🟡 Grace period */}
      {isPremium && isGrace && step === "home" && (
        <>
          <Text style={styles.title}>⚠️ Paiement échoué</Text>

          <Text style={styles.description}>
            Votre abonnement reste actif jusqu'au :
          </Text>

          <Text style={styles.expire}>
            {new Date(status.endDate).toLocaleDateString()}
          </Text>

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubscribe}
          >
            <Text style={styles.buttonText}>
              Mettre à jour paiement
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* 🔴 Pas premium */}
      {!isPremium && step === "home" && (
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
          >
            <Text style={styles.buttonText}>
              S’abonner maintenant
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* 💳 ÉTAPE PAIEMENT */}
      {step === "payment" && (
        <>
          <TouchableOpacity onPress={() => setStep("home")}>
            <Text style={{ color: "blue", marginBottom: 10 }}>
              ← Retour
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>💳 Paiement sécurisé</Text>

          <Text style={{ marginBottom: 10, color: "#555" }}>
            🔒 Redirection vers paiement sécurisé...
          </Text>

          <Text style={styles.label}>Numéro de carte</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
          />

          <Text style={styles.label}>Mois</Text>
          <TextInput
            style={styles.input}
            value={expMonth}
            onChangeText={setExpMonth}
          />

          <Text style={styles.label}>Année</Text>
          <TextInput
            style={styles.input}
            value={expYear}
            onChangeText={setExpYear}
          />

          <Text style={styles.label}>CVC</Text>
          <TextInput
            style={styles.input}
            value={cvc}
            onChangeText={setCvc}
          />

          <TouchableOpacity
            style={styles.button}
            onPress={handleConfirmPayment}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                Confirmer le paiement
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
    marginTop: 10,
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

  label: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "500",
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
});