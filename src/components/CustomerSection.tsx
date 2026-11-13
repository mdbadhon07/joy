import React, { useState } from 'react';
import { Customer } from '../types/store';
import { formatTaka, getDebtReminderMessage } from '../utils/formatters';
import { ShareButtons } from './ShareButtons';
import { Trash2 } from 'lucide-react';

interface CustomerSectionProps {
  customers: Customer[];
  storeName: string;
  onAddCustomer: (customer: { name: string; phone: string; address: string; initialDebt: number }) => void;
  onSelectCustomerHistory: (customer: Customer) => void;
  onQuickCollect: (customer: Customer) => void;
  onFillCustomerInSale: (customerName: string, customerId: string) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  customers,
  storeName,
  onAddCustomer,
  onSelectCustomerHistory,
  onQuickCollect,
  onFillCustomerInSale,
  onDeleteCustomer,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [initialDebt, setInitialDebt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'due' | 'clear'>('all');

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    const parsedInitialDebt = Math.max(0, parseFloat(initialDebt) || 0);
    if (!trimmedName) {
      alert('কাস্টমারের নাম লিখুন।');
      return;
    }

    onAddCustomer({
      name: trimmedName,
      phone: trimmedPhone,
      address: '',
      initialDebt: parsedInitialDebt,
    });

    setName('');
    setPhone('');
    setInitialDebt('');
  };

  const handlePickContact = async () => {
    try {
      if ('contacts' in navigator && (navigator as any).contacts) {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts[0]) {
          setName(contacts[0].name?.[0] || '');
          setPhone(contacts[0].tel?.[0] || '');
        }
      } else {
        alert('এই ব্রাউজারে Contacts Picker নেই। ম্যানুয়ালি নাম ও নম্বর লিখুন।');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matches = !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
    if (!matches) return false;
    if (filterType === 'due') return (c.currentDebt || 0) > 0;
    if (filterType === 'clear') return (c.currentDebt || 0) === 0;
    return true;
  });

