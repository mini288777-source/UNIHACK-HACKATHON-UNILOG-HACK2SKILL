import React, { useState, useEffect, useRef } from 'react';
import { ProductAttribute, TrustStatus, KnowledgeType } from '../../types';
import { api } from '../../services/api';
import { TrustBadge, KnowledgeBadge } from './TrustBadge';
import { gsap } from 'gsap';

interface AttributeEditModalProps {
  attribute: ProductAttribute;
  productId: string;
  onClose: () => void;
  onSaved: (updated: ProductAttribute) => void;
}

const TRUST_OPTIONS: TrustStatus[] = ['VERIFIED', 'HIGH_CONFIDENCE', 'NEEDS_REVIEW', 'CONFLICT', 'UNKNOWN'];
const KNOWLEDGE_OPTIONS: KnowledgeType[] = ['EXPLICIT_FACT', 'NORMALIZED_FACT', 'DERIVED_INFO', 'INFERRED_INFO'];

export const AttributeEditModal: React.FC<AttributeEditModalProps> = ({
  attribute, productId, onClose, onSaved
}) => {
  const [normalizedValue, setNormalizedValue] = useState(attribute.normalized_value || attribute.raw_value || '');
  const [trustStatus, setTrustStatus] = useState<TrustStatus>(attribute.trust_status);
  const [knowledgeType, setKnowledgeType] = useState<KnowledgeType>(attribute.knowledge_type);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReduced = document.documentElement.classList.contains('motion-reduced');
    if (isReduced) return;

    gsap.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: 'power2.out' });
    gsap.fromTo(modalRef.current, 
      { scale: 0.95, opacity: 0, y: 15 }, 
      { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(1.2)' }
    );
  }, []);

  const handleClose = () => {
    const isReduced = document.documentElement.classList.contains('motion-reduced');
    if (isReduced) {
      onClose();
      return;
    }

    gsap.to(overlayRef.current, { opacity: 0, duration: 0.15, ease: 'power2.in' });
    gsap.to(modalRef.current, {
      scale: 0.95,
      opacity: 0,
      y: 15,
      duration: 0.15,
      ease: 'power2.in',
      onComplete: onClose
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.updateAttribute(productId, attribute.id, {
        normalized_value: normalizedValue,
        trust_status: trustStatus,
        knowledge_type: knowledgeType
      });
      setSavedSuccess(true);
      setTimeout(() => {
        onSaved(updated);
        handleClose();
      }, 700);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save attribute.');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    normalizedValue !== (attribute.normalized_value || attribute.raw_value || '') ||
    trustStatus !== attribute.trust_status ||
    knowledgeType !== attribute.knowledge_type;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        ref={overlayRef} 
        className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-md" 
        onClick={handleClose} 
      />

      {/* Modal Container */}
      <div 
        ref={modalRef} 
        className="relative z-50 w-full max-w-lg bg-surface-container-low rounded-2xl shadow-2xl overflow-hidden border border-outline-variant/40"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest/70">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary-container/20 border border-secondary-container/30 flex items-center justify-center text-secondary-container">
              <span className="material-symbols-outlined text-[18px]">edit_note</span>
            </div>
            <div className="text-left">
              <p className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider font-label">Auditable Spec Override</p>
              <h3 className="text-sm font-bold text-on-surface font-headline">{attribute.name}</h3>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-lg hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-left">
          {/* Details */}
          <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant flex gap-4 shadow-inner">
            <div className="flex-1">
              <p className="font-bold text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">Original Raw Value</p>
              <p className="font-mono text-on-surface truncate">{attribute.raw_value || '—'}</p>
            </div>
            <div className="w-px bg-outline-variant/30" />
            <div className="flex-1">
              <p className="font-bold text-[9px] uppercase tracking-widest text-on-surface-variant mb-1 font-label">Current Trust Status</p>
              <div className="mt-0.5">
                <TrustBadge status={attribute.trust_status} />
              </div>
            </div>
          </div>

          {/* Value Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">
              Normalized Specification Value
            </label>
            <input
              type="text"
              value={normalizedValue}
              onChange={e => setNormalizedValue(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant/40 focus:border-secondary-container rounded-xl px-4 py-2.5 text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none transition-all"
              placeholder="Enter corrected value..."
            />
          </div>

          {/* Trust Options */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">
              Trust Status Override
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRUST_OPTIONS.map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setTrustStatus(status)}
                  className={`py-2 px-3 rounded-lg border text-[10px] font-bold font-label uppercase tracking-wider transition-all ${
                    trustStatus === status
                      ? 'bg-secondary-container/20 border-secondary-container text-secondary-container shadow-sm'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Knowledge Options */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-label">
              Knowledge Classification
            </label>
            <div className="grid grid-cols-2 gap-2">
              {KNOWLEDGE_OPTIONS.map(ktype => (
                <button
                  key={ktype}
                  type="button"
                  onClick={() => setKnowledgeType(ktype)}
                  className={`py-2 px-3 rounded-lg border text-[10px] font-bold transition-all ${
                    knowledgeType === ktype
                      ? 'bg-secondary-container/20 border-secondary-container text-secondary-container shadow-sm'
                      : 'bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  <KnowledgeBadge type={ktype} />
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-outline-variant/30 bg-surface-container-lowest/70">
          <p className="text-[10px] text-on-surface-variant font-mono">
            {hasChanges ? '⚠ Unsaved changes' : 'No changes'}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors font-label uppercase"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold font-label uppercase tracking-wider transition-all shadow-md ${
                savedSuccess
                  ? 'bg-emerald-600 text-white'
                  : hasChanges
                  ? 'bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                  : 'bg-surface-container text-on-surface-variant/40 border border-outline-variant/20 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {savedSuccess ? 'check' : isSaving ? 'sync' : 'save'}
              </span>
              <span>{isSaving ? 'Saving...' : savedSuccess ? 'Saved' : 'Save Override'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
