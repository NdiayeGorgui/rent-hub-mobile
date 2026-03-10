import { API } from "./api";

export const registerUser = async (data: any) => {
  const response = await API.post("/auth/register", data);
  return response.data;
};

export const loginUser = async (data: any) => {
  const response = await API.post("/auth/login", data);
  return response.data;
};

export const getCurrentUser = async () => {
  try {
    const response = await API.get("/profile/me");
    return response.data; // { id, username, email, roles, ... }
  } catch (error: any) {
    console.log("getCurrentUser error:", error.response?.data || error.message);
    return null;
  }
};


export const fetchUserProfile = async (userId: string) => {
  try {
    const response = await API.get(`/profile/${userId}`);
    return response.data; // { userId, username, fullName, ... }
  } catch (error: any) {
    console.log("getUser error:", error.response?.data || error.message);
    return null;
  }
};