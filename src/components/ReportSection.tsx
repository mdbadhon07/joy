import React, { useRef } from 'react';
import { StoreData, Transaction } from '../types/store';
import { formatTaka, formatDateTime } from '../utils/formatters';
import { Trash2 } from 'lucide-react';

interface ReportSectionProps {
  storeData: StoreData;
  onRestoreData: (data: StoreData) => void;
  onViewReceipt: (tx: Transaction) => void;
  onDeleteTransaction: (txId: string) => void;
  onDeleteAllTransactions: () => void;
  onResetData: () => void;
}

export const ReportSection: React.FC<ReportSectionProps> = ({
  storeData,
  onRestoreData,
  onViewReceipt,
  onDeleteTransaction,
  onDeleteAllTransactions,
  onResetData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Customer', 'Phone', 'Total', 'Paid', 'Due', 'Note', 'Date'];
    const rows = storeData.transactions.map((tx) => [
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
    a.download = `joy-store-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white border border-[#dce6dd] rounded-[14px] p-4 sm:p-5 shadow-2xs space-y-4">
      <h2 className="text-[19px] font-bold text-[#17251a] m-0">
        বিক্রয় রিপোর্ট ও ব্যাকআপ
      </h2>

      {/* টেবিল */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[14px] border-collapse">
          <thead>
            <tr className="border-b border-[#dce6dd] text-[#607064]">
              <th className="py-2.5 px-2 font-medium">তারিখ</th>
              <th className="py-2.5 px-2 font-medium">কাস্টমার</th>
              <th className="py-2.5 px-2 font-medium text-right">মোট</th>
              <th className="py-2.5 px-2 font-medium text-right">জমা</th>
              <th className="py-2.5 px-2 font-medium text-right">বাকি</th>
              <th className="py-2.5 px-2 font-medium text-center">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#dce6dd]">
            {storeData.transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#607064] text-[13px]">
                  এখনো কোনো বিক্রয় বা লেনদেন রেকর্ড নেই।
                </td>
              </tr>
            ) : (
              storeData.transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#f3f7f3]/60 transition-colors">
                  <td className="py-2.5 px-2 text-[#607064] text-[13px] whitespace-nowrap">
                    {formatDateTime(tx.timestamp || tx.date)}
                  </td>
                  <td className="py-2.5 px-2 font-bold text-[#17251a]">
                    {tx.customerName}
                    {tx.type === 'debt_payment' && (
                      <span className="text-[11px] text-blue-700 font-normal ml-1">
                        (বাকি জমা)
                      </span>
                    )}
                    {tx.type === 'sale' && tx.totalAmount === 0 && tx.dueAmount > 0 && (
                      <span className="text-[11px] text-amber-800 font-normal ml-1">
                        (আগের বাকি)
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono-nums">
                    {tx.totalAmount > 0 ? formatTaka(tx.totalAmount) : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono-nums font-semibold text-[#14532d]">
                    {formatTaka(tx.paidAmount)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono-nums font-bold">
                    {tx.type === 'sale' ? (
                      tx.dueAmount > 0 ? (
                        <span className="text-amber-800">+{formatTaka(tx.dueAmount)}</span>
                      ) : (
                        <span className="text-[#14532d]">৳০</span>
                      )
                    ) : (
                      <span className="text-blue-700">-{formatTaka(tx.paidAmount)}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onViewReceipt(tx)}
                        className="border-0 rounded py-1 px-2 bg-[#e2ece4] text-[#17472b] text-xs font-semibold cursor-pointer hover:bg-[#d5e3d8]"
                        title="রসিদ দেখুন"
                      >
                        রসিদ
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`আপনি কি এই লেনদেনটি (${tx.customerName} - ৳${tx.totalAmount || tx.paidAmount}) মুছে ফেলতে চান? কাস্টমারের বাকির হিসাব স্বয়ংক্রিয়ভাবে সমন্বয় করা হবে।`)) {
                            onDeleteTransaction(tx.id);
                          }
                        }}
                        className="border-0 rounded py-1 px-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs cursor-pointer transition-colors"
                        title="লেনদেন মুছুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ব্যাকআপ বাটনসমূহ */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-[#dce6dd]">
        <button
          type="button"
          onClick={handleExportBackup}
          className="border-0 rounded-[10px] py-2 px-3.5 bg-[#14532d] text-white text-xs font-semibold cursor-pointer hover:bg-[#207348] transition-colors"
        >
          ডেটা ব্যাকআপ ডাউনলোড
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="border-0 rounded-[10px] py-2 px-3.5 bg-[#e2ece4] text-[#17472b] text-xs font-semibold cursor-pointer hover:bg-[#d5e3d8] transition-colors"
        >
          ব্যাকআপ ফিরিয়ে আনুন
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
          className="border-0 rounded-[10px] py-2 px-3 bg-[#e2ece4] text-[#17472b] text-xs font-semibold cursor-pointer hover:bg-[#d5e3d8]"
        >
          CSV ডাউনলোড
        </button>
      </div>

      <p className="text-[#607064] text-[13px] m-0">
        নিয়মিত ব্যাকআপ ডাউনলোড করে নিরাপদে রাখুন।
      </p>

      {/* হিস্ট্রি মোছা ও রিসেট বাটনসমূহ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#dce6dd]">
        <button
          type="button"
          onClick={() => {
            if (window.confirm('আপনি কি নিশ্চিত যে সমস্ত লেনদেনের ইতিহাস মুছে ফেলতে চান?\n\nকাস্টমারদের নাম ও নম্বর ঠিক থাকবে, কিন্তু সমস্ত বিক্রয় ও বাকির লেনদেন মুছে শূন্য হবে।')) {
              onDeleteAllTransactions();
            }
          }}
          className="border border-red-200 rounded-[8px] py-1.5 px-3 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>সকল লেনদেনের ইতিহাস মুছুন</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('আপনি কি সমস্ত ডেটা (কাস্টমার ও লেনদেন) মুছে নতুনভাবে শুরু করতে চান?')) {
              onResetData();
            }
          }}
          className="text-stone-400 hover:text-red-700 text-xs underline cursor-pointer"
        >
          সব ডেটা ক্লিয়ার করুন
        </button>
      </div>
    </div>
  );
};
