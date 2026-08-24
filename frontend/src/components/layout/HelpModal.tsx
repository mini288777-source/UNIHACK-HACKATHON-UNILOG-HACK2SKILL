import React, { useState } from 'react';
import {
  X,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const developerEmail = 'charantejakaluvoyi@gmail.com';

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(developerEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenGmail = () => {
    const subject = encodeURIComponent('Uni - Logger AI — Feedback, Review & Feature Suggestions');
    const body = encodeURIComponent(
      'Hi Charan,\n\nI am reviewing Uni - Logger AI and wanted to share my feedback / suggestions / appreciation:\n\n' +
      '• Feedback & Review:\n\n' +
      '• Suggested Enhancements / Feature Requests:\n\n' +
      '• General Impressions & Experience:\n\n' +
      'Best regards,\n'
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${developerEmail}&su=${subject}&body=${body}`;
    const mailtoUrl = `mailto:${developerEmail}?subject=${subject}&body=${body}`;

    try {
      const win = window.open(gmailUrl, '_blank', 'noopener,noreferrer');
      if (!win || win.closed || typeof win.closed === 'undefined') {
        window.location.href = mailtoUrl;
      }
    } catch {
      window.location.href = mailtoUrl;
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in font-body">
      {/* Backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-surface-container-lowest border border-outline-variant/60 rounded-2xl shadow-2xl overflow-hidden glass-panel z-10 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/40 bg-surface-container-low/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary-container/20 border border-secondary-container/40 text-secondary-container">
              <HelpCircle className="w-5 h-5 text-secondary-container" />
            </div>
            <div>
              <h2 className="text-base font-headline font-black text-on-surface flex items-center gap-2">
                Help, System Guide & Feedback
              </h2>
              <p className="text-xs text-on-surface-variant">
                Platform architecture, operational rules & developer contact
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors cursor-pointer"
            title="Close modal (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1 text-xs text-on-surface-variant leading-relaxed">
          
          {/* Highlighted Feedback Review Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-container/15 via-surface-container to-secondary-container/10 border border-secondary-container/30 space-y-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-on-surface font-headline font-bold text-sm">
                <MessageSquare className="w-4 h-4 text-secondary-container" />
                <span>Share Feedback & Feature Requests</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary-container/20 text-secondary-container border border-secondary-container/30 uppercase tracking-wider">
                Direct Contact
              </span>
            </div>

            <p className="text-xs text-on-surface-variant">
              Have suggestions, appreciation, or custom schema requirements? Send an email directly to the developer at <strong className="text-on-surface">{developerEmail}</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                onClick={handleOpenGmail}
                className="px-4 py-2 rounded-lg bg-secondary-container hover:bg-secondary-container/90 text-on-secondary-container font-label font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Compose in Gmail</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </button>

              <button
                onClick={handleCopyEmail}
                className="px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/50 text-on-surface font-label font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                title="Copy developer email address"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-on-surface-variant" />
                    <span>Copy Email</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Core System Features */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface font-label flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-secondary-container" />
              Core Autonomous Engines
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5">
                <div className="flex items-center gap-2 text-on-surface font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>4-Factor Mathematical Trust</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Deterministic confidence calculated across Evidence Exactness (35%), Schema Validity (25%), Source Agreement (20%), and LOV Matches (20%).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5">
                <div className="flex items-center gap-2 text-on-surface font-bold text-xs">
                  <FileSpreadsheet className="w-4 h-4 text-secondary-container" />
                  <span>252-Column Delivery Standard</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Exports static 252-column CSV and Excel sheets strictly formatted to official enterprise product catalog specifications.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5">
                <div className="flex items-center gap-2 text-on-surface font-bold text-xs">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Multi-Channel Descriptions</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Enforces strict character limits: <code className="text-secondary-container">INVOICE_DESC</code> (≤35 chars uppercase), <code className="text-secondary-container">MOBILE_DESC</code> (≤150 chars), and <code className="text-secondary-container">SHORT_DESC</code> (≤200 chars).
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 space-y-1.5">
                <div className="flex items-center gap-2 text-on-surface font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>Fraction & UOM Normalizer</span>
                </div>
                <p className="text-[11px] text-on-surface-variant">
                  Converts imperial decimals (<code className="text-on-surface">50.25 in</code> → <code className="text-emerald-400">50-1/4 in</code>) and standardizes SI units (<code className="text-on-surface">mm, W, V, dBA, Grit</code>).
                </p>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="p-3.5 rounded-xl bg-surface-container-high/40 border border-outline-variant/30 text-[11px] space-y-1">
            <span className="font-bold text-on-surface">💡 Quick Navigation Tips:</span>
            <ul className="list-disc list-inside space-y-0.5 text-on-surface-variant">
              <li>Type any page number directly into the pagination box to jump instantly across any number of pages.</li>
              <li>Click the <strong>Clear</strong> button in the top header anytime to wipe the database and start fresh.</li>
              <li>Toggle Motion Effects in the bottom sidebar anytime to switch between smooth animations and static mode.</li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant/40 bg-surface-container-low/80 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-on-surface-variant font-mono">Uni - Logger AI v1.0 • Enterprise Edition</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-container-highest hover:bg-outline-variant/50 text-on-surface font-label font-bold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
