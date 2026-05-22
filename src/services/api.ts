import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "@/src/utils/baseURL";

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});