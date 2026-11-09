export type TransactionType = 'sale' | 'debt_payment';

export interface Transaction {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  type: TransactionType;
  totalAmount: number; // For sale: bill price. For debt_payment: 0 or equal to paidAmount
  paidAmount: number;  // Amount paid in this transaction
  dueAmount: number;   // For sale: totalAmount - paidAmount (can be 0 or positive). For debt_payment: -paidAmount
  note?: string;       // Optional memo/item description (e.g. "চাল ও ডাল", "বিকাশ পেমেন্ট")
  paymentMethod?: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
  date: string;        // ISO string or formatted date
  timestamp: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  currentDebt: number; // Current outstanding debt (বাকি)
  totalPurchased: number; // Total purchases to date
  totalPaid: number;      // Total payments to date
  createdAt: number;
  lastActive: number;
}

export interface StoreData {
  customers: Customer[];
  transactions: Transaction[];
  lastBackupDate?: string;
}
