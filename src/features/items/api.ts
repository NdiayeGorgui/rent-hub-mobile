import { API } from "../../api/api";
import { Item } from "../types";


export const fetchItems = async (): Promise<Item[]> => {
  const response = await API.get<Item[]>("/items");
  return response.data;
};