import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const getBaseURL = () => {
  if (Platform.OS === "android") return "http://10.0.2.2:8080/api";
  if (Platform.OS === "web") return "http://localhost:8080/api";
   return "http://192.168.0.118:8080/api"; // vrai téléphone
};

export const API = axios.create({
  baseURL: getBaseURL(),
  // ❌ NE PAS forcer JSON ici
});

API.interceptors.request.use(async (config) => {
  let token: string | null = null;

  if (Platform.OS === "web") {
    token = localStorage.getItem("token");
  } else {
    token = await SecureStore.getItemAsync("token");
  }

  console.log("TOKEN SENT TO BACKEND:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // ✅ si c'est du FormData on laisse axios gérer le multipart
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});