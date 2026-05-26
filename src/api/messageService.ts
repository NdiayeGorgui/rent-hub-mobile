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

export const sendMessageWithImage = async (formData: FormData) => {
  const res = await API.post("/messages/send-with-image", formData);
  return res.data;
};

export const sendContact = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}) => {
  const res = await API.post("/messages/contact", data);
  return res.data;
};

export const subscribeNewsletter = (email: string) =>
  API.post("/newsletter/subscribe", { email });

export const getSubscribers = () =>
  API.get("/newsletter/subscribers");

export const sendNewsletter = (subject: string, body: string) =>
  API.post("/newsletter/send", { subject, body });