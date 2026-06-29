export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier' | 'accountant' | 'supervisor' | 'waiter';
  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;
  isTaxable?: boolean;
}

export interface Employee extends User {}

export interface DashboardSummary {
  totalIncome: number;
  totalCommission: number;
  totalExpenses: number;
  netProfit: number;
  currency: string;
}

export type PaymentMethod = 'cash' | 'mpesa' | 'credit' | 'split';

export interface ServiceRecordItem {
  itemId?: string;
  name: string;
  price: number;
  discount: number;
  isTaxable: boolean;
  category: 'service' | 'product';
  employeeId?: string;
  commissionType?: string;
  commissionValue?: number;
  commissionEarned?: number;
  commissionPaid?: boolean;
  commissionPaidAt?: string;
}

export interface ServiceRecord {
  id?: string;
  name: string;
  price: number;
  employeeId: string;
  paymentMethod: PaymentMethod;
  splitDetails?: { cash: number; card: number };
  commissionEarned?: number;
  businessProfit?: number;
  items?: ServiceRecordItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  status?: 'completed' | 'refunded' | 'voided';
  refundReason?: string;
  createdAt?: string;
}

export interface Expense {
  id?: string;
  title: string;
  amount: number;
  createdAt?: string;
}

export type InventoryCategory = 'service' | 'product';

export interface InventoryItem {
  id: string;
  name: string;
  price: number;
  category: InventoryCategory;
  description?: string;
  stock?: number;
  isTaxable?: boolean;
  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ClockLog {
  id?: string;
  employee: string | User;
  clockIn: string;
  clockOut?: string;
  status: 'in' | 'out';
}

export interface CommissionReportItem {
  saleId: string;
  serviceName: string;
  price: number;
  discount?: number;
  commissionType: string;
  commissionValue: number;
  commissionEarned: number;
  commissionPaid: boolean;
  commissionPaidAt?: string;
}

export interface CommissionReportEntry {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  totalCommission: number;
  alreadyPaid: boolean;
  paidAt?: string | null;
  items: CommissionReportItem[];
}
