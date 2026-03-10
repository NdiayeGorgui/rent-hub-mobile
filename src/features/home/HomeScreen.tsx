import { View, Text } from "react-native";

import { useQuery } from "@tanstack/react-query";
import { getItems } from "../items/itemService";

const { data, isLoading } = useQuery({
  queryKey: ["items"],
  queryFn: getItems,
});

export default function HomeScreen() {
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 28, fontWeight: "bold" }}>
        RentHub
      </Text>
    </View>
  );
}