import { API } from "./api";

// 🔹 USER
export const getAllFaqs = async () => {
  const res = await API.get("/faqs");
  return res.data;
};

export const getFaqsByTheme = async (theme: string) => {
  const res = await API.get(`/faqs/theme/${theme}`);
  return res.data;
};

// 🔹 ADMIN
export const createFaq = async (data: any) => {
  const res = await API.post("/faqs", data);
  return res.data;
};

export const updateFaq = async (id: number, data: any) => {
  const res = await API.put(`/faqs/${id}`, data);
  return res.data;
};

export const deleteFaq = async (id: number) => {
  await API.delete(`/faqs/${id}`);
};

export const sendFaqFeedback = async (id: number, helpful: boolean) => {
  await API.put(`/faqs/${id}/feedback?helpful=${helpful}`);
};