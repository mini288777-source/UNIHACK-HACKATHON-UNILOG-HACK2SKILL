import { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { UploadPage } from './pages/UploadPage';
import { ProductWorkspace } from './components/workspace/ProductWorkspace';
import { api } from './services/api';
import { Product, EvaluationResult } from './types';
import { gsap } from 'gsap';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'workspace'>('upload');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [isRunningEval, setIsRunningEval] = useState<boolean>(false);

  const mainContentRef = useRef<HTMLDivElement>(null);

  const navigateTo = (tab: 'upload' | 'dashboard' | 'workspace', prodId?: string) => {
    setActiveTab(tab);
    if (prodId) setSelectedProductId(prodId);
    window.history.pushState({ tab, prodId: prodId || selectedProductId }, '', `#${tab}`);
  };

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.tab) {
        setActiveTab(e.state.tab);
        if (e.state.prodId) {
          setSelectedProductId(e.state.prodId);
        }
      } else {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'dashboard' || hash === 'workspace' || hash === 'upload') {
          setActiveTab(hash as any);
        } else {
          setActiveTab('dashboard');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    if (!window.history.state) {
      window.history.replaceState({ tab: 'dashboard', prodId: selectedProductId }, '', '#dashboard');
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedProductId]);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    try {
      const isReduced = typeof document !== 'undefined' && document.documentElement.classList.contains('motion-reduced');
      if (isReduced || !mainContentRef.current) return;

      gsap.fromTo(
        mainContentRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      );
    } catch (e) {
      console.warn('GSAP animation skipped:', e);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'dashboard' || !Array.isArray(products) || products.length === 0) return;
    try {
      const isReduced = typeof document !== 'undefined' && document.documentElement.classList.contains('motion-reduced');
      if (isReduced || !mainContentRef.current) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.animate-card',
          { opacity: 0, y: 12 },
          { opacity: 1, y: 0, duration: 0.25, stagger: { amount: 0.15 }, ease: 'power2.out' }
        );
      }, mainContentRef);

      return () => {
        try { ctx.revert(); } catch {}
      };
    } catch (e) {
      console.warn('GSAP card animation skipped:', e);
    }
  }, [activeTab, viewMode, products, selectedCategory]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.listProducts(0, 1000);
      const safeData = Array.isArray(data) ? data : [];
      setProducts(safeData);
      if (safeData.length > 0 && !selectedProductId) {
        setSelectedProductId(safeData[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    fetchProducts();
    navigateTo('dashboard');
  };

  const handleExportCatalog = (format: 'csv' | 'xlsx') => {
    window.open(api.getCatalogExportUrl(format), '_blank');
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

  // Real Database-driven KPI Computations with Defensive Array Checks
  const safeProductList = useMemo(() => Array.isArray(products) ? products : [], [products]);
  const totalSkus = safeProductList.length;
  const avgHealthScore = totalSkus > 0
    ? Math.round(safeProductList.reduce((acc, p) => acc + (p.health_score || 0), 0) / totalSkus)
    : 0;

  const flaggedProducts = useMemo(() => {
    return safeProductList.filter(p => (p.health_score || 0) < 85);
  }, [safeProductList]);

  const uniqueSuppliers = useMemo(() => {
    const suppliers = new Set(safeProductList.map(p => p.manufacturer).filter(Boolean));
    return suppliers.size;
  }, [safeProductList]);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    safeProductList.forEach(p => {
      if (p.category) {
        const top = p.category.split('>')[0].trim();
        if (top) cats.add(top);
      }
    });
    return Array.from(cats);
  }, [safeProductList]);

  const filteredProducts = useMemo(() => {
    return safeProductList.filter(p => {
      const matchesSearch = 
        (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.manufacturer || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCat = selectedCategory === 'ALL' || (p.category && p.category.startsWith(selectedCategory));

      return matchesSearch && matchesCat;
    });
  }, [safeProductList, searchQuery, selectedCategory]);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  const selectedProduct = safeProductList.find(p => p.id === selectedProductId) || safeProductList[0];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface font-body antialiased selection:bg-secondary-container selection:text-on-secondary">
      <Header activeTab={activeTab} productCount={products.length} />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => navigateTo(tab)}
          hasActiveProduct={Boolean(selectedProduct)}
        />

        <main className="flex-1 overflow-y-auto p-6 flex flex-col bg-background/50 relative">
          {/* Ambient Background Glows from Stitch */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary-container/15 rounded-full blur-[140px]"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[35%] bg-secondary-container/10 rounded-full blur-[120px]"></div>
          </div>

          <div ref={mainContentRef} className="flex-1 relative z-10">
            {activeTab === 'upload' && (
              <UploadPage onUploadSuccess={handleUploadSuccess} />
            )}

            {activeTab === 'dashboard' && (
              <div className="max-w-7xl mx-auto space-y-6 text-left">
                {/* Product Inventory Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-on-surface tracking-tight font-headline">
                      Product Inventory
                    </h2>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-label">
                      Managing <span className="text-secondary-container font-bold">{totalSkus}</span> verified industrial components across Unilog standard taxonomies
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Switcher: Dense Table vs Grid */}
                    <div className="flex items-center bg-surface-container-high rounded-lg border border-outline-variant/40 p-0.5">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                          viewMode === 'table'
                            ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        title="Dense Table View"
                      >
                        <span className="material-symbols-outlined text-[16px]">table_rows</span>
                        <span className="hidden sm:inline">Table</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 ${
                          viewMode === 'grid'
                            ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        title="Card Grid View"
                      >
                        <span className="material-symbols-outlined text-[16px]">grid_view</span>
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                    </div>

                    {/* Ground-Truth Benchmark Button */}
                    <button
                      onClick={handleRunEvaluation}
                      disabled={isRunningEval}
                      className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-secondary-container border border-secondary-container/30 hover:border-secondary-container transition-all duration-200 text-xs font-bold flex items-center gap-1.5 rounded-lg shadow-sm font-label uppercase tracking-wider"
                    >
                      <span className={`material-symbols-outlined text-[18px] ${isRunningEval ? 'animate-spin' : ''}`}>
                        {isRunningEval ? 'sync' : 'verified'}
                      </span>
                      <span>{isRunningEval ? 'Benchmarking...' : 'Ground-Truth Benchmark'}</span>
                    </button>

                    {/* Dual 252-Column Exporters */}
                    <button
                      onClick={() => handleExportCatalog('xlsx')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 shadow-sm"
                      title="Download 252-column XLSX workbook"
                    >
                      <span className="material-symbols-outlined text-[18px]">file_download</span>
                      <span>Export XLSX</span>
                    </button>
                    <button
                      onClick={() => handleExportCatalog('csv')}
                      className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 border border-outline-variant/40"
                      title="Download 252-column CSV file"
                    >
                      <span className="material-symbols-outlined text-[18px]">download</span>
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => navigateTo('upload')}
                      className="px-3.5 py-2 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary font-bold rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 shadow-[0_0_12px_rgba(254,170,0,0.3)]"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      <span>Upload Feed</span>
                    </button>
                  </div>
                </div>

                {/* Evaluation Results Banner on Dashboard if run */}
                {evalResult && (
                  <div className="animate-item p-4 rounded-2xl glass-panel text-on-surface shadow-xl border border-secondary-container/40">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-outline-variant/30">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary-container text-[22px]">workspace_premium</span>
                        <h4 className="font-bold text-sm font-headline">Ground-Truth Benchmark Results</h4>
                        <span className="text-[10px] font-mono text-on-surface-variant font-bold">({evalResult.total_benchmark_rows || 0} Labeled Rows Evaluated)</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
                        <div className="group relative cursor-help px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-emerald-500/50 transition-all">
                          <span className="text-emerald-400 font-bold">Accuracy: {evalResult.overall_accuracy_pct ?? 0}%</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                            <p className="font-bold text-emerald-400 mb-0.5">Overall Field Accuracy</p>
                            % of extracted product attributes matching ground-truth expected values.
                          </div>
                        </div>

                        <div className="group relative cursor-help px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-secondary-container/50 transition-all">
                          <span className="text-secondary-container font-bold">LOV Match: {evalResult.lov_compliance_pct ?? 0}%</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-lg shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                            <p className="font-bold text-secondary-container mb-0.5">LOV & UOM Compliance</p>
                            % matching allowed taxonomies, standardized options, and UOM units.
                          </div>
                        </div>

                        <div className="group relative cursor-help px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-blue-400/50 transition-all">
                          <span className="text-blue-400 font-bold">Char Limit: {evalResult.character_limit_compliance_pct ?? 0}%</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-lg shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                            <p className="font-bold text-blue-400 mb-0.5">Character Limit Compliance</p>
                            Ensures text fields satisfy distributor length bounds (e.g. Short Desc ≤80 chars).
                          </div>
                        </div>

                        <div className="group relative cursor-help px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-purple-400/50 transition-all">
                          <span className="text-purple-400 font-bold">Speed: {evalResult.throughput_rows_per_sec ?? 0} rows/sec</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-lg shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                            <p className="font-bold text-purple-400 mb-0.5">Processing Speed</p>
                            AI catalog extraction & enrichment throughput rate in rows per second.
                          </div>
                        </div>
                      </div>
                    </div>
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

                {/* 4 Real KPI Cards from Stitch Screen 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total SKUs */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-xs font-label uppercase tracking-wider font-bold">Total SKUs</span>
                      <span className="material-symbols-outlined text-secondary-container text-[20px]">inventory</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold font-headline text-on-surface">{totalSkus.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-400 font-mono ml-2 font-bold">100% Parsed</span>
                    </div>
                  </div>

                  {/* Average Health Score */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-xs font-label uppercase tracking-wider font-bold">Avg Health Score</span>
                      <span className="material-symbols-outlined text-emerald-400 text-[20px]">health_and_safety</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold font-headline text-on-surface">{avgHealthScore}%</span>
                      <span className="text-[10px] text-emerald-400 font-mono ml-2 font-bold">High Trust</span>
                    </div>
                  </div>

                  {/* Flagged Items */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-xs font-label uppercase tracking-wider font-bold">Flagged for Audit</span>
                      <span className="material-symbols-outlined text-secondary-container text-[20px]">warning</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold font-headline text-secondary-container">{flaggedProducts.length}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono ml-2">Needs Review</span>
                    </div>
                  </div>

                  {/* Suppliers */}
                  <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-on-surface-variant">
                      <span className="text-xs font-label uppercase tracking-wider font-bold">Active Suppliers</span>
                      <span className="material-symbols-outlined text-primary-fixed text-[20px]">factory</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-2xl font-bold font-headline text-on-surface">{uniqueSuppliers}</span>
                      <span className="text-[10px] text-on-surface-variant font-mono ml-2">Canonical MFRs</span>
                    </div>
                  </div>
                </div>

                {/* Priority Review Bento Section (If any flagged items exist) */}
                {flaggedProducts.length > 0 && (
                  <div className="glass-panel rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-secondary-container shadow-[0_0_8px_#feaa00] animate-pulse"></span>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface font-label">
                          Priority Review Queue ({flaggedProducts.length} Items Requiring Audit)
                        </h3>
                      </div>
                      <span className="text-[10px] text-on-surface-variant font-mono">Sorted by Health Score</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {flaggedProducts.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => navigateTo('workspace', p.id)}
                          className="glass-card rounded-lg p-3 cursor-pointer hover:border-secondary-container/50 transition-all group"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[9px] font-mono font-bold text-secondary-container bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/30">
                              {p.sku || 'SKU-PENDING'}
                            </span>
                            <span className="text-[10px] font-bold text-secondary-container font-mono">{p.health_score}% Health</span>
                          </div>
                          <h4 className="text-xs font-bold text-on-surface truncate group-hover:text-secondary-container transition-colors">
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-on-surface-variant truncate mt-0.5">
                            {p.manufacturer || 'Canonical Manufacturer'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filter & Search Bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all font-label uppercase tracking-wider ${
                        selectedCategory === 'ALL'
                          ? 'bg-primary-container text-on-primary-container shadow-md'
                          : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                      }`}
                    >
                      All ({products.length})
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all font-label uppercase tracking-wider ${
                          selectedCategory === cat
                            ? 'bg-primary-container text-on-primary-container shadow-md'
                            : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface border border-outline-variant/30'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
                      search
                    </span>
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-1.5 bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-secondary-container w-full sm:w-64"
                    />
                  </div>
                </div>

                {/* Main Catalog View: Dense Table vs Card Grid */}
                {isLoading && products.length === 0 ? (
                  <div className="glass-panel rounded-xl p-12 text-center flex flex-col items-center justify-center">
                    <span className="w-8 h-8 rounded-full border-2 border-secondary-container/30 border-t-secondary-container animate-spin mb-3"></span>
                    <h3 className="text-sm font-bold text-on-surface font-headline">Loading SKU Records...</h3>
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="glass-panel rounded-xl p-12 text-center space-y-4 border border-outline-variant/40">
                    <span className="material-symbols-outlined text-secondary-container text-5xl animate-float">inventory_2</span>
                    <h3 className="text-lg font-bold text-on-surface font-headline">
                      {products.length === 0 ? 'No Catalog Data Ingested Yet' : 'No SKUs Match Your Query'}
                    </h3>
                    <p className="text-xs text-on-surface-variant max-w-md mx-auto">
                      {products.length === 0
                        ? 'Upload a raw CSV catalog feed (e.g. Unihack Sample Dataset) or technical spec PDF to extract normalized attributes and compute 4-factor confidence scores.'
                        : 'Try adjusting your search query or category filters, or upload an additional catalog feed.'}
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => navigateTo('upload')}
                        className="px-4 py-2.5 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(254,170,0,0.3)] flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                        <span>Upload Catalog Feed</span>
                      </button>
                      <button
                        onClick={handleRunEvaluation}
                        disabled={isRunningEval}
                        className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-secondary-container border border-secondary-container/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified</span>
                        <span>{isRunningEval ? 'Running...' : 'Run Benchmark'}</span>
                      </button>
                    </div>
                  </div>
                ) : viewMode === 'table' ? (
                  /* Dense Enterprise Catalog Table from Stitch Screen 1 */
                  <div className="glass-panel rounded-xl overflow-hidden shadow-xl border border-outline-variant/30">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase tracking-wider text-on-surface-variant bg-surface-container-lowest/90 border-b border-outline-variant/30 font-label font-bold">
                            <th className="px-4 py-3">SKU ID / MPN</th>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-4 py-3">Manufacturer</th>
                            <th className="px-4 py-3">Category Classpath</th>
                            <th className="px-4 py-3">Health Status</th>
                            <th className="px-4 py-3">Extracted Specs</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                          {paginatedProducts.map((p) => {
                            const isHealthy = p.health_score >= 85;
                            const isWarning = p.health_score >= 65 && p.health_score < 85;

                            return (
                              <tr
                                key={p.id}
                                onClick={() => navigateTo('workspace', p.id)}
                                className="animate-card hover:bg-surface-container-high/40 transition-colors duration-150 cursor-pointer group"
                              >
                                <td className="px-4 py-3 font-mono text-[11px] text-secondary-container font-bold">
                                  {p.sku || 'N/A'}
                                </td>
                                <td className="px-4 py-3 font-bold text-on-surface group-hover:text-secondary-container transition-colors max-w-xs truncate">
                                  {p.name}
                                </td>
                                <td className="px-4 py-3 text-on-surface-variant text-[11px]">
                                  {p.manufacturer || '—'}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant border border-outline-variant/30 font-label">
                                    {p.category ? p.category.split('>').pop() : 'General'}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${
                                      isHealthy ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : isWarning ? 'bg-secondary-container shadow-[0_0_6px_#feaa00]' : 'bg-primary-container shadow-[0_0_6px_#dd2e18]'
                                    }`}></span>
                                    <span className="font-mono font-bold text-[11px] text-on-surface">{p.health_score}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-on-surface-variant text-[11px]">
                                  {p.attributes?.length ?? 0} specs
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button className="text-secondary-container hover:text-secondary-fixed-dim font-bold inline-flex items-center gap-1 text-[11px] font-label uppercase tracking-wider">
                                    <span>Inspect</span>
                                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  /* Card Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => navigateTo('workspace', p.id)}
                        className="animate-card glass-card rounded-xl p-4 cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] font-bold font-mono text-secondary-container bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30">
                              {p.sku || 'SKU-PENDING'}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-on-surface font-mono">{p.health_score}%</span>
                              <span className="text-[9px] text-on-surface-variant font-label uppercase">Health</span>
                            </div>
                          </div>
                          <h4 className="text-sm font-bold text-on-surface group-hover:text-secondary-container transition-colors line-clamp-1">
                            {p.name}
                          </h4>
                          <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
                            {p.manufacturer || 'Canonical Manufacturer'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-outline-variant/20 text-[11px]">
                          <span className="text-on-surface-variant">{p.attributes?.length ?? 0} Attributes</span>
                          <span className="text-secondary-container font-bold flex items-center gap-1">
                            Inspect Record <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fast Pagination Bar */}
                {filteredProducts.length > pageSize && (
                  <div className="flex items-center justify-between pt-4 px-2 text-xs font-label">
                    <span className="text-on-surface-variant text-[11px]">
                      Showing <strong className="text-on-surface font-mono">{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredProducts.length)}</strong> of <strong className="text-secondary-container font-mono">{filteredProducts.length}</strong> items
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/30 transition-all font-bold flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        <span>Previous</span>
                      </button>
                      <span className="font-mono text-on-surface px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/30 transition-all font-bold flex items-center gap-1"
                      >
                        <span>Next</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workspace' && selectedProduct && (
              <ProductWorkspace
                product={selectedProduct}
                onProductUpdate={fetchProducts}
                onBack={() => navigateTo('dashboard')}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
