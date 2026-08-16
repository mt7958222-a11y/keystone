import axios from 'axios';
import type {
  AuthUser,
  Customer,
  Page,
  Part,
  ReportSummary,
  Site,
  Technician,
  WorkOrder,
  WorkOrderSummary,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('keystone-auth');
  if (raw) {
    const auth: AuthUser = JSON.parse(raw);
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('keystone-auth');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post('/api/auth/login', { email, password });
  return data;
}

export async function fetchWorkOrders(status?: string): Promise<Page<WorkOrderSummary>> {
  const { data } = await api.get('/api/work-orders', { params: { status, size: 100 } });
  return data;
}

export async function fetchWorkOrder(id: number): Promise<WorkOrder> {
  const { data } = await api.get(`/api/work-orders/${id}`);
  return data;
}

export async function createWorkOrder(payload: {
  title: string;
  description: string;
  priority: string;
  customerId: number;
  siteId: number;
}): Promise<WorkOrder> {
  const { data } = await api.post('/api/work-orders', payload);
  return data;
}

export async function assignWorkOrder(id: number, technicianId: number): Promise<WorkOrder> {
  const { data } = await api.post(`/api/work-orders/${id}/assign`, { technicianId });
  return data;
}

export async function changeStatus(id: number, toStatus: string, note?: string): Promise<WorkOrder> {
  const { data } = await api.post(`/api/work-orders/${id}/status`, { toStatus, note });
  return data;
}

export async function logParts(id: number, partId: number, qtyUsed: number): Promise<WorkOrder> {
  const { data } = await api.post(`/api/work-orders/${id}/parts`, { partId, qtyUsed });
  return data;
}

export async function logTime(id: number, minutes: number, note?: string): Promise<WorkOrder> {
  const { data } = await api.post(`/api/work-orders/${id}/time`, { minutes, note });
  return data;
}

export async function fetchCustomers(search?: string): Promise<Page<Customer>> {
  const { data } = await api.get('/api/customers', { params: { search, size: 100 } });
  return data;
}

export async function createCustomer(payload: { name: string; contactEmail?: string; contactPhone?: string }) {
  const { data } = await api.post('/api/customers', payload);
  return data as Customer;
}

export async function fetchSites(customerId: number): Promise<Site[]> {
  const { data } = await api.get(`/api/customers/${customerId}/sites/all`);
  return data;
}

export async function createSite(customerId: number, payload: { name: string; address: string }) {
  const { data } = await api.post(`/api/customers/${customerId}/sites`, payload);
  return data as Site;
}

export async function fetchTechnicians(): Promise<Technician[]> {
  const { data } = await api.get('/api/users/technicians');
  return data;
}

export async function fetchParts(): Promise<Part[]> {
  const { data } = await api.get('/api/parts');
  return data;
}

export async function fetchReportSummary(): Promise<ReportSummary> {
  const { data } = await api.get('/api/reports/summary');
  return data;
}
