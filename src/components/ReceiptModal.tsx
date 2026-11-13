import React, { useState } from 'react';
import { Transaction, Customer } from '../types/store';
import { 
  X, 
  Printer, 
  Share2, 
  MessageCircle, 
  MessageSquare, 
  Check, 
  Copy, 
  ArrowUpRight, 
  ArrowDownLeft,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  formatTaka, 
  formatDateShort,
  openWhatsApp, 
  openSMS,
  getSaleReceiptMessage,
  getDebtPaymentReceiptMessage 
} from '../utils/formatters';
import { ShareButtons } from './ShareButtons';

interface ReceiptModalProps {
  transaction: Transaction;
  customer?: Customer;
  storeName: string;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  customer,
  storeName,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  const isSale = transaction.type === 'sale';
  const customerDebt = customer ? customer.currentDebt : Math.max(0, transaction.dueAmount);

  const formattedDateOnly = formatDateShort(transaction.timestamp || transaction.date);

  const receiptText = isSale
    ? getSaleReceiptMessage(
        storeName,
        transaction.customerName,
        transaction.totalAmount,
        transaction.paidAmount,
        transaction.dueAmount,
        customerDebt,
        transaction.note,
        formattedDateOnly
      )
    : getDebtPaymentReceiptMessage(
        storeName,
        transaction.customerName,
        transaction.paidAmount,
        customerDebt,
        transaction.note,
        formattedDateOnly
      );

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-emerald-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-300" />
            <h3 className="font-bold text-base">
              {isSale ? 'বিক্রয় রসিদ / বিল' : 'বাকি জমা রসিদ'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 space-y-4 bg-stone-50/50">
          {/* Store Brand Lockup */}
          <div className="text-center border-b border-stone-200 pb-4">
            <div className="inline-block bg-emerald-900 text-white px-4 py-1.5 rounded-lg shadow-2xs mb-1.5">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight m-0">✦ {storeName} ✦</h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">আপনার বিশ্বস্ত কেনাকাটার ঠিকানা</p>
            <p className="text-[11px] text-stone-400">সততা · বিশ্বাস · সেবার অঙ্গীকার</p>
          </div>

          {/* Customer & Date */}
          <div className="flex justify-between items-start text-xs border-b border-stone-200 pb-3">
            <div>
              <span className="text-stone-400 block">কাস্টমার</span>
              <strong className="text-sm font-bold text-stone-900">{transaction.customerName}</strong>
              {transaction.customerPhone && (
                <p className="text-stone-500 font-mono mt-0.5">{transaction.customerPhone}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-stone-400 block">তারিখ</span>
              <span className="text-stone-700 font-medium">
                {formattedDateOnly}{' '}
                <span className="text-[11px] text-stone-500 font-normal">· হৃদয় সাহা</span>
              </span>
              <span className="text-[10px] text-stone-400 block mt-0.5">
                ID: {transaction.id.slice(0, 8)}
              </span>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="space-y-2 py-2 text-sm">
            {transaction.note && (
              <div className="flex justify-between items-center text-xs text-stone-600 bg-white p-2 rounded-lg border border-stone-200">
                <span>বিবরণ:</span>
                <span className="font-medium text-stone-900">{transaction.note}</span>
              </div>
            )}

            {isSale ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">মোট বিক্রয় মূল্য:</span>
                  <strong className="font-mono-nums text-stone-900 text-base">
                    {formatTaka(transaction.totalAmount)}
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-stone-600">নগদ জমা:</span>
                  <span className="font-mono-nums font-bold text-emerald-700">
                    {formatTaka(transaction.paidAmount)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-dashed border-stone-300">
                  <span className="font-bold text-stone-800">এই বিলে বাকি:</span>
                  <strong className={`font-mono-nums text-base ${transaction.dueAmount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                    {transaction.dueAmount > 0 ? formatTaka(transaction.dueAmount) : '৳০ (পরিশোধিত)'}
                  </strong>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-stone-600">বকেয়া বাকি জমা গ্রহণ:</span>
                  <strong className="font-mono-nums text-emerald-700 text-lg">
                    {formatTaka(transaction.paidAmount)}
                  </strong>
                </div>
                <div className="flex justify-between items-center text-xs text-stone-500">
                  <span>পরিশোধ মাধ্যম:</span>
                  <span className="capitalize font-medium text-stone-800">
                    {transaction.paymentMethod === 'bkash' ? 'বিকাশ (bKash)' : 'নগদ ক্যাশ'}
                  </span>
                </div>
              </>
            )}

            {/* Overall Remaining Debt Highlight */}
            <div className="mt-3 p-3 rounded-xl bg-stone-100 border border-stone-300 flex justify-between items-center">
              <div>
                <span className="text-xs text-stone-600 block">কাস্টমারের বর্তমান মোট বাকি:</span>
                <span className="text-[10px] text-stone-400">দোকানের খাতা অনুযায়ী</span>
              </div>
              <strong className={`text-base sm:text-lg font-bold font-mono-nums ${customerDebt > 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                {customerDebt > 0 ? formatTaka(customerDebt) : '৳০ (দেনামুক্ত)'}
              </strong>
            </div>
          </div>

          <p className="text-center text-[11px] text-stone-400 pt-2 border-t border-stone-200">
            ধন্যবাদ! আপনার বিশ্বস্ত কেনাকাটায় আমরা সর্বদা নিয়োজিত।
          </p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-stone-100 border-t border-stone-200 space-y-3">
          <div>
            <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block mb-1.5">
              কাস্টমারকে রসিদ পাঠান:
            </span>
            <ShareButtons
              phone={transaction.customerPhone}
              customerName={transaction.customerName}
              messageText={receiptText}
              variant="full"
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={handlePrint}
              className="py-1.5 px-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>প্রিন্ট / PDF স্লিপ</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 rounded-lg bg-stone-300 hover:bg-stone-400 text-stone-800 text-xs font-bold transition-colors ml-auto"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
