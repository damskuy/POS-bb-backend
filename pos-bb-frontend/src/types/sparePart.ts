export interface SparePart {
  id: number;
  sku?: string | null;
  name: string;
  category?: string | null;
  price: number;
  stock: number;
  minStock?: number;
  supplier?: string | null;
  rackLocation?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SparePartInput {
  sku?: string | null;
  name: string;
  category?: string | null;
  price: number;
  stock: number;
  minStock?: number;
  supplier?: string | null;
  rackLocation?: string | null;
  description?: string | null;
}

export interface GetSparePartsParams {
  page?: number;
  limit?: number;
  search?: string;
  lowStock?: string;
  sort?: string;
  order?: "asc" | "desc";
}
