import { useEffect, useRef } from "react";
import { View, Text, Pressable, Animated, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendFaqFeedback } from "@/src/api/faqService";


export const FaqItem = ({ item, isOpen, onToggle }: any) => {
  const animatedHeight = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isOpen ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [isOpen]);

  const heightInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 120],
  });

  const handleFeedback = async (helpful: boolean) => {
    try {
      await sendFaqFeedback(item.id, helpful);
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
        <Text style={styles.answer}>{item.answer}</Text>

        <View style={styles.feedback}>
          <Text style={{ marginRight: 10 }}>Utile ?</Text>

          <Pressable onPress={() => handleFeedback(true)}>
            <Ionicons name="thumbs-up-outline" size={20} color="#16a34a" />
          </Pressable>

          <Pressable onPress={() => handleFeedback(false)} style={{ marginLeft: 10 }}>
            <Ionicons name="thumbs-down-outline" size={20} color="#dc2626" />
          </Pressable>
        </View>
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
  },
  question: {
    fontWeight: "600",
  },
  answer: {
    marginTop: 10,
    color: "#555",
  },
  feedback: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
});