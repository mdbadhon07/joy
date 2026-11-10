import React from 'react';
import { formatTaka } from '../utils/formatters';

interface StatsCardsProps {
  totalSales: number;
  totalCollected: number;
  totalDebt: number;
  customerCount: number;
  debtCustomerCount: number;
  onViewDebts?: () => void;
  onNewSale?: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalSales,
  totalCollected,
  totalDebt,
  debtCustomerCount,
  onViewDebts,
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 py-2 mb-3">
      {/* Total Sales */}
      <div className="bg-white rounded-xl border border-stone-200 px-3 py-2 text-center">
        <span className="text-[11px] font-medium text-stone-500 block">মোট বিক্রি</span>
        <strong className="text-sm sm:text-base font-bold font-mono-nums text-stone-900 block mt-0.5">
          {formatTaka(totalSales)}
        </strong>
      </div>

      {/* Cash Collected */}
      <div className="bg-white rounded-xl border border-stone-200 px-3 py-2 text-center">
        <span className="text-[11px] font-medium text-stone-500 block">নগদ জমা</span>
        <strong className="text-sm sm:text-base font-bold font-mono-nums text-emerald-700 block mt-0.5">
          {formatTaka(totalCollected)}
        </strong>
      </div>

      {/* Outstanding Debt */}
      <div
        onClick={onViewDebts}
        className="bg-white rounded-xl border border-amber-200 hover:border-amber-400 px-3 py-2 text-center cursor-pointer transition-colors"
      >
        <div className="flex items-center justify-center gap-1">
          <span className="text-[11px] font-medium text-amber-700">মোট বাকি</span>
          {debtCustomerCount > 0 && (
            <span className="text-[10px] text-amber-600 font-bold">({debtCustomerCount} জন)</span>
          )}
        </div>
        <strong className="text-sm sm:text-base font-bold font-mono-nums text-amber-800 block mt-0.5">
          {formatTaka(totalDebt)}
        </strong>
      </div>
    </div>
  );
};
