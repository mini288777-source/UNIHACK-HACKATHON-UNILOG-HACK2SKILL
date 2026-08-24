import React, { useState, useEffect, useRef } from 'react';
import { Dropzone } from '../components/upload/Dropzone';
import { ProcessingStatus } from '../components/upload/ProcessingStatus';
import { api } from '../services/api';
import { OFFICIAL_UNIHACK_INPUT_CSV } from '../services/officialSampleData';
import { gsap } from 'gsap';
import { EvaluationResult } from '../types';
import {
  Award,
  CheckCircle2,
  ListFilter,
  Type,
  Zap,
  BookOpen,
  Check,
  FolderOpen,
  Table,
  FileText,
  Play,
  AlertCircle,
  RotateCw
} from 'lucide-react';

interface UploadPageProps {
  onUploadSuccess: () => void;
}

export const UploadPage: React.FC<UploadPageProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [enrichmentSummary, setEnrichmentSummary] = useState<string | null>(null);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [isRunningEval, setIsRunningEval] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const isReduced = typeof document !== 'undefined' && document.documentElement.classList.contains('motion-reduced');
      if (isReduced) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.animate-item',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
        );
      }, containerRef);

      return () => {
        try { ctx.revert(); } catch {}
      };
    } catch {}
  }, []);

  const handleFileSelect = async (file: File) => {
    setIsUploading(true);
    setErrorMessage(null);
    setEnrichmentSummary(null);

    const isCsvOrExcel = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx');

    try {
      if (isCsvOrExcel) {
        // Direct Catalog Stream Enrichment Pipeline
        const result = await api.enrichCsvDataset(file);
        setEnrichmentSummary(`Successfully enriched ${result.enriched_sku_count} product records across 252 static headers!`);
        setTimeout(() => {
          setIsUploading(false);
          onUploadSuccess();
        }, 1200);
      } else {
        // PDF Ingestion Job Pipeline
        const job = await api.uploadDocument(file);
        setCurrentJobId(job.id);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setIsUploading(false);
      setErrorMessage(err.response?.data?.detail || 'Failed to process document or catalog dataset.');
    }
  };

  const handleRunEvaluation = async () => {
    setIsRunningEval(true);
    try {
      const res = await api.getEvaluation();
      setEvalResult(res);
    } catch (err) {
      console.error('Evaluation benchmark failed:', err);
    } finally {
      setIsRunningEval(false);
    }
  };

  const handleProcessingComplete = () => {
    setIsUploading(false);
    onUploadSuccess();
  };

  const handleProcessingError = (err: string) => {
    setIsUploading(false);
    setErrorMessage(err);
  };

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto space-y-6 text-left">
      {/* Header Banner from Stitch Document Intelligence */}
      <div className="animate-item flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary-container/15 text-secondary-container border border-secondary-container/30 font-label">
              UniHack Product Intelligence
            </span>
            <span className="text-xs text-on-surface-variant font-mono">252 Static Header Delivery Format</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight font-headline">
            Document Ingestion & Catalog Processing
          </h2>
          <p className="text-on-surface-variant text-xs mt-0.5 font-body">
            Ingest raw CSV/Excel distributor catalogs or manufacturer PDF datasheets for dynamic AI entity enrichment & UOM normalization.
          </p>
        </div>

        <button
          onClick={handleRunEvaluation}
          disabled={isRunningEval}
          className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-secondary-container border border-secondary-container/30 hover:border-secondary-container transition-all duration-300 text-xs font-bold flex items-center gap-2 shadow-lg font-label uppercase tracking-wider cursor-pointer"
        >
          {isRunningEval ? (
            <RotateCw className="w-4 h-4 text-secondary-container animate-spin" />
          ) : (
            <Award className="w-4 h-4 text-secondary-container" />
          )}
          <span>{isRunningEval ? 'Benchmarking...' : 'Run Ground-Truth Benchmark'}</span>
        </button>
      </div>

      {/* Evaluation Results Banner & Metric Guide (Only displayed after benchmark is run) */}
      {evalResult && (
        <div className="animate-item p-4.5 rounded-2xl glass-panel text-on-surface shadow-xl border border-secondary-container/40">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-outline-variant/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-secondary-container/20 border border-secondary-container/40 text-secondary-container shrink-0 mt-0.5">
                <Award className="w-6 h-6 text-secondary-container" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm font-headline flex items-center gap-2">
                    Ground-Truth Benchmark Results
                    <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-highest px-2 py-0.5 rounded border border-outline-variant/30">
                      {evalResult.total_benchmark_rows || 0} Labeled Rows Evaluated
                    </span>
                  </h4>
                  <button
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-[11px] font-bold text-secondary-container hover:text-secondary-fixed flex items-center gap-1 bg-secondary-container/10 px-2.5 py-1 rounded-lg border border-secondary-container/30 hover:border-secondary-container transition-all"
                    title="Toggle metric explanation guide"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-secondary-container" />
                    <span>{showGuide ? 'Hide Guide' : 'What do these mean?'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-on-surface-variant mt-1 font-body leading-relaxed max-w-2xl">
                  <strong className="text-secondary-container font-semibold">What is this?</strong> Automated quality & compliance audit comparing AI-enriched output against the official UniHack Ground-Truth gold-standard baseline.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
              <div className="group relative cursor-help px-2.5 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-emerald-500/50 transition-all">
                <span className="text-emerald-400 font-bold">Accuracy: {evalResult.overall_accuracy_pct ?? 0}%</span>
                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2.5 bg-surface-container-highest text-[11px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                  <p className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Overall Field Accuracy
                  </p>
                  <p className="text-on-surface-variant text-[10px] leading-normal">
                    Percentage of extracted product attributes (e.g. Part Desc, Brand, SKU, Dimensions) that exactly match the ground-truth target values.
                  </p>
                </div>
              </div>

              <div className="group relative cursor-help px-2.5 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-secondary-container/50 transition-all">
                <span className="text-secondary-container font-bold">LOV Match: {evalResult.lov_compliance_pct ?? 0}%</span>
                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2.5 bg-surface-container-highest text-[11px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                  <p className="font-bold text-secondary-container mb-1 flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5 text-secondary-container" />
                    List of Values (LOV) Compliance
                  </p>
                  <p className="text-on-surface-variant text-[10px] leading-normal">
                    Percentage of normalized attributes adhering to allowed taxonomies, standardized options, and valid Units of Measure (e.g., in, cm, lbs).
                  </p>
                </div>
              </div>

              <div className="group relative cursor-help px-2.5 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-blue-400/50 transition-all">
                <span className="text-blue-400 font-bold">Char Limit: {evalResult.character_limit_compliance_pct ?? 0}%</span>
                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2.5 bg-surface-container-highest text-[11px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                  <p className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-blue-400" />
                    Character Limit Compliance
                  </p>
                  <p className="text-on-surface-variant text-[10px] leading-normal">
                    Ensures text fields satisfy distributor length constraints (e.g., Short Desc ≤ 80 chars, Invoice Desc ≤ 40 chars) to avoid export truncation.
                  </p>
                </div>
              </div>

              <div className="group relative cursor-help px-2.5 py-1.5 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-purple-400/50 transition-all">
                <span className="text-purple-400 font-bold">Speed: {evalResult.throughput_rows_per_sec ?? 0} rows/sec</span>
                <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2.5 bg-surface-container-highest text-[11px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                  <p className="font-bold text-purple-400 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    AI Processing Throughput
                  </p>
                  <p className="text-on-surface-variant text-[10px] leading-normal">
                    Performance rate measuring how many product records the AI extraction & enrichment engine processes per second.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Explanation Note / Metric Guide */}
          {showGuide && (
            <div className="mt-3 p-3.5 rounded-xl bg-surface-container-lowest/80 border border-outline-variant/30 text-xs font-body animate-fadeIn">
              <h5 className="font-bold text-on-surface text-xs mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-secondary-container" />
                Metric Explanation & Benchmark Guide
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-emerald-500/20">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Accuracy ({evalResult.overall_accuracy_pct ?? 0}%)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Extraction Correctness:</strong> Measures what percentage of extracted attributes (Part #, Brand, Specs) match the ground-truth standard.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-secondary-container/20">
                  <div className="font-bold text-secondary-container mb-1 flex items-center gap-1">
                    <ListFilter className="w-3.5 h-3.5 text-secondary-container" />
                    LOV Match ({evalResult.lov_compliance_pct ?? 0}%)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Taxonomy & UOM Compliance:</strong> Verifies values conform to permitted lists (LOVs), standardized units (in, cm, lbs), and catalog schema.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-blue-400/20">
                  <div className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                    <Type className="w-3.5 h-3.5 text-blue-400" />
                    Char Limit ({evalResult.character_limit_compliance_pct ?? 0}%)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Length Constraint Check:</strong> Confirms descriptions meet character maximums (e.g. Short Desc ≤80 chars) to prevent ERP cut-offs.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-purple-400/20">
                  <div className="font-bold text-purple-400 mb-1 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    Speed ({evalResult.throughput_rows_per_sec ?? 0} rows/sec)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>AI Throughput Rate:</strong> Indicates how many product catalog rows are parsed, enriched, and validated every second.
                  </p>
                </div>
              </div>
            </div>
          )}

          {evalResult.field_level_accuracies && Object.keys(evalResult.field_level_accuracies).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-3 text-[11px]">
              {Object.entries(evalResult.field_level_accuracies).slice(0, 5).map(([field, score]) => (
                <div key={field} className="p-2 rounded-lg bg-surface-container-lowest/60 border border-outline-variant/20 flex justify-between">
                  <span className="text-on-surface-variant truncate font-label">{field}</span>
                  <span className="font-bold text-emerald-400 font-mono">{score}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Ingestion Dropzone & Processing State */}
      <div className="animate-item glass-panel rounded-2xl p-6 shadow-xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label mb-3">
          Multi-Modal Upload Console
        </h3>

        {isUploading && currentJobId ? (
          <ProcessingStatus
            jobId={currentJobId}
            onComplete={handleProcessingComplete}
            onError={handleProcessingError}
          />
        ) : (
          <Dropzone onFileSelect={handleFileSelect} isUploading={isUploading} />
        )}

        {enrichmentSummary && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{enrichmentSummary}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Quick-Load Sample Dataset Cards */}
      <div className="animate-item space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-secondary-container" />
            Supported Feed Formats & Benchmark Datasets
          </h3>
          <span className="text-[10px] text-on-surface-variant font-mono">Click card to test feed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={async () => {
              let content = OFFICIAL_UNIHACK_INPUT_CSV;
              try {
                const res = await fetch('/Unihack_Sample_Dataset_Input.csv');
                if (res.ok) {
                  const txt = await res.text();
                  if (txt && txt.length > 5000) content = txt;
                }
              } catch {}
              const blob = new Blob([content], { type: 'text/csv' });
              const sampleFile = new File([blob], 'Unihack_Sample_Dataset_Input.csv', { type: 'text/csv' });
              handleFileSelect(sampleFile);
            }}
            className="glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-secondary-container/60 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="p-2.5 rounded-lg bg-primary-container/20 text-secondary-container border border-secondary-container/30 shrink-0 group-hover:scale-105 transition-transform">
              <Table className="w-6 h-6 text-secondary-container" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-on-surface font-headline group-hover:text-secondary-container transition-colors">Unihack_ Sample Dataset - Input.csv</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">1,000 SKUs</span>
                </div>
                <span className="text-[10px] font-bold text-secondary-container opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Run <Play className="w-3 h-3 text-secondary-container fill-secondary-container" />
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Multi-domain raw industrial feed across 76 manufacturers (Appliances, Abrasives, Decking, Fasteners, Tools). Enriches dynamically into 252 static headers.
              </p>
            </div>
          </div>

          <div 
            onClick={async () => {
              const sampleFastenerContent = `Mfg_Part_Num,Part_Desc,Brand_Name,Category,Raw_UOM,Price
DIN933-M8-30,Hexagon Head Cap Screw M8x30mm Full Thread Stainless Steel A2-70,FASTENCO,Fasteners,8mm x 30mm,12.50
ISO4017-M10-40,ISO 4017 Hexagon Head Bolt M10 x 40mm Grade 8.8 Zinc Plated,BOLTMASTER,Fasteners,10mm x 40mm,8.75
DIN912-M6-25,Socket Head Cap Screw M6 x 25mm 12.9 High Tensile Steel,HEXFAST,Fasteners,6mm x 25mm,14.20`;
              const blob = new Blob([sampleFastenerContent], { type: 'text/csv' });
              const sampleFile = new File([blob], 'Fastener_DIN933_Spec.csv', { type: 'text/csv' });
              handleFileSelect(sampleFile);
            }}
            className="glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-blue-400/60 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-on-surface font-headline group-hover:text-blue-300 transition-colors">Fastener_DIN933_Spec.pdf</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Technical Spec</span>
                </div>
                <span className="text-[10px] font-bold text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Run <Play className="w-3 h-3 text-blue-300 fill-blue-300" />
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Engineering drawing and dimension datasheet. Extracts pitch, thread diameter, material grade, and attaches verbatim page quotes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
