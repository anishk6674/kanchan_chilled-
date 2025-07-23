// Customer Types
export type CustomerType = 'shop' | 'monthly' | 'order';

export interface Customer {
  customer_id: string;
  name: string;
  phone_number: string;
  alternate_number?: string;
  address: string;
  customer_type: CustomerType;
  advance_amount?: number;
  can_qty?: number;
  created_at: string;
}

// Can Price Types
export interface CanPrice {
  price_id: string;
  customer_type: CustomerType;
  price_per_can: number;
  effective_date: string;
}

// Daily Update Types
export interface DailyUpdate {
  holding_status: number;
  update_id: string;
  customer_id: string;
  date: string;
  delivered_qty: number;
  collected_qty: number;
  notes?: string;
  customer?: Customer;
}

// Order Types
export interface Order {
  order_id: string;
  customer_id: string;
  order_date: string;
  can_qty: number;
  delivery_charge: number;
  total_amount: number;
  customer?: Customer;
}

// Payment Types
export type PaymentMethod = 'cash' | 'upi' | 'qr' | 'partial';

export interface Payment {
  payment_id: string;
  customer_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  bill_id?: string;
  customer?: Customer;
}

// Bill Types
export interface Bill {
  bill_id: string;
  customer_id: string;
  bill_month: string;
  can_qty: number;
  bill_amount: number;
  paid_status: boolean;
  sent_status: boolean;
  customer?: Customer;
}

// Dashboard Stats
export interface DashboardStats {
  todayOrders: number;
  totalMonthlyCustomers: number;
  shopCustomersVisited: number;
  cansDeliveredToday: number;
  cansCollectedToday: number;
  pendingCansTotal: number;
}

// Report Types
export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  customerType?: CustomerType;
  customerId?: string;
}