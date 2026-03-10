import { API } from "./api";

export const createAuction = async (data: {
  itemId: number;
  startPrice: number;
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