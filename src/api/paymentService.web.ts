import { API } from "./api";

export interface PaymentResponse {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
  paymentIntentId: string;
  clientSecret: string;
}

export const subscribeToPremium = async (amount: number) => {
  const response = await API.post<PaymentResponse>(
    "/payments/subscribe",
    { amount }
  );

  return response.data;
};

export const confirmPayment = async (intentId:any) => {
  return API.post(`/payments/confirm/${intentId}`);
};

export const getMyPayments = async (): Promise<PaymentResponse[]> => {
  const res = await API.get<PaymentResponse[]>("/payments/me");
  return res.data;
};

export const getAllPayments = async () => {
  const res = await API.get("/payments");
  return res.data;
};

export const getPendingPayments = async () => {
  const { data } = await API.get("/payments/pending");
  return data;
};

