import axios from 'axios';
import {
  Product,
  ProductAttribute,
  ProcessingJob,
  SourceDocument,
  Conflict,
  EvaluationResult,
  CatalogMetrics,
  EnrichmentResult
} from '../types';

const API_BASE_URL = '/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Document Endpoints (PDF)
  async uploadDocument(file: File): Promise<ProcessingJob> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<ProcessingJob>('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async getDocument(documentId: string): Promise<SourceDocument> {
    const response = await apiClient.get<SourceDocument>(`/documents/${documentId}`);
    return response.data;
  },

  // Batch Catalog CSV Enrichment
  async enrichCsvDataset(file: File): Promise<EnrichmentResult> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<EnrichmentResult>('/enrich/csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Real-time Intelligence Metrics & Quality Breakdown
  async getMetrics(): Promise<CatalogMetrics> {
    const response = await apiClient.get<CatalogMetrics>('/enrich/metrics');
    return response.data;
  },

  // Automated Ground-Truth Evaluation Benchmark
  async getEvaluation(): Promise<EvaluationResult> {
    const response = await apiClient.get<EvaluationResult>('/enrich/evaluate');
    return response.data;
  },

  // Job Status Endpoint
  async getJobStatus(jobId: string): Promise<ProcessingJob> {
    const response = await apiClient.get<ProcessingJob>(`/jobs/${jobId}`);
    return response.data;
  },

  // Product Workspace Endpoints
  async listProducts(skip: number = 0, limit: number = 100): Promise<Product[]> {
    const response = await apiClient.get<Product[]>(`/products?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  async getProduct(productId: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${productId}`);
    return response.data;
  },

  async updateAttribute(
    productId: string,
    attributeId: string,
    payload: { normalized_value?: string; trust_status?: string; knowledge_type?: string }
  ): Promise<ProductAttribute> {
    const response = await apiClient.patch<ProductAttribute>(
      `/products/${productId}/attributes/${attributeId}`,
      payload
    );
    return response.data;
  },

  async getProductConflicts(productId: string): Promise<Conflict[]> {
    const response = await apiClient.get<Conflict[]>(`/products/${productId}/conflicts`);
    return response.data;
  },

  // Export URLs
  getExportUrl(productId: string, format: 'json' | 'csv' | 'delivery_format_csv' | 'xlsx'): string {
    return `${API_BASE_URL}/export/products/${productId}?format=${format}`;
  },

  getCatalogExportUrl(format: 'csv' | 'xlsx'): string {
    return `${API_BASE_URL}/export/catalog?format=${format}`;
  },
};
