import { useState } from "react";
import { TextInput, TouchableOpacity, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: any;
}

export default function PasswordInput({ placeholder = "Mot de passe", value, onChangeText, style }: Props) {
  const [show, setShow] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <TextInput
        placeholder={placeholder}
        secureTextEntry={!show}
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        autoCapitalize="none"
      />
      <TouchableOpacity
        onPress={() => setShow(prev => !prev)}
        style={styles.icon}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name={show ? "eye-off-outline" : "eye-outline"}
          size={20}
          color="#9ca3af"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    paddingRight: 12,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  icon: {
    padding: 4,
  },
});