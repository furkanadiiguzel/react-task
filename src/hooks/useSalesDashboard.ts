import { useMemo, useState } from 'react';
import initialRecords from '../data/sales-data.json';
import { ALL_CATEGORIES, type SalesRecord, type SortOrder } from '../types/sales';
import {
  calculateSummary,
  filterRecords,
  getCategories,
  sortRecords,
} from '../utils/salesFilters';

export const useSalesDashboard = () => {
  const [records] = useState<SalesRecord[]>(initialRecords);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [sortOrder, setSortOrder] = useState<SortOrder>('default');

  const categories = useMemo(() => getCategories(records), [records]);

  const filteredRecords = useMemo(
    () => filterRecords(records, { search, category }),
    [records, search, category],
  );

  // Summary is based on filtered records only; sorting never changes totals.
  const summary = useMemo(() => calculateSummary(filteredRecords), [filteredRecords]);

  const visibleRecords = useMemo(
    () => sortRecords(filteredRecords, sortOrder),
    [filteredRecords, sortOrder],
  );

  return {
    categories,
    visibleRecords,
    summary,
    search,
    setSearch,
    category,
    setCategory,
    sortOrder,
    setSortOrder,
  };
};
