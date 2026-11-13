import React, { useState } from 'react';
import { Customer, Transaction } from '../types/store';
import { formatTaka, formatDateShort, getSaleReceiptMessage } from '../utils/formatters';
import { ShareButtons } from './ShareButtons';

interface SaleSectionProps {
  customers: Customer[];
  storeName: string;
  preselectedCustomerId?: string;
  preselectedCustomerName?: string;
  onAddSale: (saleData: {
    customerId: string;
    customerName: string;
    customerPhone: string;
    totalAmount: number;
    paidAmount: number;
    dueAmount: number;
    note: string;
    paymentMethod: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
  }) => Transaction;
}

export const SaleSection: React.FC<SaleSectionProps> = ({
  customers,
  storeName,
  preselectedCustomerId,
  preselectedCustomerName,
  onAddSale,
}) => {
  const [customerInput, setCustomerInput] = useState<string>(preselectedCustomerName || '');
  const [priceInput, setPriceInput] = useState<string>('');
  const [paidInput, setPaidInput] = useState<string>('0');
  const [noteInput, setNoteInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('cash');

  const [lastBill, setLastBill] = useState<{
    tx: Transaction;
    totalCustomerDebt: number;
  } | null>(null);

  const priceNum = Math.max(0, parseFloat(priceInput) || 0);
  const paidNum = Math.max(0, parseFloat(paidInput) || 0);
  const dueNum = Math.max(0, priceNum - paidNum);

  // Match existing customer if name matches
  const matchedCustomer = customers.find(
    (c) => c.name.toLowerCase() === customerInput.trim().toLowerCase() ||
           (c.id === preselectedCustomerId)
  );

  const priorDebt = matchedCustomer ? (matchedCustomer.currentDebt || 0) : 0;
  const newTotalDebt = priorDebt + dueNum;

  const handleSaveSale = (e: React.FormEvent) => {
    e.preventDefault();
    const cName = customerInput.trim();
    if (!cName) {
      alert('কাস্টমারের নাম লিখুন।');
      return;
    }
    if (priceNum <= 0) {
      alert('মোট বিক্রয় মূল্য লিখুন।');
      return;
    }
    if (paidNum < 0) {
      alert('জমা টাকা ঋণাত্মক হতে পারবে না।');
      return;
    }

    const tx = onAddSale({
      customerId: matchedCustomer ? matchedCustomer.id : '',
      customerName: cName,
      customerPhone: matchedCustomer ? matchedCustomer.phone : '',
      totalAmount: priceNum,
      paidAmount: Math.min(paidNum, priceNum),
      dueAmount: dueNum,
      note: noteInput.trim(),
      paymentMethod,
    });

    setLastBill({
      tx,
      totalCustomerDebt: newTotalDebt,
    });

    setPriceInput('');
    setPaidInput('0');
    setNoteInput('');
  };

  return (
    <div className="bg-white border border-[#dce6dd] rounded-[14px] p-4 sm:p-5 shadow-2xs space-y-4">
      <h2 className="text-[19px] font-bold text-[#17251a] m-0">
        নতুন বিক্রয় ও টাকা জমা
      </h2>

      <form onSubmit={handleSaveSale} className="space-y-3">
        {/* কাস্টমার নাম */}
        <div>
          <label className="block text-[13px] text-[#607064] mb-1 font-medium">
            কাস্টমারের নাম
          </label>
          <input
            type="text"
            required
            list="customer-suggestions"
            value={customerInput}
            onChange={(e) => setCustomerInput(e.target.value)}
            placeholder="নাম লিখুন বা সিলেক্ট করুন"
            className="w-full p-2.5 sm:p-3 border border-[#cbd8cd] rounded-[9px] text-[14px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
          />
          <datalist id="customer-suggestions">
            {customers.map((c) => (
              <option key={c.id} value={c.name}>
                {c.phone ? `${c.phone} - ` : ''}বাকি: ৳{c.currentDebt || 0}
              </option>
            ))}
          </datalist>
          {matchedCustomer && (
            <p className="text-[12px] text-[#607064] mt-1">
              বর্তমান পূর্বের বাকি: <strong className="text-amber-800 font-mono-nums">৳{matchedCustomer.currentDebt || 0}</strong>
              {matchedCustomer.phone && ` · মোবাইল: ${matchedCustomer.phone}`}
            </p>
          )}
        </div>

        {/* ম্যানুয়াল মূল্য এবং জমা টাকা */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[13px] text-[#607064] font-medium">
                মোট বিক্রয় মূল্য (টাকা) *
              </label>
              <div className="flex gap-1">
                {[50, 100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setPriceInput(String((parseFloat(priceInput) || 0) + amt))}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-[#e2ece4] text-[#17472b] font-bold"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0"
              step="any"
              required
              value={priceInput}
              onChange={(e) => setPriceInput(e.target.value)}
              placeholder="0"
              className="w-full p-2.5 sm:p-3 border border-[#cbd8cd] rounded-[9px] text-[16px] font-bold font-mono-nums bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[13px] text-[#607064] font-medium">
                জমা টাকা
              </label>
              {priceNum > 0 && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaidInput(String(priceNum))}
                    className="text-[11px] text-[#14532d] hover:underline font-semibold"
                  >
                    পুরো জমা
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaidInput('0')}
                    className="text-[11px] text-amber-800 hover:underline font-semibold"
                  >
                    বাকি ৳০
                  </button>
                </div>
              )}
            </div>
            <input
              type="number"
              min="0"
              step="any"
              value={paidInput}
              onChange={(e) => setPaidInput(e.target.value)}
              placeholder="0"
              className="w-full p-2.5 sm:p-3 border border-[#cbd8cd] rounded-[9px] text-[16px] font-bold font-mono-nums bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            />
          </div>
        </div>

        {/* নোট ও মাধ্যম */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="sm:col-span-2">
            <label className="block text-[13px] text-[#607064] mb-1 font-medium">
              নোট / পণ্যের বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="যেমন: মুদি বাজার"
              className="w-full p-2.5 border border-[#cbd8cd] rounded-[9px] text-[13px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#607064] mb-1 font-medium">
              মাধ্যম
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full p-2.5 border border-[#cbd8cd] rounded-[9px] text-[13px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            >
              <option value="cash">নগদ ক্যাশ</option>
              <option value="bkash">বিকাশ</option>
              <option value="nagad">নগদ</option>
              <option value="bank">ব্যাংক</option>
            </select>
          </div>
        </div>

        {/* লাইভ সামারি লাইন */}
        <div className="text-[13px] text-[#607064] py-2 border-t border-[#dce6dd] flex flex-wrap justify-between items-center">
          <span>
            মোট: <strong className="text-[#17251a] font-mono-nums">{formatTaka(priceNum)}</strong> · জমা:{' '}
            <strong className="text-[#14532d] font-mono-nums">{formatTaka(paidNum)}</strong>
          </span>
          <span className="font-bold">
            {dueNum > 0 ? (
              <span className="text-amber-800">বাকি: {formatTaka(dueNum)}</span>
            ) : (
              <span className="text-[#14532d]">✓ পরিশোধিত</span>
            )}
          </span>
        </div>

        {/* সেভ বাটন */}
        <button
          type="submit"
          className="border-0 rounded-[10px] py-3 px-5 bg-[#14532d] text-white font-bold text-[14px] cursor-pointer hover:bg-[#207348] transition-colors w-full sm:w-auto"
        >
          বিক্রয় সেভ ও বিল তৈরি
        </button>
      </form>

      {/* তৈরি হওয়া বিলের রসিদ বক্স */}
      {lastBill && (
        <div className="bg-[#fff8df] border border-[#f0dfa2] p-4 rounded-[10px] text-[13px] text-[#17251a] space-y-2 mt-4 animate-in fade-in">
          <div>
            <div className="text-center bg-[#14532d] text-white py-2 px-3 rounded-[9px] mb-2.5 shadow-2xs">
              <strong className="text-[15px] tracking-wide">✦ {storeName} ✦</strong>
            </div>
            <div>কাস্টমার: <strong>{lastBill.tx.customerName}</strong></div>
            {lastBill.tx.note && <div>বিবরণ: {lastBill.tx.note}</div>}
            <div>মোট: {formatTaka(lastBill.tx.totalAmount)}</div>
            <div>জমা: {formatTaka(lastBill.tx.paidAmount)}</div>
            <div>
              <b className="text-amber-900">এই বিলে বাকি: {formatTaka(lastBill.tx.dueAmount)}</b>
            </div>
            {lastBill.totalCustomerDebt > 0 && (
              <div>কাস্টমারের বর্তমান মোট বাকি: <strong>{formatTaka(lastBill.totalCustomerDebt)}</strong></div>
            )}
            <small className="text-[#607064] block mt-1.5">
              তারিখ: {formatDateShort(lastBill.tx.timestamp || lastBill.tx.date)}{' '}
              <span className="text-[11px] font-semibold text-[#785500]">· হৃদয় সাহা</span>
            </small>
          </div>

          {/* WhatsApp, IMO, SMS বাটন */}
          <div className="pt-2 border-t border-[#f0dfa2]">
            <span className="text-xs font-bold text-[#785500] block mb-1.5">
              কাস্টমারকে রসিদ পাঠান:
            </span>
            <ShareButtons
              phone={lastBill.tx.customerPhone}
              customerName={lastBill.tx.customerName}
              messageText={getSaleReceiptMessage(
                storeName,
                lastBill.tx.customerName,
                lastBill.tx.totalAmount,
                lastBill.tx.paidAmount,
                lastBill.tx.dueAmount,
                lastBill.totalCustomerDebt,
                lastBill.tx.note,
                formatDateShort(lastBill.tx.timestamp || lastBill.tx.date)
              )}
              variant="full"
            />
          </div>
        </div>
      )}
    </div>
  );
};
