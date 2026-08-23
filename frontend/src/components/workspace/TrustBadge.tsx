import React from 'react';
import { TrustStatus, KnowledgeType } from '../../types';
import { CheckCircle2, ShieldCheck, AlertTriangle, AlertCircle, HelpCircle, BookOpen, Sliders, Layers, Sparkles } from 'lucide-react';

export const TrustBadge: React.FC<{ status: TrustStatus }> = ({ status }) => {
  switch (status) {
    case 'VERIFIED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border text-emerald-400 bg-emerald-500/10 border-emerald-500/30 glow-ring-emerald font-label uppercase tracking-wider">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>VERIFIED</span>
        </span>
      );
    case 'HIGH_CONFIDENCE':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border text-secondary-container bg-secondary-container/10 border-secondary-container/30 glow-ring-orange font-label uppercase tracking-wider">
          <ShieldCheck className="w-3 h-3 text-secondary-container shrink-0" />
          <span>HIGH CONFIDENCE</span>
        </span>
      );
    case 'NEEDS_REVIEW':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border text-secondary-container bg-secondary-container/10 border-secondary-container/30 glow-ring-orange font-label uppercase tracking-wider">
          <AlertTriangle className="w-3 h-3 text-secondary-container shrink-0" />
          <span>NEEDS REVIEW</span>
        </span>
      );
    case 'CONFLICT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border text-error bg-error-container/20 border-error/30 glow-ring-rose font-label uppercase tracking-wider">
          <AlertCircle className="w-3 h-3 text-error shrink-0" />
          <span>CONFLICT</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border text-on-surface-variant bg-surface-container-high/40 border-outline-variant/30 font-label uppercase tracking-wider">
          <HelpCircle className="w-3 h-3 text-on-surface-variant shrink-0" />
          <span>UNKNOWN</span>
        </span>
      );
  }
};

export const KnowledgeBadge: React.FC<{ type: KnowledgeType }> = ({ type }) => {
  switch (type) {
    case 'EXPLICIT_FACT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-outline-variant/30 bg-secondary-container/10 text-secondary-container font-label">
          <BookOpen className="w-3 h-3 text-secondary-container shrink-0" />
          <span>Explicit Fact</span>
        </span>
      );
    case 'NORMALIZED_FACT':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-outline-variant/30 bg-tertiary/10 text-tertiary font-label">
          <Sliders className="w-3 h-3 text-tertiary shrink-0" />
          <span>Normalized Fact</span>
        </span>
      );
    case 'DERIVED_INFO':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-outline-variant/30 bg-primary-fixed/10 text-primary-fixed font-label">
          <Layers className="w-3 h-3 text-primary-fixed shrink-0" />
          <span>Derived Spec</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-outline-variant/30 bg-error/10 text-error font-label">
          <Sparkles className="w-3 h-3 text-error shrink-0" />
          <span>AI Inferred</span>
        </span>
      );
  }
};

export const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 90 
    ? 'bg-gradient-to-r from-secondary-container to-emerald-400' 
    : pct >= 75 
    ? 'bg-gradient-to-r from-primary-container to-secondary-container' 
    : 'bg-gradient-to-r from-primary-container to-error';

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-surface-container-lowest rounded-full h-1.5 overflow-hidden border border-outline-variant/30 relative">
        <div 
          className={`${color} h-full rounded-full transition-all duration-1000 ease-out`} 
          style={{ width: `${pct}%` }} 
        />
      </div>
      <span className="text-[10px] font-mono font-bold text-on-surface tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
};
