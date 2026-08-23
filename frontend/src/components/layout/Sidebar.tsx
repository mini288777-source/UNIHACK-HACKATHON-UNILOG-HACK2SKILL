import React, { useState, useEffect } from 'react';

interface SidebarProps {
  activeTab: 'upload' | 'dashboard' | 'workspace';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'workspace') => void;
  hasActiveProduct: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasActiveProduct }) => {
  const [motionEnabled, setMotionEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('motion_enabled');
    if (saved !== null) return saved === 'true';
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    localStorage.setItem('motion_enabled', String(motionEnabled));
    if (motionEnabled) {
      document.documentElement.classList.remove('motion-reduced');
    } else {
      document.documentElement.classList.add('motion-reduced');
    }
  }, [motionEnabled]);

  return (
    <aside className="w-64 flex flex-col p-4 z-40 bg-surface-container-lowest/80 backdrop-blur-2xl text-on-surface shadow-xl border-r border-outline-variant/30 shrink-0 text-left justify-between h-[calc(100vh-4rem)] overflow-y-auto">
      <div className="space-y-6">
        <div className="px-3 pt-1">
          <h2 className="text-base font-headline font-bold text-on-surface tracking-tight">Industrial Intelligence</h2>
        </div>

        <nav className="space-y-1 font-label">
          {/* Document Ingestion Tab */}
          <button
            onClick={() => setActiveTab('upload')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'upload'
                ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">cloud_upload</span>
            <span>Document Ingestion</span>
          </button>

          {/* Product Catalog Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'dashboard'
                ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span>Product Catalog</span>
          </button>

          {/* Product Intelligence Workspace Tab */}
          <button
            onClick={() => setActiveTab('workspace')}
            disabled={!hasActiveProduct}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'workspace'
                ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                : hasActiveProduct
                ? 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                : 'text-on-surface-variant/30 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-[20px]">insights</span>
              <span>Intelligence Workspace</span>
            </div>
            {hasActiveProduct && (
              <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#feaa00] animate-pulse"></span>
            )}
          </button>
        </nav>

        {/* Trust Classification Legend from Stitch Design */}
        <div className="pt-4 border-t border-outline-variant/30 px-2 space-y-2">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label mb-2">Trust Status Index</p>
          <div className="space-y-2 text-xs font-label">
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                <span className="text-on-surface text-[11px] font-medium">VERIFIED</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">≥90%</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_6px_#feaa00]"></span>
                <span className="text-on-surface text-[11px] font-medium">NEEDS REVIEW</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">65-89%</span>
            </div>
            <div className="flex items-center justify-between py-0.5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_6px_#dd2e18]"></span>
                <span className="text-on-surface text-[11px] font-medium">CONFLICT</span>
              </div>
              <span className="text-[10px] text-error font-mono font-bold">ALERT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto space-y-3 pt-4 border-t border-outline-variant/30">
        <button
          onClick={() => setActiveTab('upload')}
          className="w-full flex items-center justify-center space-x-2 bg-secondary-container text-on-secondary px-4 py-2.5 rounded-lg font-label font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-colors shadow-[0_0_15px_rgba(254,170,0,0.3)] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Analysis</span>
        </button>

        {/* User / Node Status Footer */}
        <div className="pt-2 flex items-center justify-between px-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-secondary-container">
              <span className="material-symbols-outlined text-[16px]">verified_user</span>
            </div>
            <div>
              <p className="text-xs font-medium text-on-surface truncate font-label">CHERRY</p>
              <p className="text-[10px] text-on-surface-variant truncate font-label">Level 5 Full Admin Access!</p>
            </div>
          </div>
          <button
            onClick={() => setMotionEnabled(!motionEnabled)}
            className="text-on-surface-variant hover:text-secondary-container transition-colors"
            title={motionEnabled ? "Reduce Motion" : "Enable Motion"}
          >
            <span className="material-symbols-outlined text-[18px]">{motionEnabled ? 'motion_photos_on' : 'motion_photos_off'}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
