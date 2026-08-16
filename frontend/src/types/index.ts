export type Role = 'DISPATCHER' | 'TECHNICIAN' | 'MANAGER' | 'CUSTOMER';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CLOSED'
  | 'CANCELLED';

export interface AuthUser {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: Role;
  customerId: number | null;
}

export interface Customer {
  id: number;
  name: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface Site {
  id: number;
  customerId: number;
  name: string;
  address: string;
}

export interface WorkOrderSummary {
  id: number;
  code: string;
  title: string;
  priority: Priority;
  status: WorkOrderStatus;
  customerName: string;
  siteName: string;
  assignedToName: string | null;
  slaDueAt: string;
  slaBreached: boolean;
}

export interface StatusHistoryEntry {
  fromStatus: string | null;
  toStatus: string;
  changedByName: string;
  changedAt: string;
  note: string | null;
}

export interface WorkOrder {
  id: number;
  code: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: WorkOrderStatus;
  customerId: number;
  customerName: string;
  siteId: number;
  siteName: string;
  assignedToId: number | null;
  assignedToName: string | null;
  slaDueAt: string;
  slaBreached: boolean;
  partsCost: number;
  totalMinutesLogged: number;
  createdAt: string;
  updatedAt: string;
  history: StatusHistoryEntry[];
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface Technician {
  id: number;
  name: string;
  email: string;
}

export interface Part {
  id: number;
  name: string;
  sku: string;
  unitCost: number;
  stockQty: number;
}

export interface ReportSummary {
  countsByStatus: Record<string, number>;
  overdueCount: number;
  slaComplianceRate: number;
  byTechnician: { technicianId: number; technicianName: string; openCount: number; overdueCount: number }[];
}
