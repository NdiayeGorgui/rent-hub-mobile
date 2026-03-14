import { API } from "./api";

/*export const getAllItemsAdmin = async () => {
  const res = await API.get("/admin/items");
  return res.data;
};*/


export const getAllItemsAdmin = async () => {
  const res = await API.get("/admin/items/full");
  return res.data;
};

export const activateItemAdmin = async (id: number) => {
  return API.put(`/admin/items/${id}/activate`);
};

export const deactivateItemAdmin = async (id: number) => {
  return API.put(`/admin/items/${id}/deactivate`);
};