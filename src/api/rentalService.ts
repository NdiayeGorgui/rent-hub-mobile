import { API } from "./api";

/* =========================
   TYPES
========================= */

export interface RentalResponse {
  id: number;
  itemId: number;
  ownerId: string;
  renterId: string;
  startDate: string;
  endDate: string;
  status: "CREATED" | "APPROVED" | "CANCELLED" | "ONGOING" | "ENDED";
  totalPrice: number;
  createdAt: string;
}

/* =========================
   FETCH
========================= */

export const fetchMyRentals = async (): Promise<RentalResponse[]> => {
  const response = await API.get("/rentals/me");
  return response.data;
};

export const fetchOwnerRentals = async (): Promise<RentalResponse[]> => {
  const response = await API.get("/rentals/owner");
  return response.data;
};

/* =========================
   ACTIONS
========================= */

export const approveRental = async (id: number) => {
  return API.patch(`/rentals/${id}/approve`);
};

export const cancelRental = async (id: number) => {
  await API.delete(`/rentals/${id}`);
};


export const createRental = async (data: {
  itemId: number;
  startDate: string;
  endDate: string;
}) => {
  const response = await API.post("/rentals", data);
  return response.data;
};