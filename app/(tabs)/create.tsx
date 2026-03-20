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
import { Image } from "react-native";

export default function Create() {
  const router = useRouter();

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

  // 🔥 Vérifier premium au chargement
  useEffect(() => {
    const checkPremium = async () => {
      try {
        const result = await fetchPremiumStatus();
        setIsPremium(result.premium);
      } catch (error) {
        console.log("Premium check failed");
      }
    };


    checkPremium();
  }, []);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === "web") {
      alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const pickImages = async () => {

    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showAlert("Permission refusée", "Accès aux images refusé");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages(result.assets);
    }
  };

  const handleCreate = async () => {
    try {

      if (!title || !description || !categoryId || !city) {
        showAlert("Erreur", "Champs obligatoires manquants");
        return;
      }

      if (images.length === 0) {
        showAlert("Erreur", "Veuillez ajouter au moins une image");
        return;
      }

      const formData = new FormData();

      const itemData = {
        title,
        description,
        categoryId: Number(categoryId),
        type,
        pricePerDay: type === "RENTAL" ? Number(pricePerDay) : null,
        city,
        address,
      };

      formData.append("data", JSON.stringify(itemData));

      // 🔹 Modification ici : envoyer des Blobs pour Spring
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const uri = Platform.OS === "android" ? img.uri : img.uri.replace("file://", "");
        const response = await fetch(uri);
        const blob = await response.blob();

        formData.append("images", blob, `image_${i}.jpg`);
      }

      const createdItem = await createItem(formData);

      if (type === "AUCTION") {
         router.push(`/auction-fee/${createdItem.id}`);
        return;
      }

      showAlert("Succès", "Item créé !");
      resetForm();

    } catch (error) {
      console.log(error);
      showAlert("Erreur", "Impossible de créer");
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setPricePerDay("");
    setCity("");
    setAddress("");
    // setImageUrl("https://cdn.renthub.com/items/pression1.jpg");
    setType("RENTAL");
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Poster un item</Text>

      <TextInput
        placeholder="Titre *"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      {/* 🔥 TYPE SELECTOR */}
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            type === "RENTAL" && styles.typeButtonActive,
          ]}
          onPress={() => setType("RENTAL")}
        >
          <Text style={styles.typeText}>📦 Location</Text>
        </TouchableOpacity>

        <TouchableOpacity
          disabled={!isPremium}
          style={[
            styles.typeButton,
            type === "AUCTION" && styles.typeButtonActiveAuction,
            !isPremium && styles.disabledButton
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
        <Picker
          selectedValue={categoryId}
          onValueChange={(itemValue) => setCategoryId(itemValue)}
        >
          <Picker.Item label="Choisir une catégorie" value="" />

          {categories.map((cat) => (
            <Picker.Item
              key={cat.id}
              label={cat.name}
              value={String(cat.id)}
            />
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
          Choisir des images
        </Text>
      </TouchableOpacity>

      <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 15 }}>
        {images.map((img, index) => (
          <Image
            key={index}
            source={{ uri: img.uri }}
            style={{
              width: 90,
              height: 90,
              marginRight: 8,
              marginBottom: 8,
              borderRadius: 8,
            }}
          />
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleCreate}>
        <Text style={styles.buttonText}>Publier</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  container: {
    padding: 20,
    backgroundColor: "#f4f6f9",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },
  button: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  typeContainer: {
    flexDirection: "row",
    marginBottom: 15,
  },

  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ddd",
    alignItems: "center",
    marginRight: 8,
  },

  typeButtonActive: {
    backgroundColor: "#2563eb",
  },

  typeButtonActiveAuction: {
    backgroundColor: "#ef4444",
  },

  typeText: {
    color: "#fff",
    fontWeight: "bold",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
  },
  imageButton: {
    backgroundColor: "#16a34a",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
  },
});