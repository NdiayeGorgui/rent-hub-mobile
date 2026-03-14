import { API } from "./api";

export const fetchPremiumStatus = async () => {
  const response = await API.get("/subscriptions/me");
  return response.data;
};

export async function cancelSubscription() {
  const res = await API.post("/subscriptions/cancel");
  return res.data;
}