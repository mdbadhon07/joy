import React from 'react';
import { ShoppingBag, BookOpen, Users, FileText, Home } from 'lucide-react';

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
    <header className="bg-emerald-900 text-white sticky top-0 z-30 shadow-xs border-b border-emerald-800">
      <div className="max-w-5xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14 gap-2">
        {/* Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white text-base">
            জ
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight whitespace-nowrap">
            জয় কুমার স্টোর
          </span>
          <span className="text-[10px] bg-emerald-800 text-emerald-200 px-1.5 py-0.5 rounded font-medium">
            অ্যাডমিন
          </span>
        </div>

        {/* Clean Nav Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-white text-emerald-950 shadow-2xs'
                : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>বিক্রয়</span>
          </button>

          <button
            onClick={() => setActiveTab('debts')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'debts'
                ? 'bg-white text-emerald-950 shadow-2xs'
                : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>বাকি খাতা</span>
            {debtCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 font-bold ml-0.5">
                {debtCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-white text-emerald-950 shadow-2xs'
                : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>কাস্টমার</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-white text-emerald-950 shadow-2xs'
                : 'text-emerald-100 hover:bg-emerald-800/80 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>হিসাব</span>
          </button>

          <button
            onClick={() => setActiveTab('home')}
            className={`px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
              activeTab === 'home'
                ? 'bg-white text-emerald-950 font-bold shadow-2xs'
                : 'text-emerald-200 hover:bg-emerald-800/80 hover:text-white'
            }`}
            title="ড্যাশবোর্ড ওভারভিউ"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">হোম</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
