import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Pressable,
  Image,
} from "react-native";
import { useState, useEffect } from "react";
import { createItem } from "../../src/api/itemService";
import { fetchPremiumStatus } from "@/src/api/subscriptionService";
import { useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import * as SecureStore from "expo-secure-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BASE_URL } from "@/src/utils/baseURL";
import DateTimePicker from "@react-native-community/datetimepicker";
import { generateDescription, suggestPrice } from "@/src/api/aiService";

// Android uniquement
let DateTimePickerAndroid: any = null;
if (Platform.OS === "android") {
  DateTimePickerAndroid = require("@react-native-community/datetimepicker").DateTimePickerAndroid;
}

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
  const [postalCode, setPostalCode] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [creating, setCreating] = useState(false);

  // ── Champs auction ──────────────────────────────
  const [startPrice, setStartPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [auctionEndDate, setAuctionEndDate] = useState("");

  // iOS date picker
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [iosPickerMode, setIosPickerMode] = useState<"date" | "time">("date");
  const [tempDate, setTempDate] = useState(new Date());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [suggestingPrice, setSuggestingPrice] = useState(false);
  const [priceSuggestion, setPriceSuggestion] = useState<{
    min_price: number;
    max_price: number;
    recommended_price: number;
    reasoning: string;
  } | null>(null);
  const [generatingDesc, setGeneratingDesc] = useState(false);

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

  const handleGenerateDescription = async () => {
    if (!title || !categoryId) {
      Alert.alert("Info", "Entrez d'abord le titre et la catégorie");
      return;
    }
    try {
      setGeneratingDesc(true);
      const desc = await generateDescription({
        title,
        category_id: Number(categoryId),
        item_type: type,
        price_per_day: pricePerDay ? Number(pricePerDay) : undefined,
        city: city || undefined,
      });
      setDescription(desc);
    } catch {
      Alert.alert("Erreur", "Impossible de générer la description");
    } finally {
      setGeneratingDesc(false);
    }
  };

  const formatPostalCode = (value: string) => {
    const cleaned = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 6);

    if (cleaned.length <= 3) {
      return cleaned;
    }

    return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  };

  const handleSuggestPrice = async () => {
    if (!title || !categoryId) {
      Alert.alert("Info", "Entrez d'abord le titre et la catégorie");
      return;
    }
    try {
      setSuggestingPrice(true);
      setPriceSuggestion(null);
      const suggestion = await suggestPrice({
        title,
        category_id: Number(categoryId),
        item_type: type, // ← "RENTAL" ou "AUCTION"
      });
      setPriceSuggestion(suggestion);
    } catch {
      Alert.alert("Erreur", "Impossible d'obtenir une suggestion");
    } finally {
      setSuggestingPrice(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Requis";
    if (!description.trim()) e.description = "Requis";
    if (!categoryId) e.categoryId = "Requis";
    if (!city.trim()) e.city = "Requis";
    if (!address.trim()) e.address = "Requis";
    if (!postalCode.trim()) e.postalCode = "Requis";
    if (type === "RENTAL" && !pricePerDay) e.pricePerDay = "Requis";
    if (type === "AUCTION" && !startPrice) e.startPrice = "Requis";
    if (type === "AUCTION" && !auctionEndDate) e.auctionEndDate = "Requis";
    if (images.length === 0) e.images = "Au moins une image requise";
    return e;
  };

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
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages(prev => [...prev, ...result.assets]);
    }
  };

  // ── Date picker Android ──────────────────────────
  const openAuctionDatePicker = () => {
    if (Platform.OS === "android" && DateTimePickerAndroid) {
      DateTimePickerAndroid.open({
        value: auctionEndDate ? new Date(auctionEndDate) : new Date(),
        mode: "date",
        minimumDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        onChange: (event: any, selectedDate?: Date) => {
          if (event.type === "dismissed" || !selectedDate) return;
          DateTimePickerAndroid.open({
            value: selectedDate,
            mode: "time",
            is24Hour: true,
            onChange: (timeEvent: any, timeDate?: Date) => {
              if (timeEvent.type === "dismissed" || !timeDate) return;
              setAuctionEndDate(timeDate.toISOString());
            },
          });
        },
      });
    } else {
      // iOS
      setTempDate(auctionEndDate ? new Date(auctionEndDate) : new Date());
      setIosPickerMode("date");
      setShowIOSPicker(true);
    }
  };

  const formatDateLabel = (iso: string) => {
    if (!iso) return "Choisir une date et heure";
    const d = new Date(iso);
    return d.toLocaleDateString("fr-CA", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Composant inline pour label + erreur
  const FieldLabel = ({ label, required, error }: {
    label: string; required?: boolean; error?: string;
  }) => (
    <View style={{ marginBottom: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: "600", color: error ? "#ef4444" : "#374151" }}>
        {label}
        {required && <Text style={{ color: "#ef4444" }}> *</Text>}
      </Text>
      {error ? <Text style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>⚠ {error}</Text> : null}
    </View>
  );

  // Style d'input conditionnel
  const inputStyle = (hasError: boolean): any => ({
    backgroundColor: hasError ? "#fef2f2" : "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: hasError ? "#ef4444" : "#e5e7eb",
    fontSize: 14,
    color: "#111827",
  });

  // ── handleCreate ────────────────────────────────
  const handleCreate = async () => {
    try {
      const newErrors = validate();
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        // Scroll vers le haut pour voir les erreurs
        return;
      }
      setErrors({});
      // Validation du prix de réserve
      if (
        type === "AUCTION" &&
        reservePrice.trim() !== "" &&
        Number(reservePrice) < Number(startPrice)
      ) {
        Alert.alert(
          "Erreur",
          "Le prix de réserve doit être supérieur ou égal au prix de départ"
        );
        return;
      }
      if (images.length === 0) {
        Alert.alert("Erreur", "Veuillez ajouter au moins une image");
        return;
      }
      if (
        type === "AUCTION" &&
        reservePrice.trim() !== "" &&
        Number(reservePrice) > 0 &&
        Number(reservePrice) < Number(startPrice)
      ) {
        Alert.alert(
          "Erreur",
          "Le prix de réserve doit être supérieur ou égal au prix de départ"
        );
        return;
      }
      //todo
      const postalRegex = /^[A-Z]\d[A-Z]\s\d[A-Z]\d$/;

      if (!postalRegex.test(postalCode)) {
        Alert.alert(
          "Code postal invalide",
          "Format attendu : H2A 4C1"
        );
        return;
      }

      setCreating(true);

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
      formData.append("data", JSON.stringify({
        title,
        description,
        categoryId: Number(categoryId),
        type,
        pricePerDay: type === "RENTAL" ? Number(pricePerDay) : null,
        startPrice: type === "AUCTION" ? Number(startPrice) : null,
        reservePrice: type === "AUCTION"
          ? (!reservePrice || Number(reservePrice) <= 0
            ? Number(startPrice)
            : Number(reservePrice))
          : null,
        auctionEndDate: type === "AUCTION" ? auctionEndDate : null,
        city,
        address,
        postalCode,
        latitude,
        longitude,
      }));

      images.forEach((img, i) => {
        formData.append("images", {
          uri: img.uri,
          type: img.mimeType ?? "image/jpeg",
          name: `image_${i}.jpg`,
        } as any);
      });

      const token = await SecureStore.getItemAsync("token");
      const response = await fetch(`${BASE_URL}/api/items/with-images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        Alert.alert("Erreur", result?.message || "Erreur serveur");
        return;
      }

      const createdItem = result;

      if (type === "AUCTION") {
        // ← Redirige vers la page de paiement avec les params
        router.push({
          pathname: "/auction-fee",
          params: {
            itemId: createdItem.id.toString(),
            startPrice,
            reservePrice: reservePrice || startPrice,
            auctionEndDate,
          },
        } as any);
        return;
      }

      Alert.alert("Succès", "Item créé !");
      setTitle(""); setDescription(""); setCategoryId("");
      setPricePerDay(""); setCity(""); setAddress(""); setPostalCode("");
      setType("RENTAL"); setImages([]);

    } catch (error: any) {
      console.log("❌ ERROR:", error?.message);
      Alert.alert("Erreur", "Impossible de créer");
    } finally {
      setCreating(false);
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
          contentContainerStyle={{ ...styles.container, paddingBottom: insets.bottom + 150 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Poster un item</Text>

          {/* Toggle type */}
          <View style={styles.typeContainer}>
            <TouchableOpacity
              style={[styles.typeButton, type === "RENTAL" && styles.typeButtonActive]}
              onPress={() => { setType("RENTAL"); setErrors({}); }}
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
              onPress={() => { if (isPremium) { setType("AUCTION"); setErrors({}); } }}
            >
              <Text style={styles.typeText}>
                🔥 Enchère {!isPremium && "(Premium)"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Titre */}
          <FieldLabel label="Titre" required error={errors.title} />
          <TextInput
            placeholder="Titre de l'annonce"
            value={title}
            onChangeText={v => { setTitle(v); setErrors(p => ({ ...p, title: "" })); }}
            style={inputStyle(!!errors.title)}
          />
          {!errors.title && <View style={{ height: 10 }} />}

          {/* Catégorie */}
          <FieldLabel label="Catégorie" required error={errors.categoryId} />
          <View style={[
            styles.pickerContainer,
            errors.categoryId && { borderWidth: 1, borderColor: "#ef4444", backgroundColor: "#fef2f2" }
          ]}>
            <Picker
              selectedValue={categoryId}
              onValueChange={v => { setCategoryId(v); setErrors(p => ({ ...p, categoryId: "" })); }}
            >
              <Picker.Item label="Choisir une catégorie" value="" />
              {categories.map(cat => (
                <Picker.Item key={cat.id} label={cat.name} value={String(cat.id)} />
              ))}
            </Picker>
          </View>
          {!errors.categoryId && <View style={{ height: 10 }} />}

          {/* Description */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <Text style={{ fontSize: 12, fontWeight: "600", color: errors.description ? "#ef4444" : "#374151" }}>
              Description <Text style={{ color: "#ef4444" }}>*</Text>
            </Text>
            <TouchableOpacity
              onPress={handleGenerateDescription}
              disabled={generatingDesc || !title || !categoryId}
              style={{
                backgroundColor: generatingDesc || !title || !categoryId ? "#c4b5fd" : "#7c3aed",
                paddingVertical: 6, paddingHorizontal: 12,
                borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4,
              }}
            >
              {generatingDesc
                ? <><ActivityIndicator color="#fff" size="small" /><Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}> Génération...</Text></>
                : <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>✨ Générer avec l'IA</Text>
              }
            </TouchableOpacity>
          </View>
          {errors.description ? <Text style={{ fontSize: 11, color: "#ef4444", marginBottom: 4 }}>⚠ {errors.description}</Text> : null}
          <TextInput
            placeholder="Décrivez votre article... ou utilisez l'IA ✨"
            value={description}
            onChangeText={v => { setDescription(v); setErrors(p => ({ ...p, description: "" })); }}
            style={[inputStyle(!!errors.description), { minHeight: 100, textAlignVertical: "top" }]}
            multiline
          />
          {!errors.description && <View style={{ height: 10 }} />}



          {/* Prix location */}
          {type === "RENTAL" && (
            <>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: errors.pricePerDay ? "#ef4444" : "#374151" }}>
                  Prix / jour ($) <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handleSuggestPrice}
                  disabled={suggestingPrice || !title || !categoryId}
                  style={{
                    backgroundColor: suggestingPrice || !title || !categoryId ? "#c4b5fd" : "#7c3aed",
                    paddingVertical: 6, paddingHorizontal: 12,
                    borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4,
                  }}
                >
                  {suggestingPrice
                    ? <><ActivityIndicator color="#fff" size="small" /><Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}> Analyse...</Text></>
                    : <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>✨ Suggérer</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Suggestion IA */}
              {priceSuggestion && (
                <View style={{ backgroundColor: "#f5f3ff", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#ddd6fe" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#7c3aed", marginBottom: 8 }}>💡 Suggestion IA — Prix / jour</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                    {[
                      { label: "Min", value: priceSuggestion.min_price },
                      { label: "Recommandé ⭐", value: priceSuggestion.recommended_price, highlight: true },
                      { label: "Max", value: priceSuggestion.max_price },
                    ].map(({ label, value, highlight }) => (
                      <TouchableOpacity
                        key={label}
                        onPress={() => { setPricePerDay(String(value)); setErrors(p => ({ ...p, pricePerDay: "" })); setPriceSuggestion(null); }}
                        style={{
                          flex: 1, alignItems: "center", padding: 8, borderRadius: 10,
                          backgroundColor: highlight ? "#7c3aed" : "#fff",
                          borderWidth: 1, borderColor: highlight ? "#7c3aed" : "#ddd6fe",
                        }}
                      >
                        <Text style={{ fontSize: 10, color: highlight ? "#e9d5ff" : "#6b7280", marginBottom: 2 }}>{label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: highlight ? "#fff" : "#7c3aed" }}>{value} $</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic", marginBottom: 6 }}>
                    {priceSuggestion.reasoning}
                  </Text>
                  <TouchableOpacity onPress={() => setPriceSuggestion(null)}>
                    <Text style={{ fontSize: 11, color: "#9ca3af" }}>✕ Fermer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {errors.pricePerDay ? <Text style={{ fontSize: 11, color: "#ef4444", marginBottom: 4 }}>⚠ {errors.pricePerDay}</Text> : null}
              <TextInput
                placeholder="Ex: 25"
                value={pricePerDay}
                onChangeText={v => { setPricePerDay(v); setErrors(p => ({ ...p, pricePerDay: "" })); }}
                keyboardType="numeric"
                style={inputStyle(!!errors.pricePerDay)}
              />
              {!errors.pricePerDay && <View style={{ height: 10 }} />}
            </>
          )}

          {/* Champs enchère */}
          {type === "AUCTION" && (
            <View style={styles.auctionBox}>
              <Text style={styles.auctionBoxTitle}>🔥 Paramètres enchère</Text>

              {/* Prix de départ + bouton IA */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: errors.startPrice ? "#ef4444" : "#374151" }}>
                  Prix de départ ($) <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={handleSuggestPrice}
                  disabled={suggestingPrice || !title || !categoryId}
                  style={{
                    backgroundColor: suggestingPrice || !title || !categoryId ? "#c4b5fd" : "#7c3aed",
                    paddingVertical: 6, paddingHorizontal: 12,
                    borderRadius: 8, flexDirection: "row", alignItems: "center", gap: 4,
                  }}
                >
                  {suggestingPrice
                    ? <><ActivityIndicator color="#fff" size="small" /><Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}> Analyse...</Text></>
                    : <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600" }}>✨ Suggérer</Text>
                  }
                </TouchableOpacity>
              </View>

              {/* Suggestion IA enchère */}
              {priceSuggestion && (
                <View style={{ backgroundColor: "#f5f3ff", borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#ddd6fe" }}>
                  <Text style={{ fontSize: 11, fontWeight: "700", color: "#7c3aed", marginBottom: 8 }}>💡 Suggestion IA — Prix de départ enchère</Text>
                  <View style={{ flexDirection: "row", gap: 6, marginBottom: 8 }}>
                    {[
                      { label: "Min", value: priceSuggestion.min_price },
                      { label: "Recommandé ⭐", value: priceSuggestion.recommended_price, highlight: true },
                      { label: "Max", value: priceSuggestion.max_price },
                    ].map(({ label, value, highlight }) => (
                      <TouchableOpacity
                        key={label}
                        onPress={() => { setStartPrice(String(value)); setErrors(p => ({ ...p, startPrice: "" })); setPriceSuggestion(null); }}
                        style={{
                          flex: 1, alignItems: "center", padding: 8, borderRadius: 10,
                          backgroundColor: highlight ? "#7c3aed" : "#fff",
                          borderWidth: 1, borderColor: highlight ? "#7c3aed" : "#ddd6fe",
                        }}
                      >
                        <Text style={{ fontSize: 10, color: highlight ? "#e9d5ff" : "#6b7280", marginBottom: 2 }}>{label}</Text>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: highlight ? "#fff" : "#7c3aed" }}>{value} $</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={{ fontSize: 11, color: "#6b7280", fontStyle: "italic", marginBottom: 6 }}>
                    {priceSuggestion.reasoning}
                  </Text>
                  <TouchableOpacity onPress={() => setPriceSuggestion(null)}>
                    <Text style={{ fontSize: 11, color: "#9ca3af" }}>✕ Fermer</Text>
                  </TouchableOpacity>
                </View>
              )}

              {errors.startPrice ? <Text style={{ fontSize: 11, color: "#ef4444", marginBottom: 4 }}>⚠ {errors.startPrice}</Text> : null}
              <TextInput
                placeholder="Ex: 50"
                value={startPrice}
                onChangeText={v => { setStartPrice(v); setErrors(p => ({ ...p, startPrice: "" })); }}
                keyboardType="numeric"
                style={inputStyle(!!errors.startPrice)}
              />
              <View style={{ height: 10 }} />

              {/* Prix de réserve */}
              <FieldLabel label="Prix de réserve ($) (optionnel)" />
              <TextInput
                placeholder="Laissez vide si aucun"
                value={reservePrice}
                onChangeText={setReservePrice}
                keyboardType="numeric"
                style={inputStyle(false)}
              />
              <View style={{ height: 10 }} />

              {/* Date de fin — inchangée */}
              <FieldLabel label="Date et heure de fin" required error={errors.auctionEndDate} />
              <TouchableOpacity
                onPress={() => { openAuctionDatePicker(); setErrors(p => ({ ...p, auctionEndDate: "" })); }}
                style={[styles.datePicker, errors.auctionEndDate && { borderColor: "#ef4444", backgroundColor: "#fef2f2" }]}
              >
                <Text style={{ color: auctionEndDate ? "#111827" : "#9ca3af", fontSize: 14 }}>
                  📅 {formatDateLabel(auctionEndDate)}
                </Text>
              </TouchableOpacity>
              {Platform.OS === "ios" && showIOSPicker && (
                <View>
                  <DateTimePicker
                    value={tempDate}
                    mode={iosPickerMode}
                    minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                    display="spinner"
                    onChange={(event: any, date?: Date) => {
                      if (!date) return;
                      if (iosPickerMode === "date") { setTempDate(date); setIosPickerMode("time"); }
                      else { setAuctionEndDate(date.toISOString()); setShowIOSPicker(false); }
                    }}
                  />
                  <TouchableOpacity onPress={() => setShowIOSPicker(false)} style={{ alignItems: "center", padding: 10 }}>
                    <Text style={{ color: "#ef4444", fontWeight: "600" }}>Annuler</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 4 }}>Minimum 24h à partir de maintenant</Text>
            </View>
          )}

          {/* Ville */}
          <FieldLabel label="Ville" required error={errors.city} />
          <TextInput
            placeholder="Ex: Montréal"
            value={city}
            onChangeText={v => { setCity(v); setErrors(p => ({ ...p, city: "" })); }}
            style={inputStyle(!!errors.city)}
          />
          {!errors.city && <View style={{ height: 10 }} />}

          {/* Adresse */}
          <FieldLabel label="Adresse" required error={errors.address} />
          <TextInput
            placeholder="Ex: 123 rue Sainte-Catherine"
            value={address}
            onChangeText={v => { setAddress(v); setErrors(p => ({ ...p, address: "" })); }}
            style={inputStyle(!!errors.address)}
          />
          {!errors.address && <View style={{ height: 10 }} />}
          <View style={{ height: 10 }} />

          {/* Code postal */}
          <FieldLabel label="Code postal" required error={errors.postalCode} />
          <TextInput
            placeholder="Ex: H2X 1Y4"
            value={postalCode}
            autoCapitalize="characters"
            onChangeText={v => {
              setPostalCode(formatPostalCode(v));
              setErrors(p => ({ ...p, postalCode: "" }));
            }}
            style={inputStyle(!!errors.postalCode)}
          />
          {!errors.postalCode && <View style={{ height: 10 }} />}
          <View style={{ height: 10 }} />

          {/* Images */}
          <FieldLabel label="Images" required error={errors.images} />
          <TouchableOpacity
            style={[
              styles.imageButton,
              errors.images && { backgroundColor: "#dc2626" }
            ]}
            onPress={() => { pickImages(); setErrors(p => ({ ...p, images: "" })); }}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              {images.length > 0 ? `${images.length} image(s) — Ajouter +` : "Choisir des images"}
            </Text>
          </TouchableOpacity>
          {!errors.images && <View style={{ height: 6 }} />}

          {/* Prévisualisation */}
          {images.length > 0 && (
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginBottom: 15 }}>
              {images.map((img, index) => (
                <View key={index} style={{ position: "relative", marginRight: 8, marginBottom: 8 }}>
                  <Image
                    source={{ uri: img.uri }}
                    style={{ width: 90, height: 90, borderRadius: 8 }}
                  />
                  <Pressable
                    onPress={() => removeImage(index)}
                    style={{
                      position: "absolute", top: -6, right: -6,
                      backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 10,
                      width: 20, height: 20, justifyContent: "center", alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "bold" }}>×</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          )}

          {/* Bouton publier */}
          <TouchableOpacity
            style={[styles.button, creating && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={creating}
          >
            {creating ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.buttonText}>Publication en cours...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Publier</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );

}

const styles = StyleSheet.create({
  buttonDisabled: { backgroundColor: "#9ca3af" },
  disabledButton: { backgroundColor: "#9ca3af" },
  container: { padding: 20, backgroundColor: "#f4f6f9" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  input: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 12 },
  button: { backgroundColor: "#2563eb", padding: 15, borderRadius: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold" },
  typeContainer: { flexDirection: "row", marginBottom: 15, gap: 8 },
  typeButton: {
    flex: 1, padding: 12, borderRadius: 12,
    backgroundColor: "#ddd", alignItems: "center",
  },
  typeButtonActive: { backgroundColor: "#2563eb" },
  typeButtonActiveAuction: { backgroundColor: "#ef4444" },
  typeText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  pickerContainer: { backgroundColor: "#fff", borderRadius: 12, marginBottom: 12 },
  imageButton: {
    backgroundColor: "#16a34a", padding: 14,
    borderRadius: 12, alignItems: "center", marginBottom: 15,
  },
  auctionBox: {
    backgroundColor: "#fff7ed",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  auctionBoxTitle: {
    fontWeight: "700", color: "#c2410c",
    fontSize: 15, marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12, fontWeight: "600",
    color: "#374151", marginBottom: 6,
  },
  datePicker: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
});
