import { API } from "./api";

export const getMyNotifications = async () => {
  const res = await API.get("/notifications/me");
  return res.data;
};

export const markNotificationAsRead = async (id: number) => {
  await API.put(`/notifications/${id}/read`);
};

export const markAllNotificationsAsRead = async () => {
  await API.put("/notifications/me/read-all");
};

export const getUnreadCount = async () => {
  const res = await API.get("/notifications/me");
  return res.data.filter((n: any) => !n.read).length;
};