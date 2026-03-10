import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useState } from "react";
import { subscribeToPremium } from "@/src/api/paymentService.web";


export default function SubscriptionScreen() {
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleSubscribe = async () => {
    try {
      setLoading(true);

      // 🔥 montant fixe premium (ex: 9.99)
      const payment = await subscribeToPremium(9.99);

      console.log("Payment created:", payment);

      showAlert(
        "Succés",
        "Paiement envoyé"
      );

    } catch (error: any) {
      console.log(error);
      showAlert("Erreur", "Impossible de créer le paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>👑 Passer au Premium</Text>

      <Text style={styles.description}>
        - Plus de visibilité
        {"\n"}- Badge Premium
        {"\n"}- Mise en avant des items
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
          <Text style={styles.buttonText}>Payer maintenant</Text>
        )}
      </TouchableOpacity>
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
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});