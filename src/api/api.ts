import axios from "axios";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";

const getBaseURL = () => {
  if (__DEV__) {
    // Dev — même URL pour Android et iOS
    return "http://192.168.0.118:9191/api"; // ← port 9191
  }
  // Prod
  return "https://api.gonifty.ca/api";
};

export const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
});

// ── Intercepteur requête ──────────────────────────────
API.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"]; // ← très important
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

// ── Intercepteur réponse — détecte 401 ───────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Supprime le token expiré
      await SecureStore.deleteItemAsync("token");
      // Redirige vers login
      router.replace("/(auth)/login");
    }
    return Promise.reject(error);
  }
);