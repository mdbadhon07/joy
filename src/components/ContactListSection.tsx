import React, { useState, useRef } from 'react';
import { Customer } from '../types/store';
import { formatTaka, makePhoneCall, openWhatsApp, openImo, openSMS, getDebtReminderMessage } from '../utils/formatters';
import { 
  Phone, 
  MessageSquare, 
  MessageCircle, 
  Send, 
  Copy, 
  Check, 
  Search, 
  UserPlus, 
  Download, 
  Upload, 
  Trash2, 
  ShoppingCart, 
  BookOpen,
  Users,
  Smartphone
} from 'lucide-react';

interface ContactListSectionProps {
  customers: Customer[];
  storeName: string;
  onAddCustomer: (customer: { name: string; phone: string; address: string; initialDebt: number }) => void;
  onDeleteCustomer: (id: string) => void;
  onFillCustomerInSale: (customerName: string, customerId: string) => void;
  onSelectCustomerHistory: (customer: Customer) => void;
}

export const ContactListSection: React.FC<ContactListSectionProps> = ({
  customers,
  storeName,
  onAddCustomer,
  onDeleteCustomer,
  onFillCustomerInSale,
  onSelectCustomerHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_phone' | 'with_debt'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Contact Inline Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');

  const vcfInputRef = useRef<HTMLInputElement>(null);

  const handleCopyPhone = async (id: string, phone: string) => {
    try {
      await navigator.clipboard.writeText(phone);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.warn('Copy failed', err);
    }
  };

  const handleAddNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    const trimmedPhone = newPhone.trim();
    if (!trimmedName) {
      alert('কাস্টমারের নাম লিখুন।');
      return;
    }

    onAddCustomer({
      name: trimmedName,
      phone: trimmedPhone,
      address: newAddress.trim(),
      initialDebt: 0,
    });

    setNewName('');
    setNewPhone('');
    setNewAddress('');
    setShowAddForm(false);
  };

  // Mobile Contact Picker API
  const handlePickFromPhoneContacts = async () => {
    try {
      if ('contacts' in navigator && (navigator as any).contacts) {
        const contacts = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
        if (contacts && contacts.length > 0) {
          let addedCount = 0;
          for (const c of contacts) {
            const name = c.name?.[0] || 'নামহীন কাস্টমার';
            const phone = c.tel?.[0] || '';
            if (name) {
              onAddCustomer({
                name,
                phone,
                address: '',
                initialDebt: 0,
              });
              addedCount++;
            }
          }
          alert(`${addedCount} টি কন্টাক্ট সফলভাবে যোগ করা হয়েছে!`);
        }
      } else {
        alert('আপনার ব্রাউজার বা ডিভাইসে সরাসরি Contacts Picker নেই। আপনি VCF ফাইল ইমপোর্ট করতে পারেন অথবা ম্যানুয়ালি লিখুন।');
      }
    } catch (err) {
      console.warn('Contacts picker error:', err);
    }
  };

  // Export all contacts to .vcf file (vCard)
  const handleExportVCF = () => {
    if (customers.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো কন্টাক্ট নেই।');
      return;
    }

    const vcards = customers
      .filter((c) => c.phone || c.name)
      .map((c) => {
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `FN:${c.name}`,
          c.phone ? `TEL;TYPE=CELL,VOICE:${c.phone}` : '',
          c.address ? `ADR;TYPE=HOME:;;${c.address};;;;` : '',
          `NOTE:${storeName} এর কাস্টমার${c.currentDebt > 0 ? ` (বাকি ৳${c.currentDebt})` : ''}`,
          'END:VCARD',
        ].filter(Boolean);
        return lines.join('\r\n');
      })
      .join('\r\n');

    const blob = new Blob([vcards], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joy-store-contacts-${new Date().toISOString().slice(0, 10)}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import contacts from a .vcf file
  const handleImportVCF = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Basic vCard parser
      const vcardBlocks = text.split(/BEGIN:VCARD/i).filter((b) => b.trim().length > 0);
      let added = 0;

      for (const block of vcardBlocks) {
        const fnMatch = block.match(/FN[:;]([^\r\n]+)/i);
        const nameMatch = block.match(/N[:;]([^\r\n]+)/i);
        const telMatch = block.match(/TEL[^:]*:([^\r\n]+)/i);

        let name = fnMatch ? fnMatch[1].trim() : '';
        if (!name && nameMatch) {
          name = nameMatch[1].replace(/;/g, ' ').trim();
        }
        const phone = telMatch ? telMatch[1].replace(/[^0-9+]/g, '').trim() : '';

        if (name) {
          onAddCustomer({
            name,
            phone,
            address: '',
            initialDebt: 0,
          });
          added++;
        }
      }

      alert(`${added} টি কন্টাক্ট VCF ফাইল থেকে যোগ করা হয়েছে!`);
    } catch (err) {
      alert('VCF ফাইলটি পড়তে সমস্যা হয়েছে।');
    } finally {
      if (vcfInputRef.current) vcfInputRef.current.value = '';
    }
  };

  // Filter contacts
  const filteredContacts = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q));
    if (!matchesSearch) return false;

    if (filterType === 'with_phone') return Boolean(c.phone && c.phone.trim().length > 0);
    if (filterType === 'with_debt') return (c.currentDebt || 0) > 0;
    return true;
  });

  return (
    <div className="bg-white border border-[#dce6dd] rounded-[14px] p-4 sm:p-5 shadow-2xs space-y-4">
      {/* Header & Main Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce6dd]">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#14532d]" />
            <h2 className="text-[19px] font-bold text-[#17251a] m-0">
              কন্টাক্ট লিস্ট ও ফোনবুক
            </h2>
            <span className="text-xs bg-[#e2ece4] text-[#17472b] px-2 py-0.5 rounded-full font-bold">
              মোট: {customers.length}
            </span>
          </div>
          <p className="text-[13px] text-[#607064] m-0 mt-1">
            কাস্টমারদের সরাসরি কল, WhatsApp, IMO ও SMS পাঠানোর সহজ তালিকা
          </p>
        </div>

        {/* Action Buttons: Add, Phone Sync, VCF Export */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="border-0 rounded-[9px] py-2 px-3 bg-[#14532d] text-white text-xs font-semibold cursor-pointer hover:bg-[#207348] transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>নতুন কন্টাক্ট</span>
          </button>

          <button
            type="button"
            onClick={handlePickFromPhoneContacts}
            className="border-0 rounded-[9px] py-2 px-3 bg-[#e2ece4] text-[#17472b] text-xs font-semibold cursor-pointer hover:bg-[#d5e3d8] transition-colors flex items-center gap-1.5"
            title="Android / সমর্থিত ফোনে সরাসরি কন্টাক্ট বাছুন"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#14532d]" />
            <span>ফোন থেকে আনুন</span>
          </button>

          <button
            type="button"
            onClick={handleExportVCF}
            className="border-0 rounded-[9px] py-2 px-2.5 bg-[#f0f4f1] text-[#294230] text-xs font-semibold cursor-pointer hover:bg-[#e2ece4] transition-colors flex items-center gap-1"
            title="সব কন্টাক্ট মোবাইলে সেভ করার জন্য VCF ফাইল ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>VCF সেভ</span>
          </button>

          <button
            type="button"
            onClick={() => vcfInputRef.current?.click()}
            className="border-0 rounded-[9px] py-2 px-2.5 bg-[#f0f4f1] text-[#294230] text-xs font-semibold cursor-pointer hover:bg-[#e2ece4] transition-colors flex items-center gap-1"
            title="মোবাইলের VCF কন্টাক্ট ফাইল আপলোড করুন"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>VCF ইমপোর্ট</span>
          </button>
          <input
            ref={vcfInputRef}
            type="file"
            accept=".vcf,text/vcard"
            onChange={handleImportVCF}
            className="hidden"
          />
        </div>
      </div>

      {/* Add New Contact Form Drawer */}
      {showAddForm && (
        <form onSubmit={handleAddNewContact} className="p-4 bg-[#f8faf8] border border-[#dce6dd] rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#17251a] m-0 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-[#14532d]" />
              <span>নতুন কন্টাক্ট যোগ করুন</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-[#607064] hover:text-[#17251a] text-xs"
            >
              বাতিল
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[12px] text-[#607064] font-medium mb-1">
                নাম <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="কাস্টমারের নাম"
                className="w-full p-2.5 border border-[#cbd8cd] rounded-[8px] text-[13px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div>
              <label className="block text-[12px] text-[#607064] font-medium mb-1">
                মোবাইল নম্বর
              </label>
              <input
                type="tel"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full p-2.5 border border-[#cbd8cd] rounded-[8px] text-[13px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
              />
            </div>

            <div>
              <label className="block text-[12px] text-[#607064] font-medium mb-1">
                ঠিকানা / গ্রাম (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="যেমন: বাজারপাড়া"
                className="w-full p-2.5 border border-[#cbd8cd] rounded-[8px] text-[13px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-[#cbd8cd] rounded-[8px] py-1.5 px-3 bg-white text-[#607064] text-xs font-semibold cursor-pointer hover:bg-stone-50"
            >
              বন্ধ
            </button>
            <button
              type="submit"
              className="border-0 rounded-[8px] py-1.5 px-4 bg-[#14532d] text-white text-xs font-semibold cursor-pointer hover:bg-[#207348] transition-colors"
            >
              সেভ করুন
            </button>
          </div>
        </form>
      )}

      {/* Search Bar & Filters */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8ca090] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="নাম বা মোবাইল নম্বর দিয়ে খুঁজুন..."
              className="w-full pl-9 pr-3 py-2.5 border border-[#cbd8cd] rounded-[9px] text-[14px] bg-white text-[#17251a] focus:outline-none focus:border-[#14532d]"
            />
          </div>

          <div className="flex gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
                filterType === 'all' ? 'bg-[#14532d] text-white' : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
              }`}
            >
              সকল ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('with_phone')}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
                filterType === 'with_phone' ? 'bg-[#14532d] text-white' : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
              }`}
            >
              নম্বরসহ
            </button>
            <button
              type="button"
              onClick={() => setFilterType('with_debt')}
              className={`px-3 py-1.5 text-xs rounded-md font-semibold transition-colors ${
                filterType === 'with_debt' ? 'bg-[#14532d] text-white' : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
              }`}
            >
              বাকি আছে
            </button>
          </div>
        </div>
      </div>

      {/* Contact List Directory */}
      <div className="divide-y divide-[#dce6dd] pt-1">
        {filteredContacts.length === 0 ? (
          <div className="py-10 text-center text-[#607064] space-y-2">
            <p className="text-[14px]">কোনো কন্টাক্ট পাওয়া যায়নি।</p>
            {customers.length === 0 && (
              <p className="text-xs text-[#8ca090]">
                উপরে &quot;নতুন কন্টাক্ট&quot; বা &quot;ফোন থেকে আনুন&quot; চাপুন।
              </p>
            )}
          </div>
        ) : (
          filteredContacts.map((customer) => {
            const hasDebt = (customer.currentDebt || 0) > 0;
            const reminderMsg = getDebtReminderMessage(storeName, customer.name, customer.currentDebt || 0);
            const isCopied = copiedId === customer.id;

            return (
              <div
                key={customer.id}
                className="py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#f3f7f3]/50 px-2 rounded-lg transition-colors"
              >
                {/* Contact Info */}
                <div className="flex items-start gap-3">
                  {/* Initial Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#14532d] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                    {customer.name.trim().charAt(0) || 'ক'}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[15px] text-[#17251a]">
                        {customer.name}
                      </span>

                      {hasDebt ? (
                        <span className="text-[12px] bg-[#fff1c9] text-[#785500] px-2 py-0.5 rounded-full font-bold">
                          বাকি: {formatTaka(customer.currentDebt)}
                        </span>
                      ) : (
                        <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                          পরিশোধিত ✓
                        </span>
                      )}
                    </div>

                    {/* Phone Number & Copy */}
                    <div className="flex items-center gap-2 text-xs text-[#607064]">
                      {customer.phone ? (
                        <>
                          <span className="font-mono text-[13px] font-semibold text-[#294230]">
                            {customer.phone}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyPhone(customer.id, customer.phone)}
                            className="p-1 rounded hover:bg-stone-200 text-[#8ca090] hover:text-[#17251a] transition-colors"
                            title="নম্বর কপি করুন"
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-700" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      ) : (
                        <span className="text-stone-400 italic">ফোন নম্বর যুক্ত নেই</span>
                      )}

                      {customer.address && (
                        <span className="text-stone-400">· {customer.address}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Buttons: Call, WhatsApp, IMO, SMS, Sales, Ledger, Delete */}
                <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
                  {customer.phone ? (
                    <>
                      {/* 1. Direct Phone Call */}
                      <button
                        type="button"
                        onClick={() => makePhoneCall(customer.phone)}
                        className="border-0 rounded-[8px] py-1.5 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        title="সরাসরি কল দিন"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>কল</span>
                      </button>

                      {/* 2. WhatsApp */}
                      <button
                        type="button"
                        onClick={() => openWhatsApp(customer.phone, hasDebt ? reminderMsg : `নমস্কার ${customer.name}, ${storeName} থেকে যোগাযোগ করছি।`)}
                        className="border-0 rounded-[8px] py-1.5 px-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        title="WhatsApp এ মেসেজ পাঠান"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>হোয়াটসঅ্যাপ</span>
                      </button>

                      {/* 3. IMO */}
                      <button
                        type="button"
                        onClick={() => openImo(customer.phone, hasDebt ? reminderMsg : `নমস্কার ${customer.name}, ${storeName} থেকে যোগাযোগ করছি।`)}
                        className="border-0 rounded-[8px] py-1.5 px-2.5 bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors"
                        title="IMO শেয়ার ও মেসেজ"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ইমো</span>
                      </button>

                      {/* 4. SMS */}
                      <button
                        type="button"
                        onClick={() => openSMS(customer.phone, hasDebt ? reminderMsg : `নমস্কার ${customer.name}, ${storeName}`)}
                        className="border-0 rounded-[8px] py-1.5 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                        title="মোবাইল SMS পাঠান"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-stone-600" />
                        <span>SMS</span>
                      </button>
                    </>
                  ) : null}

                  {/* 5. Sell to this customer */}
                  <button
                    type="button"
                    onClick={() => onFillCustomerInSale(customer.name, customer.id)}
                    className="border-0 rounded-[8px] py-1.5 px-2.5 bg-[#e2ece4] text-[#17472b] text-xs font-semibold hover:bg-[#d5e3d8] flex items-center gap-1"
                    title="এই কাস্টমারকে বিক্রয় করুন"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>বিক্রয়</span>
                  </button>

                  {/* 6. Customer Ledger & Debt History */}
                  <button
                    type="button"
                    onClick={() => onSelectCustomerHistory(customer)}
                    className="border-0 rounded-[8px] py-1.5 px-2.5 bg-[#14532d] text-white text-xs font-semibold hover:bg-[#207348] flex items-center gap-1"
                    title="বাকির খাতা ও ইতিহাস দেখুন"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>খাতা</span>
                  </button>

                  {/* 7. Delete Customer */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`আপনি কি নিশ্চিত যে কাস্টমার '${customer.name}' এবং তার সমস্ত হিসাব মুছে ফেলতে চান?`)) {
                        onDeleteCustomer(customer.id);
                      }
                    }}
                    className="border-0 rounded-[8px] py-1.5 px-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1"
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

      {/* Helpful hint at bottom */}
      <div className="pt-3 border-t border-[#dce6dd] text-xs text-[#607064] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span>
          💡 &quot;VCF সেভ&quot; চাপলে একটি কন্টাক্ট ফাইল ডাউনলোড হবে, যা দিয়ে এক ক্লিকেই ফোনের কন্টাক্ট লিস্টে সব কাস্টমার সেভ করা যায়।
        </span>
      </div>
    </div>
  );
};
