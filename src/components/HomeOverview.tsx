import React from 'react';
import { Customer, Transaction } from '../types/store';
import { ArrowUpRight, ArrowDownLeft, Printer, ChevronRight } from 'lucide-react';
import { formatTaka, formatDateTime, getDebtReminderMessage } from '../utils/formatters';
import { ShareButtons } from './ShareButtons';

interface HomeOverviewProps {
  customers: Customer[];
  transactions: Transaction[];
  storeName: string;
  onNavigateTab: (tab: 'sales' | 'debts' | 'customers' | 'reports') => void;
  onSelectCustomerHistory: (customer: Customer) => void;
  onQuickCollect: (customer: Customer) => void;
  onViewReceipt: (tx: Transaction) => void;
}

export const HomeOverview: React.FC<HomeOverviewProps> = ({
  customers,
  transactions,
  storeName,
  onNavigateTab,
  onSelectCustomerHistory,
  onQuickCollect,
  onViewReceipt,
}) => {
  const topDebtors = [...customers]
    .filter((c) => (c.currentDebt || 0) > 0)
    .sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0))
    .slice(0, 5);

  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-w-5xl mx-auto">
      {/* Top Debtors */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900">
              সর্বোচ্চ বাকি তালিকা
            </h3>
            <button
              onClick={() => onNavigateTab('debts')}
              className="text-xs text-amber-800 hover:underline font-semibold flex items-center gap-0.5"
            >
              সব বাকি ({topDebtors.length}) <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topDebtors.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-400">কোনো বকেয়া বাকি নেই</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {topDebtors.map((customer) => {
                const reminderMsg = getDebtReminderMessage(storeName, customer.name, customer.currentDebt);
                return (
                  <div
                    key={customer.id}
                    className="py-2.5 flex items-center justify-between gap-2 hover:bg-stone-50 rounded-lg px-1 transition-colors"
                  >
                    <div 
                      className="cursor-pointer min-w-0"
                      onClick={() => onSelectCustomerHistory(customer)}
                    >
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                        {customer.name}
                      </h4>
                      <p className="text-[11px] text-stone-400 font-mono">
                        {customer.phone || 'নম্বর নেই'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <strong className="font-bold text-xs sm:text-sm font-mono-nums text-amber-800">
                        {formatTaka(customer.currentDebt)}
                      </strong>

                      <button
                        onClick={() => onQuickCollect(customer)}
                        className="px-2 py-1 rounded-md bg-emerald-600 text-white text-[11px] font-bold"
                      >
                        জমা
                      </button>

                      {customer.phone && (
                        <ShareButtons
                          phone={customer.phone}
                          customerName={customer.name}
                          messageText={reminderMsg}
                          variant="mini"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2.5 border-b border-stone-100">
            <h3 className="font-bold text-sm text-stone-900">
              সাম্প্রতিক লেনদেন
            </h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-emerald-800 hover:underline font-semibold flex items-center gap-0.5"
            >
              সব হিসাব <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <p className="py-8 text-center text-xs text-stone-400">এখনো কোনো লেনদেন নেই</p>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between gap-2 hover:bg-stone-50 rounded-lg px-1 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                      tx.type === 'sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      {tx.type === 'sale' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0 truncate">
                      <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                        {tx.customerName}
                      </h4>
                      <p className="text-[10px] text-stone-400">
                        {formatDateTime(tx.timestamp || tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-xs sm:text-sm font-mono-nums text-stone-900 block">
                        {tx.type === 'sale' ? formatTaka(tx.totalAmount) : formatTaka(tx.paidAmount)}
                      </span>
                      {tx.type === 'sale' && tx.dueAmount > 0 && (
                        <span className="text-[10px] font-semibold text-amber-700 font-mono-nums block">
                          বাকি: ৳{tx.dueAmount}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => onViewReceipt(tx)}
                      className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100"
                      title="রসিদ"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
