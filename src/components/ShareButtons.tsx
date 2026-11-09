import React, { useState } from 'react';
import { 
  MessageCircle, 
  MessageSquare, 
  Share2, 
  Copy, 
  Check, 
  Phone 
} from 'lucide-react';
import { openWhatsApp, openSMS, openImo, makePhoneCall } from '../utils/formatters';

interface ShareButtonsProps {
  phone: string;
  messageText: string;
  customerName?: string;
  variant?: 'full' | 'compact' | 'mini';
  showCall?: boolean;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  phone,
  messageText,
  customerName,
  variant = 'full',
  showCall = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [imoNotice, setImoNotice] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImo = async () => {
    setImoNotice(true);
    await openImo(phone, messageText);
    setTimeout(() => setImoNotice(false), 3000);
  };

  if (variant === 'mini') {
    return (
      <div className="flex items-center gap-1">
        {phone && (
          <>
            <button
              type="button"
              onClick={() => openWhatsApp(phone, messageText)}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="WhatsApp এ পাঠান"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleImo}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors font-bold text-[11px] px-2 flex items-center gap-0.5"
              title="IMO তে পাঠান"
            >
              <span className="font-extrabold tracking-tighter text-[11px]">imo</span>
            </button>

            <button
              type="button"
              onClick={() => openSMS(phone, messageText)}
              className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
              title="SMS পাঠান"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1.5 rounded-lg bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors"
          title="মেসেজ কপি করুন"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {phone && (
          <>
            <button
              type="button"
              onClick={() => openWhatsApp(phone, messageText)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleImo}
              className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <span className="font-extrabold tracking-tight text-[11px] bg-white text-blue-700 rounded px-1 py-0.2">imo</span>
              <span>IMO</span>
            </button>

            <button
              type="button"
              onClick={() => openSMS(phone, messageText)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>SMS</span>
            </button>
          </>
        )}

        <button
          type="button"
          onClick={handleCopy}
          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium flex items-center gap-1 transition-colors border border-stone-200"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'কপি হয়েছে' : 'কপি'}</span>
        </button>

        {phone && showCall && (
          <button
            type="button"
            onClick={() => makePhoneCall(phone)}
            className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors border border-stone-200"
            title="কল করুন"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  // Full variant with big descriptive buttons
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* WhatsApp */}
        <button
          type="button"
          onClick={() => {
            if (!phone) {
              handleCopy();
              alert('কাস্টমারের ফোন নম্বর নেই। মেসেজটি ক্লিপবোর্ডে কপি করা হয়েছে।');
              return;
            }
            openWhatsApp(phone, messageText);
          }}
          className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <MessageCircle className="w-4 h-4 shrink-0" />
          <span>WhatsApp এ পাঠান</span>
        </button>

        {/* IMO */}
        <button
          type="button"
          onClick={handleImo}
          className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <span className="font-black text-xs bg-white text-blue-700 rounded px-1 leading-tight">imo</span>
          <span>IMO তে পাঠান</span>
        </button>

        {/* SMS */}
        <button
          type="button"
          onClick={() => {
            if (!phone) {
              handleCopy();
              alert('কাস্টমারের ফোন নম্বর নেই। মেসেজটি ক্লিপবোর্ডে কপি করা হয়েছে।');
              return;
            }
            openSMS(phone, messageText);
          }}
          className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          <MessageSquare className="w-4 h-4 shrink-0" />
          <span>SMS পাঠান</span>
        </button>

        {/* Copy Text */}
        <button
          type="button"
          onClick={handleCopy}
          className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'কপি সম্পন্ন হয়েছে ✓' : 'মেসেজ কপি করুন'}</span>
        </button>
      </div>

      {imoNotice && (
        <p className="text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded-lg p-2 animate-in fade-in">
          ℹ️ বিবরণ কপি করা হয়েছে! IMO অ্যাপ খুললে কাস্টমারের চ্যাটে সরাসরি <strong>Paste</strong> করে দিন।
        </p>
      )}
    </div>
  );
};
