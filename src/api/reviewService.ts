import { API } from "./api"; 

export const getReviewsByItem = async (itemId: number) => {
  const response = await API.get(`/reviews/item/${itemId}`);
  return response.data;
};

export const getReviewsCountByItem = async (itemId: number) => {
  const response = await API.get(`/reviews/item/${itemId}/count`);
  return response.data;
};

export const hasReviewedRental = async (rentalId: number) => {
  const res = await API.get(`/reviews/rental/${rentalId}/can-review`);

  return res.data;
};

export const createReview = async (data: {
  rentalId: number;
  rating: number;
  comment: string;
}) => {
  return API.post("/reviews", data);
};


export const getReviewsByUser = async (userId: string) => {
  const response = await API.get(`/reviews/user/${userId}`);
  return response.data;
};
