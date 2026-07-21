import { Vehicle } from "./vehicle";

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  _count?: {
    vehicles: number;
  };
  vehicles?: Vehicle[];
}

export interface CustomerInput {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}
