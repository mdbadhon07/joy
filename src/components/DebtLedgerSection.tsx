import React, { useState, useMemo } from 'react';
import { Customer, Transaction } from '../types/store';
import { 
  BookOpen, 
  Search, 
  Filter, 
  ArrowUpDown, 
  DollarSign, 
  Phone, 
  AlertCircle, 
  CheckCircle2, 
  PlusCircle, 
  MessageCircle, 
  MessageSquare,
  FileText,
  UserCheck
} from 'lucide-react';
import { 
  formatTaka, 
  openWhatsApp, 
  openSMS, 
  makePhoneCall,
  getDebtReminderMessage 
} from '../utils/formatters';
import { ShareButtons } from './ShareButtons';

interface DebtLedgerSectionProps {
  customers: Customer[];
  transactions: Transaction[];
  storeName: string;
  onSelectCustomerHistory: (customer: Customer) => void;
  onQuickCollect: (customer: Customer) => void;
  onNewSaleForCustomer: (customerId: string) => void;
}

export const DebtLedgerSection: React.FC<DebtLedgerSectionProps> = ({
  customers,
  transactions,
  storeName,
  onSelectCustomerHistory,
  onQuickCollect,
  onNewSaleForCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due_only' | 'cleared'>('due_only');
  const [sortBy, setSortBy] = useState<'debt_desc' | 'debt_asc' | 'name' | 'recent'>('debt_desc');

  // Overall statistics for debt
  const totalDebtAmount = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.currentDebt || 0), 0);
  }, [customers]);

  const debtorCustomersCount = useMemo(() => {
    return customers.filter((c) => (c.currentDebt || 0) > 0).length;
  }, [customers]);

  // Filtered & sorted customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.address && c.address.toLowerCase().includes(q));
        if (!matchesSearch) return false;

        // Filter status
        if (filterType === 'due_only') return (c.currentDebt || 0) > 0;
        if (filterType === 'cleared') return (c.currentDebt || 0) === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'debt_desc') return (b.currentDebt || 0) - (a.currentDebt || 0);
        if (sortBy === 'debt_asc') return (a.currentDebt || 0) - (b.currentDebt || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'bn');
        if (sortBy === 'recent') return (b.lastActive || 0) - (a.lastActive || 0);
        return 0;
      });
  }, [customers, searchQuery, filterType, sortBy]);

  return (
    <div className="space-y-5">
      {/* Top Banner with Stats & Context */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              <span>কাস্টমার বাকি খাতা (Debt Ledger)</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              সকল গ্রাহকের বর্তমান বাকি স্থিতি, বকেয়া হিসাব ও ঋণ পরিশোধের বিস্তারিত খতিয়ান।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-950">
              <span className="text-[11px] text-amber-700 block font-medium">মোট বকেয়া পাওনা</span>
              <strong className="text-base sm:text-lg font-bold font-mono-nums text-amber-800">
                {formatTaka(totalDebtAmount)}
              </strong>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-stone-100 border border-stone-200 text-stone-900">
              <span className="text-[11px] text-stone-500 block font-medium">বাকি থাকা কাস্টমার</span>
              <strong className="text-base sm:text-lg font-bold font-mono-nums text-stone-800">
                {debtorCustomersCount} <span className="text-xs font-normal">জন</span>
              </strong>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কাস্টমারের নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Segmented Controls & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter buttons */}
            <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('due_only')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'due_only'
                    ? 'bg-white text-amber-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                বাকি আছে ({debtorCustomersCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                সকল ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('cleared')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  filterType === 'cleared'
                    ? 'bg-white text-emerald-900 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                দেনামুক্ত ({customers.length - debtorCustomersCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="debt_desc">সর্বোচ্চ বাকি আগে</option>
              <option value="debt_asc">কম বাকি আগে</option>
              <option value="recent">সাম্প্রতিক লেনদেন</option>
              <option value="name">নাম অনুযায়ী</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Debt List */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <BookOpen className="w-10 h-10 text-stone-300 mx-auto mb-3" />
          <h3 className="font-bold text-stone-800 text-base">কোনো কাস্টমার পাওয়া যায়নি</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {filterType === 'due_only'
              ? 'বর্তমানে কারও কাছে কোনো বকেয়া বাকি নেই। সবগুলো বিল পরিশোধিত রয়েছে।'
              : 'সার্চের সাথে মিল পাওয়া যায়নি। অন্য নাম বা নম্বর দিয়ে খুঁজুন।'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCustomers.map((customer) => {
            const hasDebt = (customer.currentDebt || 0) > 0;
            const reminderMsg = getDebtReminderMessage(storeName, customer.name, customer.currentDebt);

            return (
              <div
                key={customer.id}
                className={`bg-white rounded-2xl border transition-all p-4 flex flex-col justify-between gap-3 shadow-xs hover:shadow-md ${
                  hasDebt ? 'border-amber-200/90 hover:border-amber-400' : 'border-stone-200/80 hover:border-emerald-300'
                }`}
              >
                {/* Header with Name, Phone, and Debt Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0 ${
                      hasDebt ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {customer.name.slice(0, 1)}
                    </div>
                    <div>
                      <h4 className="font-bold text-stone-900 text-base leading-snug">
                        {customer.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mt-0.5">
                        {customer.phone ? (
                          <span className="font-mono">{customer.phone}</span>
                        ) : (
                          <span className="text-stone-400">নম্বর নেই</span>
                        )}
                        {customer.address && (
                          <span className="truncate max-w-[160px]">· {customer.address}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CURRENT DEBT BADGE - Central Focus */}
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-400 block font-medium">বর্তমান বাকি</span>
                    <span
                      className={`text-lg sm:text-xl font-bold font-mono-nums ${
                        hasDebt ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {hasDebt ? formatTaka(customer.currentDebt) : '৳০ (পরিশোধিত)'}
                    </span>
                  </div>
                </div>

                {/* Lifetime Metrics Sub-row */}
                <div className="flex items-center justify-between text-xs text-stone-500 py-1.5 px-3 rounded-xl bg-stone-50 border border-stone-100">
                  <span>
                    মোট কেনাকাটা: <strong className="font-mono-nums text-stone-800">৳{customer.totalPurchased || 0}</strong>
                  </span>
                  <span>
                    মোট পরিশোধ: <strong className="font-mono-nums text-emerald-700">৳{customer.totalPaid || 0}</strong>
                  </span>
                </div>

                {/* Action Buttons Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-1.5">
                    {/* View Full Debt History Ledger */}
                    <button
                      type="button"
                      onClick={() => onSelectCustomerHistory(customer)}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title="বাকির খাতা ও ইতিহাস দেখুন"
                    >
                      <FileText className="w-3.5 h-3.5 text-stone-600" />
                      <span>বাকির ইতিহাস</span>
                    </button>

                    {/* Receive Debt Payment */}
                    {hasDebt && (
                      <button
                        type="button"
                        onClick={() => onQuickCollect(customer)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
                        title="বাকি টাকা জমা নিন"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>জমা নিন</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onNewSaleForCustomer(customer.id)}
                      className="px-2 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 text-xs font-medium transition-colors"
                      title="এই কাস্টমারের নামে বিক্রয় করুন"
                    >
                      + বিক্রয়
                    </button>
                  </div>

                  {/* WhatsApp, IMO, SMS messaging buttons */}
                  {hasDebt && customer.phone && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-stone-400 mr-1 hidden sm:inline">তাগাদা:</span>
                      <ShareButtons
                        phone={customer.phone}
                        customerName={customer.name}
                        messageText={reminderMsg}
                        variant="compact"
                        showCall={true}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
