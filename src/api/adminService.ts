import { API } from "./api";

/* =========================
   GET ALL USERS (ADMIN)
   ========================= */
export const getAllUsers = async () => {
  try {
    const response = await API.get("/admin/users");
    return response.data;
  } catch (error: any) {
    console.log(
      "getAllUsers error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/* =========================
   SUSPEND USER
   ========================= */
export const suspendUser = async (userId: string) => {
  try {
    await API.put(`/admin/users/${userId}/suspend`);
  } catch (error: any) {
    console.log(
      "suspendUser error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

/* =========================
   ACTIVATE USER
   ========================= */
export const activateUser = async (userId: string) => {
  try {
    await API.put(`/admin/users/${userId}/activate`);
  } catch (error: any) {
    console.log(
      "activateUser error:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const getAdminStats = async () => {
  const res = await API.get("/admin/stats");
  return res.data;
};