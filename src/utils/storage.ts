import { Customer, StoreData, Transaction } from '../types/store';

const STORAGE_KEY = 'joyStoreDataV2';
const OLD_STORAGE_KEY = 'joyStoreData';

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'c1',
    name: 'আব্দুর রহিম',
    phone: '01711234567',
    address: 'বাজার রোড, দোকান নং ৩',
    currentDebt: 1250,
    totalPurchased: 4500,
    totalPaid: 3250,
    createdAt: Date.now() - 30 * 86400000,
    lastActive: Date.now() - 2 * 86400000,
  },
  {
    id: 'c2',
    name: 'মোবারক হোসেন',
    phone: '01819876543',
    address: 'পূর্ব পাড়া, মসজিদ সংলগ্ন',
    currentDebt: 680,
    totalPurchased: 2300,
    totalPaid: 1620,
    createdAt: Date.now() - 20 * 86400000,
    lastActive: Date.now() - 1 * 86400000,
  },
  {
    id: 'c3',
    name: 'ফারুক আহমেদ',
    phone: '01912345678',
    address: 'স্কুল রোড, বাড়ি নং ১২',
    currentDebt: 0,
    totalPurchased: 3100,
    totalPaid: 3100,
    createdAt: Date.now() - 15 * 86400000,
    lastActive: Date.now() - 4 * 86400000,
  },
  {
    id: 'c4',
    name: 'কামাল উদ্দিন',
    phone: '01678901234',
    address: 'পশ্চিম বাজার',
    currentDebt: 2400,
    totalPurchased: 5800,
    totalPaid: 3400,
    createdAt: Date.now() - 40 * 86400000,
    lastActive: Date.now() - 86400000,
  },
  {
    id: 'c5',
    name: 'সেলিম রেজা',
    phone: '01723456789',
    address: 'উত্তর পাড়া',
    currentDebt: 350,
    totalPurchased: 1850,
    totalPaid: 1500,
    createdAt: Date.now() - 10 * 86400000,
    lastActive: Date.now() - 3 * 86400000,
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    customerId: 'c1',
    customerName: 'আব্দুর রহিম',
    customerPhone: '01711234567',
    type: 'sale',
    totalAmount: 1500,
    paidAmount: 500,
    dueAmount: 1000,
    note: 'মাসিক মুদি বাজার ও তেল',
    paymentMethod: 'cash',
    date: new Date(Date.now() - 5 * 86400000).toLocaleString('bn-BD'),
    timestamp: Date.now() - 5 * 86400000,
  },
  {
    id: 'tx2',
    customerId: 'c1',
    customerName: 'আব্দুর রহিম',
    customerPhone: '01711234567',
    type: 'sale',
    totalAmount: 750,
    paidAmount: 500,
    dueAmount: 250,
    note: 'চিনি ও মসলা',
    paymentMethod: 'cash',
    date: new Date(Date.now() - 2 * 86400000).toLocaleString('bn-BD'),
    timestamp: Date.now() - 2 * 86400000,
  },
  {
    id: 'tx3',
    customerId: 'c2',
    customerName: 'মোবারক হোসেন',
    customerPhone: '01819876543',
    type: 'sale',
    totalAmount: 980,
    paidAmount: 300,
    dueAmount: 680,
    note: 'আটা ও গুঁড়ো দুধ',
    paymentMethod: 'cash',
    date: new Date(Date.now() - 1 * 86400000).toLocaleString('bn-BD'),
    timestamp: Date.now() - 1 * 86400000,
  },
  {
    id: 'tx4',
    customerId: 'c4',
    customerName: 'কামাল উদ্দিন',
    customerPhone: '01678901234',
    type: 'sale',
    totalAmount: 3200,
    paidAmount: 800,
    dueAmount: 2400,
    note: 'চাল ৫০ কেজি বস্তা',
    paymentMethod: 'cash',
    date: new Date(Date.now() - 1 * 86400000).toLocaleString('bn-BD'),
    timestamp: Date.now() - 1 * 86400000,
  },
  {
    id: 'tx5',
    customerId: 'c5',
    customerName: 'সেলিম রেজা',
    customerPhone: '01723456789',
    type: 'debt_payment',
    totalAmount: 0,
    paidAmount: 500,
    dueAmount: -500,
    note: 'পূর্বের বকেয়া বাকি জমা (ক্যাশ)',
    paymentMethod: 'cash',
    date: new Date(Date.now() - 3 * 86400000).toLocaleString('bn-BD'),
    timestamp: Date.now() - 3 * 86400000,
  },
];

