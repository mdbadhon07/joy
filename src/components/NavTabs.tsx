import React from 'react';

export type AppTab = 'home' | 'customers' | 'contacts' | 'sales' | 'reports';

interface NavTabsProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
}

export const NavTabs: React.FC<NavTabsProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex gap-2 overflow-x-auto no-scrollbar my-3">
      <button
        type="button"
        onClick={() => setActiveTab('home')}
        className={`border-0 rounded-[10px] py-2.5 px-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
          activeTab === 'home'
            ? 'bg-[#14532d] text-white shadow-2xs'
            : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
        }`}
      >
        হোম
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('customers')}
        className={`border-0 rounded-[10px] py-2.5 px-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
          activeTab === 'customers'
            ? 'bg-[#14532d] text-white shadow-2xs'
            : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
        }`}
      >
        কাস্টমার
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('contacts')}
        className={`border-0 rounded-[10px] py-2.5 px-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
          activeTab === 'contacts'
            ? 'bg-[#14532d] text-white shadow-2xs'
            : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
        }`}
      >
        কন্টাক্ট লিস্ট
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('sales')}
        className={`border-0 rounded-[10px] py-2.5 px-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
          activeTab === 'sales'
            ? 'bg-[#14532d] text-white shadow-2xs'
            : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
        }`}
      >
        বিক্রয় / টাকা জমা
      </button>

      <button
        type="button"
        onClick={() => setActiveTab('reports')}
        className={`border-0 rounded-[10px] py-2.5 px-3.5 text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors ${
          activeTab === 'reports'
            ? 'bg-[#14532d] text-white shadow-2xs'
            : 'bg-[#e2ece4] text-[#17472b] hover:bg-[#d5e3d8]'
        }`}
      >
        রিপোর্ট ও ব্যাকআপ
      </button>
    </nav>
  );
};
