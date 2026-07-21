export type ServiceStatus = "Active" | "Inactive";

export interface Service {
  id: number;
  name: string;
  category?: string | null;
  price: number;
  duration?: number | null;
  description?: string | null;
  status?: ServiceStatus | string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface ServiceInput {
  name: string;
  category?: string | null;
  price: number;
  duration?: number | null;
  description?: string | null;
  status?: ServiceStatus | string;
}

export interface GetServicesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
}
