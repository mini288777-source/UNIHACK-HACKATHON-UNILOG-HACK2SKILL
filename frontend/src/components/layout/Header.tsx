import React, { useState } from 'react';
import { Search, Bell, HelpCircle, Info, Trash2, X } from 'lucide-react';

interface HeaderProps {
  activeTab: 'upload' | 'dashboard' | 'workspace';
  productCount: number;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onResetCatalog?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  productCount,
  searchQuery = '',
  onSearchChange,
  onResetCatalog
}) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClear = () => {
    if (onResetCatalog) {
      onResetCatalog();
      showToast('✨ Catalog & database reset! 0 SKUs active.');
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-20 right-6 z-[100] bg-surface-container-highest border border-outline-variant/50 text-on-surface px-4 py-2.5 rounded-lg shadow-xl text-sm font-label animate-fade-in flex items-center gap-2">
          <Info className="w-4 h-4 text-secondary-container" />
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

        {/* Stitch Enterprise Search Bar with Live Query Binding */}
        <div className="flex-1 max-w-xl mx-6 hidden md:flex items-center">
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-secondary-container transition-colors pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder="Search SKU, MPN, Manufacturer, Spec or Classpath..."
              className="w-full bg-surface-container-high/90 border border-outline-variant/50 text-on-surface text-xs rounded-lg pl-10 pr-9 py-2 focus:outline-none focus:border-secondary-container focus:ring-1 focus:ring-secondary-container transition-all placeholder:text-on-surface-variant/70 glass-panel"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange?.('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-full hover:bg-surface-container-highest cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Active SKUs Badge */}
          <div className="flex items-center space-x-2 bg-surface-container-low border border-outline-variant/40 px-3 py-1.5 rounded-lg text-xs shadow-sm">
            <span className={`w-2 h-2 rounded-full ${productCount > 0 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse' : 'bg-on-surface-variant/40'}`}></span>
            <span className="text-on-surface font-label font-bold">{productCount} SKUs Active</span>
          </div>

          {/* Prominent CLEAR BUTTON right beside SKUs badge */}
          {onResetCatalog && (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 rounded-lg bg-error-container/20 hover:bg-error-container/40 text-error border border-error/40 hover:border-error text-xs font-bold font-label uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              title="Clear all catalog products, reset database & start brand new"
            >
              <Trash2 className="w-3.5 h-3.5 text-error" />
              <span>Clear</span>
            </button>
          )}

          <button onClick={() => showToast('No new notifications')} className="text-on-surface-variant hover:text-secondary-container transition-colors p-1.5 rounded-lg hover:bg-surface-container-high/60 hidden sm:flex items-center justify-center cursor-pointer" title="Notifications">
            <Bell className="w-5 h-5 text-on-surface-variant hover:text-secondary-container transition-colors" />
          </button>

          <button onClick={() => showToast('UniHack 252-Column Product Intelligence Documentation')} className="text-on-surface-variant hover:text-secondary-container transition-colors p-1.5 rounded-lg hover:bg-surface-container-high/60 hidden sm:flex items-center justify-center cursor-pointer" title="Help & Docs">
            <HelpCircle className="w-5 h-5 text-on-surface-variant hover:text-secondary-container transition-colors" />
          </button>
        </div>
      </header>
    </>
  );
};
export default Header;
