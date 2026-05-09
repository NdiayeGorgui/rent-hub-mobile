import { Platform } from "react-native";
import { API } from "./api";
import axios from "axios";
import * as SecureStore from "expo-secure-store";


const baseURL =
  Platform.OS === "android"
    ? "http://192.168.0.118:8080"
    : "http://192.168.0.118:8080";

// Liste des items actifs
export const fetchItems = async () => {
  const response = await API.get("/items");
  return response.data; // ici, response.data est une liste de ItemResponseDTO
};

// Mes items
export const fetchMyItems = async () => {
  const response = await API.get("/items/me");
  return response.data;
};

// 🔥 Détails item
export const fetchItemDetails = async (id: number) => {
  const response = await API.get(`/items/${id}/details`);
  return response.data;
  };

  // 🔥 Poster item item
 /* export const createItem = async (data: any) => {
  const response = await API.post("/items", data);
  return response.data;
};*/

export const createItem = async (formData: FormData) => {
  const response = await API.post(
    "/items/with-images",
    formData,
    // ← supprime complètement le headers ici
  );
  return response.data;
};

// 🔥 Désactiver item
export const deactivateItem = async (id: number) => {
  const response = await API.put(`/items/${id}`);
  return response.data;
};

export const activateItem = async (id: number) => {
  const response = await API.put(`/items/${id}/activate`);
  return response.data;
};

// 🔎 Recherche avec filtres
export const searchItems = async (filters: any) => {

  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== null && v !== "")
  );

  const response = await API.get("/items/search", {
    params: cleanFilters,
  });

  return response.data;
};

/*export const updateItem = async (id: number, data: any) => {
  return API.put(`/items/item/${id}`, data);
};*/
export const updateItem = async (id: number, data: any, images: any[]) => {
  const formData = new FormData();

  formData.append("data", JSON.stringify(data));

  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    if (img.uri.startsWith("file") || img.uri.startsWith("blob")) {
      formData.append("images", {
        uri: img.uri,
        type: "image/jpeg",
        name: `image_${i}.jpg`,
      } as any);
    }
  }

  const existingUrls = images
    .filter(img => !img.uri.startsWith("file") && !img.uri.startsWith("blob"))
    .map(img => img.uri.replace(baseURL, ""));

  formData.append("existingImages", JSON.stringify(existingUrls));

  // ── fetch natif comme createItem ──
  const token = await SecureStore.getItemAsync("token");

  const response = await fetch(`http://192.168.0.118:8080/api/items/item/${id}/with-images`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  console.log("UPDATE STATUS:", response.status);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error?.message || "Erreur modification");
  }

  return response.json();
};

export const getNearbyItems = async (lat: number, lng: number, radiusKm = 10) => {
  const response = await API.get("/items/nearby", {
    params: { lat, lng, radiusKm }
  });
  return response.data;
};

