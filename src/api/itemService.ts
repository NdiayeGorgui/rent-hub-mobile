import { Platform } from "react-native";
import { API } from "./api";
import axios from "axios";


const baseURL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080"
    : "http://localhost:8080";

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
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
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

  return response.data.content;
};

/*export const updateItem = async (id: number, data: any) => {
  return API.put(`/items/item/${id}`, data);
};*/
export const updateItem = async (id: number, data: any, images: any[]) => {
  const formData = new FormData();

  formData.append("data", JSON.stringify(data));

  console.log("🟡 DATA envoyée :", data);

  // 🔥 DEBUG IMAGES
  images.forEach((img, index) => {
    console.log(`🖼️ Image ${index}:`, img.uri);
  });

  // 🔥 Upload nouvelles images
  for (let i = 0; i < images.length; i++) {
    const img = images[i];

    if (
      img.uri.startsWith("file") ||
      img.uri.startsWith("blob")
    ) {
      console.log("🆕 Nouvelle image détectée :", img.uri);

      const uri =
        Platform.OS === "android"
          ? img.uri
          : img.uri.replace("file://", "");

      const response = await fetch(uri);
      const blob = await response.blob();

      console.log("✅ Blob créé pour :", img.uri);

      formData.append("images", blob, `image_${i}.jpg`);
    } else {
      console.log("📦 Image existante conservée :", img.uri);
    }
  }

  const existingUrls = images
    .filter(
      img =>
        !img.uri.startsWith("file") &&
        !img.uri.startsWith("blob")
    )
    .map(img => img.uri.replace(baseURL, ""));

  console.log("📁 existingUrls envoyées :", existingUrls);

  formData.append("existingImages", JSON.stringify(existingUrls));

  console.log("🚀 Envoi requête update...");

  return API.put(`/items/item/${id}/with-images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};