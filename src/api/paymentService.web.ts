import { API } from "./api";

export interface PaymentResponse {
  id: number;
  amount: number;
  itemId:number;
  auctionId:number;
  status: string;
  createdAt: string;
  paymentIntentId: string;
  clientSecret: string;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  intentId: string;
}

export const subscribeToPremium = async (amount: number) => {
  const response = await API.post<PaymentIntentResponse>(
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

export const createAuctionPayment = async (itemId: number) => {
  const response = await API.post<PaymentIntentResponse>(
    `/payments/auction-fee/${itemId}`
  );

  return response.data;
};


export const refundAuctionFee = async (paymentIntentId: string) => {
  return API.post(
    `/payments/admin/refund-auction-fee?paymentIntentId=${paymentIntentId}`
  );
};

export const cancelAuctionPayment = async (data: {
  auctionId: number;
  itemId: number;
  userId: string;
  amount: number;
}) => {
  const res = await API.post("/payments/auction/cancel", data);
  return res.data;
};

export const payPenalty = async () => {
    const res = await API.post("/payments/penalty/pay");
    return res.data; // { clientSecret, intentId }
};



