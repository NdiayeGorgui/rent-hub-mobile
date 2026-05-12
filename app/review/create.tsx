import { useState } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createReview } from "@/src/api/reviewService";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreateReviewScreen() {
  const router = useRouter();
  const { rentalId } = useLocalSearchParams();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const ratingLabels: Record<number, string> = {
    1: "😞 Très mauvais",
    2: "😐 Mauvais",
    3: "🙂 Correct",
    4: "😊 Bien",
    5: "🤩 Excellent",
  };

  const handleSubmit = () => {
    if (!rentalId) { Alert.alert("Erreur", "ID de location manquant"); return; }
    if (rating < 1) { Alert.alert("Erreur", "Veuillez choisir une note"); return; }

    Alert.alert(
      "Confirmation",
      "Soumettre votre avis ? Cette action est irréversible.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Soumettre",
          onPress: async () => {
            try {
              setLoading(true);
              await createReview({ rentalId: Number(rentalId), rating, comment });
              Alert.alert("Succès", "Avis soumis !");
              setRating(0);
              setComment("");
              router.replace("/rentals");
            } catch (error: any) {
              Alert.alert("Erreur", error?.response?.data?.message || "Échec de l'avis");
            } finally {
              setLoading(false);
            }
          }
        },
      ]
    );
  };

return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
    keyboardVerticalOffset={insets.top + 20}
  >
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: insets.bottom + 30,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.title}>Laisser un avis</Text>

        {/* ── Étoiles ── */}
        <View style={styles.starsCard}>
          <Text style={styles.starsLabel}>Votre note</Text>

          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.star,
                    star <= rating
                      ? styles.starActive
                      : styles.starInactive,
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {rating > 0 ? (
            <Text style={styles.ratingLabel}>
              {ratingLabels[rating]}
            </Text>
          ) : (
            <Text style={styles.ratingPlaceholder}>
              Appuyez sur une étoile
            </Text>
          )}
        </View>

        {/* ── Commentaire ── */}
        <View style={styles.commentCard}>
          <Text style={styles.commentLabel}>
            Commentaire{" "}
            <Text
              style={{
                color: "#9ca3af",
                fontWeight: "400",
              }}
            >
              (optionnel)
            </Text>
          </Text>

          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            placeholder="Partagez votre expérience..."
            placeholderTextColor="#9ca3af"
            style={styles.commentInput}
          />

          <Text style={styles.charCount}>
            {comment.length} / 500
          </Text>
        </View>

        {/* ── Bouton ── */}
        <Pressable
          onPress={handleSubmit}
          disabled={loading || rating === 0}
          style={[
            styles.submitButton,
            (loading || rating === 0) &&
              styles.submitButtonDisabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              Soumettre l'avis
            </Text>
          )}
        </Pressable>

        {rating === 0 && (
          <Text style={styles.hint}>
            Choisissez une note pour pouvoir soumettre
          </Text>
        )}
      </View>
    </ScrollView>
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f6f9" },
  title: { fontSize: 24, fontWeight: "800", color: "#111827", marginBottom: 24 },

  starsCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 20,
    alignItems: "center", marginBottom: 16,
    elevation: 2,
  },
  starsLabel: { fontSize: 13, fontWeight: "600", color: "#6b7280", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 },
  starsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  starButton: { padding: 4 },
  star: { fontSize: 44 },
  starActive: { color: "#f59e0b" },
  starInactive: { color: "#d1d5db" },
  ratingLabel: { fontSize: 15, fontWeight: "600", color: "#374151" },
  ratingPlaceholder: { fontSize: 13, color: "#9ca3af" },

  commentCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    marginBottom: 20, elevation: 2,
  },
  commentLabel: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 10 },
  commentInput: {
    borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10,
    padding: 12, height: 120, fontSize: 14, color: "#111827",
    textAlignVertical: "top", backgroundColor: "#f9fafb",
  },
  charCount: { fontSize: 11, color: "#9ca3af", textAlign: "right", marginTop: 6 },

  submitButton: {
    backgroundColor: "#2563eb", padding: 16,
    borderRadius: 14, alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: "#9ca3af" },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  hint: { textAlign: "center", color: "#9ca3af", fontSize: 12, marginTop: 10 },
  
});