import React from 'react';
import { Customer, Transaction } from '../types/store';
import { 
  ShoppingBag, 
  BookOpen, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileText, 
  PlusCircle, 
  Users, 
  MessageCircle, 
  DollarSign, 
  Printer,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
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
  // Top debtors (sorted by highest debt)
  const topDebtors = [...customers]
    .filter((c) => (c.currentDebt || 0) > 0)
    .sort((a, b) => (b.currentDebt || 0) - (a.currentDebt || 0))
    .slice(0, 5);

  // Recent transactions
  const recentTransactions = transactions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Quick Launchpad Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              দোকানের অ্যাডমিন ড্যাশবোর্ড
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              জয় কুমার স্টোর — দ্রুত বিক্রয় ও বাকি পরিচালনা
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/90 max-w-xl">
              পণ্য সিলেকশনের কোনো ঝামেলা ছাড়াই সরাসরি ম্যানুয়াল মূল্যে দ্রুত বিক্রয় ও গ্রাহকের বাকি খতিয়ান সংরক্ষণ করুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateTab('sales')}
              className="px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-stone-950 font-bold text-xs sm:text-sm transition-colors flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নতুন বিক্রয় (ম্যানুয়াল মূল্য)</span>
            </button>
            <button
              onClick={() => onNavigateTab('debts')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-2 border border-white/20"
            >
              <BookOpen className="w-4 h-4 text-amber-300" />
              <span>বাকি খাতা দেখুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Top Debtors & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top Debtors Box */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-stone-900">
                  সর্বোচ্চ বকেয়া তালিকা (বাকি খাতা)
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('debts')}
                className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-0.5"
              >
                সব বাকি ({topDebtors.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {topDebtors.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                <p className="text-xs font-medium text-stone-600">কোনো গ্রাহকের কাছে বকেয়া বাকি নেই!</p>
                <p className="text-[11px] text-stone-400 mt-0.5">সব হিসাব পরিশোধিত রয়েছে।</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 mt-2">
                {topDebtors.map((customer) => {
                  const reminderMsg = getDebtReminderMessage(storeName, customer.name, customer.currentDebt);
                  return (
                    <div
                      key={customer.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-stone-50/60 rounded-xl px-1.5 transition-colors"
                    >
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                        onClick={() => onSelectCustomerHistory(customer)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-xs shrink-0">
                          {customer.name.slice(0, 1)}
                        </div>
                        <div className="truncate">
                          <h4 className="font-bold text-sm text-stone-900 hover:text-emerald-700 transition-colors truncate">
                            {customer.name}
                          </h4>
                          <p className="text-xs text-stone-400 font-mono">
                            {customer.phone || 'নম্বর নেই'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-bold text-base font-mono-nums text-amber-800 block">
                          {formatTaka(customer.currentDebt)}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <button
                            type="button"
                            onClick={() => onQuickCollect(customer)}
                            className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold hover:bg-emerald-100 transition-colors"
                          >
                            জমা নিন
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
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-stone-100">
            <button
              onClick={() => onNavigateTab('debts')}
              className="w-full py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold text-center transition-colors"
            >
              সম্পূর্ণ বাকি খাতা ও খতিয়ান খুলুন
            </button>
          </div>
        </div>

        {/* Recent Transactions Box */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">
                  সাম্প্রতিক লেনদেনসমূহ
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-0.5"
              >
                সব দেখুন <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {recentTransactions.length === 0 ? (
              <div className="py-12 text-center text-stone-400">
                <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                <p className="text-xs font-medium text-stone-600">এখনো কোনো বিক্রয় বা জমা রেকর্ড নেই</p>
                <p className="text-[11px] text-stone-400 mt-0.5">নতুন বিক্রয় বাটনে ক্লিক করে হিসাব শুরু করুন।</p>
              </div>
            ) : (
              <div className="divide-y divide-stone-100 mt-2">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-3 hover:bg-stone-50/60 rounded-xl px-1.5 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        tx.type === 'sale' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {tx.type === 'sale' ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs sm:text-sm text-stone-900 truncate">
                            {tx.customerName}
                          </h4>
                          <span className="text-[10px] text-stone-400">
                            {tx.type === 'sale' ? 'বিক্রয়' : 'বাকি জমা'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">
                          {tx.note || formatDateTime(tx.timestamp || tx.date)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
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
                        type="button"
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

          <div className="pt-3 border-t border-stone-100">
            <button
              onClick={() => onNavigateTab('reports')}
              className="w-full py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold text-center transition-colors"
            >
              সম্পূর্ণ বিক্রয় ও অডিট রিপোর্ট দেখুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
