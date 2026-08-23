import React from 'react';
import { TrustStatus, KnowledgeType } from '../../types';

const TRUST_CONFIG: Record<TrustStatus, { label: string; color: string; bg: string; border: string; glowClass: string; icon: string }> = {
  VERIFIED: {
    label: 'VERIFIED',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    glowClass: 'glow-ring-emerald',
    icon: 'check_circle'
  },
  HIGH_CONFIDENCE: {
    label: 'HIGH CONFIDENCE',
    color: 'text-secondary-container',
    bg: 'bg-secondary-container/10',
    border: 'border-secondary-container/30',
    glowClass: 'glow-ring-orange',
    icon: 'verified_user'
  },
  NEEDS_REVIEW: {
    label: 'NEEDS REVIEW',
    color: 'text-secondary-container',
    bg: 'bg-secondary-container/10',
    border: 'border-secondary-container/30',
    glowClass: 'glow-ring-orange',
    icon: 'warning'
  },
  CONFLICT: {
    label: 'CONFLICT',
    color: 'text-error',
    bg: 'bg-error-container/20',
    border: 'border-error/30',
    glowClass: 'glow-ring-rose',
    icon: 'error'
  },
  UNKNOWN: {
    label: 'UNKNOWN',
    color: 'text-on-surface-variant',
    bg: 'bg-surface-container-high/40',
    border: 'border-outline-variant/30',
    glowClass: '',
    icon: 'help'
  }
};

const KNOWLEDGE_CONFIG: Record<KnowledgeType, { label: string; icon: string; color: string; bg: string }> = {
  EXPLICIT_FACT: { label: 'Explicit Fact', icon: 'menu_book', color: 'text-secondary-container', bg: 'bg-secondary-container/10' },
  NORMALIZED_FACT: { label: 'Normalized Fact', icon: 'tune', color: 'text-tertiary', bg: 'bg-tertiary/10' },
  DERIVED_INFO: { label: 'Derived Spec', icon: 'schema', color: 'text-primary-fixed', bg: 'bg-primary-fixed/10' },
  INFERRED_INFO: { label: 'AI Inferred', icon: 'psychology', color: 'text-error', bg: 'bg-error/10' }
};

export const TrustBadge: React.FC<{ status: TrustStatus }> = ({ status }) => {
  const cfg = TRUST_CONFIG[status] || TRUST_CONFIG.UNKNOWN;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border} ${cfg.glowClass} font-label uppercase tracking-wider`}>
      <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
};

export const KnowledgeBadge: React.FC<{ type: KnowledgeType }> = ({ type }) => {
  const cfg = KNOWLEDGE_CONFIG[type] || KNOWLEDGE_CONFIG.EXPLICIT_FACT;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border border-outline-variant/30 ${cfg.bg} ${cfg.color} font-label`}>
      <span className="material-symbols-outlined text-[13px]">{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
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
