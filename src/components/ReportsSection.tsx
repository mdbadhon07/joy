import React, { useState, useRef } from 'react';
import { StoreData, Transaction } from '../types/store';
import { Download, Upload, Printer, Search, ArrowUpRight, ArrowDownLeft, FileSpreadsheet } from 'lucide-react';
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

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(storeData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joy-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Customer', 'Phone', 'Total', 'Paid', 'Due', 'Note', 'Date'];
    const rows = filtered.map((tx) => [
      tx.id,
      tx.type,
      `"${tx.customerName}"`,
      tx.customerPhone || '',
      tx.totalAmount,
      tx.paidAmount,
      tx.dueAmount,
      `"${tx.note || ''}"`,
      `"${formatDateTime(tx.timestamp || tx.date)}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.transactions)) {
        alert('সঠিক ব্যাকআপ ফাইল নির্বাচন করুন।');
        return;
      }
      onRestoreData(parsed);
      alert('ব্যাকআপ ফিরিয়ে আনা হয়েছে!');
    } catch (err) {
      alert('ফাইলটি পড়া যায়নি।');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 max-w-5xl mx-auto">
      {/* Top Filter & Backup bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="লেনদেন খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <div className="flex p-0.5 bg-stone-100 rounded-lg text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                filterType === 'all' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-600'
              }`}
            >
              সব ({storeData.transactions.length})
            </button>
            <button
              onClick={() => setFilterType('sale')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                filterType === 'sale' ? 'bg-white shadow-2xs text-emerald-900' : 'text-stone-600'
              }`}
            >
              বিক্রয়
            </button>
            <button
              onClick={() => setFilterType('debt_payment')}
              className={`px-2.5 py-1.5 rounded-md font-semibold transition-colors ${
                filterType === 'debt_payment' ? 'bg-white shadow-2xs text-blue-900' : 'text-stone-600'
              }`}
            >
              বাকি জমা
            </button>
          </div>

          <button
            onClick={handleExportBackup}
            className="p-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs"
            title="ব্যাকআপ ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ব্যাকআপ</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-semibold flex items-center gap-1"
            title="ব্যাকআপ ফিরিয়ে আনুন"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">রিস্টোর</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportFile}
            className="hidden"
          />

          <button
            onClick={handleExportCSV}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 text-xs font-semibold"
            title="CSV ফাইল"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200">
              <tr>
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-2">ধরন</th>
                <th className="py-2.5 px-3">কাস্টমার</th>
                <th className="py-2.5 px-3">নোট</th>
                <th className="py-2.5 px-3 text-right">মোট বিল</th>
                <th className="py-2.5 px-3 text-right">জমা</th>
                <th className="py-2.5 px-3 text-right">বাকি</th>
                <th className="py-2.5 px-2 text-center">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-stone-400">
                    কোনো লেনদেন নেই।
                  </td>
                </tr>
              ) : (
                filtered.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-stone-600">
                      {formatDateTime(tx.timestamp || tx.date)}
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {tx.type === 'sale' ? (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          বিক্রয়
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded">
                          জমা
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
                    <td className="py-2.5 px-3 text-right font-mono-nums font-bold">
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
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="p-1 rounded text-stone-400 hover:text-stone-800 hover:bg-stone-100"
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

      <div className="text-right">
        <button
          onClick={() => {
            if (confirm('ডেমো ডেটায় রিসেট করতে চান?')) {
              onResetData();
            }
          }}
          className="text-stone-400 hover:text-red-600 text-xs underline"
        >
          ডেমো ডেটায় রিসেট
        </button>
      </div>
    </div>
  );
};
