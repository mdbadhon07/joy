import React from 'react';
import { Transaction } from '../types/store';
import { formatTaka } from '../utils/formatters';

interface HomeSectionProps {
  transactions: Transaction[];
  onNavigateTab: (tab: 'customers' | 'sales' | 'reports') => void;
}

export const HomeSection: React.FC<HomeSectionProps> = ({ transactions, onNavigateTab }) => {
  const latestTx = transactions.length > 0 ? transactions[0] : null;

  return (
    <div className="bg-white border border-[#dce6dd] rounded-[14px] p-4 sm:p-5 shadow-2xs">
      <h2 className="text-[19px] font-bold text-[#17251a] m-0">
        দোকানের হিসাব
      </h2>
      <p className="text-[14px] text-[#607064] mt-2 mb-3 leading-normal">
        কাস্টমার যোগ করুন, বিক্রয়ের মোট টাকা ও জমা লিখুন। আগের বাকি একই কাস্টমারের নামে স্বয়ংক্রিয়ভাবে যোগ হবে।
      </p>

      {/* সর্বশেষ লেনদেন */}
      <div className="text-[13px] text-[#607064] py-2.5 border-t border-[#dce6dd]">
        {latestTx ? (
          <span>
            সর্বশেষ লেনদেন: <strong className="text-[#17251a]">{latestTx.customerName}</strong> —{' '}
            {latestTx.type === 'sale' ? (
              <>মোট {formatTaka(latestTx.totalAmount)} {latestTx.dueAmount > 0 && <span className="text-amber-800 font-semibold">(বাকি {formatTaka(latestTx.dueAmount)})</span>}</>
            ) : (
              <>জমা {formatTaka(latestTx.paidAmount)}</>
            )}
          </span>
        ) : (
          <span>সর্বশেষ লেনদেন: এখনো কোনো লেনদেন নেই।</span>
        )}
      </div>

      {/* Yellow Notice box matching screenshot */}
      <div className="bg-[#fff8df] border border-[#f0dfa2] p-3 rounded-[10px] text-[13px] text-[#785500] leading-relaxed mt-2.5">
        এই সংস্করণে তথ্য এই ব্রাউজারের ডিভাইসেই সেভ থাকে। ফোন ও ল্যাপটপে একই ডেটা স্বয়ংক্রিয়ভাবে সিঙ্ক হয় না। নিয়মিত রিপোর্ট থেকে ব্যাকআপ রাখুন।
      </div>

      {/* Quick navigation buttons */}
      <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[#dce6dd]">
        <button
          type="button"
          onClick={() => onNavigateTab('sales')}
          className="border-0 rounded-[9px] py-2 px-3.5 bg-[#14532d] text-white text-xs font-semibold cursor-pointer hover:bg-[#207348] transition-colors"
        >
          + নতুন বিক্রয়
        </button>
        <button
          type="button"
          onClick={() => onNavigateTab('customers')}
          className="border-0 rounded-[9px] py-2 px-3.5 bg-[#e2ece4] text-[#17472b] text-xs font-semibold cursor-pointer hover:bg-[#d5e3d8] transition-colors"
        >
          কাস্টমার তালিকা ও বাকি
        </button>
      </div>
    </div>
  );
};
