import {
  ALL_CATEGORIES,
  type SalesFilters,
  type SalesRecord,
  type SalesSummary,
  type SortOrder,
} from '../types/sales';
import { normalizeText } from './text';

export const getRecordTotal = (record: SalesRecord): number => record.price * record.quantity;

export const getCategories = (records: SalesRecord[]): string[] =>
  Array.from(new Set(records.map((record) => record.category)));

export const filterRecords = (
  records: SalesRecord[],
  { search, category }: SalesFilters,
): SalesRecord[] => {
  const query = normalizeText(search);

  return records.filter((record) => {
    const matchesSearch = query === '' || normalizeText(record.product).includes(query);
    const matchesCategory = category === ALL_CATEGORIES || record.category === category;
    return matchesSearch && matchesCategory;
  });
};

export const sortRecords = (records: SalesRecord[], order: SortOrder): SalesRecord[] => {
  if (order === 'default') return records;

  const direction = order === 'asc' ? 1 : -1;
  return [...records].sort((a, b) => (a.price - b.price) * direction);
};

export const calculateSummary = (records: SalesRecord[]): SalesSummary =>
  records.reduce<SalesSummary>(
    (summary, record) => ({
      totalRevenue: summary.totalRevenue + getRecordTotal(record),
      recordCount: summary.recordCount + 1,
      totalQuantity: summary.totalQuantity + record.quantity,
    }),
    { totalRevenue: 0, recordCount: 0, totalQuantity: 0 },
  );
