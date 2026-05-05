import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendFaqFeedback } from "@/src/api/faqService";

export const FaqItem = ({ item, isOpen, onToggle }: any) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null); // ← ajoute

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  // ← hauteur dynamique selon taille du texte
  const heightInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300], // ← augmente de 120 à 300
  });

  const handleFeedback = async (helpful: boolean) => {
    if (feedback !== null) return; // ← déjà voté
    try {
      await sendFaqFeedback(item.id, helpful);
      setFeedback(helpful ? "up" : "down"); // ← mémorise le vote
    } catch (e) {
      console.log("feedback error");
    }
  };

  return (
    <View style={styles.card}>
      <Pressable onPress={onToggle}>
        <Text style={styles.question}>
          {isOpen ? "▼ " : "▶ "} {item.question}
        </Text>
      </Pressable>

      <Animated.View style={{ height: heightInterpolate, overflow: "hidden" }}>
        {/* ← ScrollView pour les longs textes */}
        <ScrollView
          scrollEnabled={isOpen}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1 }}
        >
          <Text style={styles.answer}>{item.answer}</Text>

          <View style={styles.feedback}>
            {feedback ? (
              // ← message de confirmation
              <Text style={styles.thankYou}>
                {feedback === "up" ? "👍 Merci pour votre retour !" : "👎 Nous allons améliorer cette réponse."}
              </Text>
            ) : (
              <>
                <Text style={{ marginRight: 10, color: "#555" }}>Utile ?</Text>
                <Pressable
                  onPress={() => handleFeedback(true)}
                  style={[styles.feedbackBtn, styles.feedbackBtnUp]}
                >
                  <Ionicons name="thumbs-up-outline" size={16} color="#16a34a" />
                  <Text style={styles.feedbackBtnTextUp}>Oui</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleFeedback(false)}
                  style={[styles.feedbackBtn, styles.feedbackBtnDown]}
                >
                  <Ionicons name="thumbs-down-outline" size={16} color="#dc2626" />
                  <Text style={styles.feedbackBtnTextDown}>Non</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    elevation: 2,
  },
  question: {
    fontWeight: "600",
    fontSize: 15,
  },
  answer: {
    marginTop: 10,
    color: "#555",
    lineHeight: 22,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  feedbackBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  feedbackBtnUp: {
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#86efac",
  },
  feedbackBtnDown: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  feedbackBtnTextUp: {
    color: "#16a34a",
    fontSize: 13,
    fontWeight: "600",
  },
  feedbackBtnTextDown: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
  },
  thankYou: {
    color: "#555",
    fontSize: 13,
    fontStyle: "italic",
  },
});