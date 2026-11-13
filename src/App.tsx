import React, { useState, useEffect, useRef } from 'react';
import { User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { Customer, StoreData, Transaction } from './types/store';
import { loadStoreData, saveStoreData } from './utils/storage';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from './firebase';
import {
  ensureUserAccount,
  syncCreateCustomer,
  syncSaleAndCustomer,
  syncDebtPaymentAndCustomer,
  syncDeleteCustomerCascade,
  syncDeleteTransactionAndCustomer,
  syncDeleteAllTransactionsAndResetCustomers,
  syncResetAllCloudData,
  syncUploadStoreData,
} from './utils/cloudSync';
import { Header } from './components/Header';
import { CloudSyncBar } from './components/CloudSyncBar';
import { StatsCards } from './components/StatsCards';
import { NavTabs, AppTab } from './components/NavTabs';
import { HomeSection } from './components/HomeSection';
import { CustomerSection } from './components/CustomerSection';
import { SaleSection } from './components/SaleSection';
import { ReportSection } from './components/ReportSection';
import { ContactListSection } from './components/ContactListSection';
import { CustomerDebtHistoryModal } from './components/CustomerDebtHistoryModal';
import { ReceiptModal } from './components/ReceiptModal';

const STORE_NAME = 'জয় কুমার স্টোর';

export default function App() {
  const [storeData, setStoreData] = useState<StoreData>(() => loadStoreData());
  const [activeTab, setActiveTab] = useState<AppTab>('home');

  // Firebase Auth & Cloud Sync State
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [pendingLocalData, setPendingLocalData] = useState<StoreData | null>(null);

  // Track initial local data before cloud overwrites so nothing is lost on first sign-in
  const preCloudLocalRef = useRef<StoreData | null>(null);
  const initialMigrationCheckedRef = useRef<boolean>(false);

  // Modals & Selected items
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  // Quick prefill for sale
  const [prefilledCustomer, setPrefilledCustomer] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    saveStoreData(storeData);
  }, [storeData]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Snapshot existing local data before cloud snapshot replaces state
        preCloudLocalRef.current = loadStoreData();
        initialMigrationCheckedRef.current = false;
        setUser(firebaseUser);
      } else {
        setUser(null);
        setPendingLocalData(null);
        initialMigrationCheckedRef.current = false;
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Attach real-time Firestore listeners when authenticated
  useEffect(() => {
    if (!user) return;

    let isCancelled = false;
    let unsubCustomers: (() => void) | undefined;
    let unsubTransactions: (() => void) | undefined;

    let customersReady = false;
    let transactionsReady = false;
    let latestCustomers: Customer[] = [];
    let latestTransactions: Transaction[] = [];

    const checkAndSyncInitial = async () => {
      if (!customersReady || !transactionsReady || initialMigrationCheckedRef.current) return;
      initialMigrationCheckedRef.current = true;

      const localSnap = preCloudLocalRef.current;
      const hasLocalData =
        localSnap && (localSnap.customers.length > 0 || localSnap.transactions.length > 0);

      if (latestCustomers.length === 0 && latestTransactions.length === 0 && hasLocalData && localSnap) {
        // Cloud is empty -> automatically upload existing local store data
        try {
          setIsSyncing(true);
          await syncUploadStoreData(user.uid, localSnap.customers, localSnap.transactions);
          setPendingLocalData(null);
        } catch (err) {
          handleCloudError(err);
        } finally {
          if (!isCancelled) setIsSyncing(false);
        }
      } else if (hasLocalData && localSnap) {
        // Check if there are local-only items not yet in cloud
        const cloudCustIds = new Set(latestCustomers.map((c) => c.id));
        const cloudTxIds = new Set(latestTransactions.map((t) => t.id));
        const missingCustomers = localSnap.customers.filter((c) => !cloudCustIds.has(c.id));
        const missingTxs = localSnap.transactions.filter((t) => !cloudTxIds.has(t.id));

        if (missingCustomers.length > 0 || missingTxs.length > 0) {
          setPendingLocalData({
            customers: missingCustomers,
            transactions: missingTxs,
          });
        }
      }
    };

    const startSync = async () => {
      try {
        setIsSyncing(true);
        setSyncError(null);
        await ensureUserAccount(user, STORE_NAME);
        if (isCancelled) return;

        const custPath = `users/${user.uid}/customers`;
        const custQuery = query(
          collection(db, 'users', user.uid, 'customers'),
          where('ownerUid', '==', user.uid)
        );

        unsubCustomers = onSnapshot(
          custQuery,
          (snapshot) => {
            latestCustomers = snapshot.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: String(data.id || d.id),
                  name: String(data.name || ''),
                  phone: String(data.phone || ''),
                  address: data.address ? String(data.address) : undefined,
                  currentDebt: Number(data.currentDebt || 0),
                  totalPurchased: Number(data.totalPurchased || 0),
                  totalPaid: Number(data.totalPaid || 0),
                  createdAt: Number(data.clientCreatedAt || Date.now()),
                  lastActive: Number(data.lastActive || Date.now()),
                } as Customer;
              })
              .sort((a, b) => b.createdAt - a.createdAt);

            customersReady = true;
            setStoreData((prev) => ({ ...prev, customers: latestCustomers }));
            if (transactionsReady) setIsSyncing(false);
            void checkAndSyncInitial();
          },
          (error) => {
            handleCloudError(error);
            handleFirestoreError(error, OperationType.LIST, custPath);
          }
        );

        const txPath = `users/${user.uid}/transactions`;
        const txQuery = query(
          collection(db, 'users', user.uid, 'transactions'),
          where('ownerUid', '==', user.uid)
        );

        unsubTransactions = onSnapshot(
          txQuery,
          (snapshot) => {
            latestTransactions = snapshot.docs
              .map((d) => {
                const data = d.data();
                return {
                  id: String(data.id || d.id),
                  customerId: String(data.customerId || ''),
                  customerName: String(data.customerName || ''),
                  customerPhone: String(data.customerPhone || ''),
                  type: data.type === 'debt_payment' ? 'debt_payment' : 'sale',
                  totalAmount: Number(data.totalAmount || 0),
                  paidAmount: Number(data.paidAmount || 0),
                  dueAmount: Number(data.dueAmount || 0),
                  note: data.note ? String(data.note) : undefined,
                  paymentMethod: data.paymentMethod || 'cash',
                  date: String(data.date || ''),
                  timestamp: Number(data.timestamp || Date.now()),
                } as Transaction;
              })
              .sort((a, b) => b.timestamp - a.timestamp);

            transactionsReady = true;
            setStoreData((prev) => ({ ...prev, transactions: latestTransactions }));
            if (customersReady) setIsSyncing(false);
            void checkAndSyncInitial();
          },
          (error) => {
            handleCloudError(error);
            handleFirestoreError(error, OperationType.LIST, txPath);
          }
        );
      } catch (err) {
        handleCloudError(err);
        if (!isCancelled) setIsSyncing(false);
      }
    };

    void startSync();

    return () => {
      isCancelled = true;
      if (unsubCustomers) unsubCustomers();
      if (unsubTransactions) unsubTransactions();
    };
  }, [user]);

  const handleCloudError = (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('Quota exceeded')) {
      setSyncError('আজকের ফ্রি ক্লাউড সীমা (Quota) শেষ হয়ে গেছে। আগামীকাল আবার স্বাভাবিক হয়ে যাবে।');
    } else {
      setSyncError('ক্লাউড সিঙ্কে সমস্যা হয়েছে। ইন্টারনেট সংযোগ যাচাই করুন।');
    }
  };

  const handleGoogleSignIn = async () => {
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/popup-closed-by-user') return;
      if (code === 'auth/popup-blocked') {
        setSyncError('ব্রাউজার পপ-আপ ব্লক করেছে। অনুগ্রহ করে পপ-আপ অনুমতি দিয়ে আবার চেষ্টা করুন।');
      } else {
        setSyncError('লগইন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    }
  };

  const handleGoogleSignOut = async () => {
    setSyncError(null);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const handleMergePendingLocalData = async () => {
    if (!user || !pendingLocalData) return;
    try {
      setIsSyncing(true);
      setSyncError(null);
      await syncUploadStoreData(
        user.uid,
        pendingLocalData.customers,
        pendingLocalData.transactions
      );
      setPendingLocalData(null);
    } catch (err) {
      handleCloudError(err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Derived metrics
  const totalSales = storeData.transactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const totalDebt = storeData.customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  // Keep modal customer state in sync
  const activeCustomerInModal = selectedCustomerForHistory
    ? storeData.customers.find((c) => c.id === selectedCustomerForHistory.id) ||
      selectedCustomerForHistory
    : null;

  // Add Sale
  const handleAddSale = (saleData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    note: string;
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
  }): Transaction => {
    const now = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    const txId = `tx_${now}_${rand}`;
    const formattedDate = new Date(now).toLocaleString('bn-BD');

    let targetCustomerId = saleData.customerId;
    let updatedCustomers = [...storeData.customers];
    let targetCustomer: Customer;
    let isNewCustomer = false;

    if (!targetCustomerId) {
      isNewCustomer = true;
      targetCustomerId = `c_${now}_${rand}`;
      targetCustomer = {
        id: targetCustomerId,
        name: saleData.customerName,
        phone: saleData.customerPhone || '',
        currentDebt: saleData.dueAmount,
        totalPurchased: saleData.totalAmount,
        totalPaid: saleData.paidAmount,
        createdAt: now,
        lastActive: now,
      };
      updatedCustomers.unshift(targetCustomer);
    } else {
      const existingCust = updatedCustomers.find((c) => c.id === targetCustomerId);
      targetCustomer = existingCust
        ? {
            ...existingCust,
            name: saleData.customerName || existingCust.name,
            phone: saleData.customerPhone || existingCust.phone,
            currentDebt: Math.max(0, (existingCust.currentDebt || 0) + saleData.dueAmount),
            totalPurchased: (existingCust.totalPurchased || 0) + saleData.totalAmount,
            totalPaid: (existingCust.totalPaid || 0) + saleData.paidAmount,
            lastActive: now,
          }
        : {
            id: targetCustomerId,
            name: saleData.customerName,
            phone: saleData.customerPhone || '',
            currentDebt: saleData.dueAmount,
            totalPurchased: saleData.totalAmount,
            totalPaid: saleData.paidAmount,
            createdAt: now,
            lastActive: now,
          };

      updatedCustomers = updatedCustomers.map((c) =>
        c.id === targetCustomerId ? targetCustomer : c
      );
    }

    const newTx: Transaction = {
      id: txId,
      customerId: targetCustomerId,
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      type: 'sale',
      totalAmount: saleData.totalAmount,
      paidAmount: saleData.paidAmount,
      dueAmount: saleData.dueAmount,
      note: saleData.note,
      paymentMethod: saleData.paymentMethod,
      date: formattedDate,
      timestamp: now,
    };

    setStoreData((prev) => ({
      ...prev,
      customers: updatedCustomers,
      transactions: [newTx, ...prev.transactions],
    }));

    if (user) {
      void syncSaleAndCustomer(user.uid, targetCustomer, isNewCustomer, newTx).catch(
        handleCloudError
      );
    }

    return newTx;
  };

  // Collect Debt Repayment (বাকি জমা)
  const handleCollectDebtPayment = (paymentData: {
    customerId: string;
    amount: number;
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
    note: string;
  }) => {
    const customer = storeData.customers.find((c) => c.id === paymentData.customerId);
    if (!customer) return;

    const now = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    const txId = `tx_pay_${now}_${rand}`;
    const formattedDate = new Date(now).toLocaleString('bn-BD');

    const updatedCustomer: Customer = {
      ...customer,
      currentDebt: Math.max(0, (customer.currentDebt || 0) - paymentData.amount),
      totalPaid: (customer.totalPaid || 0) + paymentData.amount,
      lastActive: now,
    };

    const updatedCustomers = storeData.customers.map((c) =>
      c.id === paymentData.customerId ? updatedCustomer : c
    );

    const newTx: Transaction = {
      id: txId,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      type: 'debt_payment',
      totalAmount: 0,
      paidAmount: paymentData.amount,
      dueAmount: -paymentData.amount,
      note: paymentData.note,
      paymentMethod: paymentData.paymentMethod,
      date: formattedDate,
      timestamp: now,
    };

    setStoreData((prev) => ({
      ...prev,
      customers: updatedCustomers,
      transactions: [newTx, ...prev.transactions],
    }));

    setActiveReceiptTransaction(newTx);

    if (user) {
      void syncDebtPaymentAndCustomer(user.uid, updatedCustomer, newTx).catch(
        handleCloudError
      );
    }
  };

  // Add Customer
  const handleAddCustomer = (c: {
    name: string;
    phone: string;
    address: string;
    initialDebt: number;
  }) => {
    const now = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    const customerId = `c_${now}_${rand}`;
    const initialDebtAmount = Math.max(0, Number(c.initialDebt) || 0);

    // Check if customer already exists by phone
    const existing = storeData.customers.find(
      (cust) => cust.phone && c.phone && cust.phone === c.phone
    );
    if (existing) {
      alert(`এই নম্বরে (${c.phone}) ইতোমধ্যে ${existing.name} নামে কাস্টমার রয়েছে।`);
      return;
    }

    const newCust: Customer = {
      id: customerId,
      name: c.name,
      phone: c.phone,
      address: c.address,
      currentDebt: initialDebtAmount,
      totalPurchased: 0,
      totalPaid: 0,
      createdAt: now,
      lastActive: now,
    };

    const openingTx: Transaction | null =
      initialDebtAmount > 0
        ? {
            id: `tx_init_${now}_${rand}`,
            customerId,
            customerName: c.name,
            customerPhone: c.phone || '',
            type: 'sale',
            totalAmount: 0,
            paidAmount: 0,
            dueAmount: initialDebtAmount,
            note: 'আগের বাকি (পূর্বের হিসাব)',
            paymentMethod: 'other',
            date: new Date(now).toLocaleString('bn-BD'),
            timestamp: now,
          }
        : null;

    setStoreData((prev) => ({
      ...prev,
      customers: [newCust, ...prev.customers],
      transactions: openingTx ? [openingTx, ...prev.transactions] : prev.transactions,
    }));

    if (user) {
      void syncCreateCustomer(user.uid, newCust, openingTx).catch(handleCloudError);
    }
  };

  const handleDeleteCustomer = (id: string) => {
    const txIdsToDelete = storeData.transactions
      .filter((t) => t.customerId === id)
      .map((t) => t.id);

    setStoreData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
      transactions: prev.transactions.filter((t) => t.customerId !== id),
    }));
    if (selectedCustomerForHistory?.id === id) {
      setSelectedCustomerForHistory(null);
    }

    if (user) {
      void syncDeleteCustomerCascade(user.uid, id, txIdsToDelete).catch(handleCloudError);
    }
  };

  // Delete a single transaction & recalculate customer balance
  const handleDeleteTransaction = (txId: string) => {
    const txToDelete = storeData.transactions.find((t) => t.id === txId);
    if (!txToDelete) return;

    const targetCustomerId = txToDelete.customerId;
    let modifiedCustomer: Customer | undefined;

    const updatedCustomers = storeData.customers.map((c) => {
      if (
        c.id === targetCustomerId ||
        (txToDelete.customerPhone && c.phone === txToDelete.customerPhone)
      ) {
        let newPurchased = c.totalPurchased || 0;
        let newPaid = c.totalPaid || 0;
        let newDebt = c.currentDebt || 0;

        if (txToDelete.type === 'sale') {
          newPurchased = Math.max(0, newPurchased - (txToDelete.totalAmount || 0));
          newPaid = Math.max(0, newPaid - (txToDelete.paidAmount || 0));
          newDebt = Math.max(0, newDebt - (txToDelete.dueAmount || 0));
        } else if (txToDelete.type === 'debt_payment') {
          newPaid = Math.max(0, newPaid - (txToDelete.paidAmount || 0));
          newDebt = newDebt + (txToDelete.paidAmount || 0);
        }

        modifiedCustomer = {
          ...c,
          totalPurchased: newPurchased,
          totalPaid: newPaid,
          currentDebt: newDebt,
          lastActive: Date.now(),
        };
        return modifiedCustomer;
      }
      return c;
    });

    setStoreData((prev) => ({
      ...prev,
      customers: updatedCustomers,
      transactions: prev.transactions.filter((t) => t.id !== txId),
    }));

    if (activeReceiptTransaction?.id === txId) {
      setActiveReceiptTransaction(null);
    }

    if (user) {
      void syncDeleteTransactionAndCustomer(user.uid, txId, modifiedCustomer).catch(
        handleCloudError
      );
    }
  };

  // Delete all transaction history & reset customer balance
  const handleDeleteAllTransactions = () => {
    const txIds = storeData.transactions.map((t) => t.id);
    const resetCustomers = storeData.customers.map((c) => ({
      ...c,
      currentDebt: 0,
      totalPurchased: 0,
      totalPaid: 0,
    }));

    setStoreData((prev) => ({
      ...prev,
      customers: resetCustomers,
      transactions: [],
    }));
    setActiveReceiptTransaction(null);

    if (user) {
      void syncDeleteAllTransactionsAndResetCustomers(
        user.uid,
        storeData.customers,
        txIds
      ).catch(handleCloudError);
    }
  };

  const handleRestoreData = (restored: StoreData) => {
    setStoreData(restored);
    if (user) {
      setIsSyncing(true);
      void syncUploadStoreData(user.uid, restored.customers, restored.transactions)
        .catch(handleCloudError)
        .finally(() => setIsSyncing(false));
    }
  };

  const handleFillCustomerInSale = (customerName: string, customerId: string) => {
    setPrefilledCustomer({ id: customerId, name: customerName });
    setActiveTab('sales');
  };

  const handleResetData = () => {
    const custIds = storeData.customers.map((c) => c.id);
    const txIds = storeData.transactions.map((t) => t.id);
    const clean: StoreData = { customers: [], transactions: [] };
    setStoreData(clean);
    saveStoreData(clean);
    setActiveReceiptTransaction(null);
    setSelectedCustomerForHistory(null);

    if (user) {
      void syncResetAllCloudData(user.uid, custIds, txIds).catch(handleCloudError);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7f3] text-[#17251a]">
      {/* 1. Exact Screenshot Header */}
      <Header />

      {/* 2. Main Content Container */}
      <main className="max-w-[1050px] mx-auto p-3.5">
        {/* Multi-device Cloud Sync Bar */}
        <CloudSyncBar
          user={user}
          authLoading={authLoading}
          isSyncing={isSyncing}
          syncError={syncError}
          hasPendingLocalMerge={Boolean(pendingLocalData)}
          onSignIn={handleGoogleSignIn}
          onSignOut={handleGoogleSignOut}
          onMergeLocalData={handleMergePendingLocalData}
        />

        {/* Exact Screenshot Stat Cards (মোট বিক্রি, সর্বমোট বাকি, মোট কাস্টমার) */}
        <StatsCards
          totalSales={totalSales}
          totalDebt={totalDebt}
          customerCount={storeData.customers.length}
        />

        {/* Exact Screenshot Tabs (হোম, কাস্টমার, কন্টাক্ট লিস্ট, বিক্রয় / টাকা জমা, রিপোর্ট ও ব্যাকআপ) */}
        <NavTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Views */}
        {activeTab === 'home' && (
          <HomeSection
            transactions={storeData.transactions}
            onNavigateTab={(tab) => setActiveTab(tab)}
            cloudUserEmail={user?.email}
            onSignIn={handleGoogleSignIn}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerSection
            customers={storeData.customers}
            storeName={STORE_NAME}
            onAddCustomer={handleAddCustomer}
            onSelectCustomerHistory={(c) => setSelectedCustomerForHistory(c)}
            onQuickCollect={(c) => setSelectedCustomerForHistory(c)}
            onFillCustomerInSale={handleFillCustomerInSale}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {activeTab === 'contacts' && (
          <ContactListSection
            customers={storeData.customers}
            storeName={STORE_NAME}
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onFillCustomerInSale={handleFillCustomerInSale}
            onSelectCustomerHistory={(c) => setSelectedCustomerForHistory(c)}
          />
        )}

        {activeTab === 'sales' && (
          <SaleSection
            customers={storeData.customers}
            storeName={STORE_NAME}
            preselectedCustomerId={prefilledCustomer?.id}
            preselectedCustomerName={prefilledCustomer?.name}
            onAddSale={handleAddSale}
          />
        )}

        {activeTab === 'reports' && (
          <ReportSection
            storeData={storeData}
            onRestoreData={handleRestoreData}
            onViewReceipt={(tx) => setActiveReceiptTransaction(tx)}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteAllTransactions={handleDeleteAllTransactions}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* MODAL: Customer Debt History & Chronological Ledger */}
      {activeCustomerInModal && (
        <CustomerDebtHistoryModal
          customer={activeCustomerInModal}
          transactions={storeData.transactions}
          storeName={STORE_NAME}
          onClose={() => setSelectedCustomerForHistory(null)}
          onCollectPayment={handleCollectDebtPayment}
          onViewReceipt={(tx) => setActiveReceiptTransaction(tx)}
          onDeleteTransaction={handleDeleteTransaction}
          onDeleteCustomer={handleDeleteCustomer}
        />
      )}

      {/* MODAL: Receipt Slip */}
      {activeReceiptTransaction && (
        <ReceiptModal
          transaction={activeReceiptTransaction}
          customer={storeData.customers.find(
            (c) => c.id === activeReceiptTransaction.customerId
          )}
          storeName={STORE_NAME}
          onClose={() => setActiveReceiptTransaction(null)}
        />
      )}
    </div>
  );
}
