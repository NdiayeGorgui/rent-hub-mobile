import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { createItem } from "../../src/api/itemService";
import { fetchPremiumStatus } from "@/src/api/subscriptionService";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { Image,Pressable  } from "react-native";
import * as Location from "expo-location";
import { API } from "../../src/api/api"; // ← ajoute cette ligne
import * as SecureStore from "expo-secure-store";
import { KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Create() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [isPremium, setIsPremium] = useState(false);
  const [type, setType] = useState<"RENTAL" | "AUCTION">("RENTAL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pricePerDay, setPricePerDay] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [images, setImages] = useState<any[]>([]);

  const categories = [
    { id: 1, name: "Électronique" },
    { id: 2, name: "Électroménager" },
    { id: 3, name: "Événements" },
    { id: 4, name: "Véhicules" },
    { id: 5, name: "Bébé & Enfants" },
    { id: 6, name: "Sport & Loisirs" },
    { id: 7, name: "Maison & Meubles" },
    { id: 8, name: "Mode & Vêtements" },
    { id: 9, name: "Outils & Bricolage" },
    { id: 10, name: "Autres" },
  ];

  useEffect(() => {
    const checkPremium = async () => {
      try {
        const result = await fetchPremiumStatus();
        setIsPremium(result.premium);
      } catch {
        console.log("Premium check failed");
      }
    };
    checkPremium();
  }, []);

  // Ajoute la fonction remove
const removeImage = (index: number) => {
  setImages(prev => prev.filter((_, i) => i !== index));
};

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "Accès aux images refusé");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"], // ← fix warning
      allowsMultipleSelection: true,
      quality: 0.8,
    });

   
if (!result.canceled) {
  setImages(prev => [...prev, ...result.assets]); // ← accumule au lieu de remplacer
}


  };

  const handleCreate = async () => {
    try {
      if (!title || !description || !categoryId || !city) {
        Alert.alert("Erreur", "Champs obligatoires manquants");
        return;
      }

      if (images.length === 0) {
        Alert.alert("Erreur", "Veuillez ajouter au moins une image");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission refusée", "Activez la localisation");
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;

      const formData = new FormData();

      const itemData = {
        title,
        description,
        categoryId: Number(categoryId),
        type,
        pricePerDay: type === "RENTAL" ? Number(pricePerDay) : null,
        city,
        address,
        latitude,
        longitude,
      };

      formData.append("data", JSON.stringify(itemData));

      images.forEach((img, i) => {
        formData.append("images", {
          uri: img.uri,
          type: img.mimeType ?? "image/jpeg",
          name: `image_${i}.jpg`,
        } as any);
      });

      // ── TEST avec fetch natif ──
      const token = await SecureStore.getItemAsync("token");

      console.log("🚀 Envoi fetch...");

      const response = await fetch("http://192.168.0.118:8080/api/items/with-images", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("📡 FETCH STATUS:", response.status);

      const result = await response.json();
      console.log("✅ FETCH RESULT:", JSON.stringify(result));

      if (!response.ok) {
        Alert.alert("Erreur", result?.message || "Erreur serveur");
        return;
      }

      const createdItem = result;

      if (type === "AUCTION") {
        router.push(`/auction-fee/${createdItem.id}`);
        return;
      }

      Alert.alert("Succès", "Item créé !");
      setTitle(""); setDescription(""); setCategoryId("");
      setPricePerDay(""); setCity(""); setAddress("");
      setType("RENTAL"); setImages([]);

    } catch (error: any) {
      console.log("❌ ERROR:", error?.message);
      console.log("❌ ERROR CODE:", error?.code);
      Alert.alert("Erreur", "Impossible de créer");
    }
  };

 return (
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : undefined}
    keyboardVerticalOffset={insets.top + 20}
  >
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView
        contentContainerStyle={{
          ...styles.container,
          paddingBottom: insets.bottom + 150, // 🔥 LA CLÉ
        }}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Poster un item</Text>

      <TextInput
        placeholder="Titre *"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[styles.typeButton, type === "RENTAL" && styles.typeButtonActive]}
          onPress={() => setType("RENTAL")}
        >
          <Text style={styles.typeText}>📦 Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!isPremium}
          style={[
            styles.typeButton,
            type === "AUCTION" && styles.typeButtonActiveAuction,
            !isPremium && styles.disabledButton,
          ]}
          onPress={() => isPremium && setType("AUCTION")}
        >
          <Text style={styles.typeText}>
            🔥 Enchère {!isPremium && "(Premium requis)"}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="Description *"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        multiline
      />

      <View style={styles.pickerContainer}>
        <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
          <Picker.Item label="Choisir une catégorie" value="" />
          {categories.map((cat) => (
            <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} />
          ))}
        </Picker>
      </View>

      {type === "RENTAL" && (
        <TextInput
          placeholder="Prix / jour *"
          value={pricePerDay}
          onChangeText={setPricePerDay}
          keyboardType="numeric"
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Ville *"
        value={city}
        onChangeText={setCity}
        style={styles.input}
      />

      <TextInput
        placeholder="Adresse"
        value={address}
        onChangeText={setAddress}
        style={styles.input}
      />

   <TouchableOpacity style={styles.imageButton} onPress={pickImages}>
  <Text style={{ color: "white", fontWeight: "bold" }}>
    {images.length > 0 ? `${images.length} image(s) — Ajouter +` : "Choisir des images"}
  </Text>
</TouchableOpacity>

<View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 15 }}>
  {images.map((img, index) => (
    <View
      key={index}
      style={{ position: "relative", marginRight: 8, marginBottom: 8 }}
    >
      <Image
        source={{ uri: img.uri }}
        style={{ width: 90, height: 90, borderRadius: 8 }}
      />
      {/* Croix de suppression */}
      <Pressable
        onPress={() => removeImage(index)}
        style={{
          position: "absolute",
          top: -6,
          right: -6,
          backgroundColor: "rgba(0,0,0,0.75)",
          borderRadius: 10,
          width: 20,
          height: 20,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold", lineHeight: 16 }}>
          ×
        </Text>
      </Pressable>
    </View>
  ))}
</View>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Publier</Text>
      </TouchableOpacity>
         </ScrollView>
    </TouchableWithoutFeedback>
  </KeyboardAvoidingView>
);
}

const styles = StyleSheet.create({
  disabledButton: { backgroundColor: "#9ca3af" },
  container: { padding: 20, backgroundColor: "#f4f6f9" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 15 },
  button: { backgroundColor: "#2563eb", padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  typeContainer: { flexDirection: "row", marginBottom: 15 },
  typeButton: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: "#ddd", alignItems: "center", marginRight: 8 },
  typeButtonActive: { backgroundColor: "#2563eb" },
  typeButtonActiveAuction: { backgroundColor: "#ef4444" },
  typeText: { color: "#fff", fontWeight: "bold" },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 15 },
  imageButton: { backgroundColor: "#16a34a", padding: 14, borderRadius: 12, alignItems: "center", marginBottom: 15 },
});