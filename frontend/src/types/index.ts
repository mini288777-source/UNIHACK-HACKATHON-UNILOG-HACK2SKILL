export type KnowledgeType = 'EXPLICIT_FACT' | 'NORMALIZED_FACT' | 'DERIVED_INFO' | 'INFERRED_INFO';

export type TrustStatus = 'VERIFIED' | 'HIGH_CONFIDENCE' | 'NEEDS_REVIEW' | 'CONFLICT' | 'UNKNOWN';

export interface Evidence {
  id: string;
  document_id: string;
  page_number: number;
  text_quote: string;
  bounding_box?: Record<string, any>;
  confidence_breakdown?: {
    evidence_exactness: number;
    schema_validity: number;
    source_agreement: number;
    known_value_match: number;
  };
}

export interface ProductAttribute {
  id: string;
  product_id: string;
  name: string;
  raw_value?: string;
  normalized_value?: string;
  unit?: string;
  knowledge_type: KnowledgeType;
  trust_status: TrustStatus;
  confidence: number;
  is_inferred: boolean;
  evidence?: Evidence;
}

export interface Conflict {
  id: string;
  product_id: string;
  attribute_name: string;
  doc1_id?: string;
  doc1_value?: string;
  doc2_id?: string;
  doc2_value?: string;
  status: string;
}

export interface Product {
  id: string;
  document_id?: string;
  name: string;
  category?: string;
  manufacturer?: string;
  sku?: string;
  health_score: number;
  created_at: string;
  updated_at: string;
  attributes: ProductAttribute[];
  conflicts: Conflict[];
}

export interface ProcessingJob {
  id: string;
  document_id: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  current_stage: 'INGESTING' | 'PARSING' | 'EXTRACTING' | 'NORMALIZING' | 'VALIDATING' | 'PERSISTING';
  progress_pct: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface SourceDocument {
  id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  uploaded_at: string;
}

export interface EvaluationResult {
  total_benchmark_rows: number;
  overall_accuracy_pct: number;
  character_limit_compliance_pct: number;
  uom_standard_compliance_pct: number;
  lov_compliance_pct: number;
  field_level_accuracies: Record<string, number>;
  benchmark_latency_ms: number;
  throughput_rows_per_sec: number;
  error_breakdown: Record<string, number>;
  timestamp: string;
}

export interface CatalogMetrics {
  total_products: number;
  average_health_score: number;
  total_attributes: number;
  verified_attributes_count: number;
  review_required_count: number;
  category_distribution: Record<string, number>;
  trust_status_breakdown: {
    VERIFIED: number;
    HIGH_CONFIDENCE: number;
    NEEDS_REVIEW: number;
    CONFLICT: number;
  };
}

export interface EnrichmentResult {
  status: string;
  enriched_sku_count: number;
  processed_records: Array<{
    product_id: string;
    sku: string;
    name: string;
    manufacturer: string;
    health_score: number;
    attributes_count: number;
  }>;
  message: string;
}
