export type WorkOrderStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "WAITING_PART"
  | "READY"
  | "COMPLETED"
  | "CANCELLED";

export interface WorkOrderServiceItem {
  id: number;
  workOrderId: number;
  serviceId: number;
  price: number;
  quantity: number;
  subtotal: number;
  service?: {
    id: number;
    name: string;
    price: number;
    category?: string | null;
    duration?: number | null;
    description?: string | null;
  };
}

export interface WorkOrderPartItem {
  id: number;
  workOrderId: number;
  sparePartId: number;
  price: number;
  quantity: number;
  subtotal: number;
  sparePart?: {
    id: number;
    name: string;
    sku?: string | null;
    price: number;
    category?: string | null;
    stock: number;
  };
}

export interface WorkOrder {
  id: number;
  code: string;
  customerId: number;
  vehicleId: number;
  mechanicId?: number | null;
  userId?: number | null;
  status: WorkOrderStatus;
  complaint?: string | null;
  notes?: string | null;
  odometer?: number | null;
  subtotal: number;
  discount: number;
  tax: number;
  grandTotal: number;
  checkInAt?: string | null;
  finishedAt?: string | null;
  scheduleDate?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  customer?: {
    id: number;
    name: string;
    phone: string;
    address?: string | null;
  };
  vehicle?: {
    id: number;
    plateNumber: string;
    brand: string;
    model: string;
    year?: number | null;
    transmission: string;
  };
  mechanic?: {
    id: number;
    name: string;
    phone: string;
    skills?: string | null;
  } | null;
  services?: WorkOrderServiceItem[];
  parts?: WorkOrderPartItem[];
  payment?: {
    id: number;
    status: string;
    method?: string | null;
    amount: number;
    paidAt?: string | null;
  } | null;
  invoice?: any | null;
}

export interface WorkOrderInput {
  customerId: number;
  vehicleId: number;
  mechanicId?: number | null;
  userId?: number | null;
  status?: WorkOrderStatus | string;
  complaint?: string | null;
  notes?: string | null;
  odometer?: number | null;
  discount?: number;
  tax?: number;
  services?: WorkOrderServiceInput[];
  parts?: WorkOrderPartInput[];
  scheduleDate?: string | null;
  checkInAt?: string | null;
}

export interface WorkOrderServiceInput {
  serviceId: number;
  price: number;
  quantity: number;
}

export interface WorkOrderPartInput {
  sparePartId: number;
  price: number;
  quantity: number;
}

export interface GetWorkOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  customerId?: number;
  mechanicId?: number;
  vehicleId?: number;
  startDate?: string;
  endDate?: string;
  sort?: string;
  order?: "asc" | "desc";
}

export const STATUS_LABELS: Record<WorkOrderStatus, string> = {
  PENDING: "Waiting",
  IN_PROGRESS: "In Progress",
  WAITING_PART: "Waiting Part",
  READY: "Ready",
  COMPLETED: "Finished",
  CANCELLED: "Cancelled",
};

export const STATUS_FLOW: Record<WorkOrderStatus, WorkOrderStatus | null> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "READY",
  WAITING_PART: "READY",
  READY: "COMPLETED",
  COMPLETED: null,
  CANCELLED: null,
};
