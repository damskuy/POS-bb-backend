export type TransmissionType = "MANUAL" | "AUTOMATIC";

export interface Vehicle {
  id: number;
  customerId: number;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number | null;
  transmission: TransmissionType;
  createdAt?: string;
  updatedAt?: string;
}

export interface VehicleInput {
  customerId: number;
  plateNumber: string;
  brand: string;
  model: string;
  year?: number;
  transmission: TransmissionType;
}
