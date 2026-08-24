import React, { useState, useEffect, useRef } from 'react';
import { Product, ProductAttribute } from '../../types';
import { TrustBadge, KnowledgeBadge, ConfidenceBar } from './TrustBadge';
import { EvidenceDrawer } from './EvidenceDrawer';
import { AttributeEditModal } from './AttributeEditModal';
import { api } from '../../services/api';
import { gsap } from 'gsap';
import {
  ArrowLeft,
  CheckCircle2,
  Table,
  FileSpreadsheet,
  Download,
  Search,
  Quote,
  Edit3,
  Check
} from 'lucide-react';

interface ProductWorkspaceProps {
  product: Product;
  onBack?: () => void;
  onProductUpdated?: (updatedProduct: Product) => void;
}

export const ProductWorkspace: React.FC<ProductWorkspaceProps> = ({
  product: initialProduct,
  onBack,
  onProductUpdated,
}) => {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [selectedAttr, setSelectedAttr] = useState<ProductAttribute | null>(null);
  const [editingAttr, setEditingAttr] = useState<ProductAttribute | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'attributes' | 'delivery_format'>('attributes');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProduct(initialProduct);
  }, [initialProduct]);

  useEffect(() => {
    try {
      const isReduced = typeof document !== 'undefined' && document.documentElement.classList.contains('motion-reduced');
      if (isReduced) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.animate-table-row',
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out' }
        );
      });

      return () => {
        try { ctx.revert(); } catch {}
      };
    } catch {}
  }, [activeView, product]);

  const handleAttributeSaved = (updated: ProductAttribute) => {
    const nextAttrs = product.attributes.map(a => a.id === updated.id ? updated : a);
    const updatedProd = { ...product, attributes: nextAttrs };
    setProduct(updatedProd);
    if (onProductUpdated) onProductUpdated(updatedProd);
  };

  const handleExportProduct = (format: 'json' | 'csv' | 'delivery_format_csv' | 'xlsx') => {
    api.exportSingleProductDirect(product, format === 'delivery_format_csv' ? 'csv' : format);
    setDownloadSuccess(`Product exported in ${format.toUpperCase()} format!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleExportFullCatalog = (format: 'csv' | 'xlsx') => {
    api.exportCatalogDirect(format);
    setDownloadSuccess(`Catalog exported in 252-Column ${format.toUpperCase()} format!`);
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const verifiedCount = product.attributes.filter(a => a.trust_status === 'VERIFIED').length;
  const reviewCount = product.attributes.filter(a => a.trust_status === 'NEEDS_REVIEW').length;
  const conflictCount = (product.conflicts || []).length;

  const filteredAttrs = product.attributes.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.normalized_value && a.normalized_value.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 text-left max-w-7xl mx-auto">
      {downloadSuccess && (
        <div className="fixed top-20 right-6 z-[100] bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-bold font-label animate-fade-in flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{downloadSuccess}</span>
        </div>
      )}

      {/* Top Product Card: 3 Cols Info + 1 Col Radial Health Gauge */}
      <section ref={headerRef} className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 glass-panel rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between border border-outline-variant/30">
          <div className="space-y-3">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-secondary-container transition-colors text-xs font-bold uppercase tracking-wider mb-1 font-label cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Catalog</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-surface-container-lowest text-secondary-container border border-outline-variant/40 font-mono text-[10px] uppercase tracking-wider font-bold">
                MPN: {product.sku || 'SKU-PENDING'}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-secondary-container/15 text-secondary-container border border-secondary-container/30 text-[10px] uppercase tracking-wider font-bold font-label">
                {product.category || 'Industrial Hardware'}
              </span>
              <span className="px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 font-label">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Provenance Backed</span>
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-on-surface leading-tight tracking-tight font-headline">
              {product.name}
            </h1>

            <p className="text-on-surface-variant text-xs leading-relaxed max-w-xl font-body">
              {product.manufacturer ? `Canonical Manufacturer: ${product.manufacturer} • ` : ''}
              Enriched across 252 static columns conforming to Unilog internal content standards with verbatim text evidence quotes.
            </p>

            {/* Metric Pills */}
            <div className="flex flex-wrap gap-2.5 pt-2">
              <div className="flex items-center gap-2 bg-surface-container rounded-full px-3.5 py-1 border border-outline-variant/30 font-label">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></span>
                <span className="text-xs font-semibold text-on-surface">{verifiedCount} Verified</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container rounded-full px-3.5 py-1 border border-outline-variant/30 font-label">
                <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#feaa00]"></span>
                <span className="text-xs font-semibold text-on-surface">{reviewCount} Needs Review</span>
              </div>
              <div className="flex items-center gap-2 bg-surface-container rounded-full px-3.5 py-1 border border-error/30 font-label">
                <span className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#dd2e18]"></span>
                <span className="text-xs font-semibold text-error">{conflictCount} Conflicts</span>
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 relative z-10 mt-6 pt-4 border-t border-outline-variant/30">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveView('attributes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-label uppercase tracking-wider transition-all cursor-pointer ${
                  activeView === 'attributes'
                    ? 'bg-secondary-container text-on-secondary-container shadow-md'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Extracted Attributes
              </button>
              <button
                onClick={() => setActiveView('delivery_format')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold font-label uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'delivery_format'
                    ? 'bg-secondary-container text-on-secondary-container shadow-md'
                    : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Table className="w-4 h-4" />
                <span>252-Column Unilog Spec</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExportProduct('json')}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-outline-variant/30 font-label uppercase cursor-pointer"
                title="Download this product as PIM-compatible JSON"
              >
                <span>JSON</span>
              </button>
              <button
                onClick={() => handleExportFullCatalog('xlsx')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md font-label uppercase cursor-pointer"
                title="Download 252-column XLSX workbook"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export XLSX</span>
              </button>
              <button
                onClick={() => handleExportFullCatalog('csv')}
                className="bg-surface-container hover:bg-surface-container-high text-on-surface font-bold px-3.5 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1.5 border border-outline-variant/30 font-label uppercase cursor-pointer"
                title="Download 252-column CSV file"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Radial Gauge Card */}
        <div className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-outline-variant/30 text-center">
          <div className="relative w-36 h-36 flex items-center justify-center mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-outline-variant/30"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                className="stroke-secondary-container health-ring"
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 40}
                strokeDashoffset={2 * Math.PI * 40 - (product.health_score / 100) * (2 * Math.PI * 40)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-on-surface font-headline">{product.health_score}%</span>
              <span className="text-[9px] text-on-surface-variant uppercase tracking-widest font-bold font-mono">Health Score</span>
            </div>
          </div>

          <div className="px-3 py-1 rounded bg-secondary-container/15 border border-secondary-container/30 text-secondary-container text-xs font-bold uppercase tracking-wider font-label">
            {product.health_score >= 85 ? 'HIGH TRUST VERIFIED' : product.health_score >= 65 ? 'MODERATE TRUST SCORE' : 'REQUIRES HUMAN AUDIT'}
          </div>
        </div>
      </section>

      {/* Main Content Area: Attributes View vs 252-Column Delivery Format Preview */}
      {activeView === 'attributes' ? (
        <div className="glass-panel rounded-2xl shadow-xl overflow-hidden border border-outline-variant/30">
          <div className="p-4 border-b border-outline-variant/30 flex items-center justify-between gap-3 flex-wrap bg-surface-container-lowest/70">
            <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider font-label">
              Extracted Product Intelligence Specifications
            </h3>
            <div className="relative">
              <Search className="text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" />
              <input
                type="text"
                placeholder="Search specifications..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-surface-container border border-outline-variant/40 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-secondary-container w-48 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30 bg-surface-container-lowest/90 font-label font-bold">
                  <th className="px-4 py-3 font-bold w-44">Attribute</th>
                  <th className="px-4 py-3 font-bold">Normalized Value</th>
                  <th className="px-4 py-3 font-bold w-32">Knowledge</th>
                  <th className="px-4 py-3 font-bold w-36">Trust Status</th>
                  <th className="px-4 py-3 font-bold w-44">Confidence</th>
                  <th className="px-4 py-3 font-bold w-20">Evidence</th>
                  <th className="px-4 py-3 font-bold w-12 text-right">Edit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {filteredAttrs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-on-surface-variant text-xs">
                      {searchQuery ? `No attributes match "${searchQuery}"` : 'No attributes found for this product.'}
                    </td>
                  </tr>
                ) : (
                  filteredAttrs.map((attr) => (
                    <tr
                      key={attr.id}
                      className="animate-table-row hover:bg-surface-container-high/40 transition-colors duration-150 group"
                    >
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-on-surface font-headline">{attr.name}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>
                          <span className="text-on-surface font-bold">{attr.normalized_value || attr.raw_value || '—'}</span>
                          {attr.unit && <span className="ml-1 text-secondary-container font-mono font-bold">{attr.unit}</span>}
                          {attr.raw_value && attr.normalized_value && attr.raw_value !== attr.normalized_value && (
                            <span className="text-[9px] text-on-surface-variant font-mono bg-surface-container px-1.5 py-0.5 rounded ml-2 border border-outline-variant/20">
                              Raw: {attr.raw_value}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <KnowledgeBadge type={attr.knowledge_type} />
                      </td>
                      <td className="px-4 py-2.5">
                        <TrustBadge status={attr.trust_status} />
                      </td>
                      <td className="px-4 py-2.5">
                        <ConfidenceBar value={attr.confidence} />
                      </td>
                      <td className="px-4 py-2.5">
                        {attr.evidence ? (
                          <button
                            type="button"
                            onClick={() => setSelectedAttr(attr)}
                            className="inline-flex items-center gap-1 text-secondary-container hover:text-secondary-fixed-dim font-bold text-xs font-label uppercase cursor-pointer"
                          >
                            <Quote className="w-3.5 h-3.5" />
                            <span>Quote</span>
                          </button>
                        ) : (
                          <span className="text-on-surface-variant/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => setEditingAttr(attr)}
                          className="p-1 rounded-md bg-surface-container text-on-surface-variant hover:text-secondary-container hover:bg-surface-container-high transition-colors cursor-pointer"
                          title="Override attribute"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* 252-Column Unilog Delivery Format Spec Viewer */
        <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-6 border border-outline-variant/30">
          <div className="border-b border-outline-variant/30 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-on-surface font-headline flex items-center gap-2">
                <Table className="w-5 h-5 text-emerald-400" />
                <span>252-Column Unilog Delivery Record Preview</span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5 font-body">
                Exact schema mapping conforming to <code className="text-secondary-container font-mono">Unihack_ Expected Output - Delivery Format.csv</code>
              </p>
            </div>
            <span className="px-3 py-1 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold">
              252 / 252 Headers Populated
            </span>
          </div>

          {/* Key Multi-Channel Descriptions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-secondary-container uppercase font-mono tracking-wider">INVOICE_DESC</span>
                <span className="text-[10px] text-emerald-400 font-mono">Max 35 Chars</span>
              </div>
              <p className="font-mono text-sm font-bold text-on-surface tracking-wide bg-surface-container-lowest p-2 rounded border border-outline-variant/20">
                {product.name.toUpperCase().slice(0, 35)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-blue-400 uppercase font-mono tracking-wider">MOBILE_DESC</span>
                <span className="text-[10px] text-on-surface-variant font-mono">Max 150 Chars</span>
              </div>
              <p className="text-xs text-on-surface bg-surface-container-lowest p-2 rounded border border-outline-variant/20">
                {product.manufacturer ? `${product.manufacturer}, ` : ''}{product.name}
              </p>
            </div>

            <div className="md:col-span-2 p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-tertiary uppercase font-mono tracking-wider">SHORT_DESC (Title Formula)</span>
                <span className="text-[10px] text-on-surface-variant font-mono">Max 200 Chars</span>
              </div>
              <p className="text-xs text-on-surface bg-surface-container-lowest p-2.5 rounded border border-outline-variant/20 leading-relaxed font-body">
                {product.manufacturer ? `${product.manufacturer}® ` : ''}{product.sku} {product.name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Modals */}
      {selectedAttr && (
        <EvidenceDrawer
          onClose={() => setSelectedAttr(null)}
          attribute={selectedAttr}
        />
      )}

      {editingAttr && (
        <AttributeEditModal
          onClose={() => setEditingAttr(null)}
          attribute={editingAttr}
          productId={product.id}
          onSaved={handleAttributeSaved}
        />
      )}
    </div>
  );
};
