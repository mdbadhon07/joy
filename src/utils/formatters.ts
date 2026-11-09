/**
 * Utility functions for Bengali formatting, currency, and messaging
 */

// Bengali digits mapping
const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNumber(num: number | string): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '০';
  const str = Number(num).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
  return str.replace(/\d/g, (d) => bnDigits[parseInt(d, 10)]);
}

export function formatTaka(amount: number, useBengaliDigits: boolean = true): string {
  const val = Number(amount || 0);
  if (useBengaliDigits) {
    return `৳${toBengaliNumber(val)}`;
  }
  return `৳${val.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

export function formatDateTime(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);
  
  return d.toLocaleString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateShort(timestamp: number | string | Date): string {
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);
  
  return d.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getSaleReceiptMessage(
  storeName: string,
  customerName: string,
  totalAmount: number,
  paidAmount: number,
  dueAmount: number,
  currentTotalDebt: number,
  note?: string,
  date?: string
): string {
  const lines = [
    `✦ ${storeName} ✦`,
    `কাস্টমার: ${customerName}`,
    note ? `বিবরণ: ${note}` : '',
    `মোট বিল: ৳${totalAmount}`,
    `পরিশোধ: ৳${paidAmount}`,
    dueAmount > 0 ? `এই বিলে বাকি: ৳${dueAmount}` : 'এই বিল সম্পূর্ণ পরিশোধিত ✓',
    `আপনার বর্তমান মোট বাকি: ৳${currentTotalDebt}`,
    `তারিখ: ${date || new Date().toLocaleDateString('bn-BD')}`,
    `ধন্যবাদ, আবার আসবেন!`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function getDebtPaymentReceiptMessage(
  storeName: string,
  customerName: string,
  paidAmount: number,
  remainingDebt: number,
  note?: string,
  date?: string
): string {
  const lines = [
    `✦ ${storeName} — বাকি জমা রসিদ ✦`,
    `কাস্টমার: ${customerName}`,
    `জমা গ্রহণ: ৳${paidAmount}`,
    note ? `মাধ্যম/নোট: ${note}` : '',
    `বর্তমান অবশিষ্ট বাকি: ৳${remainingDebt}`,
    `তারিখ: ${date || new Date().toLocaleDateString('bn-BD')}`,
    `ধন্যবাদ!`,
  ].filter(Boolean);

  return lines.join('\n');
}

export function getDebtReminderMessage(
  storeName: string,
  customerName: string,
  currentDebt: number
): string {
  return `শ্রদ্ধেয় ${customerName}, ${storeName}-এ আপনার বর্তমান বকেয়া বাকি ৳${currentDebt} টাকা। বকেয়া পরিশোধ করার জন্য বিনীত অনুরোধ জানাচ্ছি। ধন্যবাদ!`;
}

export function getCustomerFullDebtReportMessage(
  storeName: string,
  customerName: string,
  currentDebt: number,
  totalPurchased: number,
  totalPaid: number
): string {
  const lines = [
    `✦ ${storeName} — বাকি খাতার হিসাব ✦`,
    `গ্রাহকের নাম: ${customerName}`,
    `--------------------------------`,
    `মোট কেনাকাটা: ৳${totalPurchased}`,
    `মোট পরিশোধ/জমা: ৳${totalPaid}`,
    `বর্তমান অবশিষ্ট বকেয়া বাকি: ৳${currentDebt}`,
    `--------------------------------`,
    `তারিখ: ${new Date().toLocaleDateString('bn-BD')}`,
    `অনুগ্রহ করে বকেয়া টাকা পরিশোধ করুন। ধন্যবাদ!`,
  ];
  return lines.join('\n');
}

export function openWhatsApp(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  // Format BD number if missing country code
  const fullPhone = cleanPhone.startsWith('01') ? `88${cleanPhone}` : cleanPhone;
  const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function openSMS(phone: string, text: string) {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  window.location.href = `sms:${cleanPhone}?body=${encodeURIComponent(text)}`;
}

export async function openImo(phone: string, text: string): Promise<boolean> {
  // 1. Copy text to clipboard so it's ready to paste in IMO
  try {
    await navigator.clipboard.writeText(text);
  } catch (e) {
    console.warn('Clipboard write failed:', e);
  }

  // 2. If Web Share API is available (Android / iOS mobile), open native share
  // This directly lets the user pick IMO from their apps list with the message pre-filled!
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'জয় কুমার স্টোর - বাকি হিসাব',
        text: text,
      });
      return true;
    } catch (err: any) {
      // User cancelled or share failed, proceed to deep link
      if (err.name === 'AbortError') return true;
    }
  }

  // 3. Try IMO custom protocol
  const cleanPhone = phone.replace(/[^0-9]/g, '');
  const fullPhone = cleanPhone.startsWith('01') ? `+88${cleanPhone}` : cleanPhone;
  window.location.href = `imo://`;
  return false;
}

export function makePhoneCall(phone: string) {
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  window.location.href = `tel:${cleanPhone}`;
}
