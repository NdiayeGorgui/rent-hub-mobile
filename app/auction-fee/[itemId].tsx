import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { createAuctionPayment } from "@/src/api/paymentService.web";

export default function AuctionFeePage() {

  const { itemId } = useLocalSearchParams();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("Item reçu :", itemId);
  }, []);

const handlePay = async () => {
  try {

    if (!itemId) {
      alert("Item invalide");
      return;
    }

    setLoading(true);

    const payment = await createAuctionPayment(Number(itemId));

    if (payment.status === "PENDING") {

      alert("Paiement créé. Validation en cours.");

      // redirection vers le profil utilisateur
      router.push(`/my-items/${itemId}`);   
    }

  } catch (err) {
    console.log("Erreur paiement", err);
    alert("Erreur paiement");
  } finally {
    setLoading(false);
  }
};

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  return (
    <View style={{ padding: 20 }}>

      <Text style={{ fontSize: 22, fontWeight: "bold" }}>
        Publier une enchère
      </Text>

      <Text style={{ marginTop: 10 }}>
        La publication d'une enchère coûte 10$
      </Text>

      <TouchableOpacity
        onPress={handlePay}
        style={{
          marginTop: 20,
          backgroundColor: "#ef4444",
          padding: 15,
          borderRadius: 10
        }}
      >
        <Text style={{ color: "white", textAlign: "center" }}>
          Payer 10$
        </Text>

      </TouchableOpacity>

    </View>
  );
}