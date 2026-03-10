import { API } from "./api";

export const fetchPremiumStatus = async () => {
  const response = await API.get("/subscriptions/me");
  return response.data;
};