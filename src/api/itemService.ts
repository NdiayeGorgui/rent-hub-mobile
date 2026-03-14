import { API } from "./api";
import axios from "axios";

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
  const response = await API.delete(`/items/${id}`);
  return response.data;
};

export const activateItem = async (id: number) => {
  return API.put(`/items/${id}/activate`);
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

