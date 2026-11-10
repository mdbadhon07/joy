import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-br from-[#14532d] to-[#207348] text-white py-5 px-4 text-center select-none shadow-xs">
      <h1 className="text-2xl sm:text-[26px] font-bold tracking-normal m-0 leading-tight">
        ✦ জয় কুমার স্টোর ✦
      </h1>
      <p className="mt-1.5 text-[#d9f4df] text-[13px] font-normal m-0">
        আপনার বিশ্বস্ত কেনাকাটার ঠিকানা
      </p>
      <p className="mt-1 text-[#d9f4df] text-[13px] font-normal m-0">
        সততা • বিশ্বাস • সেবার অঙ্গীকার
      </p>
    </header>
  );
};