export function loadStoreData(): StoreData {
  try {
    // 1. Try modern schema
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed.customers) && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }

    // 2. Fallback check for old HTML app storage
    const rawOld = localStorage.getItem(OLD_STORAGE_KEY);
    if (rawOld) {
      const old = JSON.parse(rawOld);
      if (Array.isArray(old.customers) || Array.isArray(old.sales)) {
        const migrated = migrateOldData(old);
        saveStoreData(migrated);
        return migrated;
      }
    }
  } catch (err) {
    console.warn('Error reading store data from localStorage:', err);
  }

  // 3. Return fresh starter data
  const initialData: StoreData = {
    customers: INITIAL_CUSTOMERS,
    transactions: INITIAL_TRANSACTIONS,
  };
  saveStoreData(initialData);
  return initialData;
}

export function saveStoreData(data: StoreData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

interface OldStoreData {
  customers?: Array<{ name: string; phone: string; address?: string }>;
  sales?: Array<{
    id: number | string;
    customer: string;
    product?: string;
    qty?: number;
    total: number;
    paid: number;
    due: number;
    date: string;
  }>;
}

function migrateOldData(old: OldStoreData): StoreData {
  const customerMap = new Map<string, Customer>();
  const transactions: Transaction[] = [];

  // Register customers
  if (Array.isArray(old.customers)) {
    old.customers.forEach((c, idx) => {
      const id = `c_mig_${idx}_${Date.now()}`;
      customerMap.set(c.name.trim(), {
        id,
        name: c.name.trim(),
        phone: c.phone || '',
        address: c.address || '',
        currentDebt: 0,
        totalPurchased: 0,
        totalPaid: 0,
        createdAt: Date.now() - idx * 86400000,
        lastActive: Date.now(),
      });
    });
  }

  // Migrate sales to transactions and calculate balances
  if (Array.isArray(old.sales)) {
    old.sales.forEach((s) => {
      const cName = (s.customer || 'অজ্ঞাত').trim();
      let cust = customerMap.get(cName);
      if (!cust) {
        cust = {
          id: `c_mig_auto_${Date.now()}_${Math.random()}`,
          name: cName,
          phone: '',
          currentDebt: 0,
          totalPurchased: 0,
          totalPaid: 0,
          createdAt: Date.now(),
          lastActive: Date.now(),
        };
        customerMap.set(cName, cust);
      }

      const total = Number(s.total || 0);
      const paid = Number(s.paid || 0);
      const due = Number(s.due !== undefined ? s.due : total - paid);

      cust.totalPurchased += total;
      cust.totalPaid += paid;
      cust.currentDebt += due;

      transactions.push({
        id: String(s.id || Date.now() + Math.random()),
        customerId: cust.id,
        customerName: cust.name,
        customerPhone: cust.phone,
        type: 'sale',
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        note: s.product ? `পণ্য: ${s.product}` : 'পূর্বের রেকর্ডকৃত বিক্রয়',
        date: s.date || new Date().toLocaleString('bn-BD'),
        timestamp: typeof s.id === 'number' && s.id > 1000000000000 ? s.id : Date.now(),
      });
    });
  }

  return {
    customers: Array.from(customerMap.values()),
    transactions: transactions.sort((a, b) => b.timestamp - a.timestamp),
  };
}
