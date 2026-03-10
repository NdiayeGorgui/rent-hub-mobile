import { api } from "../../services/api";
import * as SecureStore from "expo-secure-store";

export const login = async (email: string, password: string) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const token = response.data.token;

  await SecureStore.setItemAsync("token", token);

  return response.data;
};

export const getToken = async () => {
  return await SecureStore.getItemAsync("token");
};

export const logout = async () => {
  await SecureStore.deleteItemAsync("token");
};