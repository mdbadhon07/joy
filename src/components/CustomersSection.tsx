import React, { useState } from 'react';
import { Customer } from '../types/store';
import { 
  Users, 
  UserPlus, 
  Search, 
  Phone, 
  MapPin, 
  BookOpen, 
  ShoppingBag, 
  Edit2, 
  Trash2,
  CheckCircle2,
  Contact,
  DollarSign
} from 'lucide-react';
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
        alert('আপনার ব্রাউজারে কন্টাক্ট পিকার সমর্থিত নয়। ম্যানুয়ালি নাম ও নম্বর লিখুন।');
      }
    } catch (err) {
      console.warn('Contact picker error:', err);
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q)) || (c.address && c.address.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>কাস্টমার তালিকা ও প্রোফাইল</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              দোকানের সকল গ্রাহকের তথ্য, বকেয়া বাকি ও যোগাযোগের বিবরণ।
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setName('');
              setPhone('');
              setAddress('');
              setInitialDebt('');
              setShowAddForm(!showAddForm);
            }}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>নতুন কাস্টমার যোগ করুন</span>
          </button>
        </div>

        {/* Add / Edit Customer Form Drawer */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="mt-4 p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-900">
                {editingCustomer ? 'কাস্টমার তথ্য সংশোধন করুন' : 'নতুন কাস্টমার যোগ ফরম'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCustomer(null);
                }}
                className="text-stone-400 hover:text-stone-600 text-xs"
              >
                বাতিল
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  কাস্টমারের নাম <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোবারক হোসেন"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    মোবাইল নম্বর
                  </label>
                  <button
                    type="button"
                    onClick={handlePickContact}
                    className="text-[11px] text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    <Contact className="w-3 h-3" /> কন্টাক্ট থেকে নিন
                  </button>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  ঠিকানা / এলাকা (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="যেমন: পূর্ব পাড়া"
                  className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {!editingCustomer && (
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    পূর্বের খাতার বাকি (টাকা)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-stone-400 font-bold text-xs">
                      ৳
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={initialDebt}
                      onChange={(e) => setInitialDebt(e.target.value)}
                      placeholder="0"
                      className="w-full pl-6 pr-3 py-2 rounded-lg border border-stone-300 bg-white text-sm text-stone-900 font-mono-nums focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingCustomer(null);
                }}
                className="px-4 py-1.5 rounded-lg border border-stone-300 text-stone-700 text-xs font-medium hover:bg-stone-100"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="px-5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingCustomer ? 'আপডেট করুন' : 'কাস্টমার সংরক্ষণ করুন'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Search */}
        <div className="pt-4 max-w-md">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম বা মোবাইল নম্বর দিয়ে কাস্টমার খুঁজুন..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>
      </div>

      {/* Customer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((customer) => {
          const hasDebt = (customer.currentDebt || 0) > 0;
          return (
            <div
              key={customer.id}
              className="bg-white rounded-2xl border border-stone-200/90 p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-emerald-300 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-stone-900 text-base">{customer.name}</h3>
                    {customer.phone && (
                      <p className="text-xs text-stone-500 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </p>
                    )}
                    {customer.address && (
                      <p className="text-xs text-stone-400 mt-0.5 flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3" />
                        {customer.address}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-stone-400 block">বর্তমান বাকি</span>
                    <span className={`text-base font-bold font-mono-nums ${hasDebt ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {hasDebt ? formatTaka(customer.currentDebt) : '৳০'}
                    </span>
                  </div>
                </div>

                {/* Purchase stats */}
                <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-stone-50 text-[11px] text-stone-600 flex justify-between">
                  <span>মোট ক্রয়: <strong className="font-mono-nums text-stone-800">৳{customer.totalPurchased || 0}</strong></span>
                  <span>পরিশোধ: <strong className="font-mono-nums text-emerald-700">৳{customer.totalPaid || 0}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-stone-100 gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => onSelectCustomerHistory(customer)}
                  className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold flex items-center gap-1 transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-stone-600" />
                  <span>বাকি খাতা</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onNewSaleForCustomer(customer.id)}
                    className="px-2.5 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 font-medium transition-colors"
                  >
                    + বিক্রয়
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(customer)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                    title="সম্পাদনা"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`আপনি কি সত্যিই ${customer.name}-কে মুছে ফেলতে চান?`)) {
                        onDeleteCustomer(customer.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="মুছুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
