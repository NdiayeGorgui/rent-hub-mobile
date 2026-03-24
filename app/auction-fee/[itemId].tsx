import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { createAuctionPayment } from "@/src/api/paymentService.web";
import { handleWebPayment } from "@/src/api/stripeWeb";

export default function AuctionFeePage() {
  const { itemId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  // 🔥 gestion des étapes
  const [step, setStep] = useState<"home" | "payment">("home");

  // 🔥 formulaire simulé
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");

  useEffect(() => {
    console.log("Item reçu :", itemId);
  }, []);

  // 👉 étape 1 : aller au paiement
  const handleStartPayment = () => {
    if (!itemId) {
      alert("Item invalide");
      return;
    }

    setStep("payment");
  };

  // 👉 étape 2 : paiement réel
  const handleConfirmPayment = async () => {
    try {
      if (!itemId) {
        alert("Item invalide");
        return;
      }

      setLoading(true);

      // 1️⃣ créer PaymentIntent
      const payment = await createAuctionPayment(Number(itemId));
      const clientSecret = payment.clientSecret;

      if (!clientSecret) {
        throw new Error("clientSecret manquant");
      }

      // 2️⃣ Stripe paiement
      if (Platform.OS === "web") {
        await handleWebPayment(clientSecret);
      } else {
        alert("Paiement mobile bientôt disponible");
        return;
      }

      // 3️⃣ succès
      alert("Paiement effectué ✅");

      // 4️⃣ redirection
      router.push(`/my-items/${itemId}`);

    } catch (err: any) {
      console.log("Erreur paiement", err);
      alert(err?.message || "Erreur paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>

      {/* 🟢 ÉTAPE 1 */}
      {step === "home" && (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            Publier une enchère
          </Text>

          <Text style={{ marginTop: 10 }}>
            La publication d'une enchère coûte 10$
          </Text>

          <TouchableOpacity
            onPress={handleStartPayment}
            style={{
              marginTop: 20,
              backgroundColor: "#ef4444",
              padding: 15,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>
              Continuer
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* 💳 ÉTAPE 2 */}
      {step === "payment" && (
        <>
          <TouchableOpacity onPress={() => setStep("home")}>
            <Text style={{ color: "blue", marginBottom: 10 }}>
              ← Retour
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 22, fontWeight: "bold" }}>
            💳 Paiement sécurisé
          </Text>

          <Text style={{ marginTop: 10, color: "#555" }}>
            🔒 Redirection vers paiement sécurisé...
          </Text>

          <Text style={{ marginTop: 15 }}>Numéro de carte</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={setCardNumber}
          />

          <Text>Mois</Text>
          <TextInput
            style={styles.input}
            value={expMonth}
            onChangeText={setExpMonth}
          />

          <Text>Année</Text>
          <TextInput
            style={styles.input}
            value={expYear}
            onChangeText={setExpYear}
          />

          <Text>CVC</Text>
          <TextInput
            style={styles.input}
            value={cvc}
            onChangeText={setCvc}
          />

          <TouchableOpacity
            onPress={handleConfirmPayment}
            style={{
              marginTop: 20,
              backgroundColor: "#2563eb",
              padding: 15,
              borderRadius: 10,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: "white", textAlign: "center" }}>
                Confirmer le paiement (10$)
              </Text>
            )}
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
};