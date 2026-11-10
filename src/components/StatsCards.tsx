import React from 'react';
import { formatTaka, toBengaliNumber } from '../utils/formatters';

interface StatsCardsProps {
  totalSales: number;
  totalDebt: number;
  customerCount: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalSales,
  totalDebt,
  customerCount,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 my-3">
      {/* মোট বিক্রি */}
      <div className="bg-white border border-[#dce6dd] rounded-[14px] p-3.5 shadow-2xs">
        <small className="text-[#607064] text-[13px] block font-normal">
          মোট বিক্রি
        </small>
        <strong className="text-[21px] sm:text-[23px] font-bold text-[#17251a] block mt-1 tracking-tight font-mono-nums">
          {formatTaka(totalSales)}
        </strong>
      </div>

      {/* সর্বমোট বাকি */}
      <div className="bg-white border border-[#dce6dd] rounded-[14px] p-3.5 shadow-2xs">
        <small className="text-[#607064] text-[13px] block font-normal">
          সর্বমোট বাকি
        </small>
        <strong className="text-[21px] sm:text-[23px] font-bold text-[#17251a] block mt-1 tracking-tight font-mono-nums">
          {formatTaka(totalDebt)}
        </strong>
      </div>

      {/* মোট কাস্টমার */}
      <div className="bg-white border border-[#dce6dd] rounded-[14px] p-3.5 shadow-2xs col-span-2 md:col-span-1">
        <small className="text-[#607064] text-[13px] block font-normal">
          মোট কাস্টমার
        </small>
        <strong className="text-[21px] sm:text-[23px] font-bold text-[#17251a] block mt-1 tracking-tight font-mono-nums">
          {toBengaliNumber(customerCount)}
        </strong>
      </div>
    </div>
  );
};
