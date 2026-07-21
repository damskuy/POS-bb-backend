import { Customer } from "./customer";

export type TransmissionType = "MANUAL" | "AUTOMATIC";

export interface Vehicle {
  id: number;
  customerId: number;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  transmission: TransmissionType;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customer?: Customer;
}

export interface VehicleInput {
  customerId: number;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  transmission: TransmissionType;
}

export interface GetVehiclesParams {
  page?: number;
  limit?: number;
  search?: string;
  customerId?: number | string;
  transmission?: TransmissionType;
  sort?: string;
  order?: "asc" | "desc";
}
