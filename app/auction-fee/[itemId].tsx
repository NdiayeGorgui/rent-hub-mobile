import {
  View, Text, TouchableOpacity, ActivityIndicator, TextInput,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { createAuctionPayment } from "@/src/api/paymentService.web";
import { handleMobilePayment } from "@/src/api/stripeMobile";

export default function AuctionFeePage() {
  const { itemId } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"home" | "payment">("home");
  const [cardNumber, setCardNumber] = useState("4242424242424242");
  const [expMonth, setExpMonth] = useState("12");
  const [expYear, setExpYear] = useState("34");
  const [cvc, setCvc] = useState("123");

  const handleConfirmPayment = async () => {
    try {
      if (!itemId) { alert("Item invalide"); return; }
      setLoading(true);
      const payment = await createAuctionPayment(Number(itemId));
      if (!payment.clientSecret) throw new Error("clientSecret manquant");
      await handleMobilePayment(payment.clientSecret);
      alert("Paiement effectué ✅");
      router.push(`/my-items/${itemId}`);
    } catch (err: any) {
      alert(err?.message || "Erreur paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>

      {step === "home" && (
        <>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>Publier une enchère</Text>
          <Text style={{ marginTop: 10 }}>La publication d'une enchère coûte 10$</Text>
          <TouchableOpacity
            onPress={() => setStep("payment")}
            style={{ marginTop: 20, backgroundColor: "#ef4444", padding: 15, borderRadius: 10 }}
          >
            <Text style={{ color: "white", textAlign: "center" }}>Continuer</Text>
          </TouchableOpacity>
        </>
      )}

      {step === "payment" && (
        <>
          <TouchableOpacity onPress={() => setStep("home")}>
            <Text style={{ color: "blue", marginBottom: 10 }}>← Retour</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: "bold" }}>💳 Paiement sécurisé</Text>
          <Text style={{ marginTop: 10, marginBottom: 15, color: "#555" }}>🔒 Paiement via Stripe</Text>

          <Text>Numéro de carte</Text>
          <TextInput style={styles.input} value={cardNumber} onChangeText={setCardNumber} keyboardType="numeric" maxLength={16} />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text>Mois</Text>
              <TextInput style={styles.input} value={expMonth} onChangeText={setExpMonth} keyboardType="numeric" maxLength={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text>Année</Text>
              <TextInput style={styles.input} value={expYear} onChangeText={setExpYear} keyboardType="numeric" maxLength={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text>CVC</Text>
              <TextInput style={styles.input} value={cvc} onChangeText={setCvc} keyboardType="numeric" maxLength={3} />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleConfirmPayment}
            style={{ marginTop: 20, backgroundColor: "#2563eb", padding: 15, borderRadius: 10 }}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={{ color: "white", textAlign: "center" }}>Confirmer le paiement (10$)</Text>
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
    marginTop: 4,
  },
};