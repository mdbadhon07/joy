import React from 'react';
import { 
  ShoppingBag, 
  BookOpen, 
  Users, 
  FileText, 
  LayoutDashboard, 
  ShieldCheck, 
  PlusCircle,
  Database
} from 'lucide-react';

export type ActiveTab = 'home' | 'sales' | 'debts' | 'customers' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  debtCount: number;
  totalDebt: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  debtCount,
  totalDebt,
}) => {
  return (
    <header className="bg-emerald-950 text-white shadow-lg border-b border-emerald-800/60 sticky top-0 z-30">
      {/* Top Banner with Brand and Admin Indicator */}
      <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-inner font-bold text-xl border border-emerald-400/40 shrink-0">
            জ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white leading-tight">
                জয় কুমার স্টোর
              </h1>
              <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                অ্যাডমিন সাইট
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">
              দোকানের দৈনন্দিন বিক্রয় ও গ্রাহকের বাকি খাতা পরিচালনা
            </p>
          </div>
        </div>

        {/* Quick Debt Alert & New Sale CTA in Header */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {totalDebt > 0 && (
            <button
              onClick={() => setActiveTab('debts')}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30 transition-colors flex items-center gap-1.5"
              title="বাকি খাতা দেখুন"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>বাকি: <strong className="font-mono-nums">৳{totalDebt.toLocaleString('en-US')}</strong> ({debtCount} জন)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('sales')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
          >
            <PlusCircle className="w-4 h-4" />
            <span>নতুন বিক্রয়</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs - Note: Products tab is completely removed as requested */}
      <div className="max-w-6xl mx-auto px-4 overflow-x-auto no-scrollbar border-t border-emerald-900/80">
        <nav className="flex items-center gap-1 py-1 text-sm font-medium">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-150 text-xs md:text-sm ${
              activeTab === 'home'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>ড্যাশবোর্ড</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-150 text-xs md:text-sm ${
              activeTab === 'sales'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>বিক্রয় (ম্যানুয়াল মূল্য)</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-150 text-xs md:text-sm relative ${
              activeTab === 'debts'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>বাকি খাতা ও ঋণ ইতিহাস</span>
            {debtCount > 0 && (
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 font-bold">
                {debtCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-150 text-xs md:text-sm ${
              activeTab === 'customers'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>কাস্টমার তালিকা</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg whitespace-nowrap transition-all duration-150 text-xs md:text-sm ${
              activeTab === 'reports'
                ? 'bg-emerald-800 text-white font-semibold shadow-inner'
                : 'text-emerald-200 hover:text-white hover:bg-emerald-900/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>রিপোর্ট ও ব্যাকআপ</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
