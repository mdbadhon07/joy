import React from 'react';
import { User } from 'firebase/auth';
import { Cloud, CloudOff, LogIn, LogOut, RefreshCw, UploadCloud, AlertCircle } from 'lucide-react';

interface CloudSyncBarProps {
  user: User | null;
  authLoading: boolean;
  isSigningIn?: boolean;
  isSyncing: boolean;
  syncError: string | null;
  hasPendingLocalMerge: boolean;
  onSignIn: () => void;
  onRedirectSignIn?: () => void;
  onSignOut: () => void;
  onMergeLocalData: () => void;
}

export const CloudSyncBar: React.FC<CloudSyncBarProps> = ({
  user,
  authLoading,
  isSigningIn = false,
  isSyncing,
  syncError,
  hasPendingLocalMerge,
  onSignIn,
  onRedirectSignIn,
  onSignOut,
  onMergeLocalData,
}) => {
  if (authLoading) {
    return (
      <div className="mb-3 px-3.5 py-2.5 rounded-[12px] bg-white border border-[#dce6dd] flex items-center gap-2 text-xs text-[#607064]">
        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#14532d]" />
        <span>ক্লাউড অ্যাকাউন্ট যাচাই হচ্ছে...</span>
      </div>
    );
  }

  return (
    <div className="mb-3 space-y-2">
      {user ? (
        <div className="px-3.5 py-2.5 rounded-[12px] bg-white border border-[#cbd8cd] flex flex-wrap items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-[#e2ece4] text-[#14532d] flex items-center justify-center shrink-0">
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#14532d]">
                  ক্লাউড সিঙ্ক চালু
                </span>
                <span className="text-[11px] text-[#607064] truncate">
                  ({user.email})
                </span>
              </div>
              <p className="text-[11px] text-[#607064] m-0">
                {isSyncing
                  ? 'তথ্য সিঙ্ক হচ্ছে...'
                  : 'যেকোনো ফোন বা কম্পিউটারে এই ইমেইল দিয়ে লগইন করলেই সব হিসাব পাবেন'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasPendingLocalMerge && (
              <button
                type="button"
                onClick={onMergeLocalData}
                disabled={isSyncing}
                className="border-0 rounded-[8px] py-1.5 px-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>আগের লোকাল ডেটা যোগ করুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSignOut}
              className="border border-[#cbd8cd] rounded-[8px] py-1.5 px-2.5 bg-[#f3f7f3] hover:bg-[#e2ece4] text-[#17472b] text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>লগআউট</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-2.5 rounded-[12px] bg-white border border-[#dce6dd] flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fff8df] border border-[#f0dfa2] text-[#785500] flex items-center justify-center shrink-0">
              <CloudOff className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs sm:text-[13px] font-bold text-[#17251a] m-0">
                যেকোনো ডিভাইসে ডেটা পেতে ক্লাউড সিঙ্ক চালু করুন
              </p>
              <p className="text-[11px] text-[#607064] m-0">
                একবার Google লগইন করলে আর ফাইল ট্রান্সফার করতে হবে না
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onSignIn}
              disabled={isSigningIn}
              className="border-0 rounded-[9px] py-2 px-3.5 bg-[#14532d] hover:bg-[#207348] disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              {isSigningIn ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>{isSigningIn ? 'লগইন হচ্ছে...' : 'Google দিয়ে লগইন ও সিঙ্ক'}</span>
            </button>

            {onRedirectSignIn && (
              <button
                type="button"
                onClick={onRedirectSignIn}
                disabled={isSigningIn}
                className="border border-[#cbd8cd] rounded-[9px] py-2 px-2.5 bg-[#f3f7f3] hover:bg-[#e2ece4] text-[#17472b] text-[11px] font-semibold cursor-pointer transition-colors"
                title="পপ-আপ ব্লক হলে এই বাটন দিয়ে চেষ্টা করুন"
              >
                পপ-আপ ছাড়া লগইন
              </button>
            )}
          </div>
        </div>
      )}

      {syncError && (
        <div className="px-3 py-2.5 rounded-[10px] bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-2 leading-relaxed">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="break-words space-y-1.5">
            <div>{syncError}</div>
            {typeof window !== 'undefined' && window.self !== window.top && (
              <div>
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-bold underline text-red-800 hover:text-red-950"
                >
                  সরাসরি ব্রাউজার ট্যাবে খুলে লগইন করুন ↗
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
