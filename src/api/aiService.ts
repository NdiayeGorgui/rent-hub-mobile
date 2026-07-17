import { BASE_URL } from "@/src/utils/baseURL";
import * as SecureStore from "expo-secure-store";

const AI_BASE = __DEV__
  ? "http://192.168.0.118:9191/api/ai"
  : "https://api.gonifty.ca/api/ai";

const getHeaders = async () => {
  const token = await SecureStore.getItemAsync("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
};

export const generateDescription = async (data: {
  title: string;
  category_id: number;
  item_type: string;
  price_per_day?: number;
  city?: string;
}): Promise<string> => {
  const headers = await getHeaders();
  const res = await fetch(`${AI_BASE}/generate-description`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Erreur IA");
  return json.description;
};

export const suggestPrice = async (data: {
  title: string;
  category_id: number;
  item_type: string;
}): Promise<{
  min_price: number;
  max_price: number;
  recommended_price: number;
  reasoning: string;
}> => {
  const headers = await getHeaders();
  const res = await fetch(`${AI_BASE}/suggest-price`, {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Erreur IA");
  return json;
};