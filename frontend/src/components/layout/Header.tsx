import React, { useState } from 'react';

interface HeaderProps {
  activeTab: 'upload' | 'dashboard' | 'workspace';
  productCount: number;
}

export const Header: React.FC<HeaderProps> = ({ productCount }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] bg-surface-container-highest border border-outline-variant/50 text-on-surface px-4 py-2.5 rounded-lg shadow-xl text-sm font-label animate-fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-secondary-container">info</span>
          {toastMessage}
        </div>
      )}
      <header className="w-full flex justify-between items-center px-6 h-16 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md font-body text-label-sm shrink-0 z-50 sticky top-0 transition-all duration-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-black text-sm shadow-[0_0_12px_rgba(221,46,24,0.4)]">
              UL
            </div>
            <div>
              <h1 className="text-xl font-headline font-black tracking-tight text-on-surface">Uni - Logger AI</h1>
            </div>
          </div>

          <span className="hidden lg:inline-block text-[10px] font-bold text-secondary-container bg-surface-container-high border border-outline-variant/40 px-2.5 py-0.5 rounded-full font-label uppercase tracking-widest">
            Provable Trust Engine
          </span>
        </div>

        {/* Stitch Enterprise Search Bar with ⌘K Badge */}
        <div className="flex-1 max-w-xl mx-6 hidden md:flex items-center">
          <div className="relative w-full group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-on-surface-variant group-focus-within:text-secondary-container transition-colors text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search SKU, MPN, Manufacturer, or Category Classpath..."
              className="w-full bg-surface-container-high/90 border border-outline-variant/50 text-on-surface text-xs rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-all placeholder:text-on-surface-variant/70 glass-panel"
            />
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-lg text-xs shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></span>
            <span className="text-on-surface font-label font-bold">{productCount} SKUs Active</span>
          </div>

          <button onClick={() => showToast('No new notifications')} className="text-on-surface-variant hover:text-secondary-container transition-colors p-1.5 rounded-lg hover:bg-surface-container-high/60 hidden sm:flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">notifications</span>
          </button>

          <button onClick={() => showToast('Help documentation coming soon!')} className="text-on-surface-variant hover:text-secondary-container transition-colors p-1.5 rounded-lg hover:bg-surface-container-high/60 hidden sm:flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">help</span>
          </button>
        </div>
      </header>
    </>
  );
};
