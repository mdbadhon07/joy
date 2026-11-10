import { Customer, StoreData, Transaction } from '../types/store';

const STORAGE_KEY = 'joyStoreDataV2';
const OLD_STORAGE_KEY = 'joyStoreData';

// NO DEMO DATA per user request
const INITIAL_CUSTOMERS: Customer[] = [];
const INITIAL_TRANSACTIONS: Transaction[] = [];

export function loadStoreData(): StoreData {
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (Array.isArray(parsed.customers) && Array.isArray(parsed.transactions)) {
        // If it was the seeded demo data with 'c1', 'c2', 'c3', clean it out
        const hasDummy = parsed.customers.some((c: Customer) => c.id === 'c1' || c.id === 'c2');
        if (hasDummy && parsed.customers.length <= 5 && parsed.transactions.length <= 5) {
          const freshData: StoreData = { customers: [], transactions: [] };
          saveStoreData(freshData);
          return freshData;
        }
        return parsed;
      }
    }

    // Fallback check for old HTML app storage if user had genuine data
    const rawOld = localStorage.getItem(OLD_STORAGE_KEY);
    if (rawOld) {
      const old = JSON.parse(rawOld);
      if (Array.isArray(old.customers) && old.customers.length > 0) {
        const migrated = migrateOldData(old);
        saveStoreData(migrated);
        return migrated;
      }
    }
  } catch (err) {
    console.warn('Error reading store data:', err);
  }

  const emptyData: StoreData = {
    customers: INITIAL_CUSTOMERS,
    transactions: INITIAL_TRANSACTIONS,
  };
  saveStoreData(emptyData);
  return emptyData;
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

  if (Array.isArray(old.customers)) {
    old.customers.forEach((c, idx) => {
      const id = `c_${idx}_${Date.now()}`;
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

  if (Array.isArray(old.sales)) {
    old.sales.forEach((s) => {
      const cName = (s.customer || 'অজ্ঞাত').trim();
      let cust = customerMap.get(cName);
      if (!cust) {
        cust = {
          id: `c_auto_${Date.now()}_${Math.random()}`,
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
        note: s.product ? `পণ্য: ${s.product}` : 'বিক্রয়',
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
