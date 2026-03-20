import { API } from "./api";

export const createAuction = async (data: {
  itemId: number;
  startPrice: number;
  reservePrice:number;
  endDate: string;
}) => {
  const response = await API.post("/auctions", data);
  return response.data;
};

export const placeBid = async (auctionId: number, amount: number) => {
  await API.post(`/auctions/${auctionId}/bid`, {
    amount,
  });
};

export const getAuctionByItemId = async (itemId: number) => {
  const response = await API.get(`/auctions/by-item/${itemId}`);
  return response.data;
};

export const watchAuction = async (auctionId: number) => {
  const res = await API.post(`/auctions/${auctionId}/watch`)
  return res.data
};

export const isWatchingAuction = async (auctionId: number) => {

  const res = await API.get(`/auctions/${auctionId}/is-watching`)

  return res.data

};

export const getAuctionPublicByItemId = async (itemId: number) => {

  const res = await API.get(`/auctions/public/by-item/${itemId}`)

  return res.data

};

export const closeAuction = async (auctionId: number) => {
  const res = await API.post(`/auctions/${auctionId}/close`);
  return res.data;
};

export const updateAuction = async (id: number, data: any) => {
  return API.put(`/auctions/${id}`, data);
};