  return (
    <div className="bg-white border border-[#dce6dd] rounded-[14px] p-4 sm:p-5 shadow-2xs space-y-4">
      <h2 className="text-[19px] font-bold text-[#17251a] m-0">
        কাস্টমার যোগ ও সার্চ
      </h2>

      {/* কাস্টমার যোগ ফর্ম */}
      <form onSubmit={handleSaveCustomer} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[13px] text-[#607064] mb-1 font-medium">
              কাস্টমারের নাম
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="নাম লিখুন"
              className="w-full p-2.5 sm:p-3 border border-[#cbd8cd] rounded-[9px] text-[14px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#607064] mb-1 font-medium">
              মোবাইল নম্বর
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full p-2.5 sm:p-3 border border-[#cbd8cd] rounded-[9px] text-[14px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#607064] mb-1 font-medium">
              আগের বাকি (যদি থাকে)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#607064] text-[14px] font-bold">
                ৳
              </span>
              <input
                type="number"
                min="0"
                step="any"
                value={initialDebt}
                onChange={(e) => setInitialDebt(e.target.value)}
                placeholder="0"
                className="w-full pl-7 pr-3 py-2.5 sm:py-3 border border-[#cbd8cd] rounded-[9px] text-[14px] font-mono-nums bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            className="border-0 rounded-[10px] py-2 px-4 bg-[#14532d] text-white font-semibold text-[13px] cursor-pointer hover:bg-[#207348] transition-colors"
          >
            কাস্টমার সেভ
          </button>
          <button
            type="button"
            onClick={handlePickContact}
            className="border-0 rounded-[10px] py-2 px-3.5 bg-[#e2ece4] text-[#17472b] font-semibold text-[13px] cursor-pointer hover:bg-[#d5e3d8] transition-colors"
          >
            ফোনের Contacts থেকে নিন
          </button>
        </div>
      </form>

      {/* সার্চ ও ফিল্টার */}
      <div className="pt-2 border-t border-[#dce6dd] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-[13px] text-[#607064] font-medium m-0">
            নাম বা নম্বর দিয়ে খুঁজুন
          </label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold ${
                filterType === 'all' ? 'bg-[#14532d] text-white' : 'bg-[#e2ece4] text-[#17472b]'
              }`}
            >
              সব ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('due')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold ${
                filterType === 'due' ? 'bg-[#14532d] text-white' : 'bg-[#e2ece4] text-[#17472b]'
              }`}
            >
              বাকি আছে
            </button>
            <button
              type="button"
              onClick={() => setFilterType('clear')}
              className={`px-2.5 py-1 text-xs rounded-md font-semibold ${
                filterType === 'clear' ? 'bg-[#14532d] text-white' : 'bg-[#e2ece4] text-[#17472b]'
              }`}
            >
              দেনামুক্ত
            </button>
          </div>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="সার্চ করুন..."
          className="w-full p-2.5 sm:p-3 border border-[#cbd8cd] rounded-[9px] text-[14px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
        />
      </div>

      {/* কাস্টমার তালিকা */}
      <div className="divide-y divide-[#dce6dd] pt-1">
        {filtered.length === 0 ? (
          <p className="text-[#607064] text-[13px] py-4 text-center">
            {customers.length === 0 ? 'এখনো কোনো কাস্টমার যোগ করা হয়নি।' : 'কোনো কাস্টমার পাওয়া যায়নি।'}
          </p>
        ) : (
          filtered.map((customer) => {
            const hasDebt = (customer.currentDebt || 0) > 0;
            const reminderMsg = getDebtReminderMessage(storeName, customer.name, customer.currentDebt);

            return (
              <div key={customer.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-[15px] text-[#17251a]">{customer.name}</strong>
                    {hasDebt ? (
                      <span className="text-[12px] bg-[#fff1c9] text-[#785500] px-2 py-0.5 rounded-full font-bold">
                        বাকি: {formatTaka(customer.currentDebt)}
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-800 font-medium">
                        (পরিশোধিত)
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-[#607064] m-0 font-mono mt-0.5">
                    {customer.phone || 'নম্বর নেই'}
                  </p>
                </div>

                {/* বাটনসমূহ */}
                <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => onFillCustomerInSale(customer.name, customer.id)}
                    className="border-0 rounded-[8px] py-1.5 px-2.5 bg-[#e2ece4] text-[#17472b] text-xs font-semibold hover:bg-[#d5e3d8]"
                  >
                    বিক্রয়ে নিন
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectCustomerHistory(customer)}
                    className="border-0 rounded-[8px] py-1.5 px-2.5 bg-[#14532d] text-white text-xs font-semibold hover:bg-[#207348]"
                  >
                    খাতা ও ইতিহাস
                  </button>

                  {hasDebt && (
                    <button
                      type="button"
                      onClick={() => onQuickCollect(customer)}
                      className="border-0 rounded-[8px] py-1.5 px-2.5 bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800"
                    >
                      টাকা জমা
                    </button>
                  )}

                  {customer.phone && hasDebt && (
                    <ShareButtons
                      phone={customer.phone}
                      customerName={customer.name}
                      messageText={reminderMsg}
                      variant="mini"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`আপনি কি নিশ্চিত যে কাস্টমার '${customer.name}' এবং তার সমস্ত হিসাব মুছে ফেলতে চান?`)) {
                        onDeleteCustomer(customer.id);
                      }
                    }}
                    className="border-0 rounded-[8px] py-1.5 px-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="কাস্টমার মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <p className="text-[#607064] text-[12px] pt-2 border-t border-[#dce6dd] m-0">
        Contacts বাটন Android/সমর্থিত ব্রাউজারে contact picker খুলতে পারে। সব ব্রাউজারে সমর্থিত নয়।
      </p>
    </div>
  );
};
