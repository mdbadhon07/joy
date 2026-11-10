import React, { useState, useMemo } from 'react';
import { Customer, Transaction } from '../types/store';
import { Search, DollarSign, FileText, Plus } from 'lucide-react';
import { formatTaka, getDebtReminderMessage } from '../utils/formatters';
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
  storeName,
  onSelectCustomerHistory,
  onQuickCollect,
  onNewSaleForCustomer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due_only' | 'cleared'>('due_only');
  const [sortBy, setSortBy] = useState<'debt_desc' | 'name' | 'recent'>('debt_desc');

  const debtorCustomersCount = useMemo(() => {
    return customers.filter((c) => (c.currentDebt || 0) > 0).length;
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
        if (!matchesSearch) return false;

        if (filterType === 'due_only') return (c.currentDebt || 0) > 0;
        if (filterType === 'cleared') return (c.currentDebt || 0) === 0;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'debt_desc') return (b.currentDebt || 0) - (a.currentDebt || 0);
        if (sortBy === 'name') return a.name.localeCompare(b.name, 'bn');
        if (sortBy === 'recent') return (b.lastActive || 0) - (a.lastActive || 0);
        return 0;
      });
  }, [customers, searchQuery, filterType, sortBy]);

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কাস্টমারের নাম বা মোবাইল দিয়ে খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex p-0.5 bg-stone-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('due_only')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                filterType === 'due_only' ? 'bg-white shadow-2xs text-amber-900' : 'text-stone-600'
              }`}
            >
              বাকি আছে ({debtorCustomersCount})
            </button>
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                filterType === 'all' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'
              }`}
            >
              সব ({customers.length})
            </button>
            <button
              onClick={() => setFilterType('cleared')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                filterType === 'cleared' ? 'bg-white shadow-2xs text-emerald-900' : 'text-stone-600'
              }`}
            >
              দেনামুক্ত
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2 py-1.5 rounded-lg border border-stone-300 text-xs bg-white text-stone-700"
          >
            <option value="debt_desc">বেশি বাকি</option>
            <option value="name">নাম</option>
            <option value="recent">সাম্প্রতিক</option>
          </select>
        </div>
      </div>

      {/* Customer List */}
      {filteredCustomers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-stone-500 text-xs">
          কোনো কাস্টমার পাওয়া যায়নি।
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCustomers.map((customer) => {
            const hasDebt = (customer.currentDebt || 0) > 0;
            const reminderMsg = getDebtReminderMessage(storeName, customer.name, customer.currentDebt);

            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-stone-200 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-emerald-300 transition-colors"
              >
                {/* Left: Info */}
                <div 
                  className="cursor-pointer min-w-0"
                  onClick={() => onSelectCustomerHistory(customer)}
                >
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm sm:text-base text-stone-900 truncate">
                      {customer.name}
                    </h4>
                    {customer.phone && (
                      <span className="text-xs text-stone-500 font-mono">
                        ({customer.phone})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                    <span>
                      মোট ক্রয়: <strong className="font-mono-nums text-stone-700">৳{customer.totalPurchased || 0}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      পরিশোধ: <strong className="font-mono-nums text-emerald-700">৳{customer.totalPaid || 0}</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Debt amount and quick actions */}
                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] text-stone-400 block font-medium">বর্তমান বাকি</span>
                    <strong
                      className={`text-base sm:text-lg font-bold font-mono-nums ${
                        hasDebt ? 'text-amber-700' : 'text-emerald-700'
                      }`}
                    >
                      {hasDebt ? formatTaka(customer.currentDebt) : '৳০ (পরিশোধিত)'}
                    </strong>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {hasDebt && (
                      <button
                        onClick={() => onQuickCollect(customer)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1"
                        title="বাকি টাকা জমা নিন"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>জমা</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSelectCustomerHistory(customer)}
                      className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors flex items-center gap-1"
                      title="বাকির খতিয়ান ইতিহাস"
                    >
                      <FileText className="w-3.5 h-3.5 text-stone-600" />
                      <span>খাতা</span>
                    </button>

                    {/* WhatsApp, IMO, SMS */}
                    {hasDebt && customer.phone && (
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
  );
};
