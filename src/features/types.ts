export type Item = {
  id: number;
  ownerId: string; // UUID string
  title: string;
  description: string;
  categoryId: number;
  pricePerDay: number;
  city: string;
  address?: string;
  imageUrls: string[];
  active: boolean;
   type: "AUCTION" | "RENTAL";
  createdAt: string; // ISO string
};