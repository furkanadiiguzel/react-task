export interface SalesRecord {
  id: number;
  product: string;
  category: string;
  price: number;
  quantity: number;
}

export type NewSalesRecord = Omit<SalesRecord, 'id'>;

// Form inputs are always strings; they are parsed into numbers after validation.
export interface RecordFormValues {
  product: string;
  category: string;
  price: string;
  quantity: string;
}

export type RecordFormErrors = Partial<Record<keyof RecordFormValues, string>>;

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
