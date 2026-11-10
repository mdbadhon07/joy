import React, { useState } from 'react';
import { Customer, Transaction } from '../types/store';
import { CheckCircle2, AlertCircle, UserPlus, Users } from 'lucide-react';
import { formatTaka, getSaleReceiptMessage } from '../utils/formatters';
import { ShareButtons } from './ShareButtons';

interface SaleSectionProps {
  customers: Customer[];
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
  preselectedCustomerId?: string;
}

export const SaleSection: React.FC<SaleSectionProps> = ({
  customers,
  onAddSale,
  preselectedCustomerId,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');
  const [isNewCustomerMode, setIsNewCustomerMode] = useState<boolean>(false);

  const [priceInput, setPriceInput] = useState<string>('');
  const [paidInput, setPaidInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('cash');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    tx: Transaction;
    newTotalDebt: number;
  } | null>(null);

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  const priceNum = Math.max(0, parseFloat(priceInput) || 0);
  const paidNum = Math.max(0, parseFloat(paidInput) || 0);
  const dueNum = Math.max(0, priceNum - paidNum);

  const priorDebt = currentCustomer ? currentCustomer.currentDebt : 0;
  const projectedTotalDebt = priorDebt + dueNum;

  const addPrice = (amt: number) => {
    const cur = parseFloat(priceInput) || 0;
    setPriceInput(String(cur + amt));
  };

  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerNameInput(found.name);
      setCustomerPhoneInput(found.phone);
    }
    setErrorMsg('');
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (priceNum <= 0) {
      setErrorMsg('মোট বিক্রয় মূল্য লিখুন।');
      return;
    }

    let targetCustomerId = selectedCustomerId;
    let targetCustomerName = customerNameInput.trim();
    let targetCustomerPhone = customerPhoneInput.trim();

    if (isNewCustomerMode || !targetCustomerId) {
      if (!targetCustomerName) {
        setErrorMsg('কাস্টমারের নাম লিখুন।');
        return;
      }
      const existing = customers.find(
        (c) => c.name.toLowerCase() === targetCustomerName.toLowerCase() || 
               (targetCustomerPhone && c.phone === targetCustomerPhone)
      );
      if (existing) {
        targetCustomerId = existing.id;
        targetCustomerName = existing.name;
        targetCustomerPhone = existing.phone;
      }
    } else {
      const existing = customers.find((c) => c.id === targetCustomerId);
      if (existing) {
        targetCustomerName = existing.name;
        targetCustomerPhone = existing.phone;
      }
    }

    try {
      const tx = onAddSale({
        customerId: targetCustomerId,
        customerName: targetCustomerName || 'সাধারণ কাস্টমার',
        customerPhone: targetCustomerPhone,
        totalAmount: priceNum,
        paidAmount: Math.min(paidNum, priceNum),
        dueAmount: dueNum,
        note: noteInput.trim(),
        paymentMethod,
      });

      setLastCompletedSale({
        tx,
        newTotalDebt: (priorDebt || 0) + dueNum,
      });

      setPriceInput('');
      setPaidInput('');
      setNoteInput('');
    } catch (err: unknown) {
      setErrorMsg('বিক্রয় সম্পন্ন করতে সমস্যা হয়েছে।');
    }
  };

  const handleStartNewSale = () => {
    setLastCompletedSale(null);
    setSelectedCustomerId('');
    setCustomerNameInput('');
    setCustomerPhoneInput('');
    setIsNewCustomerMode(false);
    setPriceInput('');
    setPaidInput('');
    setNoteInput('');
    setErrorMsg('');
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* If sale completed, show clean messaging card */}
      {lastCompletedSale ? (
        <div className="bg-white rounded-2xl border border-emerald-300 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <h3 className="font-bold text-stone-900 text-base">বিক্রয় সম্পন্ন হয়েছে ✓</h3>
                <p className="text-xs text-stone-600 mt-0.5">
                  {lastCompletedSale.tx.customerName} · বিল: <strong className="font-mono-nums">৳{lastCompletedSale.tx.totalAmount}</strong> · জমা: <strong className="font-mono-nums text-emerald-700">৳{lastCompletedSale.tx.paidAmount}</strong>
                  {lastCompletedSale.tx.dueAmount > 0 && (
                    <span className="text-amber-800 font-semibold ml-1">
                      (বাকি: ৳{lastCompletedSale.tx.dueAmount})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={handleStartNewSale}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shrink-0"
            >
              + নতুন বিক্রয়
            </button>
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-700 block">
              কাস্টমারকে বিল রসিদ পাঠান:
            </span>
            <ShareButtons
              phone={lastCompletedSale.tx.customerPhone}
              customerName={lastCompletedSale.tx.customerName}
              messageText={getSaleReceiptMessage(
                'জয় কুমার স্টোর',
                lastCompletedSale.tx.customerName,
                lastCompletedSale.tx.totalAmount,
                lastCompletedSale.tx.paidAmount,
                lastCompletedSale.tx.dueAmount,
                lastCompletedSale.newTotalDebt,
                lastCompletedSale.tx.note,
                lastCompletedSale.tx.date
              )}
              variant="full"
            />
          </div>
        </div>
      ) : (
        /* SIMPLE CLEAN SALES FORM */
        <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs">
          <form onSubmit={handleConfirmPayment} className="space-y-4">
            {/* Customer selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-700">কাস্টমার</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsNewCustomerMode(!isNewCustomerMode);
                    setSelectedCustomerId('');
                  }}
                  className="text-xs text-emerald-700 hover:underline font-semibold"
                >
                  {isNewCustomerMode ? 'তালিকা থেকে নিন' : '+ নতুন নাম লিখুন'}
                </button>
              </div>

              {!isNewCustomerMode ? (
                <div>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="">-- কাস্টমার নির্বাচন করুন --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} {c.currentDebt > 0 ? `· বাকি: ৳${c.currentDebt}` : ''}
                      </option>
                    ))}
                  </select>

                  {currentCustomer && currentCustomer.currentDebt > 0 && (
                    <p className="text-xs text-amber-800 mt-1 font-medium">
                      পূর্বের বাকি: <strong>৳{currentCustomer.currentDebt}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="কাস্টমারের নাম *"
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <input
                    type="tel"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    placeholder="মোবাইল নম্বর"
                    className="px-3 py-2 rounded-xl border border-stone-300 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              )}
            </div>

            {/* Price Input */}
            <div>
              <label className="text-xs font-bold text-stone-900 block mb-1">
                মোট বিক্রয় মূল্য (টাকা) *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-bold text-base">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={priceInput}
                  onChange={(e) => setPriceInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 border-stone-300 text-xl font-bold font-mono-nums text-stone-900 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Quick Adder buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {[50, 100, 200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => addPrice(amt)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono-nums border border-stone-200"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid Amount Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-900">জমা টাকা (টাকা)</label>
                {priceNum > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPaidInput(String(priceNum))}
                      className="text-xs text-emerald-700 hover:underline font-semibold"
                    >
                      পুরো জমা (৳{priceNum})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaidInput('0')}
                      className="text-xs text-amber-700 hover:underline font-semibold"
                    >
                      বাকি (৳০)
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400 font-bold text-base">
                  ৳
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  placeholder="0"
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border-2 border-stone-300 text-xl font-bold font-mono-nums text-stone-900 bg-white focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Note & Method row */}
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="নোট / পণ্যের বিবরণ (ঐচ্ছিক)"
                className="col-span-2 px-3 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="px-2 py-2 rounded-xl border border-stone-300 text-xs bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="cash">ক্যাশ (Cash)</option>
                <option value="bkash">বিকাশ</option>
                <option value="nagad">নগদ</option>
                <option value="bank">ব্যাংক</option>
              </select>
            </div>

            {/* Live Calculation preview */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-stone-500">বাকি থাকবে: </span>
                <strong className={`font-mono-nums text-sm ${dueNum > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {dueNum > 0 ? formatTaka(dueNum) : '৳০ (পরিশোধিত)'}
                </strong>
              </div>
              {currentCustomer && dueNum > 0 && (
                <div className="text-stone-500">
                  মোট বাকি হবে: <strong className="font-mono-nums text-stone-800">৳{projectedTotalDebt}</strong>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-50 text-red-700 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Confirm Payment button */}
            <button
              type="submit"
              disabled={priceNum <= 0}
              className={`w-full py-3 rounded-xl font-bold text-base text-white transition-all shadow-xs ${
                priceNum > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] cursor-pointer'
                  : 'bg-stone-300 cursor-not-allowed'
              }`}
            >
              বিক্রয় ও পেমেন্ট নিশ্চিত করুন
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
