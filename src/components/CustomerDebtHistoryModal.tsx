import React, { useState } from 'react';
import { Customer, Transaction } from '../types/store';
import { 
  X, 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Share2, 
  Printer, 
  FileText,
  User,
  PlusCircle,
  Copy,
  Check
} from 'lucide-react';
import { 
  formatTaka, 
  formatDateTime, 
  getDebtReminderMessage,
  getCustomerFullDebtReportMessage, 
  openWhatsApp, 
  openSMS, 
  openImo,
  makePhoneCall 
} from '../utils/formatters';
import { ShareButtons } from './ShareButtons';

interface CustomerDebtHistoryModalProps {
  customer: Customer;
  transactions: Transaction[];
  storeName: string;
  onClose: () => void;
  onCollectPayment: (data: {
    customerId: string;
    amount: number;
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
    note: string;
  }) => void;
  onViewReceipt: (tx: Transaction) => void;
}

export const CustomerDebtHistoryModal: React.FC<CustomerDebtHistoryModalProps> = ({
  customer,
  transactions,
  storeName,
  onClose,
  onCollectPayment,
  onViewReceipt,
}) => {
  // Payment Collection Form State
  const [showCollectForm, setShowCollectForm] = useState(false);
  const [collectAmount, setCollectAmount] = useState<string>(
    customer.currentDebt > 0 ? String(customer.currentDebt) : ''
  );
  const [collectMethod, setCollectMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('cash');
  const [collectNote, setCollectNote] = useState<string>('বকেয়া বাকি জমা');
  const [reminderMode, setReminderMode] = useState<'short' | 'full'>('short');
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [formError, setFormError] = useState('');

  // Filter and sort transactions for this customer
  const customerTxs = transactions
    .filter((t) => t.customerId === customer.id || t.customerPhone === customer.phone)
    .sort((a, b) => b.timestamp - a.timestamp);

  // Compute running balance timeline
  // Sort oldest to newest first to calculate running balance, then reverse
  const chronologicalTxs = [...customerTxs].sort((a, b) => a.timestamp - b.timestamp);
  let runningDebt = 0;
  const txsWithRunningBalance = chronologicalTxs.map((tx) => {
    if (tx.type === 'sale') {
      runningDebt += tx.dueAmount;
    } else if (tx.type === 'debt_payment') {
      runningDebt -= tx.paidAmount;
    }
    return {
      ...tx,
      balanceAfter: Math.max(0, runningDebt),
    };
  }).reverse();

  const shortReminderText = getDebtReminderMessage(storeName, customer.name, customer.currentDebt);
  const fullReportText = getCustomerFullDebtReportMessage(
    storeName,
    customer.name,
    customer.currentDebt,
    customer.totalPurchased || 0,
    customer.totalPaid || 0
  );
  const activeMessageText = reminderMode === 'short' ? shortReminderText : fullReportText;

  const handleConfirmCollect = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const amt = parseFloat(collectAmount);
    if (!amt || amt <= 0) {
      setFormError('সঠিক টাকার অংক লিখুন।');
      return;
    }

    onCollectPayment({
      customerId: customer.id,
      amount: amt,
      paymentMethod: collectMethod,
      note: collectNote.trim() || 'বকেয়া জমা',
    });

    setShowCollectForm(false);
    setCollectAmount('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl font-bold border border-white/20">
              {customer.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold leading-tight">
                  {customer.name}
                </h3>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/15 text-emerald-200">
                  বাকি খাতা ও হিসাব
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-200/90 mt-1">
                {customer.phone ? (
                  <span className="font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {customer.phone}
                  </span>
                ) : (
                  <span>নম্বর নেই</span>
                )}
                {customer.address && (
                  <span>· {customer.address}</span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className={`p-3 rounded-xl border ${
              customer.currentDebt > 0 
                ? 'bg-amber-50/80 border-amber-200 text-amber-950' 
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            }`}>
              <span className="text-[11px] font-medium text-stone-500 block">
                বর্তমান বকেয়া বাকি
              </span>
              <span className={`text-lg sm:text-2xl font-bold font-mono-nums block mt-0.5 ${
                customer.currentDebt > 0 ? 'text-amber-800' : 'text-emerald-700'
              }`}>
                {formatTaka(customer.currentDebt)}
              </span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                {customer.currentDebt > 0 ? 'পাওনা বাকি রয়েছে' : 'সম্পূর্ণ দেনামুক্ত'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900">
              <span className="text-[11px] font-medium text-stone-500 block">
                সর্বমোট ক্রয়
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono-nums text-stone-900 block mt-0.5">
                {formatTaka(customer.totalPurchased)}
              </span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                মোট বিলের সমষ্টি
              </span>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-900">
              <span className="text-[11px] font-medium text-stone-500 block">
                সর্বমোট পরিশোধ
              </span>
              <span className="text-lg sm:text-2xl font-bold font-mono-nums text-emerald-700 block mt-0.5">
                {formatTaka(customer.totalPaid)}
              </span>
              <span className="text-[10px] text-stone-400 mt-0.5 block">
                নগদ ও বাকি জমা
              </span>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-200">
            <button
              onClick={() => setShowCollectForm(!showCollectForm)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>বাকি জমা গ্রহণ (Repayment)</span>
            </button>

            {customer.phone && (
              <button
                onClick={() => makePhoneCall(customer.phone)}
                className="px-3 py-2 rounded-xl bg-stone-100 text-stone-800 hover:bg-stone-200 border border-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-stone-600" />
                <span>সরাসরি কল</span>
              </button>
            )}
          </div>

          {/* WhatsApp, IMO & SMS Messaging */}
          {customer.phone && customer.currentDebt > 0 && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-stone-700">বাকি তাগাদা পাঠান:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setReminderMode('short')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      reminderMode === 'short' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    সংক্ষিপ্ত
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderMode('full')}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      reminderMode === 'full' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
                    }`}
                  >
                    পূর্ণাঙ্গ খতিয়ান
                  </button>
                </div>
              </div>

              <ShareButtons
                phone={customer.phone}
                customerName={customer.name}
                messageText={activeMessageText}
                variant="full"
              />
            </div>
          )}

          {/* Quick Payment Collection Form Drawer */}
          {showCollectForm && (
            <form onSubmit={handleConfirmCollect} className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>বাকি জমার এন্ট্রি</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowCollectForm(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  বাতিল
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    জমা টাকা (টাকা) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 text-sm font-bold">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="1"
                      required
                      value={collectAmount}
                      onChange={(e) => setCollectAmount(e.target.value)}
                      placeholder="0"
                      className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-900 font-bold font-mono-nums text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  {customer.currentDebt > 0 && (
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => setCollectAmount(String(customer.currentDebt))}
                        className="text-[10px] text-emerald-700 hover:underline"
                      >
                        পুরো বাকি (৳{customer.currentDebt})
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    মাধ্যম
                  </label>
                  <select
                    value={collectMethod}
                    onChange={(e) => setCollectMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="cash">নগদ ক্যাশ (Cash)</option>
                    <option value="bkash">বিকাশ (bKash)</option>
                    <option value="nagad">নগদ (Nagad)</option>
                    <option value="bank">ব্যাংক</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    মন্তব্য / নোট
                  </label>
                  <input
                    type="text"
                    value={collectNote}
                    onChange={(e) => setCollectNote(e.target.value)}
                    placeholder="যেমন: দোকানে এসে জমা"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-xs text-red-600">{formError}</p>
              )}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCollectForm(false)}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>জমা নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          )}

          {/* CHRONOLOGICAL DEBT & TRANSACTION HISTORY LEDGER */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>বাকির খতিয়ান ও লেনদেন ইতিহাস ({txsWithRunningBalance.length})</span>
              </h4>
              <span className="text-xs text-stone-500">কালানুক্রমিক তালিকা</span>
            </div>

            {txsWithRunningBalance.length === 0 ? (
              <div className="text-center py-10 bg-stone-50 rounded-xl border border-dashed border-stone-200">
                <p className="text-xs text-stone-500">এই কাস্টমারের কোনো পূর্ববর্তী লেনদেন নেই।</p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-stone-100 text-stone-700 border-b border-stone-200 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">তারিখ ও সময়</th>
                        <th className="py-2.5 px-3">লেনদেনের ধরন</th>
                        <th className="py-2.5 px-3">বিবরণ / নোট</th>
                        <th className="py-2.5 px-3 text-right">মোট বিল</th>
                        <th className="py-2.5 px-3 text-right">জমা</th>
                        <th className="py-2.5 px-3 text-right">বাকি যোগ/বিয়োগ</th>
                        <th className="py-2.5 px-3 text-right">অবশিষ্ট মোট বাকি</th>
                        <th className="py-2.5 px-2 text-center">রসিদ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {txsWithRunningBalance.map((tx) => (
                        <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-stone-600">
                            {formatDateTime(tx.timestamp || tx.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {tx.type === 'sale' ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                বিক্রয়
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                <ArrowDownLeft className="w-3 h-3 text-blue-600" />
                                বাকি জমা
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-stone-700 max-w-xs truncate">
                            {tx.note || (tx.type === 'sale' ? 'বিক্রয়' : 'বকেয়া পরিশোধ')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-nums text-stone-800">
                            {tx.totalAmount > 0 ? formatTaka(tx.totalAmount) : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-nums text-emerald-700 font-medium">
                            {formatTaka(tx.paidAmount)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-nums font-semibold">
                            {tx.type === 'sale' ? (
                              tx.dueAmount > 0 ? (
                                <span className="text-amber-700">+{formatTaka(tx.dueAmount)}</span>
                              ) : (
                                <span className="text-stone-400">৳০</span>
                              )
                            ) : (
                              <span className="text-blue-700">-{formatTaka(tx.paidAmount)}</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-nums font-bold text-stone-900 bg-stone-50/50">
                            {formatTaka(tx.balanceAfter)}
                          </td>
                          <td className="py-2.5 px-2 text-center whitespace-nowrap">
                            <button
                              onClick={() => onViewReceipt(tx)}
                              className="p-1 rounded hover:bg-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
                              title="রসিদ দেখুন ও প্রিন্ট করুন"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 flex items-center justify-between text-xs text-stone-500 shrink-0">
          <span>জয় কুমার স্টোর বাকি লেজার সিস্টেম</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold transition-colors"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
