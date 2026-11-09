import React, { useState, useEffect } from 'react';
import { Customer, StoreData, Transaction } from './types/store';
import { loadStoreData, saveStoreData } from './utils/storage';
import { Navbar, ActiveTab } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { HomeOverview } from './components/HomeOverview';
import { SaleSection } from './components/SaleSection';
import { DebtLedgerSection } from './components/DebtLedgerSection';
import { CustomerDebtHistoryModal } from './components/CustomerDebtHistoryModal';
import { ReceiptModal } from './components/ReceiptModal';
import { CustomersSection } from './components/CustomersSection';
import { ReportsSection } from './components/ReportsSection';
import { formatTaka } from './utils/formatters';

const STORE_NAME = 'জয় কুমার স্টোর';

export default function App() {
  const [storeData, setStoreData] = useState<StoreData>(() => loadStoreData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  
  // Modals & Active selections
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);
  const [preselectedCustomerIdForSale, setPreselectedCustomerIdForSale] = useState<string>('');

  // Persist on change
  useEffect(() => {
    saveStoreData(storeData);
  }, [storeData]);

  // Derived metrics
  const totalSales = storeData.transactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const totalCollected = storeData.transactions
    .reduce((sum, t) => sum + (t.paidAmount || 0), 0);

  const totalDebt = storeData.customers
    .reduce((sum, c) => sum + (c.currentDebt || 0), 0);

  const debtCustomersCount = storeData.customers
    .filter((c) => (c.currentDebt || 0) > 0).length;

  // Keep selectedCustomerForHistory in sync with latest customer state
  const activeCustomerInModal = selectedCustomerForHistory
    ? storeData.customers.find((c) => c.id === selectedCustomerForHistory.id) || selectedCustomerForHistory
    : null;

  // Handler: Add Sale (Manual Price Entry & Paid Amount)
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
    const txId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const formattedDate = new Date().toLocaleString('bn-BD');

    let targetCustomerId = saleData.customerId;
    let updatedCustomers = [...storeData.customers];

    // If new customer was entered or no ID
    if (!targetCustomerId) {
      targetCustomerId = `cust_${now}`;
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

  // Handler: Collect Debt Repayment (বাকি পরিশোধ জমা)
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

    // Show receipt
    setActiveReceiptTransaction(newTx);
  };

  // Handler: Add new customer directly
  const handleAddCustomer = (c: {
    name: string;
    phone: string;
    address: string;
    initialDebt: number;
  }) => {
    const now = Date.now();
    const customerId = `cust_${now}`;

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

    const newTransactions = [...storeData.transactions];
    if (c.initialDebt > 0) {
      newTransactions.unshift({
        id: `tx_init_${now}`,
        customerId,
        customerName: c.name,
        customerPhone: c.phone,
        type: 'sale',
        totalAmount: c.initialDebt,
        paidAmount: 0,
        dueAmount: c.initialDebt,
        note: 'পূর্বের খাতার বাকি প্রারম্ভিক স্থিতি',
        paymentMethod: 'cash',
        date: new Date().toLocaleString('bn-BD'),
        timestamp: now,
      });
    }

    setStoreData({
      ...storeData,
      customers: [newCust, ...storeData.customers],
      transactions: newTransactions,
    });
  };

  const handleEditCustomer = (updated: Customer) => {
    setStoreData({
      ...storeData,
      customers: storeData.customers.map((c) => (c.id === updated.id ? updated : c)),
    });
  };

  const handleDeleteCustomer = (id: string) => {
    setStoreData({
      ...storeData,
      customers: storeData.customers.filter((c) => c.id !== id),
    });
  };

  const handleStartSaleForCustomer = (customerId: string) => {
    setPreselectedCustomerIdForSale(customerId);
    setActiveTab('sales');
    setSelectedCustomerForHistory(null);
  };

  const handleQuickCollectCustomer = (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
  };

  const handleResetData = () => {
    localStorage.removeItem('joyStoreDataV2');
    localStorage.removeItem('joyStoreData');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'sales') setPreselectedCustomerIdForSale('');
        }}
        debtCount={debtCustomersCount}
        totalDebt={totalDebt}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-5">
        {/* Metric Cards Banner (Visible on Home and Overview) */}
        <StatsCards
          totalSales={totalSales}
          totalCollected={totalCollected}
          totalDebt={totalDebt}
          customerCount={storeData.customers.length}
          debtCustomerCount={debtCustomersCount}
          onViewDebts={() => setActiveTab('debts')}
          onNewSale={() => setActiveTab('sales')}
        />

        {/* Dynamic Views according to Tab */}
        {activeTab === 'home' && (
          <HomeOverview
            customers={storeData.customers}
            transactions={storeData.transactions}
            storeName={STORE_NAME}
            onNavigateTab={(tab) => {
              setActiveTab(tab);
              if (tab !== 'sales') setPreselectedCustomerIdForSale('');
            }}
            onSelectCustomerHistory={(cust) => setSelectedCustomerForHistory(cust)}
            onQuickCollect={handleQuickCollectCustomer}
            onViewReceipt={(tx) => setActiveReceiptTransaction(tx)}
          />
        )}

        {activeTab === 'sales' && (
          <SaleSection
            customers={storeData.customers}
            onAddSale={handleAddSale}
            preselectedCustomerId={preselectedCustomerIdForSale}
          />
        )}

        {activeTab === 'debts' && (
          <DebtLedgerSection
            customers={storeData.customers}
            transactions={storeData.transactions}
            storeName={STORE_NAME}
            onSelectCustomerHistory={(cust) => setSelectedCustomerForHistory(cust)}
            onQuickCollect={handleQuickCollectCustomer}
            onNewSaleForCustomer={handleStartSaleForCustomer}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersSection
            customers={storeData.customers}
            onAddCustomer={handleAddCustomer}
            onEditCustomer={handleEditCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomerHistory={(cust) => setSelectedCustomerForHistory(cust)}
            onNewSaleForCustomer={handleStartSaleForCustomer}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsSection
            storeData={storeData}
            onRestoreData={(d) => setStoreData(d)}
            onResetData={handleResetData}
            onViewReceipt={(tx) => setActiveReceiptTransaction(tx)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-4 px-4 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{STORE_NAME} · অ্যাডমিন সাইট ও বাকি খাতা সিস্টেম</span>
          <span>তথ্য এই ডিভাইসের ব্রাউজারে সুরক্ষিত সংরক্ষিত থাকে</span>
        </div>
      </footer>

      {/* MODAL: Customer Debt History & Chronological Ledger */}
      {activeCustomerInModal && (
        <CustomerDebtHistoryModal
          customer={activeCustomerInModal}
          transactions={storeData.transactions}
          storeName={STORE_NAME}
          onClose={() => setSelectedCustomerForHistory(null)}
          onCollectPayment={handleCollectDebtPayment}
          onViewReceipt={(tx) => setActiveReceiptTransaction(tx)}
        />
      )}

      {/* MODAL: Receipt Slip (Printable / Shareable) */}
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
