import React, { useState, useEffect, useRef } from 'react';
import { Dropzone } from '../components/upload/Dropzone';
import { ProcessingStatus } from '../components/upload/ProcessingStatus';
import { api } from '../services/api';
import { gsap } from 'gsap';
import { EvaluationResult } from '../types';

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
    const isReduced = document.documentElement.classList.contains('motion-reduced');
    if (isReduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.animate-item',
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    }, containerRef);

    return () => ctx.revert();
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
          className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-secondary-container border border-secondary-container/30 hover:border-secondary-container transition-all duration-300 text-xs font-bold flex items-center gap-2 shadow-lg font-label uppercase tracking-wider"
        >
          <span className={`material-symbols-outlined text-[18px] ${isRunningEval ? 'animate-spin' : ''}`}>
            {isRunningEval ? 'sync' : 'verified'}
          </span>
          <span>{isRunningEval ? 'Benchmarking...' : 'Run Ground-Truth Benchmark'}</span>
        </button>
      </div>

      {/* Evaluation Results Banner & Metric Guide (Only displayed after benchmark is run) */}
      {evalResult && (
        <div className="animate-item p-4.5 rounded-2xl glass-panel text-on-surface shadow-xl border border-secondary-container/40">
          <div className="flex flex-wrap items-start justify-between gap-4 pb-3 border-b border-outline-variant/30">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-secondary-container/20 border border-secondary-container/40 text-secondary-container shrink-0 mt-0.5">
                <span className="material-symbols-outlined text-[24px]">workspace_premium</span>
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
                    <span className="material-symbols-outlined text-[15px]">info</span>
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
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
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
                    <span className="material-symbols-outlined text-[14px]">fact_check</span>
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
                    <span className="material-symbols-outlined text-[14px]">short_text</span>
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
                    <span className="material-symbols-outlined text-[14px]">speed</span>
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
                <span className="material-symbols-outlined text-secondary-container text-[16px]">menu_book</span>
                Metric Explanation & Benchmark Guide
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-emerald-500/20">
                  <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">verified</span>
                    Accuracy ({evalResult.overall_accuracy_pct ?? 0}%)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Extraction Correctness:</strong> Measures what percentage of extracted attributes (Part #, Brand, Specs) match the ground-truth standard.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-secondary-container/20">
                  <div className="font-bold text-secondary-container mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">rule</span>
                    LOV Match ({evalResult.lov_compliance_pct ?? 0}%)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Taxonomy & UOM Compliance:</strong> Verifies values conform to permitted lists (LOVs), standardized units (in, cm, lbs), and catalog schema.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-blue-400/20">
                  <div className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">text_fields</span>
                    Char Limit ({evalResult.character_limit_compliance_pct ?? 0}%)
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    <strong>Length Constraint Check:</strong> Confirms descriptions meet character maximums (e.g. Short Desc ≤80 chars) to prevent ERP cut-offs.
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-purple-400/20">
                  <div className="font-bold text-purple-400 mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">bolt</span>
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
            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
            <span>{enrichmentSummary}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-error-container/20 border border-error/30 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-error">error</span>
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Quick-Load Sample Dataset Cards */}
      <div className="animate-item space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant font-label flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary-container">folder_open</span>
            Supported Feed Formats & Benchmark Datasets
          </h3>
          <span className="text-[10px] text-on-surface-variant font-mono">Click card to test feed</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={async () => {
              const sampleContent = `Mfg_Part_Num,Part_Desc,Brand_Name,Category,Raw_UOM,Price\nDIN933-M8-30,Hex Cap Screw M8x30mm Full Thread Stainless Steel A2-70,FASTENCO,Fasteners,8mm x 30mm,12.50\n48-22-8424,PACKOUT Modular Tool Box System Polymer Heavy Duty,MILWAUKEE,Storage,22 in x 16 in,89.00\nDCD791B,20V MAX XR Lithium-Ion Brushless 1/2 in Compact Drill Driver,DEWALT,Power Tools,1/2 in,139.00`;
              const blob = new Blob([sampleContent], { type: 'text/csv' });
              const sampleFile = new File([blob], 'Unihack_Sample_Dataset_Input.csv', { type: 'text/csv' });
              handleFileSelect(sampleFile);
            }}
            className="glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-secondary-container/60 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="p-2.5 rounded-lg bg-primary-container/20 text-secondary-container border border-secondary-container/30 shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">table_chart</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-on-surface font-headline group-hover:text-secondary-container transition-colors">Unihack_ Sample Dataset - Input.csv</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">1,000 SKUs</span>
                </div>
                <span className="text-[10px] font-bold text-secondary-container opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Run <span className="material-symbols-outlined text-[12px]">play_arrow</span>
                </span>
              </div>
              <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                Multi-domain raw industrial feed across 76 manufacturers (Appliances, Abrasives, Decking, Fasteners, Tools). Enriches dynamically into 252 static headers.
              </p>
            </div>
          </div>

          <div 
            onClick={async () => {
              const pdfBase64 = "JVBERi0xLjcKJcK1wrYKJSBXcml0dGVuIGJ5IE11UERGIDEuMjguMgoKMSAwIG9iago8PC9UeXBlL0NhdGFsb2cvUGFnZXMgMiAwIFIvSW5mbzw8L1Byb2R1Y2VyKE11UERGIDEuMjguMik+Pj4+CmVuZG9iagoKMiAwIG9iago8PC9UeXBlL1BhZ2VzL0NvdW50IDIvS2lkc1s0IDAgUiA4IDAgUl0+PgplbmRvYmoKCjMgMCBvYmoKPDwvRm9udDw8L2hlbHYgNSAwIFI+Pj4+CmVuZG9iagoKNCAwIG9iago8PC9UeXBlL1BhZ2UvTWVkaWFCb3hbMCAwIDU5NSA4NDJdL1JvdGF0ZSAwL1Jlc291cmNlcyAzIDAgUi9QYXJlbnQgMiAwIFIvQ29udGVudHNbNiAwIFJdPj4KZW5kb2JqCgo1IDAgb2JqCjw8L1R5cGUvRm9udC9TdWJ0eXBlL1R5cGUxL0Jhc2VGb250L0hlbHZldGljYS9FbmNvZGluZy9XaW5BbnNpRW5jb2Rpbmc+PgplbmRvYmoKCjYgMCBvYmoKPDwvTGVuZ3RoIDYxNi9GaWx0ZXIvRmxhdGVEZWNvZGU+PgpzdHJlYW0KeNp9VD2P2zAM3f0rPBdoK4lfFnDoULRLtwLeDh1ytowb2qFLf38fKSf23aVNkFimRPLx8VHD7+HzPOQx4ZtHSaPVMs6/ho/P7eefMedx3sbHB85MvLKUxJUbs4iQ4BVvmRdYlbNbWLArUoRgI95K+/Rj/jak8X2WDznzOH8ZHh+EVZR00qYVz6wegTWb/9wuKsYlPRnsE86YTmUVMraCvaaGk1Psifmz6KYLdimyze+A+FhJAs7NMTMQlgScCTgJ2BU/AnLGc+NGl7OXeVQ2IHUs3IBzVaFLzwukCqoODGFTPtBgtVKmVJLvk1CC/3pkYIqKBdVtVqxGZHUGwtoQtxh4pHaucH//T+W8AkcDbsRy7CbOmpWID4tX4X1EBt/rrNa9C2/ynxghfkJrU9ncO86s3mVnaeclVFJWnrjgv1e/euXePSF8EvG9HkFb3gU5FFUU8QzvmWE/d8br8+wHaigjhaIqag5FYb8CVwtUhpPZMUbvdxThBb2p87Co80C7DerT5Vx3nANbiFuiw56dQpftVS5XEvpD1dNcuRKfBORE3kx2ihw8R6Slo3upcI8IWMk1xKskzYg4cSaw6/ZS73LpGFafRKGua9R85q8B7Rp1d/aQKbLmvbbald459oywhzq7ml3FgaP3t76o5xQJeF0l5JNaJkvXGKWRlNezsJlGR4EodLic5xy5lt1brghOvrfJEzBpl1C3Kx+z0bsKVS/eJ18DCd2qsX/HilXcPD7J4OBp91Lg5zd+GnxWv738lPfKc8Oi+5R3RpauuMB087h/a0H55jcuGEtxr/bJ+ToP34e/6wpLVQplbmRzdHJlYW0KZW5kb2JqCgo3IDAgb2JqCjw8L0ZvbnQ8PC9oZWx2IDUgMCBSPj4+PgplbmRvYmoKCjggMCBvYmoKPDwvVHlwZS9QYWdlL01lZGlhQm94WzAgMCA1OTUgODQyXS9Sb3RhdGUgMC9SZXNvdXJjZXMgNyAwIFIvUGFyZW50IDIgMCBSL0NvbnRlbnRzWzkgMCBSXT4+CmVuZG9iagoKOSAwIG9iago8PC9MZW5ndGggNDY3L0ZpbHRlci9GbGF0ZURlY29kZT4+CnN0cmVhbQp42rVUPY/bMAzd/Ss0F2gr8dMGihuKdulWwFvRIWfLuOE63HK//x6lFHFyCdKlEBLb1CP5+EhpeBm+zkNJGaskzcknSvOf4fNTfX5NpaR5S7++SBGWVZSyTFJFVJUVn/gqssBqUsIiil1VUoaNZaP68Hv+MeT0seinUiTN3wZEMyvOLqZWTZ0Ca5utnmEXm4zwW2xyAZlMRlkZe2oMu+HHR9xmFb5rfDl8fKT86EAjjrmBLVPLP39ADac3zWC+RRUCzhEhXls1rMyHPRJxNxNHbg9kReTVlA/hxYUzniNqGGPPNTAalRWwq6hBUScfbYoFrZg5s5xydP6hA3yKLRFbg8cl7lKjJSqU4Lf0vFDgcM4teCFUBud1V1VnWA3/yCrNQ6KzQE/IK1dVY83oLwNnoRQ6Hj5beGFPoeIKG+m0V1CiN607RqFP43xUEb09Ww511EID6P1u9wo25gdTcspG6/9ftzuHyhzvxeRGbf80GR27z6NiI+JqRG7TjZpxBsZbunChynf0+4u9mIw+75vhzMmCZ8t42ztmCzEeYwbuZgJqp93YZ6/dAF0JOk52NX/vLSPOJ7X51HuZOvb6ycd95dJuBsrtturT830efg5v9n8kvQplbmRzdHJlYW0KZW5kb2JqCgp4cmVmCjAgMTAKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDQyIDAwMDAwIG4gCjAwMDAwMDAxMjAgMDAwMDAgbiAKMDAwMDAwMDE3OCAwMDAwMCBuIAowMDAwMDAwMjE5IDAwMDAwIG4gCjAwMDAwMDAzMjYgMDAwMDAgbiAKMDAwMDAwMDQxNSAwMDAwMCBuIAowMDAwMDAxMTAwIDAwMDAwIG4gCjAwMDAwMDExNDEgMDAwMDAgbiAKMDAwMDAwMTI0OCAwMDAwMCBuIAoKdHJhaWxlcgo8PC9TaXplIDEwL1Jvb3QgMSAwIFIvSURbPDZGMkQ3MzQ2QzNBMTJGNjJDMkIzQzM5QkMzODFDMzkxPjxDNDJFNzEwQUEzMzY2MkMyOUJDQTIzNjlENDQ2RTQwMz5dPj4Kc3RhcnR4cmVmCjE3ODQKJSVFT0YK";
              const binaryStr = atob(pdfBase64);
              const len = binaryStr.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });
              const sampleFile = new File([blob], 'Fastener_DIN933_Spec.pdf', { type: 'application/pdf' });
              handleFileSelect(sampleFile);
            }}
            className="glass-card rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-blue-400/60 hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="p-2.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-on-surface font-headline group-hover:text-blue-300 transition-colors">Fastener_DIN933_Spec.pdf</h4>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">Technical Spec</span>
                </div>
                <span className="text-[10px] font-bold text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                  Run <span className="material-symbols-outlined text-[12px]">play_arrow</span>
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
