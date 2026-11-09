import React, { useState, useId } from 'react';
import { Customer, Transaction } from '../types/store';
import { 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  UserPlus, 
  DollarSign, 
  Receipt, 
  Send,
  MessageCircle,
  Phone,
  Sparkles
} from 'lucide-react';
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
  const customerListId = useId();
  // Selected or typed customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(preselectedCustomerId || '');
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState<string>('');
  const [isNewCustomerMode, setIsNewCustomerMode] = useState<boolean>(false);

  // Core required fields per instructions: Manual price entry & Total paid amount
  const [priceInput, setPriceInput] = useState<string>('');
  const [paidInput, setPaidInput] = useState<string>('');
  const [noteInput, setNoteInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('cash');

  // Error & Success feedback
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [lastCompletedSale, setLastCompletedSale] = useState<{
    tx: Transaction;
    newTotalDebt: number;
  } | null>(null);

  // Derived selected customer object
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Numerical calculations
  const priceNum = Math.max(0, parseFloat(priceInput) || 0);
  const paidNum = Math.max(0, parseFloat(paidInput) || 0);
  const dueNum = Math.max(0, priceNum - paidNum);
  const changeNum = paidNum > priceNum ? paidNum - priceNum : 0;

  // Potential new total debt for this customer
  const priorDebt = currentCustomer ? currentCustomer.currentDebt : 0;
  const projectedTotalDebt = priorDebt + dueNum;

  // Quick price adders
  const addPrice = (amount: number) => {
    const cur = parseFloat(priceInput) || 0;
    const next = cur + amount;
    setPriceInput(String(next));
  };

  // Quick paid helpers
  const handleFullPaid = () => {
    setPaidInput(String(priceNum));
  };

  const handleZeroPaid = () => {
    setPaidInput('0');
  };

  const handleHalfPaid = () => {
    setPaidInput(String(Math.round(priceNum / 2)));
  };

  // Handler for customer dropdown selection
  const handleSelectCustomer = (id: string) => {
    setSelectedCustomerId(id);
    const found = customers.find((c) => c.id === id);
    if (found) {
      setCustomerNameInput(found.name);
      setCustomerPhoneInput(found.phone);
    }
    setErrorMsg('');
  };

  // Submission handler
  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (priceNum <= 0) {
      setErrorMsg('অনুগ্রহ করে মোট বিক্রয় মূল্য (টাকা) লিখুন।');
      return;
    }

    let targetCustomerId = selectedCustomerId;
    let targetCustomerName = customerNameInput.trim();
    let targetCustomerPhone = customerPhoneInput.trim();

    if (isNewCustomerMode || !targetCustomerId) {
      if (!targetCustomerName) {
        setErrorMsg('অনুগ্রহ করে কাস্টমারের নাম লিখুন।');
        return;
      }
      // Check if existing phone matches
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
        customerName: targetCustomerName || 'অজ্ঞাত কাস্টমার',
        customerPhone: targetCustomerPhone,
        totalAmount: priceNum,
        paidAmount: Math.min(paidNum, priceNum),
        dueAmount: dueNum,
        note: noteInput.trim(),
        paymentMethod,
      });

      const updatedCustomerDebt = (priorDebt || 0) + dueNum;

      setLastCompletedSale({
        tx,
        newTotalDebt: updatedCustomerDebt,
      });

      // Reset form
      setPriceInput('');
      setPaidInput('');
      setNoteInput('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'বিক্রয় সম্পন্ন করতে সমস্যা হয়েছে।';
      setErrorMsg(message);
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
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title & Guidelines */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3 mb-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              <span>নতুন বিক্রয় ও পেমেন্ট এন্ট্রি</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              কোনো পণ্য তালিকার ঝামেলা নেই — কেবল মোট মূল্য ও জমা টাকা লিখে পেমেন্ট নিশ্চিত করুন।
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 self-start sm:self-auto">
            ম্যানুয়াল প্রাইস মোড
          </span>
        </div>

        {/* Success Banner & Messaging Hub if sale just completed */}
        {lastCompletedSale && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 shadow-sm animate-in fade-in space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-emerald-200/80 pb-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-emerald-950 text-base">
                    বিক্রয় সফলভাবে সম্পন্ন ও সংরক্ষিত হয়েছে!
                  </h3>
                  <p className="text-xs text-emerald-900 mt-1">
                    কাস্টমার: <strong>{lastCompletedSale.tx.customerName}</strong> · মোট বিল: <strong className="font-mono-nums">৳{lastCompletedSale.tx.totalAmount}</strong> · জমা: <strong className="font-mono-nums">৳{lastCompletedSale.tx.paidAmount}</strong>
                  </p>
                  {lastCompletedSale.tx.dueAmount > 0 ? (
                    <p className="text-xs font-semibold text-amber-900 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      এই বিলে বাকি: ৳{lastCompletedSale.tx.dueAmount} (গ্রাহকের মোট বর্তমান বাকি: ৳{lastCompletedSale.newTotalDebt})
                    </p>
                  ) : (
                    <p className="text-xs font-semibold text-emerald-800 mt-1">
                      ✓ সম্পূর্ণ পরিশোধিত (কোনো বাকি নেই)
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleStartNewSale}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 transition-colors shrink-0 shadow-xs"
              >
                + আরেকটি বিক্রয় করুন
              </button>
            </div>

            {/* PROMINENT WHATSAPP, IMO & SMS SENDING SECTION */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-emerald-700" />
                  <span>কাস্টমারকে বিলের রসিদ ও বাকি পাঠান (WhatsApp / IMO / SMS)</span>
                </span>
                {lastCompletedSale.tx.customerPhone ? (
                  <span className="text-xs text-stone-600 font-mono font-medium">
                    {lastCompletedSale.tx.customerPhone}
                  </span>
                ) : (
                  <span className="text-[11px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                    মোবাইল নম্বর দেওয়া হয়নি
                  </span>
                )}
              </div>

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
        )}

        {/* Sales Form */}
        <form onSubmit={handleConfirmPayment} className="space-y-5">
          {/* Customer Selection Block */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                <span>কাস্টমার নির্বাচন বা নতুন যোগ</span>
              </label>

              <button
                type="button"
                onClick={() => {
                  setIsNewCustomerMode(!isNewCustomerMode);
                  setSelectedCustomerId('');
                }}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1"
              >
                {isNewCustomerMode ? (
                  <>তালিকা থেকে কাস্টমার নিন</>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    নতুন কাস্টমার লিখুন
                  </>
                )}
              </button>
            </div>

            {!isNewCustomerMode ? (
              <div className="space-y-2">
                <div className="relative">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                  >
                    <option value="">-- বিদ্যমান কাস্টমার সিলেক্ট করুন --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''} — {c.currentDebt > 0 ? `বাকি: ৳${c.currentDebt}` : 'পরিশোধিত'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* If selected, show customer badge with current debt */}
                {currentCustomer && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs">
                    <div>
                      <span className="font-semibold text-stone-900 text-sm">{currentCustomer.name}</span>
                      {currentCustomer.phone && (
                        <span className="text-stone-500 ml-2 font-mono">({currentCustomer.phone})</span>
                      )}
                      {currentCustomer.address && (
                        <p className="text-stone-500 text-[11px] mt-0.5">{currentCustomer.address}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-stone-500 block">বর্তমান পূর্বের বাকি</span>
                      <span className={`font-bold font-mono-nums ${currentCustomer.currentDebt > 0 ? 'text-amber-700 text-sm' : 'text-emerald-700'}`}>
                        {currentCustomer.currentDebt > 0 ? `৳${currentCustomer.currentDebt}` : '৳০ (বাকি নেই)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* New Customer Input Fields */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    কাস্টমারের নাম <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerNameInput}
                    onChange={(e) => setCustomerNameInput(e.target.value)}
                    placeholder="যেমন: আব্দুর রহমান"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    মোবাইল নম্বর (SMS/WhatsApp এর জন্য)
                  </label>
                  <input
                    type="tel"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-stone-200 pt-4" />

          {/* MANUAL PRICE ENTRY FIELD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="manual-price-input" className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
                <span>মোট বিক্রয় মূল্য (টাকা)</span>
                <span className="text-red-500 text-xs">*</span>
              </label>
              <span className="text-xs text-stone-500">ম্যানুয়াল এন্ট্রি</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold text-lg">
                ৳
              </div>
              <input
                id="manual-price-input"
                type="number"
                min="0"
                step="any"
                required
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-stone-300 text-xl font-bold font-mono-nums text-stone-900 bg-white focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>

            {/* Quick Price Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-stone-400 mr-1">দ্রুত যোগ:</span>
              {[50, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => addPrice(amt)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-md bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 text-stone-700 transition-colors font-mono-nums border border-stone-200"
                >
                  +{amt}
                </button>
              ))}
              {priceInput && (
                <button
                  type="button"
                  onClick={() => setPriceInput('')}
                  className="px-2 py-1 text-[11px] text-stone-400 hover:text-red-600 transition-colors ml-auto"
                >
                  ক্লিয়ার
                </button>
              )}
            </div>
          </div>

          {/* TOTAL PAID AMOUNT FIELD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="paid-amount-input" className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>জমা টাকা / প্রাপ্ত অর্থ (টাকা)</span>
              </label>
              <span className="text-xs text-stone-500">পরিশোধের পরিমাণ</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400 font-bold text-lg">
                ৳
              </div>
              <input
                id="paid-amount-input"
                type="number"
                min="0"
                step="any"
                value={paidInput}
                onChange={(e) => setPaidInput(e.target.value)}
                placeholder="0"
                className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-stone-300 text-xl font-bold font-mono-nums text-stone-900 bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            {/* Quick Paid Presets */}
            {priceNum > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleFullPaid}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors border ${
                    paidNum === priceNum
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  পুরো পরিশোধ (৳{priceNum})
                </button>
                <button
                  type="button"
                  onClick={handleZeroPaid}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors border ${
                    paidNum === 0
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  সম্পূর্ণ বাকি (৳০ জমা)
                </button>
                {priceNum >= 20 && (
                  <button
                    type="button"
                    onClick={handleHalfPaid}
                    className="px-3 py-1 text-xs font-semibold rounded-md bg-stone-100 text-stone-700 border border-stone-200 hover:bg-stone-200 transition-colors"
                  >
                    অর্ধেক জমা (৳{Math.round(priceNum / 2)})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Optional Note & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label htmlFor="note-input" className="block text-xs font-medium text-stone-600 mb-1">
                বিবরণ / পণ্যের নোট (ঐচ্ছিক)
              </label>
              <input
                id="note-input"
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="যেমন: মুদি বাজার, তেল ও ডাল"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label htmlFor="method-input" className="block text-xs font-medium text-stone-600 mb-1">
                পরিশোধ মাধ্যম
              </label>
              <select
                id="method-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs sm:text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="cash">নগদ ক্যাশ (Cash)</option>
                <option value="bkash">বিকাশ (bKash)</option>
                <option value="nagad">নগদ (Nagad)</option>
                <option value="bank">ব্যাংক (Bank)</option>
                <option value="other">অন্যান্য</option>
              </select>
            </div>
          </div>

          {/* LIVE SUMMARY BANNER */}
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-600">মোট বিক্রয় মূল্য:</span>
              <span className="font-bold font-mono-nums text-stone-900">
                {formatTaka(priceNum)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-600">জমা প্রাপ্তি:</span>
              <span className="font-bold font-mono-nums text-blue-700">
                {formatTaka(paidNum)}
              </span>
            </div>

            <div className="border-t border-stone-200 pt-2 flex justify-between items-center">
              <span className="font-semibold text-stone-800">
                {dueNum > 0 ? 'এই বিক্রয়ে বকেয়া বাকি:' : 'বাকি:'}
              </span>
              <span
                className={`text-lg font-bold font-mono-nums ${
                  dueNum > 0 ? 'text-amber-700' : 'text-emerald-700'
                }`}
              >
                {dueNum > 0 ? formatTaka(dueNum) : '৳০ (পরিশোধিত)'}
              </span>
            </div>

            {changeNum > 0 && (
              <div className="flex justify-between items-center text-xs text-purple-700 pt-1">
                <span>ফেরত দিন / অগ্রিম জমা:</span>
                <span className="font-bold font-mono-nums">৳{changeNum}</span>
              </div>
            )}

            {/* Customer overall balance forecast */}
            {currentCustomer && (
              <div className="pt-2 border-t border-dashed border-stone-200 text-xs flex justify-between text-stone-500">
                <span>
                  {currentCustomer.name}-এর নতুন মোট বাকি হবে:
                </span>
                <span className="font-bold text-stone-800 font-mono-nums">
                  ৳{projectedTotalDebt}
                </span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CONFIRM PAYMENT BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={priceNum <= 0}
              className={`w-full py-3.5 px-4 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all duration-150 ${
                priceNum > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-700/20 active:scale-[0.99] cursor-pointer'
                  : 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>পেমেন্ট নিশ্চিত করুন ও বিক্রয় সংরক্ষণ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
