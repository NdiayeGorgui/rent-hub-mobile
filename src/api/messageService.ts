import { API } from "./api";

export const sendMessage = async (data:any) => {

  const res = await API.post("/messages/send", data);

  return res.data;
};


export const getUnreadMessagesCount = async () => {
  const res = await API.get("/messages/unread-count");
  return res.data;
};

export const getUserConversations = async () => {

  const res = await API.get("/messages/conversations");

  return res.data;

};

export const getConversationMessages = async (conversationId: number) => {

  const res = await API.get(`/messages/conversation/${conversationId}`);

  return res.data;

};

export const markMessageAsRead = async (messageId:number) => {
  await API.put(`/messages/${messageId}/read`)
}

export const sendSupportMessage = async (data: any) => {
  const res = await API.post("/messages/support", data);
  return res.data;
};