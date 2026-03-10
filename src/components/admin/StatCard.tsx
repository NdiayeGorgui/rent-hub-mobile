import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function StatCard({
  title,
  value,
  icon,
  color,
}: any) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "white",
        borderRadius: 14,
        padding: 16,
        margin: 6,
        shadowColor: "#000",
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      <Ionicons name={icon} size={24} color={color} />

      <Text
        style={{
          marginTop: 10,
          fontSize: 22,
          fontWeight: "bold",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: "#6b7280",
          marginTop: 4,
        }}
      >
        {title}
      </Text>
    </View>
  );
}