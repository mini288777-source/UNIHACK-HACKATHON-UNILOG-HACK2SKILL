import React, { useEffect, useRef } from 'react';
import { ProductAttribute } from '../../types';
import { TrustBadge, KnowledgeBadge, ConfidenceBar } from './TrustBadge';
import { gsap } from 'gsap';

interface EvidenceDrawerProps {
  attribute: ProductAttribute | null;
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({ attribute, onClose }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!attribute) return;
    const isReduced = document.documentElement.classList.contains('motion-reduced');
    
    if (isReduced) {
      gsap.set(overlayRef.current, { opacity: 1 });
      gsap.set(panelRef.current, { x: '0%' });
      return;
    }

    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    gsap.fromTo(panelRef.current, { x: '100%' }, { x: '0%', duration: 0.35, ease: 'power3.out' });
  }, [attribute]);

  const handleClose = () => {
    const isReduced = document.documentElement.classList.contains('motion-reduced');
    if (isReduced) {
      onClose();
      return;
    }

    gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, ease: 'power2.in' });
    gsap.to(panelRef.current, {
      x: '100%',
      duration: 0.25,
      ease: 'power3.in',
      onComplete: onClose
    });
  };

  if (!attribute) return null;

  const breakdown = attribute.evidence?.confidence_breakdown;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        ref={overlayRef} 
        className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-md" 
        onClick={handleClose} 
      />

      {/* Slide-over Panel from Stitch Workspace */}
      <div 
        ref={panelRef} 
        className="relative z-50 w-full max-w-md h-full bg-surface-container-low border-l border-outline-variant/30 shadow-2xl flex flex-col justify-between overflow-y-auto text-left"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-secondary-container tracking-widest font-label">Evidence Provenance</p>
              <h3 className="text-lg font-bold text-on-surface mt-0.5 font-headline">{attribute.name}</h3>
            </div>
            <button 
              onClick={handleClose} 
              className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Attribute Values Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 shadow-inner">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 font-label">Normalized Value</p>
              <p className="text-xs font-bold text-on-surface leading-normal">
                {attribute.normalized_value || attribute.raw_value}
                {attribute.unit && <span className="ml-1 text-secondary-container font-mono">{attribute.unit}</span>}
              </p>
            </div>
            <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 shadow-inner">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant mb-1 font-label">Raw Catalog String</p>
              <p className="text-xs font-mono text-on-surface-variant truncate">{attribute.raw_value || '—'}</p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <TrustBadge status={attribute.trust_status} />
            <KnowledgeBadge type={attribute.knowledge_type} />
          </div>

          {/* Verbatim Source Quote Citation */}
          {attribute.evidence?.text_quote ? (
            <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-2.5 shadow-md">
              <p className="text-[10px] uppercase font-bold text-secondary-container tracking-widest flex items-center gap-1.5 font-label">
                <span className="material-symbols-outlined text-[16px] text-secondary-container">format_quote</span>
                <span>Source Text Quote Citation</span>
              </p>
              <blockquote className="text-xs text-on-surface italic leading-relaxed border-l-2 border-primary-container pl-3">
                "{attribute.evidence.text_quote}"
              </blockquote>
              {attribute.evidence.page_number && (
                <div className="flex items-center gap-1.5 text-[10px] text-on-surface-variant pt-1 font-mono">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span>Document Reference: <strong className="text-on-surface font-semibold">Page {attribute.evidence.page_number}</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 text-center text-on-surface-variant text-xs py-6">
              No verbatim text quote linked.
            </div>
          )}

          {/* 4-Factor Confidence Breakdown from Stitch Engine */}
          {breakdown && (
            <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/30 space-y-4 shadow-md">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-widest font-label">4-Factor Trust Breakdown</p>
              <div className="space-y-3">
                {[
                  { label: 'Evidence Exactness', key: 'evidence_exactness', weight: '35%' },
                  { label: 'Schema Validity', key: 'schema_validity', weight: '25%' },
                  { label: 'Source Agreement', key: 'source_agreement', weight: '20%' },
                  { label: 'Known Value Match', key: 'known_value_match', weight: '20%' }
                ].map(({ label, key, weight }) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-on-surface-variant font-label">{label}</span>
                      <span className="text-[9px] text-on-surface-variant font-mono">weight: {weight}</span>
                    </div>
                    <ConfidenceBar value={(breakdown as any)[key] ?? 0} />
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="text-xs font-bold text-on-surface font-headline">Overall Confidence</span>
                <span className="text-sm font-bold text-secondary-container font-mono">{Math.round(attribute.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-outline-variant/30 bg-surface-container-lowest/60">
          <button 
            onClick={handleClose} 
            className="w-full py-2.5 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary rounded-xl text-xs font-bold font-label uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(254,170,0,0.25)]"
          >
            Acknowledge Proof
          </button>
        </div>
      </div>
    </div>
  );
};
