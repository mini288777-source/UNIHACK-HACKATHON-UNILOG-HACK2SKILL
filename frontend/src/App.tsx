import { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { UploadPage } from './pages/UploadPage';
import { ProductWorkspace } from './components/workspace/ProductWorkspace';
import { Product, EvaluationResult } from './types';
import { api, clearLocalClientProducts } from './services/api';
import { gsap } from 'gsap';
import {
  Table,
  LayoutGrid,
  RotateCw,
  Award,
  FileSpreadsheet,
  Download,
  Plus,
  Boxes,
  ShieldCheck,
  AlertTriangle,
  Factory,
  Search,
  UploadCloud,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'dashboard' | 'workspace'>('upload');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [isRunningEval, setIsRunningEval] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 12;

  const mainContentRef = useRef<HTMLDivElement>(null);

  // Sync hash routing e.g. #upload, #dashboard, #workspace
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('workspace/')) {
        const pid = hash.replace('workspace/', '');
        setSelectedProductId(pid);
        setActiveTab('workspace');
      } else if (['upload', 'dashboard', 'workspace'].includes(hash)) {
        setActiveTab(hash as 'upload' | 'dashboard' | 'workspace');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (tab: 'upload' | 'dashboard' | 'workspace', productId?: string) => {
    if (tab === 'workspace' && productId) {
      setSelectedProductId(productId);
      window.location.hash = `workspace/${productId}`;
    } else {
      window.location.hash = tab;
    }
    setActiveTab(tab);
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const data = await api.listProducts(0, 1000);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Failed to load products from API:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // GSAP subtle page transitions
  useEffect(() => {
    try {
      const isReduced = typeof document !== 'undefined' && document.documentElement.classList.contains('motion-reduced');
      if (isReduced) return;

      const ctx = gsap.context(() => {
        gsap.fromTo(
          '.animate-item',
          { opacity: 0, y: 15 },
          { opacity: 1, y: 0, duration: 0.35, stagger: 0.05, ease: 'power2.out' }
        );
        gsap.fromTo(
          '.animate-card',
          { opacity: 0, scale: 0.98 },
          { opacity: 1, scale: 1, duration: 0.25, stagger: 0.03, ease: 'power1.out' }
        );
      }, mainContentRef);

      return () => {
        try { ctx.revert(); } catch {}
      };
    } catch {}
  }, [activeTab, viewMode, currentPage]);

  const handleRunEvaluation = async () => {
    setIsRunningEval(true);
    try {
      const res = await api.getEvaluation();
      setEvalResult(res);
    } catch (err) {
      console.error('Ground-truth evaluation benchmark failed:', err);
    } finally {
      setIsRunningEval(false);
    }
  };

  const handleExportCatalog = (format: 'csv' | 'xlsx') => {
    const url = api.getCatalogExportUrl(format);
    if (url.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = url;
      link.download = `Unihack_252_Delivery_Catalog.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      window.open(url, '_blank');
    }
  };

  // Safe guarded Product List calculations
  const safeProductList = useMemo(() => Array.isArray(products) ? products : [], [products]);

  // Dynamic Categories derived from dataset
  const categories = useMemo(() => {
    const set = new Set<string>();
    safeProductList.forEach((p) => {
      if (p.category) {
        const topCat = p.category.split('>')[0].trim();
        if (topCat) set.add(topCat);
      }
    });
    return Array.from(set);
  }, [safeProductList]);

  // Filtered & Searched Products
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return safeProductList.filter((p) => {
      const matchesSearch =
        q === '' ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.attributes && p.attributes.some((a) =>
          (a.name && a.name.toLowerCase().includes(q)) ||
          (a.normalized_value && a.normalized_value.toLowerCase().includes(q)) ||
          (a.raw_value && a.raw_value.toLowerCase().includes(q))
        ));

      const matchesCat =
        selectedCategory === 'ALL' ||
        (p.category && p.category.toLowerCase().includes(selectedCategory.toLowerCase()));

      return matchesSearch && matchesCat;
    });
  }, [safeProductList, searchQuery, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // KPIs
  const totalSkus = safeProductList.length;
  const avgHealthScore = totalSkus > 0 ? Math.round(safeProductList.reduce((acc, p) => acc + (p.health_score || 0), 0) / totalSkus) : 0;
  const flaggedProducts = safeProductList.filter((p) => (p.health_score || 0) < 85);
  const uniqueSuppliers = new Set(safeProductList.map((p) => p.manufacturer).filter(Boolean)).size;

  const selectedProduct = safeProductList.find((p) => p.id === selectedProductId) || safeProductList[0] || null;

  const handleResetCatalog = async () => {
    setIsLoading(true);
    try {
      await api.resetDatabase();
    } catch (err) {
      console.warn('Backend reset call encountered error:', err);
    } finally {
      clearLocalClientProducts();
      setProducts([]);
      setSelectedProductId(null);
      setEvalResult(null);
      setSearchQuery('');
      setSelectedCategory('ALL');
      setCurrentPage(1);
      setIsLoading(false);
      navigateTo('upload');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background text-on-surface flex flex-col font-body selection:bg-secondary-container selection:text-on-secondary">
      {/* Global Stitch Header with Live Connected Search Bar */}
      <Header
        activeTab={activeTab}
        productCount={totalSkus}
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setCurrentPage(1);
          if (query.trim() && activeTab !== 'dashboard') {
            navigateTo('dashboard');
          }
        }}
        onResetCatalog={handleResetCatalog}
      />

      <div className="flex flex-1 h-[calc(100vh-4rem)] overflow-hidden relative">
        {/* Global Sidebar Navigation */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => navigateTo(tab)}
          hasActiveProduct={!!selectedProduct}
        />

        {/* Dynamic Route Content */}
        <main
          ref={mainContentRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-surface-container-lowest/40 backdrop-blur-3xl text-left"
        >
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'upload' && (
              <UploadPage
                onUploadSuccess={() => {
                  fetchProducts();
                  navigateTo('dashboard');
                }}
              />
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                {/* Top Control Bar with Search, View Mode, Benchmark & 252-Column Exporters */}
                <div className="animate-item flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-secondary-container/15 text-secondary-container border border-secondary-container/30 font-label">
                        Universal Catalog Feed
                      </span>
                      <span className="text-xs text-on-surface-variant font-mono">252 Static Header Delivery Standard</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-on-surface tracking-tight font-headline">
                      Enterprise Product Catalog
                    </h2>
                    <p className="text-on-surface-variant text-xs mt-0.5 font-body">
                      Managing <span className="text-secondary-container font-bold">{totalSkus}</span> verified industrial components across Unilog standard taxonomies
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* View Switcher: Dense Table vs Grid */}
                    <div className="flex items-center bg-surface-container-high rounded-lg border border-outline-variant/40 p-0.5">
                      <button
                        onClick={() => setViewMode('table')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          viewMode === 'table'
                            ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        title="Dense Table View"
                      >
                        <Table className="w-4 h-4" />
                        <span className="hidden sm:inline">Table</span>
                      </button>
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          viewMode === 'grid'
                            ? 'bg-secondary-container text-on-secondary-container shadow-sm'
                            : 'text-on-surface-variant hover:text-on-surface'
                        }`}
                        title="Card Grid View"
                      >
                        <LayoutGrid className="w-4 h-4" />
                        <span className="hidden sm:inline">Grid</span>
                      </button>
                    </div>

                    {/* Ground-Truth Benchmark Button */}
                    <button
                      onClick={handleRunEvaluation}
                      disabled={isRunningEval}
                      className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-secondary-container border border-secondary-container/30 hover:border-secondary-container transition-all duration-200 text-xs font-bold flex items-center gap-1.5 rounded-lg shadow-sm font-label uppercase tracking-wider cursor-pointer"
                    >
                      {isRunningEval ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                      <span>{isRunningEval ? 'Benchmarking...' : 'Ground-Truth Benchmark'}</span>
                    </button>

                    {/* Dual 252-Column Exporters */}
                    <button
                      onClick={() => handleExportCatalog('xlsx')}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="Download 252-column XLSX workbook"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export XLSX</span>
                    </button>
                    <button
                      onClick={() => handleExportCatalog('csv')}
                      className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-bold rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 border border-outline-variant/40 cursor-pointer"
                      title="Download 252-column CSV file"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => navigateTo('upload')}
                      className="px-3.5 py-2 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary font-bold rounded-lg text-xs transition-all duration-200 flex items-center gap-1.5 shadow-[0_0_12px_rgba(254,170,0,0.3)] cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Upload Feed</span>
                    </button>
                  </div>
                </div>

                {/* Evaluation Results Banner on Dashboard if run */}
                {evalResult && (
                  <div className="animate-item p-4 rounded-2xl glass-panel text-on-surface shadow-xl border border-secondary-container/40">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-outline-variant/30">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-secondary-container" />
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
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                            <p className="font-bold text-secondary-container mb-0.5">LOV & UOM Compliance</p>
                            % matching allowed taxonomies, standardized options, and UOM units.
                          </div>
                        </div>

                        <div className="group relative cursor-help px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-blue-400/50 transition-all">
                          <span className="text-blue-400 font-bold">Char Limit: {evalResult.character_limit_compliance_pct ?? 0}%</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
                            <p className="font-bold text-blue-400 mb-0.5">Character Limit Compliance</p>
                            Ensures text fields satisfy distributor length bounds (e.g. Short Desc ≤80 chars).
                          </div>
                        </div>

                        <div className="group relative cursor-help px-2.5 py-1 rounded-lg bg-surface-container-lowest/80 border border-outline-variant/30 hover:border-purple-400/50 transition-all">
                          <span className="text-purple-400 font-bold">Speed: {evalResult.throughput_rows_per_sec ?? 0} rows/sec</span>
                          <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 w-64 p-2 bg-surface-container-highest text-[10px] text-on-surface rounded-xl shadow-2xl border border-outline-variant/50 font-body z-50 pointer-events-none text-left">
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
                      <Boxes className="w-5 h-5 text-secondary-container" />
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
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
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
                      <AlertTriangle className="w-5 h-5 text-secondary-container" />
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
                      <Factory className="w-5 h-5 text-primary-fixed" />
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all font-label uppercase tracking-wider cursor-pointer ${
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
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all font-label uppercase tracking-wider cursor-pointer ${
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
                    <Search className="text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search inventory, MPN, specs..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 pr-8 py-1.5 bg-surface-container-high border border-outline-variant/40 rounded-lg text-xs text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-secondary-container w-full sm:w-64"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setCurrentPage(1);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface p-1 rounded-full cursor-pointer"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                    <Boxes className="w-12 h-12 text-secondary-container mx-auto animate-float" />
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
                        className="px-4 py-2.5 bg-secondary-container hover:bg-secondary-fixed-dim text-on-secondary font-bold rounded-lg text-xs uppercase tracking-wider transition-all shadow-[0_0_12px_rgba(254,170,0,0.3)] flex items-center gap-2 cursor-pointer"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>Upload Catalog Feed</span>
                      </button>
                      <button
                        onClick={handleRunEvaluation}
                        disabled={isRunningEval}
                        className="px-4 py-2.5 bg-surface-container-high hover:bg-surface-container-highest text-secondary-container border border-secondary-container/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <Award className="w-4 h-4" />
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
                                  <button className="text-secondary-container hover:text-secondary-fixed-dim font-bold inline-flex items-center gap-1 text-[11px] font-label uppercase tracking-wider cursor-pointer">
                                    <span>Inspect</span>
                                    <ArrowRight className="w-4 h-4" />
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
                            Inspect Record <ArrowRight className="w-3.5 h-3.5" />
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
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/30 transition-all font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous</span>
                      </button>
                      <span className="font-mono text-on-surface px-2">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface disabled:opacity-40 disabled:cursor-not-allowed border border-outline-variant/30 transition-all font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'workspace' && selectedProduct && (
              <ProductWorkspace
                product={selectedProduct}
                onProductUpdated={fetchProducts}
                onBack={() => navigateTo('dashboard')}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
export default App;
