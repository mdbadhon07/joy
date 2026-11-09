import React, { useState, useRef } from 'react';
import { Customer, StoreData, Transaction } from '../types/store';
import { 
  FileText, 
  Download, 
  Upload, 
  Printer, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { formatTaka, formatDateTime } from '../utils/formatters';

interface ReportsSectionProps {
  storeData: StoreData;
  onRestoreData: (data: StoreData) => void;
  onResetData: () => void;
  onViewReceipt: (tx: Transaction) => void;
}

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  storeData,
  onRestoreData,
  onResetData,
  onViewReceipt,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'sale' | 'debt_payment'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered transactions
  const filtered = storeData.transactions.filter((tx) => {
    if (filterType !== 'all' && tx.type !== filterType) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      tx.customerName.toLowerCase().includes(q) ||
      (tx.customerPhone && tx.customerPhone.includes(q)) ||
      (tx.note && tx.note.toLowerCase().includes(q))
    );
  });

  // Calculate totals for filtered list
  const totalBilled = filtered
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalCollected = filtered.reduce((sum, t) => sum + t.paidAmount, 0);

  const totalDueGenerated = filtered
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + t.dueAmount, 0);

  // Export JSON Backup
  const handleExportBackup = () => {
    const dataStr = JSON.stringify(storeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    a.download = `joy-kumar-store-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Customer Name', 'Phone', 'Total Amount', 'Paid Amount', 'Due Amount', 'Note', 'Date'];
    const rows = filtered.map((tx) => [
      tx.id,
      tx.type === 'sale' ? 'Sale' : 'Debt Payment',
      `"${tx.customerName.replace(/"/g, '""')}"`,
      tx.customerPhone || '',
      tx.totalAmount,
      tx.paidAmount,
      tx.dueAmount,
      `"${(tx.note || '').replace(/"/g, '""')}"`,
      `"${formatDateTime(tx.timestamp || tx.date)}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joy-kumar-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.customers) || (!Array.isArray(parsed.transactions) && !Array.isArray(parsed.sales))) {
        alert('সঠিক ব্যাকআপ ফাইল নির্বাচন করুন। ফরম্যাট মিলছে না।');
        return;
      }
      onRestoreData(parsed);
      alert('ব্যাকআপ সফলভাবে ফিরিয়ে আনা হয়েছে!');
    } catch (err) {
      alert('ব্যাকআপ ফাইলটি পড়তে ব্যর্থ হয়েছে।');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <span>বিক্রয় ও বাকি আদায় রিপোর্ট</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              সকল লেনদেনের সম্পূর্ণ হিসাব, অডিট হিস্টোরি ও ডেটা ব্যাকআপ।
            </p>
          </div>

          {/* Backup Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportBackup}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ব্যাকআপ ডাউনলোড</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1.5 border border-stone-200 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ব্যাকআপ রিস্টোর</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 border border-stone-200"
              title="এক্সেল CSV ডাউনলোড"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="কাস্টমার বা বিবরণ দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs text-stone-900 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-md font-medium ${
                filterType === 'all' ? 'bg-white shadow-xs text-stone-900 font-bold' : 'text-stone-600'
              }`}
            >
              সব ({storeData.transactions.length})
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-3 py-1 rounded-md font-medium ${
                filterType === 'sale' ? 'bg-white shadow-xs text-emerald-900 font-bold' : 'text-stone-600'
              }`}
            >
              শুধু বিক্রয়
            </button>
            <button
              onClick={() => setFilterType('debt_payment')}
              className={`px-3 py-1 rounded-md font-medium ${
                filterType === 'debt_payment' ? 'bg-white shadow-xs text-blue-900 font-bold' : 'text-stone-600'
              }`}
            >
              শুধু বাকি জমা
            </button>
          </div>
        </div>

        {/* Aggregate Mini-stats */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 pt-4 border-t border-stone-100 text-xs">
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <span className="text-stone-500 block">মোট বিক্রয় পরিমাণ</span>
            <strong className="text-sm sm:text-base font-bold font-mono-nums text-stone-900">
              {formatTaka(totalBilled)}
            </strong>
          </div>
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <span className="text-stone-500 block">মোট সংগৃহীত নগদ</span>
            <strong className="text-sm sm:text-base font-bold font-mono-nums text-emerald-700">
              {formatTaka(totalCollected)}
            </strong>
          </div>
          <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-100">
            <span className="text-stone-500 block">নতুন বাকি সৃষ্টি</span>
            <strong className="text-sm sm:text-base font-bold font-mono-nums text-amber-700">
              {formatTaka(totalDueGenerated)}
            </strong>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
              <tr>
                <th className="py-3 px-3.5">তারিখ</th>
                <th className="py-3 px-3">ধরন</th>
                <th className="py-3 px-3">কাস্টমার</th>
                <th className="py-3 px-3">বিবরণ / নোট</th>
                <th className="py-3 px-3 text-right">বিলের মোট মূল্য</th>
                <th className="py-3 px-3 text-right">জমা</th>
                <th className="py-3 px-3 text-right">বাকি</th>
                <th className="py-3 px-3 text-center">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-stone-400">
                    কোনো লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 px-3.5 whitespace-nowrap text-stone-600">
                      {formatDateTime(tx.timestamp || tx.date)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {tx.type === 'sale' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                          বিক্রয়
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                          <ArrowDownLeft className="w-3 h-3 text-blue-600" />
                          বাকি জমা
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <strong className="text-stone-900 block">{tx.customerName}</strong>
                      {tx.customerPhone && (
                        <span className="text-[10px] text-stone-400 font-mono">{tx.customerPhone}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">
                      {tx.note || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-nums font-medium text-stone-900">
                      {tx.totalAmount > 0 ? formatTaka(tx.totalAmount) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono-nums font-bold text-emerald-700">
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
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="p-1 rounded text-stone-400 hover:text-stone-800 hover:bg-stone-200 transition-colors"
                        title="রসিদ দেখুন"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Notice & Demo Reset */}
      <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
        <div>
          <strong className="block font-bold">নিয়মিত ব্যাকআপ সংরক্ষণ নির্দেশিকা:</strong>
          <p className="text-amber-800/90 mt-0.5">
            দোকানের সমস্ত তথ্য আপনার ব্রাউজার মেমোরিতে নিরাপদে সংরক্ষিত রয়েছে। নিয়মিত "ব্যাকআপ ডাউনলোড" করে কম্পিউটারে বা ফোনে ফাইলটি রেখে দিন।
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (confirm('আপনি কি টেস্ট ডেমো ডেটায় রিসেট করতে চান? বর্তমান সব পরিবর্তন মুছে যাবে।')) {
              onResetData();
            }
          }}
          className="text-amber-800 hover:text-red-700 underline text-xs font-medium shrink-0"
        >
          ডেমো ডেটায় রিসেট
        </button>
      </div>
    </div>
  );
};
