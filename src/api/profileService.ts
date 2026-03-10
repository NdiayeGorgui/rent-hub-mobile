import { API } from "./api";

export const fetchMyProfile = async () => {
  const response = await API.get("/profile/me");
  return response.data;
};


export const getUserProfile = async (userId: string) => {
  const res = await API.get(`/profile/${userId}`);
  return res.data;
};