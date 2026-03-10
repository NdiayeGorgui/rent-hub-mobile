import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createReview } from "@/src/api/reviewService";

export default function CreateReviewScreen() {
  const router = useRouter();
  const { rentalId } = useLocalSearchParams();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    if (Platform.OS === "web") {
      if (confirm(message)) {
        onConfirm();
      }
    } else {
      Alert.alert(
        "Confirmation",
        message,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit", onPress: onConfirm },
        ]
      );
    }
  };

  const handleSubmit = () => {
    if (!rentalId) {
      showAlert("Error", "Missing rental ID");
      return;
    }

    if (rating < 1 || rating > 5) {
      showAlert("Error", "Rating must be between 1 and 5");
      return;
    }

    showConfirm(
      "Submit your review? This action cannot be undone.",
      async () => {
        try {
          setLoading(true);

          await createReview({
            rentalId: Number(rentalId),
            rating,
            comment,
          });

          showAlert("Success", "Review submitted");

          // 🧹 RESET FORM
          setRating(5);
          setComment("");

          // 🔙 Retour rentals proprement
          router.replace("/rentals");

        } catch (error: any) {
          showAlert(
            "Error",
            error?.response?.data?.message || "Review failed"
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f3f4f6" }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        Leave a Review
      </Text>

      <Text>Rating (1 - 5)</Text>
      <TextInput
        value={rating.toString()}
        onChangeText={(text) => setRating(Number(text))}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          borderRadius: 8,
          marginBottom: 20,
          backgroundColor: "#fff",
        }}
      />

      <Text>Comment</Text>
      <TextInput
        value={comment}
        onChangeText={setComment}
        multiline
        style={{
          borderWidth: 1,
          borderColor: "#ccc",
          padding: 10,
          borderRadius: 8,
          height: 120,
          backgroundColor: "#fff",
        }}
      />

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: "#2563eb",
          padding: 14,
          borderRadius: 10,
          marginTop: 25,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", textAlign: "center", fontWeight: "bold" }}>
            Submit Review
          </Text>
        )}
      </Pressable>
    </View>
  );
}