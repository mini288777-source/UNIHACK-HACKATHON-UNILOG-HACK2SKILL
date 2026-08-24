import React, { useState, useEffect } from 'react';
import { UploadCloud, Boxes, Cpu, Plus, Eye, EyeOff, Pencil, Dices, Check, X } from 'lucide-react';

const RANDOM_NAMES = [
  'Shiva',
  'Mahadeva',
  'Shankara',
  'Rudra',
  'Neelakantha',
  'Veerabhadra',
  'Narayana',
  'Govinda',
  'Venkateswara',
  'Srinivasa',
  'Rama',
  'Krishna',
  'Narasimha',
  'Hanuman',
  'Ganapati',
  'Durga',
  'Lakshmi',
  'Saraswati',
  'Parvati',
  'Kali',
  'Kanaka Durga',
  'Bhavani',
  'Lalitha',
  'Yellamma',
  'Pochamma',
  'Cat Burglar Nami',
  'Straw Hat Luffy',
  'Pirate Hunter Zoro',
  'Black Leg Sanji',
  'God Usopp',
  'Cotton Candy Lover Chopper',
  'Devil Child Robin',
  'Iron Man Franky',
  'Soul King Brook',
  'Knight of the Sea Jinbe',
  'Fire Fist Ace',
  'Revolutionary Sabo',
  'Red-Haired Shanks',
  'Surgeon of Death Law',
  'Captain Kid',
  'Hawk-Eye Mihawk',
  'Heavenly Demon Doflamingo',
  'King of Beasts Kaido',
  'Big Mom Charlotte Linlin',
  'Blackbeard Marshall D. Teach',
  'Red Dog Sakazuki',
  'Ghost Princess Perona',
  'Boa Hancock',
  'Desert King Crocodile'
];

interface SidebarProps {
  activeTab: 'upload' | 'dashboard' | 'workspace';
  setActiveTab: (tab: 'upload' | 'dashboard' | 'workspace') => void;
  hasActiveProduct: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, hasActiveProduct }) => {
  const [userName, setUserName] = useState<string>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('unilogger_username') : null;
      if (saved && saved.trim()) return saved.trim();
      const initial = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
      if (typeof window !== 'undefined') {
        localStorage.setItem('unilogger_username', initial);
      }
      return initial;
    } catch {
      return 'Shiva';
    }
  });

  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [tempName, setTempName] = useState<string>(userName);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  const [motionEnabled, setMotionEnabled] = useState<boolean>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('motion_enabled') : null;
      if (saved !== null) return saved === 'true';
      return typeof window !== 'undefined' && window.matchMedia ? !window.matchMedia('(prefers-reduced-motion: reduce)').matches : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('motion_enabled', String(motionEnabled));
    } catch {
      // Ignore localStorage write restrictions
    }
    if (typeof document !== 'undefined') {
      if (motionEnabled) {
        document.documentElement.classList.remove('motion-reduced');
      } else {
        document.documentElement.classList.add('motion-reduced');
      }
    }
  }, [motionEnabled]);

  const saveCustomName = () => {
    const trimmed = tempName.trim();
    if (trimmed) {
      setUserName(trimmed);
      try {
        localStorage.setItem('unilogger_username', trimmed);
      } catch {}
    }
    setIsEditingName(false);
  };

  const cancelEditName = () => {
    setTempName(userName);
    setIsEditingName(false);
  };

  const rollRandomName = () => {
    setIsRolling(true);
    const available = RANDOM_NAMES.filter(n => n.toUpperCase() !== userName.toUpperCase());
    const picked = (available.length > 0 ? available : RANDOM_NAMES)[Math.floor(Math.random() * (available.length || RANDOM_NAMES.length))];
    
    setTimeout(() => {
      setUserName(picked);
      setTempName(picked);
      try {
        localStorage.setItem('unilogger_username', picked);
      } catch {}
      setIsRolling(false);
    }, 200);
  };

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
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <UploadCloud className="w-5 h-5 text-current shrink-0" />
            <span>Document Ingestion</span>
          </button>

          {/* Product Catalog Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              activeTab === 'dashboard'
                ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
            }`}
          >
            <Boxes className="w-5 h-5 text-current shrink-0" />
            <span>Product Catalog</span>
          </button>

          {/* Product Intelligence Workspace Tab */}
          <button
            onClick={() => setActiveTab('workspace')}
            disabled={!hasActiveProduct}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              activeTab === 'workspace'
                ? 'bg-secondary-container text-on-secondary-container shadow-[0_0_12px_rgba(254,170,0,0.3)] cursor-pointer'
                : hasActiveProduct
                ? 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60 cursor-pointer'
                : 'text-on-surface-variant/30 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center space-x-3">
              <Cpu className="w-5 h-5 text-current shrink-0" />
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
          className="w-full flex items-center justify-center space-x-2 bg-secondary-container text-on-secondary px-4 py-2.5 rounded-lg font-label font-bold text-xs uppercase tracking-wider hover:bg-secondary-fixed-dim transition-colors shadow-[0_0_15px_rgba(254,170,0,0.3)] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-on-secondary" />
          <span>New Analysis</span>
        </button>

        {/* User / Node Status Footer with Editable Name & Random Divine Dice */}
        <div className="pt-2 border-t border-outline-variant/20 px-1">
          {isEditingName ? (
            <div className="flex items-center gap-1.5 py-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCustomName();
                  if (e.key === 'Escape') cancelEditName();
                }}
                autoFocus
                placeholder="Enter user name"
                className="flex-1 min-w-0 px-2 py-1 text-xs font-bold font-label bg-surface-container-lowest text-on-surface border border-secondary-container rounded-md outline-none focus:ring-1 focus:ring-secondary-container shadow-inner"
              />
              <button
                onClick={saveCustomName}
                className="p-1 rounded bg-secondary-container/20 hover:bg-secondary-container/40 text-secondary-container border border-secondary-container/40 transition-colors cursor-pointer"
                title="Save Name (Enter)"
              >
                <Check className="w-3.5 h-3.5 text-secondary-container" />
              </button>
              <button
                onClick={cancelEditName}
                className="p-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant transition-colors cursor-pointer"
                title="Cancel (Esc)"
              >
                <X className="w-3.5 h-3.5 text-on-surface-variant" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-full bg-secondary-container/20 border border-secondary-container/40 flex items-center justify-center text-secondary-container shrink-0 shadow-sm font-bold font-mono text-xs">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-on-surface truncate font-label uppercase tracking-wide" title={userName}>
                    {userName}
                  </p>
                </div>
              </div>

              {/* Action Icons: Edit Pencil, Divine Random Dice, Motion Toggle */}
              <div className="flex items-center space-x-1 shrink-0 ml-1">
                <button
                  onClick={() => {
                    setTempName(userName);
                    setIsEditingName(true);
                  }}
                  className="p-1 rounded text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high transition-all cursor-pointer"
                  title="Edit user name (keep custom name)"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={rollRandomName}
                  disabled={isRolling}
                  className={`p-1 rounded text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high transition-all cursor-pointer ${
                    isRolling ? 'rotate-180 transition-transform duration-300 text-secondary-container' : ''
                  }`}
                  title="Roll random name from divine list (Shiva, Krishna, Durga...)"
                >
                  <Dices className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setMotionEnabled(!motionEnabled)}
                  className="p-1 rounded text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high transition-colors cursor-pointer"
                  title={motionEnabled ? "Reduce Motion" : "Enable Motion"}
                >
                  {motionEnabled ? (
                    <Eye className="w-3.5 h-3.5 text-on-surface-variant" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-on-surface-variant" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
