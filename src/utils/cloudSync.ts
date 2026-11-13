import { User } from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  writeBatch,
  serverTimestamp,
  collection,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Customer, Transaction } from '../types/store';

export function sanitizeFirestoreId(rawId: string): string {
  const cleaned = String(rawId || '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  return cleaned || `id_${Date.now()}`;
}

function truncate(val: string | undefined, maxLen: number): string {
  return String(val || '').slice(0, maxLen);
}

function buildCustomerPayload(uid: string, c: Customer, isCreate: boolean) {
  const payload: Record<string, unknown> = {
    id: sanitizeFirestoreId(c.id),
    ownerUid: uid,
    name: truncate(c.name.trim() || 'নামহীন কাস্টমার', 120),
    phone: truncate(c.phone || '', 30),
    currentDebt: Math.max(0, Number(c.currentDebt) || 0),
    totalPurchased: Math.max(0, Number(c.totalPurchased) || 0),
    totalPaid: Math.max(0, Number(c.totalPaid) || 0),
    clientCreatedAt: Math.max(0, Number(c.createdAt) || Date.now()),
    lastActive: Math.max(0, Number(c.lastActive) || Date.now()),
    updatedAt: serverTimestamp(),
  };

  if (c.address && c.address.trim()) {
    payload.address = truncate(c.address.trim(), 250);
  }

  if (isCreate) {
    payload.createdAt = serverTimestamp();
  }

  return payload;
}

function buildTransactionPayload(uid: string, tx: Transaction) {
  const validMethod =
    tx.paymentMethod && ['cash', 'bkash', 'nagad', 'bank', 'other'].includes(tx.paymentMethod)
      ? tx.paymentMethod
      : 'cash';

  const payload: Record<string, unknown> = {
    id: sanitizeFirestoreId(tx.id),
    ownerUid: uid,
    customerId: sanitizeFirestoreId(tx.customerId),
    customerName: truncate(tx.customerName.trim() || 'কাস্টমার', 120),
    customerPhone: truncate(tx.customerPhone || '', 30),
    type: tx.type === 'debt_payment' ? 'debt_payment' : 'sale',
    totalAmount: Math.max(0, Number(tx.totalAmount) || 0),
    paidAmount: Math.max(0, Number(tx.paidAmount) || 0),
    dueAmount: Number(tx.dueAmount) || 0,
    paymentMethod: validMethod,
    date: truncate(tx.date || new Date().toLocaleString('bn-BD'), 100),
    timestamp: Math.max(0, Number(tx.timestamp) || Date.now()),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (tx.note && tx.note.trim()) {
    payload.note = truncate(tx.note.trim(), 500);
  }

  return payload;
}

export async function ensureUserAccount(user: User, storeName: string): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: truncate(user.email || '', 200),
        displayName: truncate(user.displayName || '', 120),
        storeName: truncate(storeName, 120),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(
        userRef,
        {
          email: truncate(user.email || '', 200),
          displayName: truncate(user.displayName || '', 120),
          storeName: truncate(storeName, 120),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export async function syncCreateCustomer(
  uid: string,
  customer: Customer,
  openingTx?: Transaction | null
): Promise<void> {
  const custId = sanitizeFirestoreId(customer.id);
  const custPath = `users/${uid}/customers/${custId}`;
  try {
    const batch = writeBatch(db);
    const custRef = doc(db, 'users', uid, 'customers', custId);
    batch.set(custRef, buildCustomerPayload(uid, { ...customer, id: custId }, true));

    if (openingTx) {
      const txId = sanitizeFirestoreId(openingTx.id);
      const txRef = doc(db, 'users', uid, 'transactions', txId);
      batch.set(
        txRef,
        buildTransactionPayload(uid, { ...openingTx, id: txId, customerId: custId })
      );
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, custPath);
  }
}

export async function syncSaleAndCustomer(
  uid: string,
  customer: Customer,
  isNewCustomer: boolean,
  newTx: Transaction
): Promise<void> {
  const custId = sanitizeFirestoreId(customer.id);
  const txId = sanitizeFirestoreId(newTx.id);
  const path = `users/${uid}/transactions/${txId}`;
  try {
    const batch = writeBatch(db);
    const custRef = doc(db, 'users', uid, 'customers', custId);

    if (isNewCustomer) {
      batch.set(custRef, buildCustomerPayload(uid, { ...customer, id: custId }, true));
    } else {
      batch.update(custRef, {
        name: truncate(customer.name.trim() || 'কাস্টমার', 120),
        phone: truncate(customer.phone || '', 30),
        currentDebt: Math.max(0, Number(customer.currentDebt) || 0),
        totalPurchased: Math.max(0, Number(customer.totalPurchased) || 0),
        totalPaid: Math.max(0, Number(customer.totalPaid) || 0),
        lastActive: Math.max(0, Number(customer.lastActive) || Date.now()),
        updatedAt: serverTimestamp(),
      });
    }

    const txRef = doc(db, 'users', uid, 'transactions', txId);
    batch.set(
      txRef,
      buildTransactionPayload(uid, { ...newTx, id: txId, customerId: custId })
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDebtPaymentAndCustomer(
  uid: string,
  customer: Customer,
  newTx: Transaction
): Promise<void> {
  const custId = sanitizeFirestoreId(customer.id);
  const txId = sanitizeFirestoreId(newTx.id);
  const path = `users/${uid}/transactions/${txId}`;
  try {
    const batch = writeBatch(db);
    const custRef = doc(db, 'users', uid, 'customers', custId);
    batch.update(custRef, {
      currentDebt: Math.max(0, Number(customer.currentDebt) || 0),
      totalPurchased: Math.max(0, Number(customer.totalPurchased) || 0),
      totalPaid: Math.max(0, Number(customer.totalPaid) || 0),
      lastActive: Math.max(0, Number(customer.lastActive) || Date.now()),
      updatedAt: serverTimestamp(),
    });

    const txRef = doc(db, 'users', uid, 'transactions', txId);
    batch.set(
      txRef,
      buildTransactionPayload(uid, { ...newTx, id: txId, customerId: custId })
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function syncDeleteCustomerCascade(
  uid: string,
  customerId: string,
  txIds: string[]
): Promise<void> {
  const custId = sanitizeFirestoreId(customerId);
  const path = `users/${uid}/customers/${custId}`;
  try {
    const ops: Array<{ ref: ReturnType<typeof doc> }> = [
      { ref: doc(db, 'users', uid, 'customers', custId) },
      ...txIds.map((id) => ({
        ref: doc(db, 'users', uid, 'transactions', sanitizeFirestoreId(id)),
      })),
    ];

    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(db);
      ops.slice(i, i + 400).forEach((op) => batch.delete(op.ref));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncDeleteTransactionAndCustomer(
  uid: string,
  txId: string,
  updatedCustomer?: Customer
): Promise<void> {
  const cleanTxId = sanitizeFirestoreId(txId);
  const path = `users/${uid}/transactions/${cleanTxId}`;
  try {
    const batch = writeBatch(db);
    if (updatedCustomer) {
      const custId = sanitizeFirestoreId(updatedCustomer.id);
      const custRef = doc(db, 'users', uid, 'customers', custId);
      batch.update(custRef, {
        currentDebt: Math.max(0, Number(updatedCustomer.currentDebt) || 0),
        totalPurchased: Math.max(0, Number(updatedCustomer.totalPurchased) || 0),
        totalPaid: Math.max(0, Number(updatedCustomer.totalPaid) || 0),
        lastActive: Math.max(0, Number(updatedCustomer.lastActive) || Date.now()),
        updatedAt: serverTimestamp(),
      });
    }
    batch.delete(doc(db, 'users', uid, 'transactions', cleanTxId));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncDeleteAllTransactionsAndResetCustomers(
  uid: string,
  customers: Customer[],
  txIds: string[]
): Promise<void> {
  const path = `users/${uid}/transactions`;
  try {
    const ops: Array<() => { type: 'update'; ref: ReturnType<typeof doc>; data: Record<string, unknown> } | { type: 'delete'; ref: ReturnType<typeof doc> }> = [];

    customers.forEach((c) => {
      const custId = sanitizeFirestoreId(c.id);
      ops.push(() => ({
        type: 'update',
        ref: doc(db, 'users', uid, 'customers', custId),
        data: {
          currentDebt: 0,
          totalPurchased: 0,
          totalPaid: 0,
          lastActive: Date.now(),
          updatedAt: serverTimestamp(),
        },
      }));
    });

    txIds.forEach((id) => {
      const txId = sanitizeFirestoreId(id);
      ops.push(() => ({
        type: 'delete',
        ref: doc(db, 'users', uid, 'transactions', txId),
      }));
    });

    for (let i = 0; i < ops.length; i += 400) {
      const batch = writeBatch(db);
      ops.slice(i, i + 400).forEach((buildOp) => {
        const op = buildOp();
        if (op.type === 'update') {
          batch.update(op.ref, op.data);
        } else {
          batch.delete(op.ref);
        }
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncResetAllCloudData(
  uid: string,
  customerIds: string[],
  txIds: string[]
): Promise<void> {
  const path = `users/${uid}`;
  try {
    const refs = [
      ...txIds.map((id) => doc(db, 'users', uid, 'transactions', sanitizeFirestoreId(id))),
      ...customerIds.map((id) => doc(db, 'users', uid, 'customers', sanitizeFirestoreId(id))),
    ];

    for (let i = 0; i < refs.length; i += 400) {
      const batch = writeBatch(db);
      refs.slice(i, i + 400).forEach((r) => batch.delete(r));
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncUploadStoreData(
  uid: string,
  customers: Customer[],
  transactions: Transaction[]
): Promise<void> {
  const path = `users/${uid}/customers`;
  try {
    const customerMap = new Map<string, Customer>();
    customers.forEach((c) => {
      const cleanId = sanitizeFirestoreId(c.id);
      customerMap.set(cleanId, { ...c, id: cleanId });
    });

    // Ensure every transaction has a corresponding customer so Firestore existsAfter() passes
    transactions.forEach((tx) => {
      const cleanCustId = sanitizeFirestoreId(tx.customerId || `c_${tx.customerName}`);
      if (!customerMap.has(cleanCustId)) {
        customerMap.set(cleanCustId, {
          id: cleanCustId,
          name: tx.customerName || 'কাস্টমার',
          phone: tx.customerPhone || '',
          currentDebt: 0,
          totalPurchased: 0,
          totalPaid: 0,
          createdAt: tx.timestamp || Date.now(),
          lastActive: tx.timestamp || Date.now(),
        });
      }
    });

    const customerList = Array.from(customerMap.values());
    const txList = transactions.map((tx) => ({
      ...tx,
      id: sanitizeFirestoreId(tx.id),
      customerId: sanitizeFirestoreId(tx.customerId || `c_${tx.customerName}`),
    }));

    // Write customers first in batches of 400
    for (let i = 0; i < customerList.length; i += 400) {
      const batch = writeBatch(db);
      customerList.slice(i, i + 400).forEach((c) => {
        const ref = doc(collection(db, 'users', uid, 'customers'), c.id);
        batch.set(ref, buildCustomerPayload(uid, c, true));
      });
      await batch.commit();
    }

    // Write transactions next in batches of 400
    for (let i = 0; i < txList.length; i += 400) {
      const batch = writeBatch(db);
      txList.slice(i, i + 400).forEach((tx) => {
        const ref = doc(collection(db, 'users', uid, 'transactions'), tx.id);
        batch.set(ref, buildTransactionPayload(uid, tx));
      });
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
