export type MechanicStatus = "Active" | "Inactive";

export interface Mechanic {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  status?: MechanicStatus | string;
  skills?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface MechanicInput {
  name: string;
  phone: string;
  address?: string | null;
  status?: MechanicStatus | string;
  skills?: string | null;
  notes?: string | null;
}

export interface GetMechanicsParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
}
