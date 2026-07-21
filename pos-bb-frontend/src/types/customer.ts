export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomerInput {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}
