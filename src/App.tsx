import React, { useState, useEffect } from 'react';
import { Customer, StoreData, Transaction } from './types/store';
import { loadStoreData, saveStoreData } from './utils/storage';
import { Header } from './components/Header';
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

  // Modals & Selected items
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);
  
  // Quick prefill for sale
  const [prefilledCustomer, setPrefilledCustomer] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    saveStoreData(storeData);
  }, [storeData]);

  // Derived metrics
  const totalSales = storeData.transactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const totalDebt = storeData.customers
    .reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  // Keep modal customer state in sync
  const activeCustomerInModal = selectedCustomerForHistory
    ? storeData.customers.find((c) => c.id === selectedCustomerForHistory.id) || selectedCustomerForHistory
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
    const txId = `tx_${Date.now()}`;
    const now = Date.now();
    const formattedDate = new Date().toLocaleString('bn-BD');

    let targetCustomerId = saleData.customerId;
    let updatedCustomers = [...storeData.customers];

    if (!targetCustomerId) {
      targetCustomerId = `c_${now}`;
      const newCust: Customer = {
        id: targetCustomerId,
        name: saleData.customerName,
        phone: saleData.customerPhone || '',
        currentDebt: saleData.dueAmount,
        totalPurchased: saleData.totalAmount,
        totalPaid: saleData.paidAmount,
        createdAt: now,
        lastActive: now,
      };
      updatedCustomers.unshift(newCust);
    } else {
      updatedCustomers = updatedCustomers.map((c) => {
        if (c.id === targetCustomerId) {
          return {
            ...c,
            name: saleData.customerName || c.name,
            phone: saleData.customerPhone || c.phone,
            currentDebt: Math.max(0, (c.currentDebt || 0) + saleData.dueAmount),
            totalPurchased: (c.totalPurchased || 0) + saleData.totalAmount,
            totalPaid: (c.totalPaid || 0) + saleData.paidAmount,
            lastActive: now,
          };
        }
        return c;
      });
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

    setStoreData({
      ...storeData,
      customers: updatedCustomers,
      transactions: [newTx, ...storeData.transactions],
    });

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

    const txId = `tx_pay_${Date.now()}`;
    const now = Date.now();
    const formattedDate = new Date().toLocaleString('bn-BD');

    const updatedCustomers = storeData.customers.map((c) => {
      if (c.id === paymentData.customerId) {
        return {
          ...c,
          currentDebt: Math.max(0, (c.currentDebt || 0) - paymentData.amount),
          totalPaid: (c.totalPaid || 0) + paymentData.amount,
          lastActive: now,
        };
      }
      return c;
    });

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

    setStoreData({
      ...storeData,
      customers: updatedCustomers,
      transactions: [newTx, ...storeData.transactions],
    });

    setActiveReceiptTransaction(newTx);
  };

  // Add Customer
  const handleAddCustomer = (c: {
    name: string;
    phone: string;
    address: string;
    initialDebt: number;
  }) => {
    const now = Date.now();
    const customerId = `c_${now}`;

    // Check if customer already exists by phone
    const existing = storeData.customers.find((cust) => cust.phone && cust.phone === c.phone);
    if (existing) {
      alert(`এই নম্বরে (${c.phone}) ইতোমধ্যে ${existing.name} নামে কাস্টমার রয়েছে।`);
      return;
    }

    const newCust: Customer = {
      id: customerId,
      name: c.name,
      phone: c.phone,
      address: c.address,
      currentDebt: c.initialDebt || 0,
      totalPurchased: c.initialDebt || 0,
      totalPaid: 0,
      createdAt: now,
      lastActive: now,
    };

    setStoreData({
      ...storeData,
      customers: [newCust, ...storeData.customers],
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setStoreData((prev) => ({
      ...prev,
      customers: prev.customers.filter((c) => c.id !== id),
      transactions: prev.transactions.filter((t) => t.customerId !== id),
    }));
    if (selectedCustomerForHistory?.id === id) {
      setSelectedCustomerForHistory(null);
    }
  };

  // Delete a single transaction & recalculate customer balance
  const handleDeleteTransaction = (txId: string) => {
    const txToDelete = storeData.transactions.find((t) => t.id === txId);
    if (!txToDelete) return;

    const targetCustomerId = txToDelete.customerId;
    const updatedCustomers = storeData.customers.map((c) => {
      if (c.id === targetCustomerId || (txToDelete.customerPhone && c.phone === txToDelete.customerPhone)) {
        let newPurchased = c.totalPurchased || 0;
        let newPaid = c.totalPaid || 0;
        let newDebt = c.currentDebt || 0;

        if (txToDelete.type === 'sale') {
          newPurchased = Math.max(0, newPurchased - (txToDelete.totalAmount || 0));
          newPaid = Math.max(0, newPaid - (txToDelete.paidAmount || 0));
          newDebt = Math.max(0, newDebt - (txToDelete.dueAmount || 0));
        } else if (txToDelete.type === 'debt_payment') {
          // Undoing payment subtracts from totalPaid and restores debt
          newPaid = Math.max(0, newPaid - (txToDelete.paidAmount || 0));
          newDebt = newDebt + (txToDelete.paidAmount || 0);
        }

        return {
          ...c,
          totalPurchased: newPurchased,
          totalPaid: newPaid,
          currentDebt: newDebt,
        };
      }
      return c;
    });

    setStoreData({
      ...storeData,
      customers: updatedCustomers,
      transactions: storeData.transactions.filter((t) => t.id !== txId),
    });

    if (activeReceiptTransaction?.id === txId) {
      setActiveReceiptTransaction(null);
    }
  };

  // Delete all transaction history & reset customer balance
  const handleDeleteAllTransactions = () => {
    const resetCustomers = storeData.customers.map((c) => ({
      ...c,
      currentDebt: 0,
      totalPurchased: 0,
      totalPaid: 0,
    }));

    setStoreData({
      ...storeData,
      customers: resetCustomers,
      transactions: [],
    });
    setActiveReceiptTransaction(null);
  };

  const handleFillCustomerInSale = (customerName: string, customerId: string) => {
    setPrefilledCustomer({ id: customerId, name: customerName });
    setActiveTab('sales');
  };

  const handleResetData = () => {
    const clean: StoreData = { customers: [], transactions: [] };
    setStoreData(clean);
    saveStoreData(clean);
    setActiveReceiptTransaction(null);
    setSelectedCustomerForHistory(null);
  };

  return (
    <div className="min-h-screen bg-[#f3f7f3] text-[#17251a]">
      {/* 1. Exact Screenshot Header */}
      <Header />

      {/* 2. Main Content Container */}
      <main className="max-w-[1050px] mx-auto p-3.5">
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
            onRestoreData={(d) => setStoreData(d)}
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
          customer={storeData.customers.find((c) => c.id === activeReceiptTransaction.customerId)}
          storeName={STORE_NAME}
          onClose={() => setActiveReceiptTransaction(null)}
        />
      )}
    </div>
  );
}
