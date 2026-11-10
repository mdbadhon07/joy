import React, { useState } from 'react';
import { Customer } from '../types/store';
import { UserPlus, Search, Phone, MapPin, BookOpen, Edit2, Trash2, Contact } from 'lucide-react';
import { formatTaka } from '../utils/formatters';

interface CustomersSectionProps {
  customers: Customer[];
  onAddCustomer: (customer: {
    name: string;
    phone: string;
    address: string;
    initialDebt: number;
  }) => void;
  onEditCustomer: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onSelectCustomerHistory: (customer: Customer) => void;
  onNewSaleForCustomer: (customerId: string) => void;
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({
  customers,
  onAddCustomer,
  onEditCustomer,
  onDeleteCustomer,
  onSelectCustomerHistory,
  onNewSaleForCustomer,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialDebt, setInitialDebt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCustomer) {
      onEditCustomer({
        ...editingCustomer,
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setEditingCustomer(null);
    } else {
      onAddCustomer({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        initialDebt: parseFloat(initialDebt) || 0,
      });
    }

    setName('');
    setPhone('');
    setAddress('');
    setInitialDebt('');
    setShowAddForm(false);
  };

  const handleStartEdit = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setAddress(c.address || '');
    setShowAddForm(true);
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
        alert('আপনার ব্রাউজারে Contacts Picker নেই। ম্যানুয়ালি নাম ও নম্বর লিখুন।');
      }
    } catch (err) {
      console.warn(err);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
  });

  return (
    <div className="space-y-3 max-w-4xl mx-auto">
      {/* Top Bar: Search & Add button */}
      <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-4 shadow-xs flex items-center justify-between gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কাস্টমার খুঁজুন..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs sm:text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setName('');
            setPhone('');
            setAddress('');
            setInitialDebt('');
            setShowAddForm(!showAddForm);
          }}
          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-2xs"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ নতুন কাস্টমার</span>
        </button>
      </div>

      {/* Add / Edit Drawer */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border-2 border-emerald-300 p-4 shadow-xs space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <h4 className="font-bold text-sm text-stone-900">
              {editingCustomer ? 'কাস্টমার এডিট করুন' : 'নতুন কাস্টমার যোগ করুন'}
            </h4>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setEditingCustomer(null);
              }}
              className="text-xs text-stone-400 hover:text-stone-600"
            >
              বাতিল
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">নাম *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: রহিম শেখ"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[11px] font-bold text-stone-600">মোবাইল</label>
                <button
                  type="button"
                  onClick={handlePickContact}
                  className="text-[10px] text-emerald-700 hover:underline flex items-center gap-0.5"
                >
                  <Contact className="w-3 h-3" /> কন্টাক্ট
                </button>
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="017XXXXXXXX"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">ঠিকানা (ঐচ্ছিক)</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="যেমন: পূর্ব পাড়া"
                className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {!editingCustomer && (
              <div>
                <label className="text-[11px] font-bold text-stone-600 block mb-1">পূর্বের বাকি (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={initialDebt}
                  onChange={(e) => setInitialDebt(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 text-sm font-mono-nums bg-white text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
            >
              {editingCustomer ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}
            </button>
          </div>
        </form>
      )}

      {/* Customer List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {filtered.map((customer) => {
          const hasDebt = (customer.currentDebt || 0) > 0;
          return (
            <div
              key={customer.id}
              className="bg-white rounded-xl border border-stone-200 p-3 shadow-2xs flex flex-col justify-between gap-2.5 hover:border-emerald-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-stone-900 truncate">{customer.name}</h4>
                    {customer.phone && (
                      <p className="text-xs text-stone-500 font-mono mt-0.5">{customer.phone}</p>
                    )}
                    {customer.address && (
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">{customer.address}</p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-400 block font-medium">বাকি</span>
                    <strong className={`font-mono-nums text-sm font-bold ${hasDebt ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {hasDebt ? formatTaka(customer.currentDebt) : '৳০'}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-1.5 border-t border-stone-100 text-xs">
                <button
                  onClick={() => onSelectCustomerHistory(customer)}
                  className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1"
                >
                  <BookOpen className="w-3 h-3 text-stone-600" />
                  <span>খাতা</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onNewSaleForCustomer(customer.id)}
                    className="px-2 py-1 rounded-md text-emerald-700 hover:bg-emerald-50 font-semibold"
                  >
                    + বিক্রয়
                  </button>
                  <button
                    onClick={() => handleStartEdit(customer)}
                    className="p-1 text-stone-400 hover:text-stone-700"
                    title="এডিট"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`${customer.name}-কে মুছে ফেলতে চান?`)) {
                        onDeleteCustomer(customer.id);
                      }
                    }}
                    className="p-1 text-stone-400 hover:text-red-600"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
