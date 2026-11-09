import React from 'react';
import { DollarSign, Wallet, AlertCircle, Users } from 'lucide-react';
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
  customerCount,
  debtCustomerCount,
  onViewDebts,
  onNewSale,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-4">
      {/* Total Sales */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between text-stone-500 mb-1">
          <span className="text-xs font-medium">মোট বিক্রয়</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-stone-900 font-mono-nums">
          {formatTaka(totalSales)}
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5">সবসময়ের রেকর্ডকৃত মোট বিক্রি</p>
      </div>

      {/* Total Cash Collected */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between text-stone-500 mb-1">
          <span className="text-xs font-medium">মোট জমা / আদায়</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-stone-900 font-mono-nums">
          {formatTaka(totalCollected)}
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5">বিক্রয় ও বাকি পরিশোধ থেকে মোট নগদ</p>
      </div>

      {/* Total Outstanding Debt */}
      <div 
        onClick={onViewDebts}
        className="bg-white rounded-xl border border-amber-200/90 p-4 shadow-xs hover:border-amber-400 transition-colors cursor-pointer relative group"
      >
        <div className="flex items-center justify-between text-amber-700 mb-1">
          <span className="text-xs font-medium flex items-center gap-1">
            মোট বর্তমান বাকি
          </span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-amber-900 font-mono-nums">
          {formatTaka(totalDebt)}
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <p className="text-[11px] text-amber-700/80">{debtCustomerCount} জন কাস্টমারের কাছে পাওনা</p>
          <span className="text-[10px] text-amber-600 underline font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            খাতা দেখুন →
          </span>
        </div>
      </div>

      {/* Customer summary */}
      <div className="bg-white rounded-xl border border-stone-200/90 p-4 shadow-xs hover:border-emerald-300 transition-colors">
        <div className="flex items-center justify-between text-stone-500 mb-1">
          <span className="text-xs font-medium">মোট কাস্টমার</span>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-bold text-stone-900 font-mono-nums">
          {customerCount} <span className="text-sm font-normal text-stone-500">জন</span>
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5">
          {customerCount - debtCustomerCount} জন দেনামুক্ত
        </p>
      </div>
    </div>
  );
};
