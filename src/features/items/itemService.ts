import { api } from "../../services/api";

export const getItems = async () => {
  const response = await api.get("/items");
  return response.data;
};