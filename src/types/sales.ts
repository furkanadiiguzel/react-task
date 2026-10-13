export interface SalesRecord {
  id: number;
  product: string;
  category: string;
  price: number;
  quantity: number;
}

export type SortOrder = 'default' | 'asc' | 'desc';

export interface SalesFilters {
  search: string;
  category: string;
}

export interface SalesSummary {
  totalRevenue: number;
  recordCount: number;
  totalQuantity: number;
}

export const ALL_CATEGORIES = 'all';
