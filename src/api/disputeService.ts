import { API } from "./api";

export const getMyDisputes = async () => {
  const res = await API.get("/disputes/my");
  return res.data;
};

export const createDispute = async (data: {
  rentalId: number;
  reason: string;
  description: string;
}) => {
  const res = await API.post("/disputes", data);
  return res.data;
};